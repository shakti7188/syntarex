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
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated and is admin
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Test data creation initiated by admin user: ${user.id}`);

    console.log('=== Creating Comprehensive Test Data ===');

    // Clean existing test data
    await supabase.from('direct_commissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('binary_commissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('override_commissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('weekly_settlements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('binary_volume').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('binary_tree').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('referrals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_activity').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Cleaned existing data');

    // Create test users with structured network and RANK ASSIGNMENTS
    const users = [
      // Top Level (Admin) - Diamond rank, qualifies for all overrides
      { id: '10000000-0000-0000-0000-000000000001', email: 'admin@test.com', full_name: 'Admin User', sponsor_id: null, binary_parent_id: null, binary_position: null, rank: 'Diamond' },
      
      // Level 1 - Direct to Admin
      // User 2: Platinum (qualifies for all 3 override levels)
      { id: '10000000-0000-0000-0000-000000000002', email: 'user2@test.com', full_name: 'User 2 - Platinum', sponsor_id: '10000000-0000-0000-0000-000000000001', binary_parent_id: '10000000-0000-0000-0000-000000000001', binary_position: 'left', rank: 'Platinum' },
      // User 3: Gold (qualifies for all 3 override levels)
      { id: '10000000-0000-0000-0000-000000000003', email: 'user3@test.com', full_name: 'User 3 - Gold', sponsor_id: '10000000-0000-0000-0000-000000000001', binary_parent_id: '10000000-0000-0000-0000-000000000001', binary_position: 'right', rank: 'Gold' },
      
      // Level 2 - Under User 2 (left leg of Admin)
      // User 4: Silver (qualifies for Level 1 & 2 overrides only)
      { id: '10000000-0000-0000-0000-000000000004', email: 'user4@test.com', full_name: 'User 4 - Silver', sponsor_id: '10000000-0000-0000-0000-000000000002', binary_parent_id: '10000000-0000-0000-0000-000000000002', binary_position: 'left', rank: 'Silver' },
      // User 5: Bronze (qualifies for Level 1 override only)
      { id: '10000000-0000-0000-0000-000000000005', email: 'user5@test.com', full_name: 'User 5 - Bronze', sponsor_id: '10000000-0000-0000-0000-000000000002', binary_parent_id: '10000000-0000-0000-0000-000000000002', binary_position: 'right', rank: 'Bronze' },
      
      // Level 2 - Under User 3 (right leg of Admin)
      // User 6: Bronze (qualifies for Level 1 override only)
      { id: '10000000-0000-0000-0000-000000000006', email: 'user6@test.com', full_name: 'User 6 - Bronze', sponsor_id: '10000000-0000-0000-0000-000000000003', binary_parent_id: '10000000-0000-0000-0000-000000000003', binary_position: 'left', rank: 'Bronze' },
      // User 7: Member (NO rank - doesn't qualify for any overrides)
      { id: '10000000-0000-0000-0000-000000000007', email: 'user7@test.com', full_name: 'User 7 - Member', sponsor_id: '10000000-0000-0000-0000-000000000003', binary_parent_id: '10000000-0000-0000-0000-000000000003', binary_position: 'right', rank: 'Member' },
      
      // Level 3 - Under User 4 (tests qualification chain)
      // User 8: Member (earning binary, upline chain: Silver→Platinum→Diamond)
      { id: '10000000-0000-0000-0000-000000000008', email: 'user8@test.com', full_name: 'User 8 - Member', sponsor_id: '10000000-0000-0000-0000-000000000004', binary_parent_id: '10000000-0000-0000-0000-000000000004', binary_position: 'left', rank: 'Member' },
      // User 9: Member (earning binary, upline: Silver→Platinum→Diamond)
      { id: '10000000-0000-0000-0000-000000000009', email: 'user9@test.com', full_name: 'User 9 - Member', sponsor_id: '10000000-0000-0000-0000-000000000004', binary_parent_id: '10000000-0000-0000-0000-000000000004', binary_position: 'right', rank: 'Member' },
      
      // Level 3 - Under User 5 (tests Bronze qualification limits)
      // User 10: Member (earning binary, upline: Bronze→Platinum→Diamond)
      // Bronze should get Level 1, Platinum gets Level 2, Diamond gets Level 3
      { id: '10000000-0000-0000-0000-000000000010', email: 'user10@test.com', full_name: 'User 10 - Member', sponsor_id: '10000000-0000-0000-0000-000000000003', binary_parent_id: '10000000-0000-0000-0000-000000000005', binary_position: 'left', rank: 'Member' },
    ];

    // Insert profiles
    const { error: profileError } = await supabase.from('profiles').insert(users);
    if (profileError) throw profileError;
    console.log(`Created ${users.length} test users with rank assignments`);

    // Assign admin role to first user
    await supabase.from('user_roles').insert({ user_id: users[0].id, role: 'admin' });
    console.log('Assigned admin role');

    // Create binary tree entries
    const binaryTrees = users.map(u => ({
      user_id: u.id,
      left_leg_id: null,
      right_leg_id: null,
      left_volume: 0,
      right_volume: 0,
      weak_leg: null,
      total_left_members: 0,
      total_right_members: 0,
    }));

    const { error: binaryError } = await supabase.from('binary_tree').insert(binaryTrees);
    if (binaryError) throw binaryError;
    console.log('Created binary tree entries');

    // Create user activity entries
    const activities = users.map(u => ({
      user_id: u.id,
      is_active: true,
      inactive_weeks: 0,
    }));

    const { error: activityError } = await supabase.from('user_activity').insert(activities);
    if (activityError) throw activityError;
    console.log('Created user activity records');

    // Create transactions for week 2025-01-13
    const weekStart = '2025-01-13';
    const transactions = [
      // High volume users
      { user_id: users[1].id, amount: 5000, week_start: weekStart, is_eligible: true }, // User 2
      { user_id: users[2].id, amount: 4000, week_start: weekStart, is_eligible: true }, // User 3
      { user_id: users[3].id, amount: 3000, week_start: weekStart, is_eligible: true }, // User 4
      { user_id: users[4].id, amount: 2500, week_start: weekStart, is_eligible: true }, // User 5
      { user_id: users[5].id, amount: 2000, week_start: weekStart, is_eligible: true }, // User 6
      { user_id: users[6].id, amount: 1500, week_start: weekStart, is_eligible: true }, // User 7
      { user_id: users[7].id, amount: 1000, week_start: weekStart, is_eligible: true }, // User 8
      { user_id: users[8].id, amount: 800, week_start: weekStart, is_eligible: true },  // User 9
      { user_id: users[9].id, amount: 700, week_start: weekStart, is_eligible: true },  // User 10
      
      // Multiple transactions from same user
      { user_id: users[1].id, amount: 2000, week_start: weekStart, is_eligible: true }, // User 2 again
      { user_id: users[3].id, amount: 1500, week_start: weekStart, is_eligible: true }, // User 4 again
    ];

    const { error: txError } = await supabase.from('transactions').insert(transactions);
    if (txError) throw txError;
    console.log(`Created ${transactions.length} transactions`);

    // Calculate binary volumes (simulating accumulated volume)
    const binaryVolumes = [
      // Admin has both legs with volume
      { user_id: users[0].id, leg: 'left', volume: 13800, carry_in: 0, carry_out: 0, total_volume: 13800, week_start: weekStart },
      { user_id: users[0].id, leg: 'right', volume: 10200, carry_in: 0, carry_out: 0, total_volume: 10200, week_start: weekStart },
      
      // User 2 has strong left leg
      { user_id: users[1].id, leg: 'left', volume: 6300, carry_in: 0, carry_out: 0, total_volume: 6300, week_start: weekStart },
      { user_id: users[1].id, leg: 'right', volume: 2500, carry_in: 0, carry_out: 0, total_volume: 2500, week_start: weekStart },
      
      // User 3 has balanced legs
      { user_id: users[2].id, leg: 'left', volume: 2000, carry_in: 0, carry_out: 0, total_volume: 2000, week_start: weekStart },
      { user_id: users[2].id, leg: 'right', volume: 1500, carry_in: 0, carry_out: 0, total_volume: 1500, week_start: weekStart },
      
      // User 4 has small volume on both sides
      { user_id: users[3].id, leg: 'left', volume: 1000, carry_in: 0, carry_out: 0, total_volume: 1000, week_start: weekStart },
      { user_id: users[3].id, leg: 'right', volume: 800, carry_in: 0, carry_out: 0, total_volume: 800, week_start: weekStart },
      
      // User 5 has one leg only
      { user_id: users[4].id, leg: 'left', volume: 700, carry_in: 0, carry_out: 0, total_volume: 700, week_start: weekStart },
      { user_id: users[4].id, leg: 'right', volume: 0, carry_in: 0, carry_out: 0, total_volume: 0, week_start: weekStart },
    ];

    const { error: volumeError } = await supabase.from('binary_volume').insert(binaryVolumes);
    if (volumeError) throw volumeError;
    console.log(`Created ${binaryVolumes.length} binary volume records`);

    // Update binary_tree with volumes
    await supabase.from('binary_tree')
      .update({ left_volume: 13800, right_volume: 10200, weak_leg: 'right' })
      .eq('user_id', users[0].id);
    
    await supabase.from('binary_tree')
      .update({ left_volume: 6300, right_volume: 2500, weak_leg: 'right' })
      .eq('user_id', users[1].id);
    
    await supabase.from('binary_tree')
      .update({ left_volume: 2000, right_volume: 1500, weak_leg: 'right' })
      .eq('user_id', users[2].id);
    
    await supabase.from('binary_tree')
      .update({ left_volume: 1000, right_volume: 800, weak_leg: 'right' })
      .eq('user_id', users[3].id);
    
    await supabase.from('binary_tree')
      .update({ left_volume: 700, right_volume: 0, weak_leg: 'right' })
      .eq('user_id', users[4].id);

    console.log('Updated binary tree with volumes');

    // Calculate totals
    const totalSV = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    const summary = {
      users: users.length,
      transactions: transactions.length,
      totalSalesVolume: totalSV,
      weekStart: weekStart,
      networkStructure: {
        topLevel: 1,
        level1: 2,
        level2: 4,
        level3: 3,
      },
      rankDistribution: {
        Diamond: users.filter(u => u.rank === 'Diamond').length,
        Platinum: users.filter(u => u.rank === 'Platinum').length,
        Gold: users.filter(u => u.rank === 'Gold').length,
        Silver: users.filter(u => u.rank === 'Silver').length,
        Bronze: users.filter(u => u.rank === 'Bronze').length,
        Member: users.filter(u => u.rank === 'Member').length,
      },
      overrideTestScenarios: [
        'User 8 binary → User 4 (Silver L1), User 2 (Platinum L2), Admin (Diamond L3)',
        'User 9 binary → User 4 (Silver L1), User 2 (Platinum L2), Admin (Diamond L3)',
        'User 10 binary → User 5 (Bronze L1), User 2 (Platinum L2), Admin (Diamond L3)',
        'User 7 (Member upline) should be SKIPPED - doesn\'t qualify for any override'
      ],
      expectedCommissions: {
        directPool: totalSV * 0.20,
        binaryPool: totalSV * 0.17,
        overridePool: totalSV * 0.03,
        globalCap: totalSV * 0.40,
      },
    };

    console.log('=== Test Data Creation Complete ===');
    console.log(JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        message: 'Test data created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error creating test data:', error);
    
    // Handle authentication/authorization errors specifically
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message 
        }),
        { 
          status: error.message.includes('Unauthorized') ? 401 : 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
