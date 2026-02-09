import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AllocationConfig {
  id: string;
  affiliate_network_pct: number;
  btc_mining_machines_pct: number;
  core_team_pct: number;
  investor_returns_pct: number;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export const useAllocationConfig = () => {
  const [config, setConfig] = useState<AllocationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-allocation-config-get`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch allocation config');
      }

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching allocation config:', error);
      toast({
        title: "Error",
        description: "Failed to load allocation configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<AllocationConfig>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-allocation-config-update`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update allocation config');
      }

      const data = await response.json();
      setConfig(data);
      
      toast({
        title: "Success",
        description: "Allocation configuration updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating allocation config:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update allocation configuration",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchConfig();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('allocation-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'allocation_config',
        },
        () => {
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    config,
    isLoading,
    updateConfig,
    refetch: fetchConfig,
  };
};
