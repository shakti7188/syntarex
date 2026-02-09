import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= PUBLIC API TYPE =============

export type WeeklyPayoutResult = {
  weekStart: string;
  settlements: Array<{
    userId: string;
    direct: string;
    binary: string;
    override: string;
    leadership: string;
    stakingOverride: string;
    total: string;
    scaleFactor: string;
    capApplied: boolean;
  }>;
  totals: {
    SV: string;
    T_dir: string;
    T_bin: string;
    T_ov: string;
    T_lead: string;
    T_staking: string;
    total: string;
    globalScaleFactor: string;
  };
  ghostBvCreated: number;
  ghostBvExpired: number;
};

// ============= TYPE DEFINITIONS =============

interface User {
  id: string;
  rank: string;
  sponsor_id: string | null;
  binary_parent_id: string | null;
  binary_position: 'left' | 'right' | null;
  highest_package_value: number;
  commission_unlock_level: number;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  week_start: string;
  package_id?: string;
}

interface PackagePurchase {
  id: string;
  user_id: string;
  package_id: string;
  total_price: number;
  created_at: string;
}

interface Package {
  id: string;
  price_usd: number;
  bv_percent: number;
  commission_unlock_level: number;
  is_premium_bonus_eligible: boolean;
}

interface BinaryVolume {
  user_id: string;
  left_volume: number;
  right_volume: number;
  weak_leg: 'left' | 'right' | null;
}

interface DirectCommission {
  user_id: string;
  source_user_id: string;
  tier: number;
  rate: number;
  amount: number;
  is_instant: boolean;
}

interface BinaryCommission {
  user_id: string;
  weak_leg_volume: number;
  base_amount: number;
  scaled_amount: number;
  scale_factor: number;
  cap_applied: boolean;
  weekly_cap: number;
}

interface OverrideCommission {
  user_id: string;
  source_user_id: string;
  level: number;
  base_amount: number;
  scaled_amount: number;
}

interface LeadershipCommission {
  user_id: string;
  rank: string;
  tier: number;
  pool_share_percent: number;
  amount: number;
}

interface StakingOverrideCommission {
  user_id: string;
  source_user_id: string;
  btc_earnings_source: number;
  override_amount: number;
}

interface GhostBVRecord {
  user_id: string;
  package_purchase_id: string;
  ghost_bv_amount: number;
  pay_leg: 'left' | 'right';
  start_date: string;
  expires_at: string;
  status: string;
}

interface WeeklySettlement {
  user_id: string;
  week_start: string;
  week_end: string;
  direct_total: number;
  binary_total: number;
  override_total: number;
  leadership_total: number;
  staking_override_total: number;
  grand_total: number;
  scale_factor_applied: number;
  cap_applied: boolean;
  status: string;
}

interface RankWeeklyCap {
  rank_name: string;
  weekly_cap_usd: number;
  hard_cap_usd: number;
}

interface EngineOutput {
  directCommissions: DirectCommission[];
  binaryCommissions: BinaryCommission[];
  overrideCommissions: OverrideCommission[];
  leadershipCommissions: LeadershipCommission[];
  stakingOverrideCommissions: StakingOverrideCommission[];
  settlements: WeeklySettlement[];
  ghostBvCreated: GhostBVRecord[];
  ghostBvExpired: string[];
  summary: {
    totalSV: number;
    totalBV: number;
    poolLimits: {
      globalCap: number;
      binaryPool: number;
      directPool: number;
      leadershipPool: number;
    };
    unscaledTotals: {
      direct: number;
      binary: number;
      override: number;
      leadership: number;
      stakingOverride: number;
      total: number;
    };
    scaleFactors: {
      direct: number;
      binary: number;
      override: number;
      global: number;
    };
    finalTotals: {
      direct: number;
      binary: number;
      override: number;
      leadership: number;
      stakingOverride: number;
      total: number;
    };
  };
}

// ============= SYNTERAX COMMISSION CONFIGURATION =============

