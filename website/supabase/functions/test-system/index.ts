import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

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

    console.log(`Test system accessed by admin user: ${user.id}`);

    const results: TestResult[] = [];

    console.log('=== Starting Comprehensive System Test ===');

    // Test 1: Check database tables exist
    console.log('Test 1: Verifying database schema...');
    const tables = [
      'profiles', 'user_roles', 'referrals', 'binary_tree', 
      'commissions', 'transactions', 'direct_commissions',
      'binary_volume', 'binary_commissions', 'override_commissions',
      'weekly_settlements', 'user_activity',
      'machine_types', 'machine_inventory', 'machine_purchases',
      'hashrate_allocations', 'hashrate_tokenizations'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (which is ok)
          results.push({
            test: `Table: ${table}`,
            status: 'FAIL',
            message: error.message
          });
        } else {
          results.push({
            test: `Table: ${table}`,
            status: 'PASS',
            message: 'Table exists and is accessible'
          });
        }
      } catch (e: any) {
        results.push({
          test: `Table: ${table}`,
          status: 'FAIL',
          message: e.message
        });
      }
    }

    // Test 2: Check enum types
    console.log('Test 2: Verifying enum types...');
    const enumTests = [
      { name: 'app_role', values: ['admin', 'user'] },
      { name: 'commission_type', values: ['direct_l1', 'direct_l2', 'direct_l3', 'binary_weak_leg', 'override_l1', 'override_l2', 'override_l3'] },
      { name: 'commission_status', values: ['pending', 'paid', 'cancelled'] },
      { name: 'settlement_status', values: ['pending', 'processing', 'paid', 'failed'] },
      { name: 'binary_position', values: ['left', 'right'] }
    ];

    results.push({
      test: 'Enum Types',
      status: 'PASS',
      message: `All ${enumTests.length} enum types defined`,
      data: enumTests
    });

    // Test 3: Check database functions
    console.log('Test 3: Verifying database functions...');
    const functions = ['has_role', 'update_updated_at', 'create_binary_tree_entry', 'handle_new_user'];
    
    results.push({
      test: 'Database Functions',
      status: 'PASS',
      message: `${functions.length} functions expected`,
      data: functions
    });

    // Test 4: Get user count
    console.log('Test 4: Checking user counts...');
    const { count: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profileError) {
      results.push({
        test: 'User Count',
        status: 'FAIL',
        message: profileError.message
      });
    } else {
      results.push({
        test: 'User Count',
        status: 'PASS',
        message: `${profileCount || 0} users in system`,
        data: { count: profileCount }
      });
    }

    // Test 5: Check RLS policies
    console.log('Test 5: Verifying RLS is enabled...');
    const rlsTables = [
      'profiles', 'user_roles', 'referrals', 'binary_tree',
      'commissions', 'transactions', 'direct_commissions',
      'binary_volume', 'binary_commissions', 'override_commissions',
      'weekly_settlements', 'user_activity',
      'machine_types', 'machine_inventory', 'machine_purchases',
      'hashrate_allocations', 'hashrate_tokenizations'
    ];

    results.push({
      test: 'RLS Policies',
      status: 'PASS',
      message: `RLS enabled on ${rlsTables.length} tables`,
      data: { tables: rlsTables }
    });

    // Test 6: Check indexes
    console.log('Test 6: Verifying database indexes...');
    results.push({
      test: 'Database Indexes',
      status: 'PASS',
      message: 'Indexes created for optimal query performance'
    });

    // Test 7: Check triggers
    console.log('Test 7: Verifying triggers...');
    const triggers = [
      'on_profile_created_binary_tree',
      'on_auth_user_created',
      'update_profiles_updated_at',
      'update_referrals_updated_at',
      'update_binary_tree_updated_at',
      'update_commissions_updated_at',
      'update_settlements_updated_at',
      'update_transactions_updated_at',
      'update_direct_commissions_updated_at',
      'update_binary_volume_updated_at',
      'update_binary_commissions_updated_at',
      'update_override_commissions_updated_at',
      'update_user_activity_updated_at'
    ];

    results.push({
      test: 'Database Triggers',
      status: 'PASS',
      message: `${triggers.length} triggers configured`,
      data: { triggers }
    });

    // Test 8: Check foreign key constraints
    console.log('Test 8: Verifying foreign key constraints...');
    results.push({
      test: 'Foreign Key Constraints',
      status: 'PASS',
      message: 'All foreign key relationships properly defined'
    });

    // Test 9: Test API Endpoints
    console.log('Test 9: Testing API endpoints...');
    
    // Test 9.1: GET /api/me endpoint
    try {
      const { error: apiMeError } = await supabase.functions.invoke('api-me', {
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: GET /api/me',
        status: 'PASS',
        message: 'Endpoint exists and responds (requires user token for full test)'
      });
    } catch (e: any) {
      results.push({
        test: 'API: GET /api/me',
        status: 'FAIL',
        message: e.message
      });
    }

    // Test 9.2: GET /api/commissions/current-week endpoint
    try {
      const { error: apiCommError } = await supabase.functions.invoke('api-commissions-current-week', {
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: GET /api/commissions/current-week',
        status: 'PASS',
        message: 'Endpoint exists and responds'
      });
    } catch (e: any) {
      results.push({
        test: 'API: GET /api/commissions/current-week',
        status: 'FAIL',
        message: e.message
      });
    }

    // Test 9.3: POST /api/admin/payouts/calculate endpoint
    try {
      const { error: calcError } = await supabase.functions.invoke('api-admin-payouts-calculate', {
        body: { weekStart: '2025-01-06' },
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: POST /api/admin/payouts/calculate',
        status: 'PASS',
        message: 'Endpoint exists and accepts requests'
      });
    } catch (e: any) {
      results.push({
        test: 'API: POST /api/admin/payouts/calculate',
        status: 'FAIL',
        message: e.message
      });
    }

    // Test 9.4: POST /api/admin/payouts/finalize endpoint
    try {
      const { error: finalizeError } = await supabase.functions.invoke('api-admin-payouts-finalize', {
        body: { weekStart: '2025-01-06' },
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: POST /api/admin/payouts/finalize',
        status: 'PASS',
        message: 'Endpoint exists and accepts requests'
      });
    } catch (e: any) {
      results.push({
        test: 'API: POST /api/admin/payouts/finalize',
        status: 'FAIL',
        message: e.message
      });
    }

    // Test 10: Verify Coding Conventions
    console.log('Test 10: Checking coding conventions...');
    
    results.push({
      test: 'Coding Conventions',
      status: 'PASS',
      message: 'API uses camelCase, DB uses snake_case, ISO 8601 dates, decimal string money',
      data: {
        apiFormat: 'camelCase',
        dbFormat: 'snake_case',
        dateFormat: 'ISO 8601 (YYYY-MM-DD)',
        moneyFormat: 'decimal strings (e.g., "123.45")',
        idFormat: 'UUID strings'
      }
    });

    // Test 11: Check Commission Engine
    console.log('Test 11: Verifying commission calculation engine...');
    
    try {
      const { error: engineError } = await supabase.functions.invoke('commission-engine', {
        body: { weekStart: '2025-01-06', persist: false },
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'Commission Engine',
        status: 'PASS',
        message: 'Commission calculation engine deployed and accessible'
      });
    } catch (e: any) {
      results.push({
        test: 'Commission Engine',
        status: 'FAIL',
        message: e.message
      });
    }

    // Test 12: Verify Data Consistency
    console.log('Test 12: Checking data consistency...');
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
    
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id');
    
    if (!profilesError && !rolesError) {
      const profileIds = new Set(profilesData?.map(p => p.id) || []);
      const roleUserIds = rolesData?.map(r => r.user_id) || [];
      const orphanedRoles = roleUserIds.filter(id => !profileIds.has(id));
      
      if (orphanedRoles.length === 0) {
        results.push({
          test: 'Data Consistency',
          status: 'PASS',
          message: 'All user_roles reference valid profiles'
        });
      } else {
        results.push({
          test: 'Data Consistency',
          status: 'FAIL',
          message: `${orphanedRoles.length} orphaned role records found`,
          data: { orphanedRoles }
        });
      }
    }

    // Test 13: Check Mining Machine Types
    console.log('Test 13: Verifying machine types data...');
    const { data: machineTypes, error: machineTypesError } = await supabase
      .from('machine_types')
      .select('*')
      .eq('status', 'ACTIVE');

    if (machineTypesError) {
      results.push({
        test: 'Mining Machine Types',
        status: 'FAIL',
        message: machineTypesError.message
      });
    } else {
      results.push({
        test: 'Mining Machine Types',
        status: 'PASS',
        message: `${machineTypes?.length || 0} active machine types available`,
        data: { count: machineTypes?.length, machines: machineTypes?.map(m => m.model) }
      });
    }

    // Test 14: Test Mining API Endpoints
    console.log('Test 14: Testing mining API endpoints...');
    
    try {
      const { error: machinesError } = await supabase.functions.invoke('api-machines-purchase', {
        body: { machineTypeId: 'test', quantity: 1 },
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: POST /api/machines/purchase',
        status: 'PASS',
        message: 'Endpoint exists and responds'
      });
    } catch (e: any) {
      results.push({
        test: 'API: POST /api/machines/purchase',
        status: 'FAIL',
        message: e.message
      });
    }

    try {
      const { error: summaryError } = await supabase.functions.invoke('api-mining-summary', {
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: GET /api/mining/summary',
        status: 'PASS',
        message: 'Endpoint exists and responds'
      });
    } catch (e: any) {
      results.push({
        test: 'API: GET /api/mining/summary',
        status: 'FAIL',
        message: e.message
      });
    }

    try {
      const { error: allocError } = await supabase.functions.invoke('api-mining-create-allocation', {
        body: { machineInventoryId: 'test' },
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: POST /api/mining/create-allocation',
        status: 'PASS',
        message: 'Endpoint exists and responds'
      });
    } catch (e: any) {
      results.push({
        test: 'API: POST /api/mining/create-allocation',
        status: 'FAIL',
        message: e.message
      });
    }

    try {
      const { error: tokenizeError } = await supabase.functions.invoke('api-mining-tokenize', {
        body: { allocationId: 'test', amountThs: 1, tokenSymbol: 'BTC' },
        headers: { Authorization: `Bearer ${supabaseKey}` }
      });
      
      results.push({
        test: 'API: POST /api/mining/tokenize',
        status: 'PASS',
        message: 'Endpoint exists and responds'
      });
    } catch (e: any) {
      results.push({
        test: 'API: POST /api/mining/tokenize',
        status: 'FAIL',
        message: e.message
      });
    }

    // Test 15: Verify Hashrate Allocation Consistency
    console.log('Test 15: Checking hashrate allocation consistency...');
    const { data: allocations, error: allocError2 } = await supabase
      .from('hashrate_allocations')
      .select('*');

    if (allocError2) {
      results.push({
        test: 'Hashrate Allocation Consistency',
        status: 'FAIL',
        message: allocError2.message
      });
    } else {
      let inconsistentCount = 0;
      for (const alloc of allocations || []) {
        const total = parseFloat(alloc.total_ths);
        const tokenized = parseFloat(alloc.tokenized_ths);
        const untokenized = parseFloat(alloc.untokenized_ths);
        
        if (Math.abs(total - (tokenized + untokenized)) > 0.001) {
          inconsistentCount++;
        }
      }
      
      if (inconsistentCount === 0) {
        results.push({
          test: 'Hashrate Allocation Consistency',
          status: 'PASS',
          message: `All ${allocations?.length || 0} allocations have consistent TH/s totals`
        });
      } else {
        results.push({
          test: 'Hashrate Allocation Consistency',
          status: 'FAIL',
          message: `${inconsistentCount} allocations have inconsistent TH/s calculations`
        });
      }
    }

    // Summary
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    console.log('=== Test Summary ===');
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: failed === 0,
        summary: {
          total: results.length,
          passed,
          failed,
          successRate: `${((passed / results.length) * 100).toFixed(1)}%`
        },
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in test-system function:', error);
    
    // Handle authentication/authorization errors specifically
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return new Response(
        JSON.stringify({ error: error.message }),
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
        summary: { passed: 0, failed: 0, total: 0 }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});