import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePoolConfigs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['mining-pool-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mining_pool_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('mining_pool_configs')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mining-pool-configs'] });
      toast({ title: 'Pool status updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update pool status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mining_pool_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mining-pool-configs'] });
      toast({ title: 'Pool connection deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete pool connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const syncPool = useMutation({
    mutationFn: async ({ id, provider }: { id: string; provider: string }) => {
      const functionName = provider === 'ANTPOOL' 
        ? 'mining-pool-sync-antpool' 
        : 'mining-pool-sync-f2pool';

      // Get the sync token from environment (should be set as a secret)
      const syncToken = import.meta.env.VITE_MINING_POOL_SYNC_TOKEN;

      const { error } = await supabase.functions.invoke(functionName, {
        headers: {
          'X-Sync-Token': syncToken || '',
        },
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mining-pool-configs'] });
      toast({ title: 'Pool sync initiated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to sync pool',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    configs,
    isLoading,
    error,
    toggleActive: toggleActive.mutate,
    deleteConfig: deleteConfig.mutate,
    syncPool: syncPool.mutate,
  };
};