interface SynteraxConfig {
  // Direct Referral Rates (3 tiers: 10%/5%/5%)
  DIRECT_RATES: number[];
  // Premium Package Rates (100%/5%/5% for L1/L2/L3)
  PREMIUM_DIRECT_RATES: number[];
  // Package unlock levels
  PACKAGE_UNLOCK_L1_L2: number; // $500 unlocks L1+L2
  PACKAGE_UNLOCK_L3: number;     // $1000 unlocks L3
  // Binary
  BINARY_RATE: number;           // 10% weak leg
  BINARY_WEEKLY_CAP_DEFAULT: number;
  BINARY_HARD_CAP: number;       // $40,000 per position
  // Ghost BV
  GHOST_BV_PERCENT: number;      // 80%
  GHOST_BV_DURATION_DAYS: number; // 10 days
  GHOST_BV_WEEKLY_CAP: number;   // $20,000 per week
  // Leadership Pool
  LEADERSHIP_POOL_PERCENT: number; // 3% of volume
  LEADERSHIP_TIER_RATES: number[]; // [1.5%, 1.0%, 0.5%]
  // Staking Override
  STAKING_OVERRIDE_RATE: number;  // 10%
  // Global
  GLOBAL_CAP_PERCENT: number;    // 40%
  // Volume flush
  VOLUME_FLUSH_DAYS: number;     // 180 days
}

async function fetchSynteraxConfig(supabase: any): Promise<SynteraxConfig> {
  try {
    const { data: settings, error } = await supabase
      .from('commission_settings')
      .select('setting_name, setting_value');

    if (error || !settings) {
      console.warn('Failed to fetch commission settings, using defaults:', error);
      return getDefaultSynteraxConfig();
    }

    const settingsMap = new Map(settings.map((s: any) => [s.setting_name, s.setting_value]));
    
    return {
      DIRECT_RATES: [
        (settingsMap.get('direct_tier_1_rate') as number || 10) / 100,
        (settingsMap.get('direct_tier_2_rate') as number || 5) / 100,
        (settingsMap.get('direct_tier_3_rate') as number || 5) / 100,
      ],
      // Premium packages: 100% L1, 5% L2, 5% L3
      PREMIUM_DIRECT_RATES: [
        (settingsMap.get('premium_tier_1_rate') as number || 100) / 100,
        (settingsMap.get('premium_tier_2_rate') as number || 5) / 100,
        (settingsMap.get('premium_tier_3_rate') as number || 5) / 100,
      ],
      PACKAGE_UNLOCK_L1_L2: settingsMap.get('package_unlock_l1_l2') as number || 500,
      PACKAGE_UNLOCK_L3: settingsMap.get('package_unlock_l3') as number || 1000,
      BINARY_RATE: (settingsMap.get('binary_weak_leg_rate') as number || 10) / 100,
      BINARY_WEEKLY_CAP_DEFAULT: settingsMap.get('binary_weekly_cap_default') as number || 250,
      BINARY_HARD_CAP: settingsMap.get('binary_hard_cap') as number || 40000,
      GHOST_BV_PERCENT: (settingsMap.get('ghost_bv_percent') as number || 80) / 100,
      GHOST_BV_DURATION_DAYS: settingsMap.get('ghost_bv_duration_days') as number || 10,
      GHOST_BV_WEEKLY_CAP: settingsMap.get('ghost_bv_weekly_cap') as number || 20000,
      LEADERSHIP_POOL_PERCENT: (settingsMap.get('leadership_pool_percent') as number || 3) / 100,
      LEADERSHIP_TIER_RATES: [
        (settingsMap.get('leadership_tier_1_rate') as number || 1.5) / 100,
        (settingsMap.get('leadership_tier_2_rate') as number || 1.0) / 100,
        (settingsMap.get('leadership_tier_3_rate') as number || 0.5) / 100,
      ],
      STAKING_OVERRIDE_RATE: (settingsMap.get('staking_override_rate') as number || 10) / 100,
      GLOBAL_CAP_PERCENT: (settingsMap.get('global_cap_percent') as number || 40) / 100,
      VOLUME_FLUSH_DAYS: settingsMap.get('volume_flush_days') as number || 180,
    };
  } catch (err) {
    console.error('Error fetching Synterax config:', err);
    return getDefaultSynteraxConfig();
  }
}

function getDefaultSynteraxConfig(): SynteraxConfig {
  return {
    DIRECT_RATES: [0.10, 0.05, 0.05],           // Standard: 10%/5%/5%
    PREMIUM_DIRECT_RATES: [1.00, 0.05, 0.05],   // Premium: 100%/5%/5%
    PACKAGE_UNLOCK_L1_L2: 500,
    PACKAGE_UNLOCK_L3: 1000,
    BINARY_RATE: 0.10,
    BINARY_WEEKLY_CAP_DEFAULT: 250,
    BINARY_HARD_CAP: 40000,
    GHOST_BV_PERCENT: 0.80,
    GHOST_BV_DURATION_DAYS: 10,
    GHOST_BV_WEEKLY_CAP: 20000,
    LEADERSHIP_POOL_PERCENT: 0.03,
    LEADERSHIP_TIER_RATES: [0.015, 0.010, 0.005],
    STAKING_OVERRIDE_RATE: 0.10,
    GLOBAL_CAP_PERCENT: 0.40,
    VOLUME_FLUSH_DAYS: 180,
  };
}

