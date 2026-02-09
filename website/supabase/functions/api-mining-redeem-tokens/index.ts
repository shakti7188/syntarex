import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THS_PER_TOKEN = 0.001; // 1 token = 0.001 TH/s

Deno.serve(async (req) => {
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

    const { allocationId, tokenAmount, tokenSymbol } = await req.json();

    // Validate inputs
    if (!allocationId || !tokenAmount || !tokenSymbol || tokenAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters. Token amount must be positive.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate hashrate from tokens
    const hashrateToRestore = tokenAmount * THS_PER_TOKEN;

    // Fetch user's allocation
    const { data: allocation, error: allocError } = await supabaseClient
      .from('hashrate_allocations')
      .select('*')
      .eq('id', allocationId)
      .eq('user_id', user.id)
      .single();

    if (allocError || !allocation) {
      return new Response(
        JSON.stringify({ error: 'Allocation not found or does not belong to you' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has enough tokenized hashrate
    if (hashrateToRestore > allocation.tokenized_ths) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient tokenized hashrate to redeem', 
          available: allocation.tokenized_ths 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabaseClient
      .from('hashrate_tokenizations')
      .insert({
        user_id: user.id,
        allocation_id: allocationId,
        amount_ths: hashrateToRestore,
        tokens_minted: -tokenAmount, // Negative to indicate tokens burned
        token_symbol: tokenSymbol,
        status: 'PENDING',
      })
      .select()
      .single();

    if (redemptionError) {
      console.error('Redemption record creation error:', redemptionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create redemption record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update allocation: restore hashrate from tokenized to untokenized
    const { error: updateError } = await supabaseClient
      .from('hashrate_allocations')
      .update({
        tokenized_ths: allocation.tokenized_ths - hashrateToRestore,
        untokenized_ths: allocation.untokenized_ths + hashrateToRestore,
      })
      .eq('id', allocationId);

    if (updateError) {
      console.error('Allocation update error:', updateError);
      // Rollback redemption record
      await supabaseClient
        .from('hashrate_tokenizations')
        .delete()
        .eq('id', redemption.id);

      return new Response(
        JSON.stringify({ error: 'Failed to update allocation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update redemption status to CONFIRMED
    await supabaseClient
      .from('hashrate_tokenizations')
      .update({ status: 'CONFIRMED' })
      .eq('id', redemption.id);

    // Broadcast real-time event
    await supabaseClient.channel('hashrate-redemptions').send({
      type: 'broadcast',
      event: 'redemption_completed',
      payload: { 
        userId: user.id,
        allocationId,
        hashrateRestored: hashrateToRestore 
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        redemption: {
          id: redemption.id,
          hashrateRestored: hashrateToRestore,
          tokensBurned: tokenAmount,
          newTokenizedThs: allocation.tokenized_ths - hashrateToRestore,
          newUntokenizedThs: allocation.untokenized_ths + hashrateToRestore,
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
});
