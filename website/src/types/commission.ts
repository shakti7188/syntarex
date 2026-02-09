export interface CommissionData {
  direct_l1: number;
  direct_l2: number;
  direct_l3: number;
  binary: number;
  override: number;
  total: number;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  leftLegVolume: number;
  rightLegVolume: number;
}

export interface AdminMetrics {
  currentWeekSV: number;
  estimatedTotalPayout: number;
  estimatedDirectPayout: number;
  estimatedBinaryPayout: number;
  estimatedOverridePayout: number;
  payoutRatio: number;
  capUsagePercent: number;
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  pendingSettlements: number;
  activeRate: number;
  isApproachingCap: boolean;
  isCriticalCap: boolean;
}