// ============= RANK WEEKLY CAPS =============

async function fetchRankWeeklyCaps(supabase: any): Promise<Map<string, RankWeeklyCap>> {
  const { data, error } = await supabase
    .from('rank_weekly_caps')
    .select('rank_name, weekly_cap_usd, hard_cap_usd');

  if (error || !data) {
    console.warn('Failed to fetch rank weekly caps:', error);
    return new Map();
  }

  return new Map(data.map((r: RankWeeklyCap) => [r.rank_name.toLowerCase(), r]));
}

// ============= GHOST BV FUNCTIONS =============

/**
 * Create Ghost BV records for new package purchases
 * Ghost BV uses FIXED values from packages table (ghost_bv_amount column)
 * Falls back to 80% of package value if not set
 * Auto-placed in pay leg, expires in 10 days
 */
async function processGhostBV(
  supabase: any,
  newPurchases: PackagePurchase[],
  packages: Package[],
  config: SynteraxConfig
): Promise<GhostBVRecord[]> {
  const ghostBvRecords: GhostBVRecord[] = [];
  const packageMap = new Map(packages.map(p => [p.id, p]));
  
  for (const purchase of newPurchases) {
    const pkg = packageMap.get(purchase.package_id);
    if (!pkg) continue;

    // Use FIXED Ghost BV amount from packages table, fallback to percentage calculation
    const ghostBvAmount = (pkg as any).ghost_bv_amount || purchase.total_price * config.GHOST_BV_PERCENT;
    
    // Get user's pay leg (weak leg or default)
    const { data: binaryTree } = await supabase
      .from('binary_tree')
      .select('weak_leg')
      .eq('user_id', purchase.user_id)
      .maybeSingle();

    const payLeg = binaryTree?.weak_leg || 'left';
    
    const startDate = new Date(purchase.created_at);
    const expiresAt = new Date(startDate);
    expiresAt.setDate(expiresAt.getDate() + config.GHOST_BV_DURATION_DAYS);

    ghostBvRecords.push({
      user_id: purchase.user_id,
      package_purchase_id: purchase.id,
      ghost_bv_amount: ghostBvAmount,
      pay_leg: payLeg,
      start_date: startDate.toISOString().split('T')[0],
      expires_at: expiresAt.toISOString().split('T')[0],
      status: 'active',
    });
  }

  return ghostBvRecords;
}

/**
 * Expire Ghost BV records older than 10 days
 */
async function expireGhostBV(supabase: any): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: expiredRecords, error } = await supabase
    .from('ghost_bv')
    .update({ status: 'expired' })
    .lt('expires_at', today)
    .eq('status', 'active')
    .select('id');

  if (error) {
    console.error('Error expiring ghost BV:', error);
    return [];
  }

  return expiredRecords?.map((r: any) => r.id) || [];
}

// ============= DIRECT AFFILIATE BONUS (SYNTERAX) =============

/**
 * Calculate direct referral commissions with package-based tier unlocking
 * and PREMIUM BONUS system
 * 
 * STANDARD PACKAGES:
 * - Tier 1: 10% (always unlocked, INSTANT)
 * - Tier 2: 5% (requires $500+ package purchase by sponsor)
 * - Tier 3: 5% (requires $1000+ package purchase by sponsor)
 * 
 * PREMIUM PACKAGES (is_premium_bonus_eligible = true):
 * - Tier 1: 100% BONUS (instant cash engine!)
 * - Tier 2: 5%
 * - Tier 3: 5%
 * 
 * All bonuses are STACKABLE with Binary, Leadership Pool, and Staking Override
 */
