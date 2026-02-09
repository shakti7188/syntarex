import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface HashrateStats {
  totalThsOwned: number;
  thsTokenized: number;
  thsAvailableForTokenization: number;
}

export const useHashrateStats = () => {
  const query = useQuery({
    queryKey: ['hashrate-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('machine_inventory')
        .select('machine_types(hash_rate_ths), tokenized_ths')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalThsOwned = (data || []).reduce(
        (sum: number, item: any) => sum + parseFloat(item.machine_types.hash_rate_ths || '0'),
        0
      );

      const thsTokenized = (data || []).reduce(
        (sum: number, item: any) => sum + parseFloat(item.tokenized_ths || '0'),
        0
      );

      const thsAvailableForTokenization = totalThsOwned - thsTokenized;

      return {
        totalThsOwned,
        thsTokenized,
        thsAvailableForTokenization,
      } as HashrateStats;
    },
  });

  // Set up realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('hashrate-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machine_inventory',
        },
        () => {
          query.refetch();
        }
      )
      .on(
        'broadcast',
        { event: 'mining.machine.purchased' },
        () => {
          query.refetch();
        }
      )
      .on(
        'broadcast',
        { event: 'mining.hashrate.tokenized' },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return query;
};
