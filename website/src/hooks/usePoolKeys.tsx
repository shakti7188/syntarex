import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MaskedPoolKey {
  id: string;
  ownerUserId: string;
  poolName: string;
  accountLabel?: string;
  keyAlias?: string;
  last4: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  poolProvider: string;
}

export interface CreatePoolKeyPayload {
  poolName: string;
  poolProvider: string;
  apiKey: string;
  apiSecret: string;
  accountLabel?: string;
  keyAlias?: string;
  scopes?: string[];
  subaccount?: string;
}

export interface RotatePoolKeyPayload {
  id: string;
  rotationType?: 'SCHEDULED' | 'ON_DEMAND' | 'FORCED_COMPROMISE';
  reason?: string;
  newApiKey?: string;
  newApiSecret?: string;
}

/**
 * Hook for managing mining pool API keys
 */
export const usePoolKeys = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch masked pool keys (admin only)
  const { data: poolKeys, isLoading, error } = useQuery({
    queryKey: ['pool-keys'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-admin-pools-keys-list');
      
      if (error) throw error;
      return data.keys as MaskedPoolKey[];
    },
  });

  // Create new pool key
  const createPoolKey = useMutation({
    mutationFn: async (payload: CreatePoolKeyPayload) => {
      const { data, error } = await supabase.functions.invoke('api-admin-pools-keys-create', {
        body: payload,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pool-keys'] });
      queryClient.invalidateQueries({ queryKey: ['mining-pool-configs'] });
      toast({
        title: 'Pool key created',
        description: 'API key has been encrypted and stored securely',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create pool key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Rotate pool key
  const rotatePoolKey = useMutation({
    mutationFn: async (payload: RotatePoolKeyPayload) => {
      const { data, error } = await supabase.functions.invoke('api-admin-pools-keys-rotate', {
        body: payload,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pool-keys'] });
      queryClient.invalidateQueries({ queryKey: ['pool-key-rotations'] });
      toast({
        title: 'Pool key rotated',
        description: `Keys rotated successfully. New version: ${data.version}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to rotate pool key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deactivate pool key
  const deactivatePoolKey = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('api-admin-pools-keys-deactivate', {
        body: { id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pool-keys'] });
      queryClient.invalidateQueries({ queryKey: ['mining-pool-configs'] });
      toast({
        title: 'Pool key deactivated',
        description: 'API key has been deactivated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to deactivate pool key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    poolKeys,
    isLoading,
    error,
    createPoolKey,
    rotatePoolKey,
    deactivatePoolKey,
  };
};

/**
 * Hook for fetching pool key audit logs
 */
export const usePoolKeyAudits = (poolConfigId?: string) => {
  return useQuery({
    queryKey: ['pool-key-audits', poolConfigId],
    queryFn: async () => {
      if (!poolConfigId) return [];

      const { data, error } = await supabase.functions.invoke('api-admin-pools-keys-audits', {
        body: { id: poolConfigId },
      });

      if (error) throw error;
      return data.audits || [];
    },
    enabled: !!poolConfigId,
  });
};

/**
 * Hook for fetching pool key rotation history
 */
export const usePoolKeyRotations = (poolConfigId?: string) => {
  return useQuery({
    queryKey: ['pool-key-rotations', poolConfigId],
    queryFn: async () => {
      if (!poolConfigId) return [];

      const { data, error } = await supabase.functions.invoke('api-admin-pools-keys-rotations', {
        body: { id: poolConfigId },
      });

      if (error) throw error;
      return data.rotations || [];
    },
    enabled: !!poolConfigId,
  });
};
