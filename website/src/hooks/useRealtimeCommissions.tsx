import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { fetchDirectCommissionsByTier, fetchCommissionsByType } from "@/lib/supabase-utils";
import type { CommissionData } from "@/types/commission";

export const useRealtimeCommissions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const previousTotal = useRef<number>(0);
  const [commissions, setCommissions] = useState<CommissionData>({
    direct_l1: 0,
    direct_l2: 0,
    direct_l3: 0,
    binary: 0,
    override: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommissions = useCallback(async () => {
    if (!user) return;
    try {
      const [directTiers, binary, override] = await Promise.all([
        fetchDirectCommissionsByTier(user.id),
        fetchCommissionsByType("binary_commissions", user.id, "scaled_amount"),
        fetchCommissionsByType("override_commissions", user.id, "scaled_amount"),
      ]);

      const newTotal = directTiers.l1 + directTiers.l2 + directTiers.l3 + binary + override;

      if (!isLoading && previousTotal.current > 0 && newTotal > previousTotal.current) {
        toast({
          title: "New Commission Earned! 🎉",
          description: `You've earned +$${(newTotal - previousTotal.current).toFixed(2)}`,
          duration: 5000,
        });
      }

      previousTotal.current = newTotal;
      setCommissions({
        direct_l1: directTiers.l1,
        direct_l2: directTiers.l2,
        direct_l3: directTiers.l3,
        binary,
        override,
        total: newTotal,
      });
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, isLoading]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchCommissions();
  }, [user, fetchCommissions]);

  useRealtimeSubscription(
    [
      { channel: "user-commissions-direct", table: "direct_commissions", filter: `user_id=eq.${user?.id}` },
      { channel: "user-commissions-binary", table: "binary_commissions", filter: `user_id=eq.${user?.id}` },
      { channel: "user-commissions-override", table: "override_commissions", filter: `user_id=eq.${user?.id}` },
      {
        channel: "user-settlements",
        table: "weekly_settlements",
        filter: `user_id=eq.${user?.id}`,
        onEvent: (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            toast({
              title: "Settlement Updated",
              description: "Your weekly settlement has been processed",
              duration: 5000,
            });
          }
        },
      },
    ],
    fetchCommissions,
    [user, toast, fetchCommissions]
  );

  return { commissions, isLoading };
};