function calculateDirectCommissions(
  users: User[],
  transactions: Transaction[],
  packages: Package[],
  config: SynteraxConfig
): DirectCommission[] {
  const commissions: DirectCommission[] = [];
  const userMap = new Map(users.map(u => [u.id, u]));
  const packageMap = new Map(packages.map(p => [p.id, p]));
  
  // Group transactions by user AND track which packages were purchased
  const txByUser = transactions.reduce((acc, tx) => {
    if (!acc[tx.user_id]) acc[tx.user_id] = { txs: [], packages: new Set<string>() };
    acc[tx.user_id].txs.push(tx);
    if (tx.package_id) acc[tx.user_id].packages.add(tx.package_id);
    return acc;
  }, {} as Record<string, { txs: Transaction[], packages: Set<string> }>);

  for (const [userId, userData] of Object.entries(txByUser)) {
    const userSV = userData.txs.reduce((sum, tx) => sum + tx.amount, 0);
    const user = userMap.get(userId);
    if (!user) continue;

    // Check if any purchased package is premium bonus eligible
    let isPremiumPurchase = false;
    let premiumPackageValue = 0;
    
    for (const pkgId of userData.packages) {
      const pkg = packageMap.get(pkgId);
      if (pkg?.is_premium_bonus_eligible) {
        isPremiumPurchase = true;
        premiumPackageValue = Math.max(premiumPackageValue, pkg.price_usd);
      }
    }

    // Traverse sponsor chain up to 3 levels
    let currentSponsor = user.sponsor_id;
    for (let tier = 0; tier < 3 && currentSponsor; tier++) {
      const sponsor = userMap.get(currentSponsor);
      if (!sponsor) break;

      // Check if this tier is unlocked for the sponsor
      const sponsorUnlockLevel = sponsor.commission_unlock_level || 1;
      
      // Tier unlocking rules:
      // - Tier 1: Always unlocked
      // - Tier 2: Sponsor needs $500+ package
      // - Tier 3: Sponsor needs $1000+ package
      let tierUnlocked = false;
      if (tier === 0) {
        tierUnlocked = true; // L1 always unlocked
      } else if (tier === 1) {
        tierUnlocked = sponsorUnlockLevel >= 2; // $500+ unlocks L2
      } else if (tier === 2) {
        tierUnlocked = sponsorUnlockLevel >= 3; // $1000+ unlocks L3
      }

      if (!tierUnlocked) {
        currentSponsor = sponsor.sponsor_id;
        continue; // Skip this tier but continue up the chain
      }

      // Select rates based on whether this is a premium package purchase
      // PREMIUM: 100% L1, 5% L2, 5% L3
      // STANDARD: 10% L1, 5% L2, 5% L3
      const rates = isPremiumPurchase ? config.PREMIUM_DIRECT_RATES : config.DIRECT_RATES;
      const rate = rates[tier];
      
      // For premium L1, the commission is based on the package value, not total SV
      let commissionAmount: number;
      if (isPremiumPurchase && tier === 0) {
        // 100% of premium package value for L1
        commissionAmount = premiumPackageValue * rate;
      } else {
        // Standard calculation
        commissionAmount = userSV * rate;
      }

      commissions.push({
        user_id: currentSponsor,
        source_user_id: userId,
        tier: tier + 1,
        rate: rate,
        amount: commissionAmount,
        is_instant: tier === 0, // L1 is always instant
      });

      currentSponsor = sponsor.sponsor_id;
    }
  }

  return commissions;
}

// ============= BINARY COMMISSIONS (SYNTERAX) =============

/**
 * Calculate binary weak-leg commissions with rank-based weekly caps
 * 
 * Rules:
 * - 10% of weak leg volume
 * - Weekly caps based on rank ($250 - $20,000)
 * - Hard cap: $40,000 per position per week
 * - 80% BV rule applies
 */
function calculateBinaryCommissions(
  users: User[],
  binaryVolumes: BinaryVolume[],
  rankCaps: Map<string, RankWeeklyCap>,
  config: SynteraxConfig
): BinaryCommission[] {
  const commissions: BinaryCommission[] = [];
  const userMap = new Map(users.map(u => [u.id, u]));
  
  for (const vol of binaryVolumes) {
    if (vol.left_volume <= 0 && vol.right_volume <= 0) continue;

    const user = userMap.get(vol.user_id);
    if (!user) continue;

    // Calculate weak leg
    const weak = Math.min(vol.left_volume, vol.right_volume);
    
    // Base binary commission: 10% on weak leg (which is 80% BV)
    const baseBinary = weak * config.BINARY_RATE;
    
    // Get weekly cap for user's rank
    const rankCap = rankCaps.get(user.rank?.toLowerCase() || 'private');
    const weeklyCap = rankCap?.weekly_cap_usd || config.BINARY_WEEKLY_CAP_DEFAULT;
    const hardCap = Math.min(rankCap?.hard_cap_usd || config.BINARY_HARD_CAP, config.BINARY_HARD_CAP);

    // Apply weekly cap
    let cappedAmount = Math.min(baseBinary, weeklyCap);
    cappedAmount = Math.min(cappedAmount, hardCap);
    const capApplied = cappedAmount < baseBinary;

    commissions.push({
      user_id: vol.user_id,
      weak_leg_volume: weak,
      base_amount: baseBinary,
      scaled_amount: cappedAmount,
      scale_factor: cappedAmount / baseBinary,
      cap_applied: capApplied,
      weekly_cap: weeklyCap,
    });
  }

  return commissions;
}

