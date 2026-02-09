import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createListingSchema } from "../_shared/validation.ts";
import { logAuditEvent, getClientIp, getUserAgent } from "../_shared/audit-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      await logAuditEvent(supabaseAdmin, {
        operation: 'CREATE_LISTING',
        resourceType: 'hashrate_listing',
        ipAddress: clientIp,
        userAgent,
        status: 'BLOCKED',
        errorMessage: 'Unauthorized access attempt',
      });

      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate input with zod
    const validated = createListingSchema.parse(body);
    const { allocationId, amountThs, pricePerThs, expiresInDays } = validated;


    // Fetch user's allocation
    const { data: allocation, error: allocError } = await supabaseClient
      .from('hashrate_allocations')
      .select('*')
      .eq('id', allocationId)
      .eq('user_id', user.id)
      .single();

    if (allocError || !allocation) {
      await logAuditEvent(supabaseAdmin, {
        userId: user.id,
        operation: 'CREATE_LISTING',
        resourceType: 'hashrate_listing',
        resourceId: allocationId,
        ipAddress: clientIp,
        userAgent,
        status: 'FAILED',
        errorMessage: 'Allocation not found',
      });

      return new Response(
        JSON.stringify({ error: 'Allocation not found or does not belong to you' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate available hashrate
    if (amountThs > allocation.untokenized_ths) {
      await logAuditEvent(supabaseAdmin, {
        userId: user.id,
        operation: 'CREATE_LISTING',
        resourceType: 'hashrate_listing',
        resourceId: allocationId,
        ipAddress: clientIp,
        userAgent,
        status: 'FAILED',
        errorMessage: 'Insufficient untokenized hashrate',
        metadata: { 
          requested: amountThs, 
          available: allocation.untokenized_ths 
        },
      });

      return new Response(
        JSON.stringify({ 
          error: 'Insufficient untokenized hashrate', 
          available: allocation.untokenized_ths 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiration date
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const totalPrice = amountThs * pricePerThs;

    // Create listing
    const { data: listing, error: createError } = await supabaseClient
      .from('hashrate_listings')
      .insert({
        seller_id: user.id,
        allocation_id: allocationId,
        amount_ths: amountThs,
        price_per_ths: pricePerThs,
        total_price: totalPrice,
        status: 'ACTIVE',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (createError) {
      console.error('Listing creation error:', createError);
      
      await logAuditEvent(supabaseAdmin, {
        userId: user.id,
        operation: 'CREATE_LISTING',
        resourceType: 'hashrate_listing',
        resourceId: allocationId,
        ipAddress: clientIp,
        userAgent,
        status: 'FAILED',
        errorMessage: createError.message,
      });

      return new Response(
        JSON.stringify({ error: 'Failed to create listing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful listing creation
    await logAuditEvent(supabaseAdmin, {
      userId: user.id,
      operation: 'CREATE_LISTING',
      resourceType: 'hashrate_listing',
      resourceId: listing.id,
      ipAddress: clientIp,
      userAgent,
      status: 'SUCCESS',
      metadata: {
        amountThs,
        pricePerThs,
        totalPrice,
        expiresAt,
      },
    });

    // Broadcast real-time event
    await supabaseClient.channel('marketplace-listings').send({
      type: 'broadcast',
      event: 'listing_created',
      payload: { listingId: listing.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        listing: {
          id: listing.id,
          amountThs: listing.amount_ths,
          pricePerThs: listing.price_per_ths,
          totalPrice: listing.total_price,
          expiresAt: listing.expires_at,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    
    // Log validation or unexpected errors
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      await logAuditEvent(supabaseAdmin, {
        userId: user?.id,
        operation: 'CREATE_LISTING',
        resourceType: 'hashrate_listing',
        ipAddress: clientIp,
        userAgent,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
