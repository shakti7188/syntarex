import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { allocationId, amountThs, tokenSymbol } = await req.json();

    // Validate inputs
    if (!allocationId || typeof allocationId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid allocationId. Must be a valid UUID.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!amountThs || typeof amountThs !== 'number' || amountThs <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amountThs. Must be a positive number.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenSymbol || typeof tokenSymbol !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid tokenSymbol' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Tokenizing ${amountThs} TH/s from allocation ${allocationId} for user ${user.id}`);

    // Fetch the allocation
    const { data: allocation, error: allocationError } = await supabaseClient
      .from('hashrate_allocations')
      .select('*')
      .eq('id', allocationId)
      .eq('user_id', user.id) // Security: ensure user owns this allocation
      .single();

    if (allocationError || !allocation) {
      console.error('Error fetching allocation:', allocationError);
      return new Response(
        JSON.stringify({ error: 'Allocation not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate sufficient untokenized hashrate
    const untokenizedThs = parseFloat(allocation.untokenized_ths || '0');
    if (amountThs > untokenizedThs) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient untokenized hashrate. Available: ${untokenizedThs.toFixed(3)} TH/s`,
          availableThs: untokenizedThs 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute tokens to mint (1 token = 0.001 TH/s)
    const thsPerToken = 0.001;
    const tokensMinted = Math.floor(amountThs / thsPerToken);

    console.log(`Minting ${tokensMinted} ${tokenSymbol} tokens for ${amountThs} TH/s`);

    // Insert tokenization record
    const { data: tokenization, error: tokenizationError } = await supabaseClient
      .from('hashrate_tokenizations')
      .insert({
        user_id: user.id,
        allocation_id: allocationId,
        amount_ths: amountThs,
        token_symbol: tokenSymbol,
        tokens_minted: tokensMinted,
        status: 'PENDING',
      })
      .select()
      .single();

    if (tokenizationError) {
      console.error('Error creating tokenization record:', tokenizationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create tokenization record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Tokenization record created: ${tokenization.id}`);

    // Update allocation: increment tokenized_ths and recalculate untokenized_ths
    const newTokenizedThs = parseFloat(allocation.tokenized_ths || '0') + amountThs;
    const newUntokenizedThs = parseFloat(allocation.total_ths) - newTokenizedThs;

    const { error: updateError } = await supabaseClient
      .from('hashrate_allocations')
      .update({
        tokenized_ths: newTokenizedThs,
        untokenized_ths: newUntokenizedThs,
      })
      .eq('id', allocationId)
      .eq('user_id', user.id); // Security check

    if (updateError) {
      console.error('Error updating allocation:', updateError);
      // Rollback tokenization record
      await supabaseClient
        .from('hashrate_tokenizations')
        .delete()
        .eq('id', tokenization.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to update allocation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update tokenization status to CONFIRMED
    await supabaseClient
      .from('hashrate_tokenizations')
      .update({ status: 'CONFIRMED' })
      .eq('id', tokenization.id);

    console.log(`Successfully tokenized ${amountThs} TH/s for user ${user.id}`);

    // Broadcast real-time event
    const channel = supabaseClient.channel('mining-events');
    await channel.send({
      type: 'broadcast',
      event: 'mining.hashrate.tokenized',
      payload: {
        userId: user.id,
        allocationId,
        amountThs,
        tokensMinted,
        tokenSymbol,
        tokenizationId: tokenization.id,
      }
    });

    // TODO: In production, this would also:
    // - Call smart contract to mint tokens on-chain
    // - Update tx_hash when blockchain transaction completes
    // - Update status based on blockchain confirmation

    return new Response(
      JSON.stringify({
        status: 'SUCCESS',
        allocationId,
        amountThs: amountThs.toFixed(3),
        tokensMinted: tokensMinted.toString(),
        tokenSymbol,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in tokenize function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
