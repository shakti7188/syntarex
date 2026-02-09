import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { withRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
        auth: { persistSession: false },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const machineId = url.pathname.split('/').filter(Boolean).pop();

    if (!machineId) {
      return new Response(JSON.stringify({ error: 'Machine ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { quantity, paymentCurrency } = await req.json();

    if (!quantity || quantity <= 0) {
      return new Response(JSON.stringify({ error: 'Valid quantity is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentCurrency || !['USDT', 'MUSD'].includes(paymentCurrency)) {
      return new Response(JSON.stringify({ error: 'Valid payment currency is required (USDT or MUSD)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch machine type
    const { data: machineType, error: machineError } = await supabaseClient
      .from('machine_types')
      .select('*')
      .eq('id', machineId)
      .single();

    if (machineError || !machineType) {
      return new Response(JSON.stringify({ error: 'Machine not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (machineType.status !== 'ACTIVE' && machineType.status !== 'PRE_ORDER') {
      return new Response(JSON.stringify({ error: 'Machine is not available for purchase' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (machineType.available_quantity < quantity) {
      return new Response(JSON.stringify({ error: 'Insufficient quantity available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalPrice = machineType.price_usdt * quantity;

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from('machine_purchases')
      .insert({
        user_id: user.id,
        machine_type_id: machineId,
        quantity,
        unit_price_usdt: machineType.price_usdt,
        total_price: totalPrice,
        payment_currency: paymentCurrency,
        status: 'PENDING',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Purchase creation error:', purchaseError);
      return new Response(JSON.stringify({ error: 'Failed to create purchase' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update available quantity
    const { error: updateError } = await supabaseClient
      .from('machine_types')
      .update({ available_quantity: machineType.available_quantity - quantity })
      .eq('id', machineId);

    if (updateError) {
      console.error('Failed to update quantity:', updateError);
      // Rollback purchase
      await supabaseClient.from('machine_purchases').delete().eq('id', purchase.id);
      return new Response(JSON.stringify({ error: 'Failed to process purchase' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create machine inventory entries for each purchased machine
    const inventoryEntries = Array.from({ length: quantity }, () => ({
      user_id: user.id,
      machine_type_id: machineId,
      purchase_id: purchase.id,
      status: 'AVAILABLE',
      tokenized_ths: 0,
      location: machineType.location,
    }));

    const { error: inventoryError } = await supabaseClient
      .from('machine_inventory')
      .insert(inventoryEntries);

    if (inventoryError) {
      console.error('Failed to create inventory:', inventoryError);
      // Rollback purchase and quantity update
      await supabaseClient.from('machine_purchases').delete().eq('id', purchase.id);
      await supabaseClient
        .from('machine_types')
        .update({ available_quantity: machineType.available_quantity })
        .eq('id', machineId);
      return new Response(JSON.stringify({ error: 'Failed to create inventory' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Created ${quantity} inventory entries for purchase ${purchase.id}`);

    // Broadcast real-time event
    const channel = supabaseClient.channel('mining-events');
    await channel.send({
      type: 'broadcast',
      event: 'mining.machine.purchased',
      payload: {
        userId: user.id,
        purchaseId: purchase.id,
        machineId,
        quantity,
        totalPrice,
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        purchase: {
          id: purchase.id,
          machineId: purchase.machine_type_id,
          quantity: purchase.quantity,
          unitPrice: purchase.unit_price_usdt,
          totalPrice: purchase.total_price,
          paymentCurrency: purchase.payment_currency,
          status: purchase.status,
          createdAt: purchase.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

// Apply rate limiting: 10 purchases per minute per user
Deno.serve(withRateLimit(handler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
}));
