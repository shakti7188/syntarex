import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommissionCalculation {
  userId: string;
  directCommissions: { tier: number; amount: number; rate: number }[];
  binaryCommission: { weakLegVolume: number; baseAmount: number; scaledAmount: number };
  overrideCommissions: { level: number; baseAmount: number; scaledAmount: number }[];
  totals: {
    directTotal: number;
    binaryTotal: number;
    overrideTotal: number;
    grandTotal: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { weekStart } = await req.json();
    
    if (!weekStart) {
      return new Response(
        JSON.stringify({ error: 'weekStart parameter required (YYYY-MM-DD format)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`=== Starting Commission Calculation for week: ${weekStart} ===`);

    // Step 1: Get total sales volume (SV) for the week
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount, user_id')
      .eq('week_start', weekStart)
      .eq('is_eligible', true);

    if (txError) throw txError;

    const totalSV = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
    console.log(`Total Sales Volume: ${totalSV}`);

    // Calculate pool limits
    const GLOBAL_CAP = totalSV * 0.40; // 40% of SV
    const BINARY_POOL_LIMIT = totalSV * 0.17; // 17% of SV
    const DIRECT_POOL_LIMIT = totalSV * 0.20; // 20% of SV
    const OVERRIDE_POOL_LIMIT = totalSV * 0.03; // 3% of SV

    console.log('Pool Limits:', {
      globalCap: GLOBAL_CAP,
      binaryPool: BINARY_POOL_LIMIT,
      directPool: DIRECT_POOL_LIMIT,
      overridePool: OVERRIDE_POOL_LIMIT
    });

    // Step 2: Get all active users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, sponsor_id, binary_parent_id, binary_position');

    if (profileError) throw profileError;

    const calculations: CommissionCalculation[] = [];

    // Direct commission rates
    const DIRECT_RATES = [0.10, 0.05, 0.03]; // 10%, 5%, 3% for tiers 1, 2, 3

    // Step 3: Calculate commissions for each user
    for (const user of profiles || []) {
      const calc: CommissionCalculation = {
        userId: user.id,
        directCommissions: [],
        binaryCommission: { weakLegVolume: 0, baseAmount: 0, scaledAmount: 0 },
        overrideCommissions: [],
        totals: { directTotal: 0, binaryTotal: 0, overrideTotal: 0, grandTotal: 0 }
      };

      // === DIRECT REFERRAL COMMISSIONS (3 tiers) ===
      const userTransactions = transactions?.filter(tx => tx.user_id === user.id) || [];
      const userSV = userTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

      if (userSV > 0) {
        // Get referral chain (users who referred this user up to 3 levels)
        let currentSponsor = user.sponsor_id;
        for (let tier = 0; tier < 3 && currentSponsor; tier++) {
          const sponsorProfile = profiles.find(p => p.id === currentSponsor);
          if (!sponsorProfile) break;

          const commissionAmount = userSV * DIRECT_RATES[tier];
          calc.directCommissions.push({
            tier: tier + 1,
            amount: commissionAmount,
            rate: DIRECT_RATES[tier]
          });

          // Store in database
          await supabase.from('direct_commissions').insert({
            user_id: currentSponsor,
            source_user_id: user.id,
            tier: tier + 1,
            amount: commissionAmount,
            rate: DIRECT_RATES[tier],
            week_start: weekStart,
            status: 'pending'
          });

          currentSponsor = sponsorProfile.sponsor_id;
        }

        calc.totals.directTotal = calc.directCommissions.reduce((sum, dc) => sum + dc.amount, 0);
      }

      // === BINARY WEAK-LEG COMMISSIONS ===
      const { data: binaryData } = await supabase
        .from('binary_tree')
        .select('left_volume, right_volume, weak_leg')
        .eq('user_id', user.id)
        .single();

      if (binaryData) {
        const weakLegVol = Math.min(binaryData.left_volume || 0, binaryData.right_volume || 0);
        const binaryRate = 0.10; // 10% on weak leg
        const binaryBase = weakLegVol * binaryRate;

        calc.binaryCommission = {
          weakLegVolume: weakLegVol,
          baseAmount: binaryBase,
          scaledAmount: binaryBase // Will be scaled later
        };

        calc.totals.binaryTotal = binaryBase;
      }

      // === LEADERSHIP OVERRIDES (3 levels on binary) ===
      const OVERRIDE_RATES = [0.05, 0.03, 0.02]; // 5%, 3%, 2% for levels 1, 2, 3

      // Get downline's binary commissions
      const { data: downlineBinary } = await supabase
        .from('binary_tree')
        .select('user_id, left_volume, right_volume')
        .eq('binary_parent_id', user.id);

      if (downlineBinary && downlineBinary.length > 0) {
        for (let level = 0; level < 3; level++) {
          const downlineBinaryTotal = downlineBinary.reduce((sum, db) => {
            const weakLeg = Math.min(db.left_volume || 0, db.right_volume || 0);
            return sum + (weakLeg * 0.10);
          }, 0);

          const overrideAmount = downlineBinaryTotal * OVERRIDE_RATES[level];
          calc.overrideCommissions.push({
            level: level + 1,
            baseAmount: overrideAmount,
            scaledAmount: overrideAmount // Will be scaled later
          });
        }

        calc.totals.overrideTotal = calc.overrideCommissions.reduce((sum, oc) => sum + oc.baseAmount, 0);
      }

      calc.totals.grandTotal = calc.totals.directTotal + calc.totals.binaryTotal + calc.totals.overrideTotal;
      calculations.push(calc);
    }

    // Step 4: Calculate total unscaled commissions
    const totalDirect = calculations.reduce((sum, c) => sum + c.totals.directTotal, 0);
    const totalBinary = calculations.reduce((sum, c) => sum + c.totals.binaryTotal, 0);
    const totalOverride = calculations.reduce((sum, c) => sum + c.totals.overrideTotal, 0);
    const totalUnscaled = totalDirect + totalBinary + totalOverride;

    console.log('Unscaled Totals:', { totalDirect, totalBinary, totalOverride, totalUnscaled });

    // Step 5: Apply scaling factors
    let directScaleFactor = 1.0;
    let binaryScaleFactor = 1.0;
    let overrideScaleFactor = 1.0;
    let globalScaleFactor = 1.0;

    // Scale each pool independently
    if (totalDirect > DIRECT_POOL_LIMIT) {
      directScaleFactor = DIRECT_POOL_LIMIT / totalDirect;
    }
    if (totalBinary > BINARY_POOL_LIMIT) {
      binaryScaleFactor = BINARY_POOL_LIMIT / totalBinary;
    }
    if (totalOverride > OVERRIDE_POOL_LIMIT) {
      overrideScaleFactor = OVERRIDE_POOL_LIMIT / totalOverride;
    }

    // Apply pool scaling
    const scaledDirect = totalDirect * directScaleFactor;
    const scaledBinary = totalBinary * binaryScaleFactor;
    const scaledOverride = totalOverride * overrideScaleFactor;
    const scaledTotal = scaledDirect + scaledBinary + scaledOverride;

    // Apply global cap if needed
    if (scaledTotal > GLOBAL_CAP) {
      globalScaleFactor = GLOBAL_CAP / scaledTotal;
    }

    console.log('Scale Factors:', {
      directScaleFactor,
      binaryScaleFactor,
      overrideScaleFactor,
      globalScaleFactor,
      finalScaledTotal: scaledTotal * globalScaleFactor
    });

    // Step 6: Apply scaling and store final commissions
    for (const calc of calculations) {
      const finalBinary = calc.totals.binaryTotal * binaryScaleFactor * globalScaleFactor;
      const finalOverride = calc.totals.overrideTotal * overrideScaleFactor * globalScaleFactor;
      const finalDirect = calc.totals.directTotal * directScaleFactor * globalScaleFactor;

      // Update direct commissions with scaling
      await supabase
        .from('direct_commissions')
        .update({ 
          amount: supabase.rpc('multiply_amount', { 
            original: calc.totals.directTotal,
            factor: directScaleFactor * globalScaleFactor 
          })
        })
        .eq('user_id', calc.userId)
        .eq('week_start', weekStart);

      // Store binary commission
      if (calc.binaryCommission.baseAmount > 0) {
        await supabase.from('binary_commissions').insert({
          user_id: calc.userId,
          week_start: weekStart,
          weak_leg_volume: calc.binaryCommission.weakLegVolume,
          base_amount: calc.binaryCommission.baseAmount,
          scaled_amount: finalBinary,
          scale_factor: binaryScaleFactor * globalScaleFactor,
          status: 'pending'
        });
      }

      // Store override commissions
      for (const override of calc.overrideCommissions) {
        const finalOverrideAmount = override.baseAmount * overrideScaleFactor * globalScaleFactor;
        await supabase.from('override_commissions').insert({
          user_id: calc.userId,
          source_user_id: calc.userId, // Source is downline in practice
          level: override.level,
          week_start: weekStart,
          base_amount: override.baseAmount,
          scaled_amount: finalOverrideAmount,
          status: 'pending'
        });
      }

      // Store weekly settlement
      await supabase.from('weekly_settlements').insert({
        user_id: calc.userId,
        week_start_date: weekStart,
        week_end_date: new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        direct_total: finalDirect,
        binary_total: finalBinary,
        override_total: finalOverride,
        grand_total: finalDirect + finalBinary + finalOverride,
        scale_factor_applied: globalScaleFactor,
        status: 'pending'
      });
    }

    const summary = {
      weekStart,
      salesVolume: totalSV,
      poolLimits: {
        globalCap: GLOBAL_CAP,
        binaryPool: BINARY_POOL_LIMIT,
        directPool: DIRECT_POOL_LIMIT,
        overridePool: OVERRIDE_POOL_LIMIT
      },
      unscaledTotals: {
        direct: totalDirect,
        binary: totalBinary,
        override: totalOverride,
        total: totalUnscaled
      },
      scaleFactors: {
        direct: directScaleFactor,
        binary: binaryScaleFactor,
        override: overrideScaleFactor,
        global: globalScaleFactor
      },
      finalTotals: {
        direct: scaledDirect * globalScaleFactor,
        binary: scaledBinary * globalScaleFactor,
        override: scaledOverride * globalScaleFactor,
        total: scaledTotal * globalScaleFactor
      },
      usersProcessed: calculations.length
    };

    console.log('=== Calculation Complete ===');
    console.log(JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in calculate-commissions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
