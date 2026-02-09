import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface StakingPosition {
  id: string;
  user_id: string;
  token_amount: number;
  token_symbol: string;
  staked_at: string;
  unstaked_at: string | null;
  daily_btc_rate: number;
  total_btc_earned: number;
  status: string;
}

export interface StakingReward {
  id: string;
  user_id: string;
  staking_position_id: string;
  reward_date: string;
  btc_earned: number;
  override_paid_to_sponsor: number;
  sponsor_id: string | null;
  status: string;
}

export interface StakingOverrideEarning {
  id: string;
  reward_date: string;
  btc_earned: number;
  source_user_email: string;
}

export const useStakingData = () => {
  const { user } = useAuth();

  // Fetch user's staking positions
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["staking-positions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("staking_positions")
        .select("*")
        .eq("user_id", user.id)
        .order("staked_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as StakingPosition[];
    },
    enabled: !!user,
  });

  // Fetch user's staking rewards (BTC earned)
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ["staking-rewards", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("staking_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("reward_date", { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return (data || []) as StakingReward[];
    },
    enabled: !!user,
  });

  // Fetch override earnings from direct referrals
  const { data: overrideEarnings, isLoading: overrideLoading } = useQuery({
    queryKey: ["staking-override-earnings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get rewards where sponsor_id is the current user
      const { data, error } = await supabase
        .from("staking_rewards")
        .select(`
          id,
          reward_date,
          override_paid_to_sponsor,
          user_id
        `)
        .eq("sponsor_id", user.id)
        .gt("override_paid_to_sponsor", 0)
        .order("reward_date", { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        reward_date: r.reward_date,
        btc_earned: r.override_paid_to_sponsor,
        source_user_email: "Direct Referral",
      })) as StakingOverrideEarning[];
    },
    enabled: !!user,
  });

  // Calculate totals
  const activePositions = positions?.filter(p => p.status === "active") || [];
  const totalStaked = activePositions.reduce((sum, p) => sum + p.token_amount, 0);
  const totalBtcEarned = positions?.reduce((sum, p) => sum + p.total_btc_earned, 0) || 0;
  const totalOverrideEarned = overrideEarnings?.reduce((sum, e) => sum + e.btc_earned, 0) || 0;
  
  // Today's earnings
  const today = new Date().toISOString().split("T")[0];
  const todayRewards = rewards?.filter(r => r.reward_date === today) || [];
  const todayBtcEarned = todayRewards.reduce((sum, r) => sum + r.btc_earned, 0);

  return {
    positions: positions || [],
    rewards: rewards || [],
    overrideEarnings: overrideEarnings || [],
    activePositions,
    totalStaked,
    totalBtcEarned,
    totalOverrideEarned,
    todayBtcEarned,
    isLoading: positionsLoading || rewardsLoading || overrideLoading,
  };
};
