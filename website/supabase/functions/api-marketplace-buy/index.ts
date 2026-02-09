import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
      }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { listingId, amountThs } = await req.json();

    if (!listingId || !amountThs || amountThs <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch listing
    const { data: listing, error: listingError } = await supabaseClient
      .from('hashrate_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'ACTIVE')
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: 'Listing not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate buyer is not seller
    if (listing.seller_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot buy your own listing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount
    if (amountThs > listing.amount_ths) {
      return new Response(
        JSON.stringify({ error: 'Requested amount exceeds available hashrate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pricePerThs = parseFloat(listing.price_per_ths);
    const totalPrice = amountThs * pricePerThs;

    // Create trade record
    const { data: trade, error: tradeError } = await supabaseClient
      .from('hashrate_trades')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount_ths: amountThs,
        price_per_ths: pricePerThs,
        total_price: totalPrice,
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Trade creation error:', tradeError);
      return new Response(
        JSON.stringify({ error: 'Failed to create trade' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch seller's allocation
    const { data: sellerAllocation, error: allocError } = await supabaseClient
      .from('hashrate_allocations')
      .select('*')
      .eq('id', listing.allocation_id)
      .single();

    if (allocError || !sellerAllocation) {
      await supabaseClient.from('hashrate_trades').delete().eq('id', trade.id);
      return new Response(
        JSON.stringify({ error: 'Seller allocation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update seller's allocation (reduce untokenized)
    const { error: updateSellerError } = await supabaseClient
      .from('hashrate_allocations')
      .update({
        untokenized_ths: sellerAllocation.untokenized_ths - amountThs,
      })
      .eq('id', listing.allocation_id);

    if (updateSellerError) {
      await supabaseClient.from('hashrate_trades').delete().eq('id', trade.id);
      return new Response(
        JSON.stringify({ error: 'Failed to update seller allocation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update buyer's allocation
    const { data: buyerAllocation, error: buyerAllocError } = await supabaseClient
      .from('hashrate_allocations')
      .select('*')
      .eq('user_id', user.id)
      .eq('machine_inventory_id', sellerAllocation.machine_inventory_id)
      .maybeSingle();

    if (buyerAllocation) {
      // Update existing allocation
      await supabaseClient
        .from('hashrate_allocations')
        .update({
          total_ths: buyerAllocation.total_ths + amountThs,
          untokenized_ths: buyerAllocation.untokenized_ths + amountThs,
        })
        .eq('id', buyerAllocation.id);
    } else {
      // Create new allocation for buyer
      await supabaseClient
        .from('hashrate_allocations')
        .insert({
          user_id: user.id,
          machine_inventory_id: sellerAllocation.machine_inventory_id,
          total_ths: amountThs,
          tokenized_ths: 0,
          untokenized_ths: amountThs,
          status: 'ACTIVE',
        });
    }

    // Update listing
    const remainingAmount = listing.amount_ths - amountThs;
    if (remainingAmount <= 0) {
      await supabaseClient
        .from('hashrate_listings')
        .update({ status: 'SOLD' })
        .eq('id', listingId);
    } else {
      await supabaseClient
        .from('hashrate_listings')
        .update({ 
          amount_ths: remainingAmount,
          total_price: remainingAmount * pricePerThs,
        })
        .eq('id', listingId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        trade: {
          id: trade.id,
          amountThs: trade.amount_ths,
          totalPrice: trade.total_price,
          status: trade.status,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

// Apply rate limiting: 30 requests per minute per user
Deno.serve(withRateLimit(handler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
}));
