import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WeeklyEarning {
  id: string;
  user_id: string;
  week_start: string;
  binary_earnings: number;
  direct_earnings: number;
  override_earnings: number;
  leadership_earnings: number;
  total_earnings: number;
  cap_applied: boolean;
}

export interface RankWeeklyCap {
  rank_name: string;
  weekly_cap_usd: number;
  hard_cap_usd: number;
}

export const useWeeklyEarnings = () => {
  const { user } = useAuth();

  // Fetch user's weekly earnings history
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["weekly-earnings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_weekly_earnings")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return (data || []) as WeeklyEarning[];
    },
    enabled: !!user,
  });

  // Fetch rank weekly caps
  const { data: rankCaps, isLoading: capsLoading } = useQuery({
    queryKey: ["rank-weekly-caps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_weekly_caps")
        .select("*")
        .order("weekly_cap_usd", { ascending: true });
      
      if (error) throw error;
      return (data || []) as RankWeeklyCap[];
    },
  });

  // Get current week's earnings
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const currentWeekStart = getWeekStart();
  const currentWeekEarnings = earnings?.find(e => e.week_start === currentWeekStart);

  // Get user's current rank cap
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-rank", user?.id],
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

  const userRank = userProfile?.rank?.toLowerCase() || "private";
  const userCap = rankCaps?.find(c => c.rank_name.toLowerCase() === userRank);
  const weeklyCap = userCap?.weekly_cap_usd || 250;
  const hardCap = userCap?.hard_cap_usd || 40000;

  // Calculate cap usage
  const currentEarnings = currentWeekEarnings?.total_earnings || 0;
  const capUsagePercent = (currentEarnings / weeklyCap) * 100;

  return {
    earnings: earnings || [],
    currentWeekEarnings,
    rankCaps: rankCaps || [],
    weeklyCap,
    hardCap,
    currentEarnings,
    capUsagePercent,
    isLoading: earningsLoading || capsLoading,
  };
};