// ============= LEADERSHIP POOL COMMISSIONS =============

/**
 * Calculate leadership pool distribution (3% of volume)
 * 
 * Rules:
 * - 3% of total weekly volume goes to leadership pool
 * - Distributed among qualified leaders by tier:
 *   - Tier 1 (1.5%): Colonel, General, 5-Star General
 *   - Tier 2 (1.0%): Major, Lieutenant Colonel
 *   - Tier 3 (0.5%): Captain, Lieutenant
 */
function calculateLeadershipCommissions(
  users: User[],
  totalVolume: number,
  config: SynteraxConfig
): LeadershipCommission[] {
  const commissions: LeadershipCommission[] = [];
  
  // Define which ranks qualify for which tier
  const LEADERSHIP_TIERS: Record<string, number> = {
    '5-star general': 1,
    'general': 1,
    'colonel': 1,
    'major': 2,
    'captain': 3,
    'lieutenant': 3,
  };

  // Group users by tier
  const usersByTier: Record<number, User[]> = { 1: [], 2: [], 3: [] };
  
  for (const user of users) {
    const rank = user.rank?.toLowerCase() || '';
    const tier = LEADERSHIP_TIERS[rank];
    if (tier) {
      usersByTier[tier].push(user);
    }
  }

  // Calculate pool for each tier
  const totalPool = totalVolume * config.LEADERSHIP_POOL_PERCENT;

  for (let tier = 1; tier <= 3; tier++) {
    const tierUsers = usersByTier[tier];
    if (tierUsers.length === 0) continue;

    const tierPool = totalPool * (config.LEADERSHIP_TIER_RATES[tier - 1] / config.LEADERSHIP_POOL_PERCENT);
    const sharePerUser = tierPool / tierUsers.length;

    for (const user of tierUsers) {
      commissions.push({
        user_id: user.id,
        rank: user.rank || '',
        tier,
        pool_share_percent: config.LEADERSHIP_TIER_RATES[tier - 1] * 100,
        amount: sharePerUser,
      });
    }
  }

  return commissions;
}

// ============= STAKING OVERRIDE COMMISSIONS =============

/**
 * Calculate staking override (10% of direct referrals' staking rewards)
 * 
 * Rules:
 * - When direct referrals earn staking rewards (daily BTC)
 * - Sponsor earns 10% of their daily BTC earnings
 */
async function calculateStakingOverrideCommissions(
  supabase: any,
  users: User[],
  weekStart: string,
  config: SynteraxConfig
): Promise<StakingOverrideCommission[]> {
  const commissions: StakingOverrideCommission[] = [];
  const userMap = new Map(users.map(u => [u.id, u]));

  // Get staking rewards for the week
  const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const { data: stakingRewards, error } = await supabase
    .from('staking_rewards')
    .select('user_id, btc_earned')
    .gte('reward_date', weekStart)
    .lte('reward_date', weekEnd)
    .eq('status', 'pending');

  if (error || !stakingRewards) {
    console.warn('Failed to fetch staking rewards:', error);
    return [];
  }

  // Group rewards by user
  const rewardsByUser = stakingRewards.reduce((acc: Record<string, number>, r: any) => {
    acc[r.user_id] = (acc[r.user_id] || 0) + Number(r.btc_earned);
    return acc;
  }, {});

  // Calculate override for each sponsor
  for (const [userId, btcEarned] of Object.entries(rewardsByUser)) {
    const user = userMap.get(userId);
    if (!user || !user.sponsor_id) continue;

    const overrideAmount = (btcEarned as number) * config.STAKING_OVERRIDE_RATE;
    
    commissions.push({
      user_id: user.sponsor_id,
      source_user_id: userId,
      btc_earnings_source: btcEarned as number,
      override_amount: overrideAmount,
    });
  }

  return commissions;
}

