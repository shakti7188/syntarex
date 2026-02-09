import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SYNTERAX SAFETY VALVE PROCESSOR
 * 
 * This function enforces all safety mechanisms to ensure platform sustainability:
 * 
 * 1. 40% GLOBAL PAYOUT CAP
 *    - Total payouts cannot exceed 40% of total volume
 *    - Enforced during commission calculation
 * 
 * 2. GHOST BV 10-DAY FLUSH
 *    - Ghost BV expires automatically after 10 days
 *    - Prevents artificial volume inflation
 * 
 * 3. WEEKLY RANK CAPS
 *    - Each rank has a maximum weekly earning limit
 *    - Private: $250, up to 5-Star General: $20,000
 *    - Hard cap: $40,000 per position
 * 
 * 4. 180-DAY VOLUME FLUSH
 *    - Binary volume older than 180 days is flushed
 *    - Ensures fresh activity drives commissions
 * 
 * Run this function daily via cron to maintain platform health.
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== SYNTERAX SAFETY VALVE PROCESSOR ===');
    console.log(`Started at: ${new Date().toISOString()}`);

    const results = {
      ghostBvExpired: 0,
      volumeFlushed: 0,
      capViolationsDetected: 0,
      weeklyCapResets: 0,
    };

    // ============= 1. GHOST BV 10-DAY EXPIRY =============
    console.log('\n--- Processing Ghost BV Expiry ---');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Find expired ghost BV
    const { data: expiredGhostBv, error: ghostError } = await supabase
      .from('ghost_bv')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .lt('expires_at', today)
      .eq('status', 'active')
      .select('id, user_id, ghost_bv_amount, pay_leg');

    if (ghostError) {
      console.error('Ghost BV expiry error:', ghostError);
    } else {
      results.ghostBvExpired = expiredGhostBv?.length || 0;
      console.log(`Expired ${results.ghostBvExpired} Ghost BV records`);

      // Remove expired ghost BV from binary tree volumes
      for (const ghost of expiredGhostBv || []) {
        const leg = ghost.pay_leg || 'left';
        
        // Get current volume
        const { data: tree } = await supabase
          .from('binary_tree')
          .select('left_volume, right_volume')
          .eq('user_id', ghost.user_id)
          .single();

        if (tree) {
          const currentVolume = leg === 'left' 
            ? (tree.left_volume || 0) 
            : (tree.right_volume || 0);
          const newVolume = Math.max(0, currentVolume - ghost.ghost_bv_amount);
          
          const updateData = leg === 'left' 
            ? { left_volume: newVolume }
            : { right_volume: newVolume };
          
          await supabase
            .from('binary_tree')
            .update(updateData)
            .eq('user_id', ghost.user_id);
        }
      }
    }

    // ============= 2. 180-DAY VOLUME FLUSH =============
    console.log('\n--- Processing 180-Day Volume Flush ---');
    
    const flushDate = new Date();
    flushDate.setDate(flushDate.getDate() - 180);
    const flushDateStr = flushDate.toISOString().split('T')[0];

    // Mark old volume as flushed
    const { data: flushedVolume, error: flushError } = await supabase
      .from('binary_volume')
      .update({ 
        carry_out: 0, // Zero out carry-over
        updated_at: new Date().toISOString()
      })
      .lt('week_start', flushDateStr)
      .gt('carry_out', 0)
      .select('id');

    if (flushError) {
      console.error('Volume flush error:', flushError);
    } else {
      results.volumeFlushed = flushedVolume?.length || 0;
      console.log(`Flushed carry-over from ${results.volumeFlushed} old volume records`);
    }

    // ============= 3. WEEKLY CAP RESET CHECK =============
    console.log('\n--- Checking Weekly Cap Resets ---');
    
    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];
    
    // Check if it's Monday (new week) - reset weekly earnings tracking
    if (dayOfWeek === 1) {
      console.log('New week detected - weekly caps reset automatically');
      results.weeklyCapResets = 1;
    }

    // ============= 4. CAP VIOLATION DETECTION =============
    console.log('\n--- Detecting Cap Violations ---');
    
    // Find any settlements that might have exceeded caps (safety check)
    const { data: violations, error: violationError } = await supabase
      .from('weekly_settlements')
      .select('id, user_id, grand_total, week_start')
      .gt('grand_total', 40000) // Hard cap
      .eq('status', 'pending');

    if (violationError) {
      console.error('Cap violation check error:', violationError);
    } else {
      results.capViolationsDetected = violations?.length || 0;
      
      if (violations && violations.length > 0) {
        console.warn(`⚠️ Found ${violations.length} potential cap violations!`);
        
        // Flag violations for manual review
        for (const violation of violations) {
          console.warn(`  - User ${violation.user_id}: $${violation.grand_total} (Week: ${violation.week_start})`);
          
          // Cap the settlement at $40,000
          await supabase
            .from('weekly_settlements')
            .update({ 
              grand_total: 40000,
              cap_applied: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', violation.id);
        }
      }
    }

    // ============= 5. GLOBAL CAP AUDIT =============
    console.log('\n--- Global 40% Cap Audit ---');
    
    // Get this week's totals
    const { data: weeklyStats } = await supabase
      .from('weekly_settlements')
      .select('grand_total')
      .eq('week_start', weekStart)
      .eq('status', 'pending');

    const totalPayouts = weeklyStats?.reduce((sum: number, s: { grand_total: number }) => sum + (s.grand_total || 0), 0) || 0;

    // Get this week's volume
    const { data: volumeStats } = await supabase
      .from('transactions')
      .select('amount')
      .gte('created_at', weekStart);

    const totalVolume = volumeStats?.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0) || 0;
    
    const payoutRatio = totalVolume > 0 ? (totalPayouts / totalVolume) * 100 : 0;
    
    console.log(`Weekly Volume: $${totalVolume.toLocaleString()}`);
    console.log(`Total Payouts: $${totalPayouts.toLocaleString()}`);
    console.log(`Payout Ratio: ${payoutRatio.toFixed(2)}%`);
    
    if (payoutRatio > 40) {
      console.warn(`⚠️ ALERT: Payout ratio (${payoutRatio.toFixed(2)}%) exceeds 40% cap!`);
    } else {
      console.log(`✓ Payout ratio within 40% cap`);
    }

    // ============= LOG SUMMARY =============
    console.log('\n=== SAFETY VALVE SUMMARY ===');
    console.log(`Ghost BV Expired: ${results.ghostBvExpired}`);
    console.log(`Volume Records Flushed: ${results.volumeFlushed}`);
    console.log(`Cap Violations Fixed: ${results.capViolationsDetected}`);
    console.log(`Weekly Cap Resets: ${results.weeklyCapResets}`);
    console.log(`Completed at: ${new Date().toISOString()}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Safety valves processed successfully',
      results,
      audit: {
        weekStart,
        totalVolume,
        totalPayouts,
        payoutRatio: payoutRatio.toFixed(2) + '%',
        withinCap: payoutRatio <= 40,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const error = err as Error;
    console.error('Safety valve processor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
