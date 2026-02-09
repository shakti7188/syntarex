import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface LeadershipDistribution {
  id: string;
  week_start: string;
  week_end: string;
  total_weekly_volume: number;
  total_pool_amount: number;
  tier_1_5_percent: number;
  tier_1_0_percent: number;
  tier_0_5_percent: number;
  qualified_leaders: any;
  distribution_status: string;
  distributed_at: string | null;
}

export const useLeadershipPool = () => {
  const { user } = useAuth();

  // Fetch recent leadership pool distributions
  const { data: distributions, isLoading: distributionsLoading } = useQuery({
    queryKey: ["leadership-distributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadership_pool_distributions")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return (data || []) as LeadershipDistribution[];
    },
  });

  // Calculate user's share based on their rank
  const { data: userRankData } = useQuery({
    queryKey: ["user-rank-for-leadership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("rank")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Determine user's leadership tier based on rank
  const getLeadershipTier = (rank: string | null): number | null => {
    if (!rank) return null;
    const rankLower = rank.toLowerCase();
    
    // Tier 1 (1.5%): 5-Star General
    if (rankLower.includes("5-star") || rankLower.includes("five star")) return 1;
    
    // Tier 2 (1.0%): General
    if (rankLower === "general") return 2;
    
    // Tier 3 (0.5%): Colonel
    if (rankLower === "colonel") return 3;
    
    return null;
  };

  const userTier = getLeadershipTier(userRankData?.rank || null);
  const latestDistribution = distributions?.[0];
  
  // Calculate user's potential earnings from the pool
  let userPoolShare = 0;
  if (latestDistribution && userTier) {
    const tierPercentage = userTier === 1 ? 0.015 : userTier === 2 ? 0.01 : 0.005;
    // This is simplified - actual distribution divides among all qualified leaders in each tier
    userPoolShare = latestDistribution.total_pool_amount * tierPercentage;
  }

  return {
    distributions: distributions || [],
    latestDistribution,
    userTier,
    userPoolShare,
    isLoading: distributionsLoading,
    isQualified: userTier !== null,
  };
};