// ============= GLOBAL PAYOUT CAP =============

function applyPayoutCap(
  directCommissions: DirectCommission[],
  binaryCommissions: BinaryCommission[],
  overrideCommissions: OverrideCommission[],
  leadershipCommissions: LeadershipCommission[],
  stakingOverrideCommissions: StakingOverrideCommission[],
  salesVolume: number,
  config: SynteraxConfig
) {
  const T_dir = directCommissions.reduce((sum, dc) => sum + dc.amount, 0);
  const T_bin = binaryCommissions.reduce((sum, bc) => sum + bc.scaled_amount, 0);
  const T_ov = overrideCommissions.reduce((sum, oc) => sum + oc.scaled_amount, 0);
  const T_lead = leadershipCommissions.reduce((sum, lc) => sum + lc.amount, 0);
  const T_staking = stakingOverrideCommissions.reduce((sum, sc) => sum + sc.override_amount, 0);
  
  const total = T_dir + T_bin + T_ov + T_lead + T_staking;
  const limit = salesVolume * config.GLOBAL_CAP_PERCENT;

  console.log(`\n=== Global Payout Cap Check ===`);
  console.log(`Direct: $${T_dir.toFixed(2)}`);
  console.log(`Binary: $${T_bin.toFixed(2)}`);
  console.log(`Override: $${T_ov.toFixed(2)}`);
  console.log(`Leadership: $${T_lead.toFixed(2)}`);
  console.log(`Staking Override: $${T_staking.toFixed(2)}`);
  console.log(`Total: $${total.toFixed(2)}`);
  console.log(`Limit (40% of SV): $${limit.toFixed(2)}`);

  if (total <= limit) {
    console.log(`✓ Within limit. No global scaling needed.`);
    return {
      directTotal: T_dir,
      binaryTotal: T_bin,
      overrideTotal: T_ov,
      leadershipTotal: T_lead,
      stakingOverrideTotal: T_staking,
      grandTotal: total,
      globalScaleFactor: 1.0,
      capApplied: false,
    };
  }

  console.log(`✗ Cap exceeded. Scaling binary/override/leadership.`);

  // Scale everything except direct (instant) proportionally
  const nonDirectTotal = T_bin + T_ov + T_lead + T_staking;
  const nonDirectAllowed = limit - T_dir;
  
  if (nonDirectAllowed <= 0) {
    // Emergency: even direct exceeds cap
    const scaleFactor = limit / total;
    return {
      directTotal: T_dir * scaleFactor,
      binaryTotal: T_bin * scaleFactor,
      overrideTotal: T_ov * scaleFactor,
      leadershipTotal: T_lead * scaleFactor,
      stakingOverrideTotal: T_staking * scaleFactor,
      grandTotal: limit,
      globalScaleFactor: scaleFactor,
      capApplied: true,
    };
  }

  const scaleFactor = nonDirectAllowed / nonDirectTotal;

  binaryCommissions.forEach(bc => bc.scaled_amount *= scaleFactor);
  overrideCommissions.forEach(oc => oc.scaled_amount *= scaleFactor);
  leadershipCommissions.forEach(lc => lc.amount *= scaleFactor);
  stakingOverrideCommissions.forEach(sc => sc.override_amount *= scaleFactor);

  return {
    directTotal: T_dir,
    binaryTotal: T_bin * scaleFactor,
    overrideTotal: T_ov * scaleFactor,
    leadershipTotal: T_lead * scaleFactor,
    stakingOverrideTotal: T_staking * scaleFactor,
    grandTotal: limit,
    globalScaleFactor: scaleFactor,
    capApplied: true,
  };
}

// ============= SETTLEMENT GENERATION =============

