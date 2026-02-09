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
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Decode JWT from Authorization header (verify_jwt=true already validated it)
    const jwt = authHeader.replace('Bearer ', '').trim();

    let userId: string | null = null;
    try {
      const payloadPart = jwt.split('.')[1];
      if (!payloadPart) {
        throw new Error('Invalid token format');
      }
      const padded = payloadPart.padEnd(payloadPart.length + (4 - (payloadPart.length % 4)) % 4, '=');
      const decodedJson = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(decodedJson);
      userId = (payload.sub as string) ?? null;
    } catch (err) {
      console.error('Failed to decode JWT payload', err);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userId) {
      console.error('JWT missing subject (user id)');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching claimable settlements for user: ${userId}`);

    // Get user's wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.wallet_address) {
      return new Response(
        JSON.stringify({ 
          claimable: [],
          message: 'No wallet address linked to account' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const walletAddress = profile.wallet_address.toLowerCase();
    console.log(`Wallet address: ${walletAddress}`);

    // Fetch settlements with merkle proofs where user hasn't claimed yet
    const { data: settlements, error: settlementsError } = await supabase
      .from('weekly_settlements')
      .select(`
        week_start_date,
        week_end_date,
        grand_total,
        merkle_proof,
        merkle_root,
        blockchain_status,
        blockchain_tx_hash
      `)
      .eq('user_id', userId)
      .gt('grand_total', 0)
      .not('merkle_proof', 'is', null)
      .neq('blockchain_status', 'claimed');

    if (settlementsError) {
      console.error('Error fetching settlements:', settlementsError);
      throw new Error(`Failed to fetch settlements: ${settlementsError.message}`);
    }

    const claimable = (settlements || []).map((s: any) => {
      const weekStartTimestamp = Math.floor(new Date(s.week_start_date).getTime() / 1000);
      const amount = Math.floor(parseFloat(s.grand_total) * 1e6); // Convert to USDT (6 decimals)

      return {
        weekStart: weekStartTimestamp,
        weekStartDate: s.week_start_date,
        weekEndDate: s.week_end_date,
        amount: s.grand_total,
        amountWei: amount.toString(),
        merkleProof: s.merkle_proof,
        merkleRoot: s.merkle_root,
        status: s.blockchain_status || 'ready_to_claim',
        txHash: s.blockchain_tx_hash,
      };
    });

    console.log(`Found ${claimable.length} claimable settlements`);

    return new Response(
      JSON.stringify({ 
        claimable,
        walletAddress,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in get-claimable-settlements:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
