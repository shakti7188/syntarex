import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Ghost BV Processor
 * 
 * Handles Ghost BV lifecycle:
 * 1. Creates Ghost BV for new package purchases (80% BV, 10 day expiry)
 * 2. Expires Ghost BV after 10 days
 * 3. Adds Ghost BV to user's pay leg volume
 * 
 * Can be run on-demand or via cron job
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
    console.log(`Processing Ghost BV for ${today}`);

    // Get Ghost BV settings
    const { data: settings } = await supabase
      .from('commission_settings')
      .select('setting_name, setting_value')
      .in('setting_name', ['ghost_bv_percent', 'ghost_bv_duration_days', 'ghost_bv_weekly_cap']);

    const settingsMap = new Map(settings?.map((s: any) => [s.setting_name, s.setting_value]) || []);
    const ghostBvPercent = (settingsMap.get('ghost_bv_percent') || 80) / 100;
    const durationDays = settingsMap.get('ghost_bv_duration_days') || 10;
    const weeklyCap = settingsMap.get('ghost_bv_weekly_cap') || 20000;

    // Step 1: Expire old Ghost BV
    const { data: expiredRecords, error: expireError } = await supabase
      .from('ghost_bv')
      .update({ status: 'expired' })
      .lt('expires_at', today)
      .eq('status', 'active')
      .select('id, user_id, ghost_bv_amount, pay_leg');

    if (expireError) {
      console.error('Error expiring ghost BV:', expireError);
    }

    const expiredCount = expiredRecords?.length || 0;
    console.log(`Expired ${expiredCount} Ghost BV records`);

    // Remove expired Ghost BV from binary volumes
    for (const expired of expiredRecords || []) {
      const updateField = expired.pay_leg === 'left' ? 'left_volume' : 'right_volume';
      
      // Decrement the volume
      await supabase.rpc('decrement_binary_volume', {
        p_user_id: expired.user_id,
        p_leg: expired.pay_leg,
        p_amount: expired.ghost_bv_amount,
      });
    }

    // Step 2: Find new package purchases without Ghost BV
    const { data: newPurchases, error: purchaseError } = await supabase
      .from('package_purchases')
      .select(`
        id,
        user_id,
        package_id,
        total_price,
        created_at,
        packages(bv_percent)
      `)
      .eq('status', 'COMPLETED')
      .is('ghost_bv_created', null);

    if (purchaseError) {
      throw new Error(`Failed to fetch purchases: ${purchaseError.message}`);
    }

    console.log(`Found ${newPurchases?.length || 0} purchases needing Ghost BV`);

    // Step 3: Create Ghost BV for new purchases
    const ghostBvToCreate = [];
    const purchasesToUpdate = [];

    for (const purchase of newPurchases || []) {
      // Calculate Ghost BV amount
      const bvPercent = (purchase as any).packages?.bv_percent || ghostBvPercent * 100;
      const ghostBvAmount = purchase.total_price * (bvPercent / 100);

      // Check weekly cap for user
      const weekStart = getWeekStart(new Date(purchase.created_at));
      const { data: weeklyGhost } = await supabase
        .from('ghost_bv')
        .select('ghost_bv_amount')
        .eq('user_id', purchase.user_id)
        .gte('start_date', weekStart)
        .eq('status', 'active');

      const currentWeeklyTotal = weeklyGhost?.reduce((sum, g) => sum + Number(g.ghost_bv_amount), 0) || 0;
      
      // Apply weekly cap
      let cappedAmount = ghostBvAmount;
      if (currentWeeklyTotal + ghostBvAmount > weeklyCap) {
        cappedAmount = Math.max(0, weeklyCap - currentWeeklyTotal);
        console.log(`Ghost BV capped for user ${purchase.user_id}: ${ghostBvAmount} -> ${cappedAmount}`);
      }

      if (cappedAmount <= 0) continue;

      // Get user's pay leg (weak leg)
      const { data: binaryTree } = await supabase
        .from('binary_tree')
        .select('weak_leg')
        .eq('user_id', purchase.user_id)
        .maybeSingle();

      const payLeg = binaryTree?.weak_leg || 'left';

      // Calculate expiry
      const startDate = new Date(purchase.created_at);
      const expiresAt = new Date(startDate);
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      ghostBvToCreate.push({
        user_id: purchase.user_id,
        package_purchase_id: purchase.id,
        ghost_bv_amount: cappedAmount,
        original_package_value: purchase.total_price,
        pay_leg: payLeg,
        start_date: startDate.toISOString().split('T')[0],
        expires_at: expiresAt.toISOString().split('T')[0],
        status: 'active',
      });

      purchasesToUpdate.push(purchase.id);
    }

    // Insert Ghost BV records
    if (ghostBvToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('ghost_bv')
        .insert(ghostBvToCreate);

      if (insertError) {
        throw new Error(`Failed to create Ghost BV: ${insertError.message}`);
      }

      // Add Ghost BV to binary volumes
      for (const ghost of ghostBvToCreate) {
        await supabase.rpc('increment_binary_volume', {
          p_user_id: ghost.user_id,
          p_leg: ghost.pay_leg,
          p_amount: ghost.ghost_bv_amount,
        });
      }

      // Mark purchases as processed
      await supabase
        .from('package_purchases')
        .update({ ghost_bv_created: true })
        .in('id', purchasesToUpdate);
    }

    const totalGhostBvCreated = ghostBvToCreate.reduce((sum, g) => sum + g.ghost_bv_amount, 0);

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        ghostBvCreated: ghostBvToCreate.length,
        ghostBvExpired: expiredCount,
        totalGhostBvCreated,
        totalGhostBvExpired: expiredRecords?.reduce((sum, e) => sum + Number(e.ghost_bv_amount), 0) || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ghost BV processor error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