function generateSettlements(
  users: User[],
  directCommissions: DirectCommission[],
  binaryCommissions: BinaryCommission[],
  overrideCommissions: OverrideCommission[],
  leadershipCommissions: LeadershipCommission[],
  stakingOverrideCommissions: StakingOverrideCommission[],
  weekStart: string,
  globalScaleFactor: number,
  capApplied: boolean
): WeeklySettlement[] {
  const settlements: WeeklySettlement[] = [];
  
  // Group by user
  const directByUser = directCommissions.reduce((acc, dc) => {
    acc[dc.user_id] = (acc[dc.user_id] || 0) + dc.amount;
    return acc;
  }, {} as Record<string, number>);

  const binaryByUser = new Map(binaryCommissions.map(bc => [bc.user_id, bc.scaled_amount]));

  const overrideByUser = overrideCommissions.reduce((acc, oc) => {
    acc[oc.user_id] = (acc[oc.user_id] || 0) + oc.scaled_amount;
    return acc;
  }, {} as Record<string, number>);

  const leadershipByUser = new Map(leadershipCommissions.map(lc => [lc.user_id, lc.amount]));

  const stakingByUser = stakingOverrideCommissions.reduce((acc, sc) => {
    acc[sc.user_id] = (acc[sc.user_id] || 0) + sc.override_amount;
    return acc;
  }, {} as Record<string, number>);

  const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const allUserIds = new Set([
    ...Object.keys(directByUser),
    ...binaryByUser.keys(),
    ...Object.keys(overrideByUser),
    ...leadershipByUser.keys(),
    ...Object.keys(stakingByUser),
  ]);

  for (const userId of allUserIds) {
    const directTotal = directByUser[userId] || 0;
    const binaryTotal = binaryByUser.get(userId) || 0;
    const overrideTotal = overrideByUser[userId] || 0;
    const leadershipTotal = leadershipByUser.get(userId) || 0;
    const stakingTotal = stakingByUser[userId] || 0;
    const grandTotal = directTotal + binaryTotal + overrideTotal + leadershipTotal + stakingTotal;

    if (grandTotal > 0) {
      settlements.push({
        user_id: userId,
        week_start: weekStart,
        week_end: weekEnd,
        direct_total: directTotal,
        binary_total: binaryTotal,
        override_total: overrideTotal,
        leadership_total: leadershipTotal,
        staking_override_total: stakingTotal,
        grand_total: grandTotal,
        scale_factor_applied: globalScaleFactor,
        cap_applied: capApplied,
        status: 'pending',
      });
    }
  }

  return settlements;
}

// ============= VOLUME FLUSH (180 days) =============

async function flushOldVolume(supabase: any, config: SynteraxConfig) {
  const flushDate = new Date();
  flushDate.setDate(flushDate.getDate() - config.VOLUME_FLUSH_DAYS);
  const flushDateStr = flushDate.toISOString().split('T')[0];

  console.log(`Flushing volume older than ${flushDateStr} (${config.VOLUME_FLUSH_DAYS} days)`);

  // Mark old volume records as flushed
  const { error } = await supabase
    .from('binary_volume')
    .update({ status: 'flushed' })
    .lt('week_start', flushDateStr)
    .eq('status', 'active');

  if (error) {
    console.error('Error flushing old volume:', error);
  }
}

// ============= MAIN ENGINE =============

