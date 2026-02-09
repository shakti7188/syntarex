import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format money as string decimal
function formatMoney(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0.00";
  
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? "0.00" : parsed.toFixed(2);
  }
  
  return amount.toFixed(2);
}

// Get current week start (Monday)
function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weekStart = getCurrentWeekStart();
    console.log('Fetching commissions for week:', weekStart, 'user:', user.id);

    // Fetch direct commissions
    const { data: directCommissions, error: directError } = await supabase
      .from('direct_commissions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('week_start', weekStart);

    if (directError) {
      console.error('Direct commissions error:', directError);
    }

    // Fetch binary commissions
    const { data: binaryCommissions, error: binaryError } = await supabase
      .from('binary_commissions')
      .select('scaled_amount')
      .eq('user_id', user.id)
      .eq('week_start', weekStart);

    if (binaryError) {
      console.error('Binary commissions error:', binaryError);
    }

    // Fetch override commissions
    const { data: overrideCommissions, error: overrideError } = await supabase
      .from('override_commissions')
      .select('scaled_amount')
      .eq('user_id', user.id)
      .eq('week_start', weekStart);

    if (overrideError) {
      console.error('Override commissions error:', overrideError);
    }

    // Calculate totals as strings
    const directTotal = (directCommissions || [])
      .reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
    
    const binaryTotal = (binaryCommissions || [])
      .reduce((sum, c) => sum + parseFloat(c.scaled_amount || '0'), 0);
    
    const overrideTotal = (overrideCommissions || [])
      .reduce((sum, c) => sum + parseFloat(c.scaled_amount || '0'), 0);
    
    const total = directTotal + binaryTotal + overrideTotal;

    const response = {
      weekStart,
      direct: formatMoney(directTotal),
      binary: formatMoney(binaryTotal),
      override: formatMoney(overrideTotal),
      total: formatMoney(total),
    };

    console.log('Returning commission breakdown:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in api-commissions-current-week:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
