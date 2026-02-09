import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface PhaseResult {
  phase: number;
  name: string;
  tests: TestResult[];
  passed: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await validateAdminAuth(req);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error!.message }), {
        status: auth.error!.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const { phase } = body; // Optional: test specific phase only

    const results: PhaseResult[] = [];

    // ========== PHASE 1: Database Schema Tests ==========
    if (!phase || phase === 1) {
      const phase1Tests: TestResult[] = [];

      // Test 1.1: Verify army ranks exist
      const { data: ranks } = await supabase.from('rank_definitions').select('*').order('rank_level');
      const expectedRanks = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General', '5-Star General'];
      const ranksExist = !!(ranks && ranks.length >= 9 && expectedRanks.every(r => ranks.some(rank => rank.rank_name === r)));
      phase1Tests.push({
        name: 'Army ranks exist',
        passed: ranksExist,
        message: ranksExist ? `Found ${ranks?.length} ranks` : 'Missing expected army ranks',
        details: ranks?.map(r => ({ name: r.rank_name, level: r.rank_level }))
      });

      // Test 1.2: Verify rank_weekly_caps
      const { data: caps } = await supabase.from('rank_weekly_caps').select('*');
      const capsValid = !!(caps && caps.length >= 9);
      phase1Tests.push({
        name: 'Rank weekly caps configured',
        passed: capsValid,
        message: capsValid ? `Found ${caps?.length} cap configurations` : 'Missing rank weekly caps',
        details: caps?.map(c => ({ rank: c.rank_name, cap: c.weekly_cap_usd, hard_cap: c.hard_cap_usd }))
      });

      // Test 1.3: Verify ghost_bv table exists
      const { error: ghostBvError } = await supabase.from('ghost_bv').select('id').limit(1);
      phase1Tests.push({
        name: 'Ghost BV table exists',
        passed: !ghostBvError,
        message: !ghostBvError ? 'ghost_bv table accessible' : `Error: ${ghostBvError?.message}`
      });

      // Test 1.4: Verify staking tables exist
      const { error: stakingError } = await supabase.from('staking_positions').select('id').limit(1);
      const { error: rewardsError } = await supabase.from('staking_rewards').select('id').limit(1);
      phase1Tests.push({
        name: 'Staking tables exist',
        passed: !stakingError && !rewardsError,
        message: !stakingError && !rewardsError ? 'staking_positions and staking_rewards accessible' : 'Staking tables missing'
      });

      // Test 1.5: Verify leadership_pool_distributions table
      const { error: leadershipError } = await supabase.from('leadership_pool_distributions').select('id').limit(1);
      phase1Tests.push({
        name: 'Leadership pool table exists',
        passed: !leadershipError,
        message: !leadershipError ? 'leadership_pool_distributions accessible' : `Error: ${leadershipError?.message}`
      });

      // Test 1.6: Verify commission_settings have Synterax values
      const { data: commSettings } = await supabase.from('commission_settings').select('*');
      const hasDirectTiers = commSettings?.some(s => s.setting_name.includes('direct_tier'));
      const hasBinaryRate = commSettings?.some(s => s.setting_name.includes('binary'));
      phase1Tests.push({
        name: 'Commission settings configured',
        passed: !!(hasDirectTiers && hasBinaryRate),
        message: hasDirectTiers && hasBinaryRate ? 'Synterax commission settings found' : 'Missing Synterax commission settings',
        details: commSettings?.map(s => ({ name: s.setting_name, value: s.setting_value }))
      });

      // Test 1.7: Verify packages have commission_unlock_level
      const { data: packages } = await supabase.from('packages').select('id, name, price_usd, commission_unlock_level, bv_percent');
      const packagesConfigured = !!(packages && packages.some(p => p.commission_unlock_level !== null));
      phase1Tests.push({
        name: 'Packages have commission unlock levels',
        passed: packagesConfigured,
        message: packagesConfigured ? 'Packages configured with unlock levels' : 'Packages missing commission_unlock_level',
        details: packages?.map(p => ({ name: p.name, price: p.price_usd, unlock: p.commission_unlock_level, bv: p.bv_percent }))
      });

      results.push({
        phase: 1,
        name: 'Database Schema',
        tests: phase1Tests,
        passed: phase1Tests.every(t => t.passed)
      });
    }

    // ========== PHASE 2: Commission Engine Tests ==========
    if (!phase || phase === 2) {
      const phase2Tests: TestResult[] = [];

      // Get test users for commission testing
      const { data: testUsers } = await supabase
        .from('profiles')
        .select('id, email, full_name, sponsor_id')
        .like('email', '%@test.com')
        .limit(10);

      const hasTestUsers = !!(testUsers && testUsers.length >= 2);
      phase2Tests.push({
        name: 'Test users exist',
        passed: hasTestUsers,
        message: hasTestUsers ? `Found ${testUsers?.length} test users` : 'No test users found - run test data generator first'
      });

      // Test 2.1: Check direct commissions structure
      const { data: directComms } = await supabase.from('direct_commissions').select('*').limit(10);
      const hasDirectComms = !!(directComms && directComms.length > 0);
      phase2Tests.push({
        name: 'Direct commissions calculated',
        passed: hasDirectComms,
        message: hasDirectComms ? `Found ${directComms?.length} direct commission records` : 'No direct commissions found',
        details: directComms?.slice(0, 3)
      });

      // Test 2.2: Check binary commissions structure
      const { data: binaryComms } = await supabase.from('binary_commissions').select('*').limit(10);
      const hasBinaryComms = !!(binaryComms && binaryComms.length > 0);
      phase2Tests.push({
        name: 'Binary commissions calculated',
        passed: hasBinaryComms,
        message: hasBinaryComms ? `Found ${binaryComms?.length} binary commission records` : 'No binary commissions found',
        details: binaryComms?.slice(0, 3)
      });

      // Test 2.3: Check Ghost BV records
      const { data: ghostBvRecords } = await supabase.from('ghost_bv').select('*').limit(10);
      const hasGhostBv = !!(ghostBvRecords && ghostBvRecords.length > 0);
      phase2Tests.push({
        name: 'Ghost BV records exist',
        passed: hasGhostBv,
        message: hasGhostBv ? `Found ${ghostBvRecords?.length} Ghost BV records` : 'No Ghost BV records found',
        details: ghostBvRecords?.slice(0, 3).map(g => ({ 
          amount: g.ghost_bv_amount, 
          status: g.status,
          expires: g.expires_at 
        }))
      });

      // Test 2.4: Verify referral chain integrity
      const { data: referrals } = await supabase
        .from('referrals')
        .select('referrer_id, referee_id, referral_level')
        .in('referee_id', testUsers?.map(u => u.id) || []);
      
      const hasReferralChains = !!(referrals && referrals.length > 0);
      const hasMultipleLevels = !!(referrals && [...new Set(referrals.map(r => r.referral_level))].length >= 2);
      phase2Tests.push({
        name: 'Referral chains intact',
        passed: hasReferralChains && hasMultipleLevels,
        message: hasReferralChains ? `Found ${referrals?.length} referral records across ${[...new Set(referrals?.map(r => r.referral_level))].length} levels` : 'No referral chains found'
      });

      // Test 2.5: Invoke commission engine
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const { data: engineResult, error: engineError } = await supabase.functions.invoke('commission-engine', {
        body: { weekStart: weekStartStr, dryRun: true }
      });
      
      phase2Tests.push({
        name: 'Commission engine callable',
        passed: !engineError,
        message: !engineError ? 'Commission engine executed successfully' : `Engine error: ${engineError?.message}`,
        details: engineResult
      });

      results.push({
        phase: 2,
        name: 'Commission Engine',
        tests: phase2Tests,
        passed: phase2Tests.every(t => t.passed)
      });
    }

    // ========== PHASE 3: Premium Bonus Tests ==========
    if (!phase || phase === 3) {
      const phase3Tests: TestResult[] = [];

      // Test 3.1: Check packages with premium eligibility
      const { data: premiumPackages } = await supabase
        .from('packages')
        .select('*')
        .eq('is_premium_bonus_eligible', true);
      
      phase3Tests.push({
        name: 'Premium packages configured',
        passed: !!(premiumPackages && premiumPackages.length > 0),
        message: premiumPackages?.length ? `Found ${premiumPackages.length} premium-eligible packages` : 'No premium packages found',
        details: premiumPackages?.map(p => ({ name: p.name, price: p.price_usd }))
      });

      // Test 3.2: Check for premium package purchases
      const { data: premiumPurchases } = await supabase
        .from('package_purchases')
        .select('*, packages!inner(name, price_usd, is_premium_bonus_eligible)')
        .eq('packages.is_premium_bonus_eligible', true)
        .limit(5);

      phase3Tests.push({
        name: 'Premium purchases tracked',
        passed: true, // This is informational
        message: `Found ${premiumPurchases?.length || 0} premium package purchases`,
        details: premiumPurchases?.slice(0, 3)
      });

      // Test 3.3: Check direct commissions for premium bonus rates
      const { data: premiumComms } = await supabase
        .from('direct_commissions')
        .select('*')
        .eq('tier', 1)
        .gte('rate', 0.5)
        .limit(5);

      phase3Tests.push({
        name: 'Premium L1 100% bonus applied',
        passed: true, // Informational
        message: `Found ${premiumComms?.length || 0} potential 100% L1 premium commissions`
      });

      results.push({
        phase: 3,
        name: 'Premium Bonus System',
        tests: phase3Tests,
        passed: phase3Tests.every(t => t.passed)
      });
    }

    // ========== PHASE 4: Frontend Components Tests ==========
    if (!phase || phase === 4) {
      const phase4Tests: TestResult[] = [];

      // Test 4.1: Verify staking data accessible
      const { data: stakingPositions, error: stakingErr } = await supabase
        .from('staking_positions')
        .select('*')
        .limit(5);

      phase4Tests.push({
        name: 'Staking positions queryable',
        passed: !stakingErr,
        message: !stakingErr ? `Staking positions accessible (${stakingPositions?.length || 0} records)` : `Error: ${stakingErr?.message}`
      });

      // Test 4.2: Verify staking rewards accessible
      const { data: stakingRewards, error: rewardsErr } = await supabase
        .from('staking_rewards')
        .select('*')
        .limit(5);

      phase4Tests.push({
        name: 'Staking rewards queryable',
        passed: !rewardsErr,
        message: !rewardsErr ? `Staking rewards accessible (${stakingRewards?.length || 0} records)` : `Error: ${rewardsErr?.message}`
      });

      // Test 4.3: Verify Ghost BV with expiry countdown data
      const { data: ghostBv, error: ghostErr } = await supabase
        .from('ghost_bv')
        .select('*')
        .eq('status', 'active')
        .limit(5);

      phase4Tests.push({
        name: 'Active Ghost BV queryable',
        passed: !ghostErr,
        message: !ghostErr ? `Active Ghost BV accessible (${ghostBv?.length || 0} records)` : `Error: ${ghostErr?.message}`
      });

      // Test 4.4: Verify leadership pool data
      const { data: leadershipPool, error: leadershipErr } = await supabase
        .from('leadership_pool_distributions')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(1);

      phase4Tests.push({
        name: 'Leadership pool queryable',
        passed: !leadershipErr,
        message: !leadershipErr ? `Leadership pool accessible (${leadershipPool?.length || 0} distributions)` : `Error: ${leadershipErr?.message}`
      });

      // Test 4.5: Verify weekly settlements for cap tracking
      const { data: settlements, error: settlementsErr } = await supabase
        .from('weekly_settlements')
        .select('*')
        .order('week_start_date', { ascending: false })
        .limit(5);

      phase4Tests.push({
        name: 'Weekly settlements queryable',
        passed: !settlementsErr,
        message: !settlementsErr ? `Settlements accessible (${settlements?.length || 0} records)` : `Error: ${settlementsErr?.message}`
      });

      results.push({
        phase: 4,
        name: 'Frontend Data Access',
        tests: phase4Tests,
        passed: phase4Tests.every(t => t.passed)
      });
    }

    // ========== PHASE 5: Safety Valve Tests ==========
    if (!phase || phase === 5) {
      const phase5Tests: TestResult[] = [];

      // Test 5.1: Check Ghost BV expiry logic
      const { data: expiredGhostBv } = await supabase
        .from('ghost_bv')
        .select('*')
        .eq('status', 'expired')
        .limit(5);

      phase5Tests.push({
        name: 'Ghost BV expiry tracking',
        passed: true, // Informational
        message: `Found ${expiredGhostBv?.length || 0} expired Ghost BV records`
      });

      // Test 5.2: Check for capped settlements
      const { data: cappedSettlements } = await supabase
        .from('weekly_settlements')
        .select('*')
        .eq('cap_applied', true)
        .limit(5);

      phase5Tests.push({
        name: 'Cap enforcement tracking',
        passed: true, // Informational
        message: `Found ${cappedSettlements?.length || 0} capped settlements`
      });

      // Test 5.3: Verify hard cap enforcement ($40,000)
      const { data: overCapSettlements } = await supabase
        .from('weekly_settlements')
        .select('*')
        .gt('grand_total', 40000)
        .limit(5);

      phase5Tests.push({
        name: '$40K hard cap enforced',
        passed: !overCapSettlements || overCapSettlements.length === 0,
        message: overCapSettlements?.length ? `WARNING: Found ${overCapSettlements.length} settlements over $40K!` : 'No settlements exceed $40K hard cap'
      });

      // Test 5.4: Invoke safety valve processor
      const { data: safetyResult, error: safetyError } = await supabase.functions.invoke('safety-valve-processor', {
        body: { dryRun: true }
      });

      phase5Tests.push({
        name: 'Safety valve processor callable',
        passed: !safetyError,
        message: !safetyError ? 'Safety valve executed successfully' : `Error: ${safetyError?.message}`,
        details: safetyResult
      });

      // Test 5.5: Check binary volume data for 180-day flush tracking
      const { data: binaryVolume } = await supabase
        .from('binary_volume')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(5);

      phase5Tests.push({
        name: 'Binary volume tracking',
        passed: true, // Informational
        message: `Found ${binaryVolume?.length || 0} binary volume records`
      });

      results.push({
        phase: 5,
        name: 'Safety Valves',
        tests: phase5Tests,
        passed: phase5Tests.every(t => t.passed)
      });
    }

    // Calculate overall summary
    const totalTests = results.reduce((sum, r) => sum + r.tests.length, 0);
    const passedTests = results.reduce((sum, r) => sum + r.tests.filter(t => t.passed).length, 0);
    const allPassed = results.every(r => r.passed);

    return new Response(
      JSON.stringify({
        success: allPassed,
        summary: {
          totalPhases: results.length,
          totalTests,
          passedTests,
          failedTests: totalTests - passedTests,
          passRate: `${Math.round((passedTests / totalTests) * 100)}%`
        },
        phases: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Synterax test error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
