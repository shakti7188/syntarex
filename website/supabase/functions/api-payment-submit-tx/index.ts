import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate Solana transaction signature format (base58, 87-88 chars)
function isValidSolanaSignature(signature: string): boolean {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;
  return base58Regex.test(signature);
}

// Validate Ethereum transaction hash format (0x prefix + 64 hex chars)
function isValidEthereumTxHash(txHash: string): boolean {
  const ethTxRegex = /^0x[a-fA-F0-9]{64}$/;
  return ethTxRegex.test(txHash);
}

// Validate Tron transaction hash format (64 hex chars, no 0x prefix)
function isValidTronTxHash(txHash: string): boolean {
  const tronTxRegex = /^[a-fA-F0-9]{64}$/;
  return tronTxRegex.test(txHash);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId, txSignature } = await req.json();
    
    if (!orderId || !txSignature) {
      return new Response(JSON.stringify({ error: 'Order ID and transaction signature are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the payment order to determine the chain
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Payment order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate transaction format based on chain
    const chain = order.chain || 'SOLANA';
    if (chain === 'ETHEREUM') {
      if (!isValidEthereumTxHash(txSignature)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid Ethereum transaction hash format. Must start with 0x followed by 64 hex characters.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (chain === 'TRON') {
      if (!isValidTronTxHash(txSignature)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid Tron transaction hash format. Must be 64 hex characters.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Default to Solana validation
      if (!isValidSolanaSignature(txSignature)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid Solana transaction signature format.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Submitting ${chain} tx ${txSignature} for order ${orderId}`);

    // CRITICAL SECURITY: Check if this transaction hash has already been used
    const { data: existingTx, error: existingTxError } = await serviceSupabase
      .from('payment_orders')
      .select('id, user_id, status')
      .eq('tx_hash', txSignature)
      .in('status', ['AWAITING_CONFIRMATION', 'CONFIRMED'])
      .maybeSingle();

    if (existingTxError) {
      console.error('Error checking existing tx:', existingTxError);
    }

    if (existingTx) {
      console.warn(`Duplicate tx_hash detected: ${txSignature} already used in order ${existingTx.id}`);
      return new Response(JSON.stringify({ 
        error: 'This transaction has already been submitted for another order.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if order is still valid
    if (order.status !== 'PENDING') {
      return new Response(JSON.stringify({ error: `Order is already ${order.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(order.expires_at) < new Date()) {
      // Update order to expired
      await serviceSupabase
        .from('payment_orders')
        .update({ status: 'EXPIRED' })
        .eq('id', orderId);
      
      return new Response(JSON.stringify({ error: 'Payment order has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order with tx signature and status
    const { data: updatedOrder, error: updateError } = await serviceSupabase
      .from('payment_orders')
      .update({
        tx_hash: txSignature,
        status: 'AWAITING_CONFIRMATION',
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to submit transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Order updated to AWAITING_CONFIRMATION:', updatedOrder.id);

    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder,
      message: 'Transaction submitted for verification',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in api-payment-submit-tx:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});