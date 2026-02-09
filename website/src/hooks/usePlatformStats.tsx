import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalUsers: number;
  totalHashrateThs: number;
  totalPackagesSold: number;
  activePackages: number;
}

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      try {
        // Get total users count
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Get total hashrate from machine inventory
        const { data: machineData } = await supabase
          .from("machine_inventory")
          .select("machine_type_id, machine_types!inner(hash_rate_ths)");

        const totalHashrate = machineData?.reduce((sum, machine: any) => {
          return sum + (machine.machine_types?.hash_rate_ths || 0);
        }, 0) || 0;

        // Get total packages sold
        const { count: packagesSold } = await supabase
          .from("package_purchases")
          .select("*", { count: "exact", head: true });

        // Get active packages count
        const { count: activePackages } = await supabase
          .from("package_purchases")
          .select("*", { count: "exact", head: true })
          .eq("status", "COMPLETED");

        return {
          totalUsers: userCount || 0,
          totalHashrateThs: totalHashrate,
          totalPackagesSold: packagesSold || 0,
          activePackages: activePackages || 0,
        };
      } catch (error) {
        console.error("Error fetching platform stats:", error);
        return {
          totalUsers: 0,
          totalHashrateThs: 0,
          totalPackagesSold: 0,
          activePackages: 0,
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
