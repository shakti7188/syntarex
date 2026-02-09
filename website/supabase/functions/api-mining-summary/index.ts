import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log(`Fetching mining summary for user: ${user.id}`);

    // Fetch user's hashrate allocations
    const { data: allocations, error: allocationsError } = await supabaseClient
      .from('hashrate_allocations')
      .select('total_ths, tokenized_ths, untokenized_ths')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE');

    if (allocationsError) {
      console.error('Error fetching allocations:', allocationsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch allocations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate totals from allocations
    const totalThsOwned = (allocations || []).reduce(
      (sum: number, item: any) => sum + parseFloat(item.total_ths || '0'),
      0
    );

    const thsTokenized = (allocations || []).reduce(
      (sum: number, item: any) => sum + parseFloat(item.tokenized_ths || '0'),
      0
    );

    const thsAvailableForTokenization = (allocations || []).reduce(
      (sum: number, item: any) => sum + parseFloat(item.untokenized_ths || '0'),
      0
    );

    const summary = {
      totalThsOwned: totalThsOwned.toFixed(3),
      thsTokenized: thsTokenized.toFixed(3),
      thsAvailableForTokenization: thsAvailableForTokenization.toFixed(3),
    };

    console.log('Mining summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mining summary:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
