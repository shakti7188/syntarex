import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GhostBVRecord {
  id: string;
  user_id: string;
  package_purchase_id: string | null;
  ghost_bv_amount: number;
  original_package_value: number;
  pay_leg: string | null;
  start_date: string;
  expires_at: string;
  status: string;
  created_at: string;
}

export const useGhostBV = () => {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ghost-bv", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("ghost_bv")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as GhostBVRecord[];
    },
    enabled: !!user,
  });

  const activeGhostBV = data?.filter(g => g.status === "active") || [];
  const expiredGhostBV = data?.filter(g => g.status === "expired") || [];
  
  const totalActiveGhostBV = activeGhostBV.reduce((sum, g) => sum + g.ghost_bv_amount, 0);
  const totalExpiredGhostBV = expiredGhostBV.reduce((sum, g) => sum + g.ghost_bv_amount, 0);

  // Calculate days until expiry for each active ghost BV
  const ghostBVWithExpiry = activeGhostBV.map(g => {
    const expiresAt = new Date(g.expires_at);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      ...g,
      daysRemaining,
    };
  });

  return {
    ghostBV: data || [],
    activeGhostBV: ghostBVWithExpiry,
    expiredGhostBV,
    totalActiveGhostBV,
    totalExpiredGhostBV,
    isLoading,
    refetch,
  };
};
