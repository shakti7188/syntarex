import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get order with related data
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select(`
        *,
        packages!inner(name, price_usd, hashrate_ths, tier),
        deposit_wallets!inner(wallet_address)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Payment order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if expired
    if (order.status === 'PENDING' && new Date(order.expires_at) < new Date()) {
      // Update to expired
      await supabase
        .from('payment_orders')
        .update({ status: 'EXPIRED' })
        .eq('id', orderId);

      order.status = 'EXPIRED';
    }

    // Calculate time remaining
    const expiresAt = new Date(order.expires_at);
    const now = new Date();
    const timeRemainingMs = Math.max(0, expiresAt.getTime() - now.getTime());
    const timeRemainingSeconds = Math.floor(timeRemainingMs / 1000);

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        amountExpected: order.amount_expected,
        amountReceived: order.amount_received,
        currency: order.currency,
        chain: order.chain,
        txHash: order.tx_hash,
        expiresAt: order.expires_at,
        confirmedAt: order.confirmed_at,
        createdAt: order.created_at,
      },
      package: order.packages,
      walletAddress: order.deposit_wallets.wallet_address,
      timeRemainingSeconds,
      isExpired: order.status === 'EXPIRED' || timeRemainingSeconds <= 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in api-payment-status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