async function calculateWeeklyPayout(
  weekStart: string,
  supabase: any
): Promise<WeeklyPayoutResult> {
  console.log(`\n========================================`);
  console.log(`Synterax Commission Engine: ${weekStart}`);
  console.log(`========================================`);

  // Fetch all required data
  const [
    { data: transactions, error: txError },
    { data: profiles, error: profileError },
    { data: binaryTree, error: binaryError },
    { data: packages, error: pkgError },
    { data: packagePurchases, error: purchaseError },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, user_id, amount, week_start')
      .eq('week_start', weekStart)
      .eq('is_eligible', true),
    supabase
      .from('profiles')
      .select('id, rank, sponsor_id, binary_parent_id, binary_position'),
    supabase
      .from('binary_tree')
      .select('user_id, left_volume, right_volume, weak_leg'),
    supabase
      .from('packages')
      .select('id, price_usd, bv_percent, commission_unlock_level, is_premium_bonus_eligible'),
    supabase
      .from('package_purchases')
      .select('id, user_id, package_id, total_price, created_at')
      .gte('created_at', weekStart),
  ]);

  if (txError) throw new Error(`Transaction fetch error: ${txError.message}`);
  if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`);

  // Get highest package purchase for each user to determine unlock level
  const { data: userPackages } = await supabase
    .from('package_purchases')
    .select('user_id, total_price, packages(commission_unlock_level)')
    .eq('status', 'COMPLETED');

  const userUnlockLevels = new Map<string, number>();
  for (const up of userPackages || []) {
    const currentLevel = userUnlockLevels.get(up.user_id) || 0;
    const packageLevel = up.packages?.commission_unlock_level || 1;
    userUnlockLevels.set(up.user_id, Math.max(currentLevel, packageLevel));
  }

  // Enrich profiles with unlock levels
  const users: User[] = (profiles || []).map((p: any) => ({
    ...p,
    highest_package_value: 0,
    commission_unlock_level: userUnlockLevels.get(p.id) || 1,
  }));

  const config = await fetchSynteraxConfig(supabase);
  const rankCaps = await fetchRankWeeklyCaps(supabase);

  // Calculate sales volume
  const salesVolume = transactions?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;

  // Process Ghost BV for new purchases
  const ghostBvRecords = await processGhostBV(supabase, packagePurchases || [], packages || [], config);
  
  // Expire old Ghost BV
  const expiredGhostBv = await expireGhostBV(supabase);

  // Calculate commissions
  const directCommissions = calculateDirectCommissions(users, transactions || [], packages || [], config);
  const binaryCommissions = calculateBinaryCommissions(users, binaryTree || [], rankCaps, config);
  const overrideCommissions: OverrideCommission[] = []; // Leadership-based override (future)
  const leadershipCommissions = calculateLeadershipCommissions(users, salesVolume, config);
  const stakingOverrideCommissions = await calculateStakingOverrideCommissions(supabase, users, weekStart, config);

  // Apply global cap
  const capResult = applyPayoutCap(
    directCommissions,
    binaryCommissions,
    overrideCommissions,
    leadershipCommissions,
    stakingOverrideCommissions,
    salesVolume,
    config
  );

  // Generate settlements
  const settlements = generateSettlements(
    users,
    directCommissions,
    binaryCommissions,
    overrideCommissions,
    leadershipCommissions,
    stakingOverrideCommissions,
    weekStart,
    capResult.globalScaleFactor,
    capResult.capApplied
  );

  // Flush old volume
  await flushOldVolume(supabase, config);

  console.log(`\n=== Summary ===`);
  console.log(`Direct Commissions: ${directCommissions.length}`);
  console.log(`Binary Commissions: ${binaryCommissions.length}`);
  console.log(`Leadership Commissions: ${leadershipCommissions.length}`);
  console.log(`Staking Override Commissions: ${stakingOverrideCommissions.length}`);
  console.log(`Ghost BV Created: ${ghostBvRecords.length}`);
  console.log(`Ghost BV Expired: ${expiredGhostBv.length}`);
  console.log(`Settlements: ${settlements.length}`);

  return {
    weekStart,
    settlements: settlements.map(s => ({
      userId: s.user_id,
      direct: s.direct_total.toFixed(2),
      binary: s.binary_total.toFixed(2),
      override: s.override_total.toFixed(2),
      leadership: s.leadership_total.toFixed(2),
      stakingOverride: s.staking_override_total.toFixed(2),
      total: s.grand_total.toFixed(2),
      scaleFactor: s.scale_factor_applied.toFixed(4),
      capApplied: s.cap_applied,
    })),
    totals: {
      SV: salesVolume.toFixed(2),
      T_dir: capResult.directTotal.toFixed(2),
      T_bin: capResult.binaryTotal.toFixed(2),
      T_ov: capResult.overrideTotal.toFixed(2),
      T_lead: capResult.leadershipTotal.toFixed(2),
      T_staking: capResult.stakingOverrideTotal.toFixed(2),
      total: capResult.grandTotal.toFixed(2),
      globalScaleFactor: capResult.globalScaleFactor.toFixed(4),
    },
    ghostBvCreated: ghostBvRecords.length,
    ghostBvExpired: expiredGhostBv.length,
  };
}

// ============= HTTP HANDLER =============

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
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { weekStart, persist = false } = body;
    
    if (!weekStart || typeof weekStart !== 'string') {
      return new Response(
        JSON.stringify({ error: 'weekStart parameter required (YYYY-MM-DD format)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(weekStart)) {
      return new Response(
        JSON.stringify({ error: 'weekStart must be in YYYY-MM-DD format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\nSynterax Commission Engine`);
    console.log(`Week: ${weekStart}`);
    console.log(`Persist: ${persist}`);

    const result = await calculateWeeklyPayout(weekStart, supabase);

    if (persist) {
      console.log('\n=== Persisting to Database ===');
      // TODO: Insert all commission records to database
      // This will be implemented in Phase 4
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Commission engine error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
