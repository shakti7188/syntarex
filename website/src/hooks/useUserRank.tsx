import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RankDefinition {
  id: string;
  rank_name: string;
  rank_level: number;
  rank_color: string;
  min_personal_sales: number;
  min_team_sales: number;
  min_left_leg_volume: number;
  min_right_leg_volume: number;
  min_hashrate_ths: number;
  min_direct_referrals: number;
  benefits: string[];
}

export interface UserRankData {
  qualified_rank_name: string;
  qualified_rank_level: number;
  personal_sales: number;
  team_sales: number;
  left_leg_volume: number;
  right_leg_volume: number;
  total_hashrate: number;
  direct_referral_count: number;
}

export const useUserRank = () => {
  const { user } = useAuth();

  const { data: rankDefinitions, isLoading: ranksLoading } = useQuery({
    queryKey: ["rank-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_definitions")
        .select("*")
        .order("rank_level", { ascending: true });

      if (error) throw error;
      return data as RankDefinition[];
    },
    enabled: !!user,
  });

  const { data: userRankData, isLoading: rankDataLoading } = useQuery({
    queryKey: ["user-rank", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc("calculate_user_rank", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data?.[0] as UserRankData;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: rankHistory } = useQuery({
    queryKey: ["rank-history", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_rank_history")
        .select("*")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const currentRank = rankDefinitions?.find(
    (r) => r.rank_name === userRankData?.qualified_rank_name
  );

  const nextRank = rankDefinitions?.find(
    (r) => r.rank_level === (currentRank?.rank_level || 0) + 1
  );

  const calculateProgress = (current: number, required: number) => {
    if (required === 0) return 100;
    return Math.min((current / required) * 100, 100);
  };

  const progressToNextRank = nextRank
    ? {
        personalSales: calculateProgress(
          userRankData?.personal_sales || 0,
          nextRank.min_personal_sales
        ),
        teamSales: calculateProgress(
          userRankData?.team_sales || 0,
          nextRank.min_team_sales
        ),
        leftLeg: calculateProgress(
          userRankData?.left_leg_volume || 0,
          nextRank.min_left_leg_volume
        ),
        rightLeg: calculateProgress(
          userRankData?.right_leg_volume || 0,
          nextRank.min_right_leg_volume
        ),
        hashrate: calculateProgress(
          userRankData?.total_hashrate || 0,
          nextRank.min_hashrate_ths
        ),
        referrals: calculateProgress(
          userRankData?.direct_referral_count || 0,
          nextRank.min_direct_referrals
        ),
      }
    : null;

  return {
    rankDefinitions,
    currentRank,
    nextRank,
    userRankData,
    rankHistory,
    progressToNextRank,
    isLoading: ranksLoading || rankDataLoading,
  };
};
