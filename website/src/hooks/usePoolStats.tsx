import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePoolStats = (poolConfigId: string | undefined) => {
  const { data: latestStats, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['mining-pool-stats-latest', poolConfigId],
    queryFn: async () => {
      if (!poolConfigId) return null;

      const { data, error } = await supabase
        .from('mining_pool_stats_snapshots')
        .select('*')
        .eq('pool_config_id', poolConfigId)
        .order('snapshot_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!poolConfigId,
  });

  const { data: historicalStats, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['mining-pool-stats-history', poolConfigId],
    queryFn: async () => {
      if (!poolConfigId) return [];

      const { data, error } = await supabase
        .from('mining_pool_stats_snapshots')
        .select('*')
        .eq('pool_config_id', poolConfigId)
        .order('snapshot_time', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!poolConfigId,
  });

  return {
    latestStats,
    historicalStats,
    isLoading: isLoadingLatest || isLoadingHistory,
  };
};
