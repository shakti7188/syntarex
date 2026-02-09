import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { ReferralStats } from "@/types/commission";

export const useRealtimeReferrals = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    leftLegVolume: 0,
    rightLegVolume: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const [{ data: referrals }, { data: binaryTree }] = await Promise.all([
        supabase.from("referrals").select("is_active").eq("referrer_id", user.id),
        supabase.from("binary_tree").select("left_volume, right_volume").eq("user_id", user.id).single(),
      ]);

      setStats({
        totalReferrals: referrals?.length || 0,
        activeReferrals: referrals?.filter(r => r.is_active).length || 0,
        leftLegVolume: Number(binaryTree?.left_volume || 0),
        rightLegVolume: Number(binaryTree?.right_volume || 0),
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  useRealtimeSubscription(
    [
      { channel: "user-referrals", table: "referrals", filter: `referrer_id=eq.${user?.id}` },
      { channel: "user-binary-tree", table: "binary_tree", filter: `user_id=eq.${user?.id}` },
    ],
    fetchStats,
    [user, fetchStats]
  );

  return { stats, isLoading };
};
