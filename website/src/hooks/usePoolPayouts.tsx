import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePoolPayouts = (poolConfigId: string | undefined) => {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ['mining-pool-payouts', poolConfigId],
    queryFn: async () => {
      if (!poolConfigId) return [];

      const { data, error } = await supabase
        .from('mining_pool_payouts')
        .select('*')
        .eq('pool_config_id', poolConfigId)
        .order('payout_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!poolConfigId,
  });

  return { payouts, isLoading };
};
