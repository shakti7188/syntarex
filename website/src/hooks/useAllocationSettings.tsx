import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AllocationSetting {
  id: string;
  name: string;
  value: number;
  min_value: number | null;
  max_value: number | null;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export const useAllocationSettings = () => {
  const [settings, setSettings] = useState<AllocationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-allocation-settings', {
        method: 'GET',
      });

      if (error) {
        // Handle auth errors by signing out
        if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
          console.error('Session expired, signing out');
          await supabase.auth.signOut();
        }
        throw error;
      }
      
      setSettings(data);
    } catch (error) {
      console.error('Error fetching allocation settings:', error);
      toast({
        title: "Error",
        description: "Failed to load allocation settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (id: string, value: number) => {
    try {
      const { data, error } = await supabase.functions.invoke(`api-allocation-settings/${id}`, {
        method: 'POST',
        body: { value },
      });

      if (error) throw error;
      
      // Update local state
      setSettings(prev => 
        prev.map(s => s.id === id ? data : s)
      );
      
      toast({
        title: "Success",
        description: "Allocation setting updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating allocation setting:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update allocation setting",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('allocation-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'allocation_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTotalAllocation = () => {
    return settings.reduce((sum, s) => sum + parseFloat(s.value.toString()), 0);
  };

  const getSettingByName = (name: string) => {
    return settings.find(s => s.name === name);
  };

  return {
    settings,
    isLoading,
    updateSetting,
    refetch: fetchSettings,
    getTotalAllocation,
    getSettingByName,
  };
};
