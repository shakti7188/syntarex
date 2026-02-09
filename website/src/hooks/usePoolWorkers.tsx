import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePoolWorkers = (poolConfigId: string | undefined) => {
  const { data: workers, isLoading } = useQuery({
    queryKey: ['mining-pool-workers', poolConfigId],
    queryFn: async () => {
      if (!poolConfigId) return [];

      const { data, error } = await supabase
        .from('mining_pool_workers')
        .select('*')
        .eq('pool_config_id', poolConfigId)
        .order('worker_name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!poolConfigId,
  });

  return { workers, isLoading };
};
