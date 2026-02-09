import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { getCurrentWeekRange, fetchTransactionsSum, fetchCount, sumField } from "@/lib/supabase-utils";
import type { AdminMetrics } from "@/types/commission";

export const useRealtimeAdminMetrics = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AdminMetrics>({
    currentWeekSV: 0,
    estimatedTotalPayout: 0,
    estimatedDirectPayout: 0,
    estimatedBinaryPayout: 0,
    estimatedOverridePayout: 0,
    payoutRatio: 0,
    capUsagePercent: 0,
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisWeek: 0,
    pendingSettlements: 0,
    activeRate: 0,
    isApproachingCap: false,
    isCriticalCap: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!isAdmin) {
      // If user is not admin, don't keep the hook in a loading state forever
      setIsLoading(false);
      return;
    }

    try {
      const { startISO, startStr } = getCurrentWeekRange();

      const [
        currentWeekSV,
        { data: directComms },
        { data: binaryComms },
        { data: overrideComms },
        totalUsers,
        newUsersThisWeek,
        activeUsers,
        pendingSettlements,
      ] = await Promise.all([
        fetchTransactionsSum(startISO),
        supabase.from("direct_commissions").select("amount").eq("week_start", startStr),
        supabase.from("binary_commissions").select("scaled_amount").eq("week_start", startStr),
        supabase.from("override_commissions").select("scaled_amount").eq("week_start", startStr),
        fetchCount("profiles"),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startISO)
          .then((r) => r.count || 0),
        fetchCount("user_activity", [{ column: "is_active", value: true }]),
        fetchCount("weekly_settlements", [{ column: "status", value: "pending" }]),
      ]);

      const estimatedDirectPayout = sumField(directComms, "amount");
      const estimatedBinaryPayout = sumField(binaryComms, "scaled_amount");
      const estimatedOverridePayout = sumField(overrideComms, "scaled_amount");
      const estimatedTotalPayout =
        estimatedDirectPayout + estimatedBinaryPayout + estimatedOverridePayout;

      const payoutRatio = currentWeekSV > 0 ? (estimatedTotalPayout / currentWeekSV) * 100 : 0;
      const capUsagePercent = (payoutRatio / 40) * 100;
      const activeRate = totalUsers ? (activeUsers / totalUsers) * 100 : 0;
      const isApproachingCap = payoutRatio > 35;
      const isCriticalCap = payoutRatio > 38;

      const newMetrics = {
        currentWeekSV,
        estimatedTotalPayout,
        estimatedDirectPayout,
        estimatedBinaryPayout,
        estimatedOverridePayout,
        payoutRatio,
        capUsagePercent,
        totalUsers,
        activeUsers,
        newUsersThisWeek,
        pendingSettlements,
        activeRate,
        isApproachingCap,
        isCriticalCap,
      };

      if (isCriticalCap && !metrics.isCriticalCap) {
        toast({
          title: "⚠️ Critical: Payout Cap Alert!",
          description: `Payout ratio at ${payoutRatio.toFixed(1)}% of SV (limit: 40%)`,
          variant: "destructive",
          duration: 10000,
        });
      } else if (isApproachingCap && !metrics.isApproachingCap) {
        toast({
          title: "⚠️ Warning: Approaching Payout Cap",
          description: `Payout ratio at ${payoutRatio.toFixed(1)}% of SV (limit: 40%)`,
          duration: 7000,
        });
      }

      setMetrics(newMetrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, toast, metrics.isApproachingCap, metrics.isCriticalCap]);

  // Initial fetch
  useEffect(() => {
    if (isAdmin) fetchMetrics();
  }, [isAdmin, fetchMetrics]);

  useRealtimeSubscription(
    [
      { channel: "admin-transactions", table: "transactions" },
      { channel: "admin-settlements", table: "weekly_settlements" },
      {
        channel: "admin-profiles",
        table: "profiles",
        event: "INSERT",
        onEvent: () => toast({
          title: "New User Registered! 🎉",
          description: "A new user has joined the platform",
          duration: 5000,
        }),
      },
      { channel: "admin-activity", table: "user_activity" },
      { channel: "admin-direct-comm", table: "direct_commissions" },
      { channel: "admin-binary-comm", table: "binary_commissions" },
      { channel: "admin-override-comm", table: "override_commissions" },
    ],
    fetchMetrics,
    [isAdmin, fetchMetrics, toast],
    3000
  );

  return { metrics, isLoading };
};
