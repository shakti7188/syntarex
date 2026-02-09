import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Leadership Pool Distribution
 * 
 * Distributes the 3% leadership pool among qualified leaders:
 * - Tier 1 (1.5%): Colonel, General, 5-Star General
 * - Tier 2 (1.0%): Major
 * - Tier 3 (0.5%): Captain, Lieutenant
 * 
 * Should be run weekly after commission calculations
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const bodyText = await req.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { weekStart } = body;
    
    if (!weekStart) {
      return new Response(
        JSON.stringify({ error: 'weekStart required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Distributing leadership pool for week: ${weekStart}`);

    // Get leadership pool settings
    const { data: settings } = await supabase
      .from('commission_settings')
      .select('setting_name, setting_value')
      .in('setting_name', [
        'leadership_pool_percent',
        'leadership_tier_1_rate',
        'leadership_tier_2_rate',
        'leadership_tier_3_rate',
      ]);

    const settingsMap = new Map(settings?.map((s: any) => [s.setting_name, s.setting_value]) || []);
    const poolPercent = (settingsMap.get('leadership_pool_percent') || 3) / 100;
    const tierRates = [
      (settingsMap.get('leadership_tier_1_rate') || 1.5) / 100,
      (settingsMap.get('leadership_tier_2_rate') || 1.0) / 100,
      (settingsMap.get('leadership_tier_3_rate') || 0.5) / 100,
    ];

    // Get total weekly volume
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('week_start', weekStart)
      .eq('is_eligible', true);

    const totalVolume = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalPool = totalVolume * poolPercent;

    console.log(`Total volume: $${totalVolume.toFixed(2)}`);
    console.log(`Leadership pool (3%): $${totalPool.toFixed(2)}`);

    // Define rank tiers
    const RANK_TIERS: Record<string, number> = {
      '5-star general': 1,
      'general': 1,
      'colonel': 1,
      'major': 2,
      'captain': 3,
      'lieutenant': 3,
    };

    // Get all users with qualifying ranks
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, rank')
      .not('rank', 'is', null);

    // Group by tier
    const usersByTier: Record<number, string[]> = { 1: [], 2: [], 3: [] };
    
    for (const profile of profiles || []) {
      const rank = profile.rank?.toLowerCase() || '';
      const tier = RANK_TIERS[rank];
      if (tier) {
        usersByTier[tier].push(profile.id);
      }
    }

    // Calculate distribution
    const distributions: any[] = [];
    const qualifiedLeaders: Record<string, { count: number; share: number }> = {};

    for (let tier = 1; tier <= 3; tier++) {
      const tierUsers = usersByTier[tier];
      if (tierUsers.length === 0) continue;

      const tierPool = totalPool * (tierRates[tier - 1] / poolPercent);
      const sharePerUser = tierPool / tierUsers.length;

      qualifiedLeaders[`tier_${tier}`] = {
        count: tierUsers.length,
        share: sharePerUser,
      };

      for (const userId of tierUsers) {
        distributions.push({
          user_id: userId,
          tier,
          amount: sharePerUser,
        });
      }
    }

    // Calculate week end
    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    // Insert distribution record
    const { error: insertError } = await supabase
      .from('leadership_pool_distributions')
      .upsert({
        week_start: weekStart,
        week_end: weekEnd,
        total_weekly_volume: totalVolume,
        total_pool_amount: totalPool,
        tier_1_5_percent: tierRates[0] * 100,
        tier_1_0_percent: tierRates[1] * 100,
        tier_0_5_percent: tierRates[2] * 100,
        qualified_leaders: qualifiedLeaders,
        distribution_status: 'calculated',
        distributed_at: new Date().toISOString(),
      }, {
        onConflict: 'week_start',
      });

    if (insertError) {
      throw new Error(`Failed to save distribution: ${insertError.message}`);
    }

    console.log(`Distribution calculated:`);
    console.log(`  Tier 1: ${usersByTier[1].length} leaders, $${(distributions.filter(d => d.tier === 1).reduce((s, d) => s + d.amount, 0)).toFixed(2)}`);
    console.log(`  Tier 2: ${usersByTier[2].length} leaders, $${(distributions.filter(d => d.tier === 2).reduce((s, d) => s + d.amount, 0)).toFixed(2)}`);
    console.log(`  Tier 3: ${usersByTier[3].length} leaders, $${(distributions.filter(d => d.tier === 3).reduce((s, d) => s + d.amount, 0)).toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        weekStart,
        totalVolume,
        totalPool,
        distributions: distributions.length,
        qualifiedLeaders,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Leadership pool error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
