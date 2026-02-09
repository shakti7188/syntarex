import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PayoutSetting {
  id: string;
  key: string;
  value: number;
  min_value: number | null;
  max_value: number | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface GroupedPayoutSettings {
  direct: {
    tier1?: number;
    tier2?: number;
    tier3?: number;
  };
  binary: {
    weakLeg?: number;
    cap?: number;
  };
  override: {
    level1?: number;
    level2?: number;
    level3?: number;
  };
  global: {
    payoutCap?: number;
  };
}

export const usePayoutSettings = () => {
  const [settings, setSettings] = useState<PayoutSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-payout-settings', {
        method: 'GET',
      });

      if (error) {
        if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
          console.error('Session expired, signing out');
          await supabase.auth.signOut();
        }
        throw error;
      }
      
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching payout settings:', error);
      toast({
        title: "Error",
        description: "Failed to load payout settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('api-payout-settings', {
        method: 'POST',
        body: { key, value },
      });

      if (error) throw error;
      
      setSettings(prev => 
        prev.map(s => s.key === key ? data : s)
      );
      
      toast({
        title: "Success",
        description: "Payout setting updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating payout setting:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payout setting",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('payout-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payout_settings',
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

  const getSettingByKey = (key: string) => {
    return settings.find(s => s.key === key);
  };

  const getSettingValue = (key: string): number | undefined => {
    return settings.find(s => s.key === key)?.value;
  };

  return {
    settings,
    isLoading,
    updateSetting,
    getSettingByKey,
    getSettingValue,
    refetch: fetchSettings,
  };
};

export const useGroupedPayoutSettings = () => {
  const [grouped, setGrouped] = useState<GroupedPayoutSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGrouped = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-payout-settings-grouped');

      if (error) throw error;
      setGrouped(data);
    } catch (error) {
      console.error('Error fetching grouped payout settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrouped();
  }, []);

  return { grouped, isLoading, refetch: fetchGrouped };
};
