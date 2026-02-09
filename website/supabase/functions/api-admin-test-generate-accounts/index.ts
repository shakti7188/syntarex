import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authorization
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

    console.log('=== Test Data Generation Started ===');

    // Get current week start
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Seed default payout settings if missing
    const { data: existingSettings } = await supabase
      .from('payout_settings')
      .select('key')
      .limit(1);

    if (!existingSettings || existingSettings.length === 0) {
      console.log('Seeding default payout settings...');
      const defaultSettings = [
        { key: 'direct_tier1_rate', value: 0.10, description: 'Direct referral tier 1 rate (10%)', min_value: 0, max_value: 0.25 },
        { key: 'direct_tier2_rate', value: 0.05, description: 'Direct referral tier 2 rate (5%)', min_value: 0, max_value: 0.15 },
        { key: 'direct_tier3_rate', value: 0.03, description: 'Direct referral tier 3 rate (3%)', min_value: 0, max_value: 0.10 },
        { key: 'binary_base_rate', value: 0.10, description: 'Binary weak leg rate (10%)', min_value: 0, max_value: 0.20 },
        { key: 'binary_cap_pct', value: 0.17, description: 'Binary pool cap (17% of SV)', min_value: 0.10, max_value: 0.25 },
        { key: 'override_level1_rate', value: 0.015, description: 'Override level 1 rate (1.5%)', min_value: 0, max_value: 0.05 },
        { key: 'override_level2_rate', value: 0.010, description: 'Override level 2 rate (1.0%)', min_value: 0, max_value: 0.03 },
        { key: 'override_level3_rate', value: 0.005, description: 'Override level 3 rate (0.5%)', min_value: 0, max_value: 0.02 },
        { key: 'global_payout_cap', value: 0.40, description: 'Global payout cap (40% of SV)', min_value: 0.30, max_value: 0.50 },
      ];
      await supabase.from('payout_settings').insert(defaultSettings);
      console.log('✓ Default settings seeded');
    }

    // Create 10 test users with proper binary tree structure
    const testUsers = [
      { email: 'alice@test.com', full_name: 'Alice Test', sponsor_id: auth.user!.id, binary_parent_id: auth.user!.id, binary_position: 'left' },
      { email: 'bob@test.com', full_name: 'Bob Test', sponsor_id: auth.user!.id, binary_parent_id: auth.user!.id, binary_position: 'right' },
    ];

    const createdUsers: any[] = [];
    
    // Create first 2 users (direct under admin)
    for (const testUser of testUsers) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: 'TestPass123!',
        email_confirm: true,
      });

      if (authError) {
        console.error(`Failed to create ${testUser.email}:`, authError);
        continue;
      }

      await supabase.from('profiles').update({
        full_name: testUser.full_name,
        sponsor_id: testUser.sponsor_id,
        binary_parent_id: testUser.binary_parent_id,
        binary_position: testUser.binary_position,
      }).eq('id', authUser.user.id);

      // Create referral chain records for this user
      await supabase.rpc('create_referral_chain', {
        p_referee_id: authUser.user.id,
        p_sponsor_id: testUser.sponsor_id,
        p_binary_position: testUser.binary_position,
      });
      console.log(`✓ Created referral chain for ${testUser.full_name}`);

      await supabase.from('user_roles').insert({
        user_id: authUser.user.id,
        role: 'user',
      });

      await supabase.from('binary_tree').upsert({
        user_id: authUser.user.id,
        left_volume: 0,
        right_volume: 0,
      }, { onConflict: 'user_id' });

      await supabase.from('user_activity').upsert({
        user_id: authUser.user.id,
        is_active: true,
        last_activity_date: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      createdUsers.push({ id: authUser.user.id, ...testUser });
      console.log(`✓ Created ${testUser.full_name}`);
    }

    // Create next 8 users (under Alice and Bob)
    const moreUsers = [
      { email: 'carol@test.com', full_name: 'Carol Test', parentIdx: 0, position: 'left' },
      { email: 'dave@test.com', full_name: 'Dave Test', parentIdx: 0, position: 'right' },
      { email: 'eve@test.com', full_name: 'Eve Test', parentIdx: 1, position: 'left' },
      { email: 'frank@test.com', full_name: 'Frank Test', parentIdx: 1, position: 'right' },
      { email: 'grace@test.com', full_name: 'Grace Test', parentIdx: 2, position: 'left' },
      { email: 'heidi@test.com', full_name: 'Heidi Test', parentIdx: 2, position: 'right' },
      { email: 'ivan@test.com', full_name: 'Ivan Test', parentIdx: 3, position: 'left' },
      { email: 'judy@test.com', full_name: 'Judy Test', parentIdx: 3, position: 'right' },
    ];

    for (const testUser of moreUsers) {
      const parentUser = createdUsers[testUser.parentIdx];
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: 'TestPass123!',
        email_confirm: true,
      });

      if (authError) {
        console.error(`Failed to create ${testUser.email}:`, authError);
        continue;
      }

      // Use parent's sponsor for the referral chain (maintaining the hierarchy)
      const sponsorId = parentUser.id;

      await supabase.from('profiles').update({
        full_name: testUser.full_name,
        sponsor_id: sponsorId,
        binary_parent_id: parentUser.id,
        binary_position: testUser.position,
      }).eq('id', authUser.user.id);

      // Create referral chain records for this user
      await supabase.rpc('create_referral_chain', {
        p_referee_id: authUser.user.id,
        p_sponsor_id: sponsorId,
        p_binary_position: testUser.position,
      });
      console.log(`✓ Created referral chain for ${testUser.full_name}`);

      await supabase.from('user_roles').insert({
        user_id: authUser.user.id,
        role: 'user',
      });

      await supabase.from('binary_tree').upsert({
        user_id: authUser.user.id,
        left_volume: 0,
        right_volume: 0,
      }, { onConflict: 'user_id' });

      await supabase.from('user_activity').upsert({
        user_id: authUser.user.id,
        is_active: true,
        last_activity_date: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      createdUsers.push({ id: authUser.user.id, sponsor_id: sponsorId, ...testUser });
      console.log(`✓ Created ${testUser.full_name}`);
    }

    console.log(`✓ Created ${createdUsers.length} test users with referral chains`);

    // Assign deposits: First 5 get $5,000, next 5 get $10,000
    const transactions = [];
    for (let i = 0; i < createdUsers.length; i++) {
      const amount = i < 5 ? 5000 : 10000;
      const { data: tx } = await supabase.from('transactions').insert({
        user_id: createdUsers[i].id,
        amount,
        week_start: weekStartStr,
        is_eligible: true,
        currency: 'USD',
      }).select().single();
      
      transactions.push(tx);
      console.log(`✓ Deposit $${amount} for ${createdUsers[i].full_name}`);
    }

    const totalDeposits = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    console.log(`✓ Total deposits: $${totalDeposits}`);

    // === SYNTERAX TEST DATA ===
    console.log('Creating Synterax-specific test data...');

    // Create Ghost BV records for users with package purchases
    const ghostBvRecords = [];
    for (let i = 0; i < Math.min(5, createdUsers.length); i++) {
      const packageValue = i < 3 ? 1000 : 2500; // Mix of standard and premium
      const ghostBvAmount = packageValue * 0.8; // 80% of package value
      const startDate = new Date();
      const expiresAt = new Date(startDate);
      expiresAt.setDate(expiresAt.getDate() + 10); // 10-day expiry

      const { data: ghostBv } = await supabase.from('ghost_bv').insert({
        user_id: createdUsers[i].id,
        original_package_value: packageValue,
        ghost_bv_amount: ghostBvAmount,
        start_date: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
        pay_leg: i % 2 === 0 ? 'left' : 'right',
      }).select().single();
      
      if (ghostBv) ghostBvRecords.push(ghostBv);
      console.log(`✓ Created Ghost BV $${ghostBvAmount} for ${createdUsers[i].full_name}`);
    }

    // Create staking positions for some users
    const stakingPositions = [];
    for (let i = 0; i < Math.min(4, createdUsers.length); i++) {
      const tokenAmount = (i + 1) * 1000; // 1000, 2000, 3000, 4000 tokens
      const dailyBtcRate = 0.00001 * (i + 1); // Increasing rates

      const { data: position } = await supabase.from('staking_positions').insert({
        user_id: createdUsers[i].id,
        token_amount: tokenAmount,
        token_symbol: 'XFLOW',
        daily_btc_rate: dailyBtcRate,
        status: 'active',
        staked_at: new Date().toISOString(),
      }).select().single();

      if (position) {
        stakingPositions.push(position);
        
        // Create a staking reward record
        await supabase.from('staking_rewards').insert({
          user_id: createdUsers[i].id,
          staking_position_id: position.id,
          btc_earned: dailyBtcRate,
          override_paid_to_sponsor: dailyBtcRate * 0.1, // 10% override
          sponsor_id: createdUsers[i].sponsor_id,
          status: 'pending',
        });
      }
      console.log(`✓ Created staking position ${tokenAmount} XFLOW for ${createdUsers[i].full_name}`);
    }

    // Create a leadership pool distribution record
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    await supabase.from('leadership_pool_distributions').insert({
      week_start: weekStartStr,
      week_end: weekEnd.toISOString().split('T')[0],
      total_weekly_volume: totalDeposits,
      total_pool_amount: totalDeposits * 0.03, // 3% of volume
      tier_1_5_percent: totalDeposits * 0.015,
      tier_1_0_percent: totalDeposits * 0.01,
      tier_0_5_percent: totalDeposits * 0.005,
      distribution_status: 'pending',
      qualified_leaders: JSON.stringify([
        { tier: '1.5%', count: 2 },
        { tier: '1.0%', count: 3 },
        { tier: '0.5%', count: 5 },
      ]),
    });
    console.log('✓ Created leadership pool distribution');

    // Trigger commission calculation
    console.log('Calculating commissions...');
    const { data: commissionData, error: commError } = await supabase.functions.invoke('commission-engine', {
      body: { weekStart: weekStartStr }
    });

    if (commError) {
      console.error('Commission calculation error:', commError);
    } else {
      console.log('✓ Commissions calculated via commission-engine');
    }

    // Fetch results for response
    const [
      { data: directComms },
      { data: binaryComms },
      { data: overrideComms },
      { data: settlements },
      { data: referralRecords },
      { data: ghostBvData },
      { data: stakingData },
    ] = await Promise.all([
      supabase.from('direct_commissions').select('*').eq('week_start', weekStartStr),
      supabase.from('binary_commissions').select('*').eq('week_start', weekStartStr),
      supabase.from('override_commissions').select('*').eq('week_start', weekStartStr),
      supabase.from('weekly_settlements').select('*').eq('week_start_date', weekStartStr),
      supabase.from('referrals').select('*').in('referee_id', createdUsers.map(u => u.id)),
      supabase.from('ghost_bv').select('*').in('user_id', createdUsers.map(u => u.id)),
      supabase.from('staking_positions').select('*').in('user_id', createdUsers.map(u => u.id)),
    ]);

    const result = {
      success: true,
      message: 'Test data generated successfully with complete referral chains and Synterax data',
      summary: {
        usersCreated: createdUsers.length,
        referralRecordsCreated: referralRecords?.length || 0,
        totalDeposits,
        weekStart: weekStartStr,
        commissions: {
          direct: directComms?.length || 0,
          binary: binaryComms?.length || 0,
          override: overrideComms?.length || 0,
          settlements: settlements?.length || 0,
        },
        synterax: {
          ghostBvRecords: ghostBvData?.length || 0,
          stakingPositions: stakingData?.length || 0,
          leadershipPool: 1,
        }
      },
      users: createdUsers.map(u => ({ id: u.id, name: u.full_name, email: u.email })),
    };

    console.log('=== Test Data Generation Complete ===');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
