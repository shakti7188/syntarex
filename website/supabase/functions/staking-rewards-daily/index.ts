import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Daily Staking Rewards Processor
 * 
 * This function processes daily staking rewards:
 * 1. Calculates BTC earnings for each active staking position
 * 2. Creates staking_rewards records
 * 3. Calculates 10% override for sponsors
 * 
 * Should be run via cron job daily
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Processing staking rewards for ${today}`);

    // Get staking override rate from settings
    const { data: settings } = await supabase
      .from('commission_settings')
      .select('setting_value')
      .eq('setting_name', 'staking_override_rate')
      .maybeSingle();
    
    const overrideRate = (settings?.setting_value || 10) / 100;

    // Get all active staking positions
    const { data: positions, error: posError } = await supabase
      .from('staking_positions')
      .select(`
        id,
        user_id,
        token_amount,
        daily_btc_rate,
        profiles!inner(sponsor_id)
      `)
      .eq('status', 'active');

    if (posError) {
      throw new Error(`Failed to fetch staking positions: ${posError.message}`);
    }

    if (!positions || positions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active staking positions',
          rewardsCreated: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${positions.length} active staking positions`);

    // Calculate rewards for each position
    const rewardsToInsert = [];
    const positionUpdates = [];

    for (const position of positions) {
      // Calculate daily BTC earnings
      const btcEarned = position.token_amount * position.daily_btc_rate;
      
      // Get sponsor ID from joined profiles
      const sponsorId = (position as any).profiles?.sponsor_id;

      // Calculate override for sponsor (10%)
      const overrideAmount = sponsorId ? btcEarned * overrideRate : 0;

      rewardsToInsert.push({
        user_id: position.user_id,
        staking_position_id: position.id,
        reward_date: today,
        btc_earned: btcEarned,
        override_paid_to_sponsor: overrideAmount,
        sponsor_id: sponsorId,
        status: 'pending',
      });

      // Track total earned for position update
      positionUpdates.push({
        id: position.id,
        btcToAdd: btcEarned,
      });
    }

    // Insert rewards
    const { error: insertError } = await supabase
      .from('staking_rewards')
      .insert(rewardsToInsert);

    if (insertError) {
      throw new Error(`Failed to insert staking rewards: ${insertError.message}`);
    }

    // Update position total_btc_earned
    for (const update of positionUpdates) {
      await supabase.rpc('increment_staking_btc_earned', {
        position_id: update.id,
        btc_amount: update.btcToAdd,
      });
    }

    const totalBtcDistributed = rewardsToInsert.reduce((sum, r) => sum + r.btc_earned, 0);
    const totalOverrides = rewardsToInsert.reduce((sum, r) => sum + r.override_paid_to_sponsor, 0);

    console.log(`Created ${rewardsToInsert.length} staking rewards`);
    console.log(`Total BTC distributed: ${totalBtcDistributed}`);
    console.log(`Total overrides: ${totalOverrides}`);

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        rewardsCreated: rewardsToInsert.length,
        totalBtcDistributed,
        totalOverrides,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Staking rewards error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
