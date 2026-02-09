import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface HashrateAllocation {
  id: string;
  userId: string;
  machineInventoryId: string;
  totalThs: number;
  tokenizedThs: number;
  untokenizedThs: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const useHashrateAllocations = () => {
  const query = useQuery({
    queryKey: ['hashrate-allocations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hashrate_allocations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        machineInventoryId: item.machine_inventory_id,
        totalThs: parseFloat(item.total_ths),
        tokenizedThs: parseFloat(item.tokenized_ths),
        untokenizedThs: parseFloat(item.untokenized_ths),
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as HashrateAllocation[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('hashrate-allocations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hashrate_allocations',
        },
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
