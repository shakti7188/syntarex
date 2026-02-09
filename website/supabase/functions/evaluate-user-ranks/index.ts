import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, userId } = body;

    console.log(`[evaluate-user-ranks] Action: ${action}, UserId: ${userId || 'all'}`);

    if (action === 'evaluate_single' && userId) {
      // Evaluate a single user
      const { data, error } = await supabase.rpc('evaluate_and_promote_user_rank', {
        p_user_id: userId
      });

      if (error) {
        console.error('[evaluate-user-ranks] Error evaluating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data?.[0] || { promoted: false };
      console.log(`[evaluate-user-ranks] User ${userId} evaluation result:`, result);

      return new Response(
        JSON.stringify({ 
          success: true, 
          result,
          message: result.promoted 
            ? `User promoted from ${result.old_rank_name} to ${result.new_rank_name}!` 
            : `User remains at ${result.old_rank_name}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'evaluate_all') {
      // Bulk evaluate all users
      const { data, error } = await supabase.rpc('bulk_evaluate_all_ranks');

      if (error) {
        console.error('[evaluate-user-ranks] Error in bulk evaluation:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data?.[0] || { total_evaluated: 0, total_promoted: 0, promotions: [] };
      console.log(`[evaluate-user-ranks] Bulk evaluation complete:`, result);

      return new Response(
        JSON.stringify({ 
          success: true, 
          result,
          message: `Evaluated ${result.total_evaluated} users. ${result.total_promoted} were promoted.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'set_rank' && userId) {
      // Admin manual rank override
      const { newRank, reason } = body;
      
      if (!newRank) {
        return new Response(
          JSON.stringify({ error: 'newRank is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase.rpc('admin_set_user_rank', {
        p_user_id: userId,
        p_new_rank: newRank,
        p_reason: reason || 'Manual admin override'
      });

      if (error) {
        console.error('[evaluate-user-ranks] Error setting rank:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[evaluate-user-ranks] User ${userId} rank set to ${newRank}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User rank set to ${newRank}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get rank statistics
    if (action === 'get_stats') {
      const { data: rankStats, error } = await supabase
        .from('profiles')
        .select('rank')
        .not('rank', 'is', null);

      if (error) {
        console.error('[evaluate-user-ranks] Error getting stats:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Count users per rank
      const rankCounts: Record<string, number> = {};
      rankStats?.forEach(({ rank }) => {
        const r = rank || 'Member';
        rankCounts[r] = (rankCounts[r] || 0) + 1;
      });

      // Get recent promotions
      const { data: recentPromotions } = await supabase
        .from('user_rank_history')
        .select('id, user_id, old_rank, new_rank, rank_level, achieved_at, criteria_met')
        .order('achieved_at', { ascending: false })
        .limit(20);

      return new Response(
        JSON.stringify({ 
          success: true, 
          rankDistribution: rankCounts,
          totalUsers: rankStats?.length || 0,
          recentPromotions: recentPromotions || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: evaluate_single, evaluate_all, set_rank, or get_stats' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[evaluate-user-ranks] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
