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

    const { packageId, paymentCurrency } = await req.json();

    if (!packageId) {
      return new Response(JSON.stringify({ error: 'Package ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentCurrency || !['USDT', 'XFLOW'].includes(paymentCurrency)) {
      return new Response(JSON.stringify({ error: 'Valid payment currency is required (USDT or XFLOW)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch package details
    const { data: pkg, error: packageError } = await supabaseClient
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (packageError || !pkg) {
      return new Response(JSON.stringify({ error: 'Package not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create package purchase
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from('package_purchases')
      .insert({
        user_id: user.id,
        package_id: packageId,
        payment_currency: paymentCurrency,
        total_price: pkg.price_usd,
        status: 'COMPLETED',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Package purchase creation error:', purchaseError);
      return new Response(JSON.stringify({ error: 'Failed to create package purchase' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create hashrate allocation for the user
    const { data: allocation, error: allocationError } = await supabaseClient
      .from('hashrate_allocations')
      .insert({
        user_id: user.id,
        machine_inventory_id: purchase.id, // Using purchase_id as reference
        total_ths: pkg.hashrate_ths,
        tokenized_ths: 0,
        untokenized_ths: pkg.hashrate_ths,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (allocationError) {
      console.error('Hashrate allocation error:', allocationError);
      // Rollback purchase
      await supabaseClient.from('package_purchases').delete().eq('id', purchase.id);
      return new Response(JSON.stringify({ error: 'Failed to allocate hashrate' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Package purchase completed: ${purchase.id}, Hashrate allocated: ${pkg.hashrate_ths} TH/s`);

    // Broadcast real-time event
    const channel = supabaseClient.channel('package-events');
    await channel.send({
      type: 'broadcast',
      event: 'package.purchased',
      payload: {
        userId: user.id,
        purchaseId: purchase.id,
        packageId,
        hashrateAllocated: pkg.hashrate_ths,
        xflowTokens: pkg.xflow_tokens,
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        purchase: {
          id: purchase.id,
          packageId: purchase.package_id,
          totalPrice: purchase.total_price,
          paymentCurrency: purchase.payment_currency,
          status: purchase.status,
          hashrateAllocated: pkg.hashrate_ths,
          xflowTokens: pkg.xflow_tokens,
          createdAt: purchase.created_at,
        },
        allocation: {
          id: allocation.id,
          totalThs: allocation.total_ths,
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

// Apply rate limiting: 5 purchases per minute per user
Deno.serve(withRateLimit(handler, {
  windowMs: 60 * 1000,
  maxRequests: 5,
}));
