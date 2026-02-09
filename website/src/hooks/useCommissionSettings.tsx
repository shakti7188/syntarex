import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CommissionSetting {
  id: string;
  setting_name: string;
  setting_value: number;
  min_value: number;
  max_value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export const useCommissionSettings = () => {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-commission-settings-get', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      toast({
        title: "Error",
        description: "Failed to load commission settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (settingName: string, value: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('api-commission-settings-update', {
        body: { setting_name: settingName, setting_value: value },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission setting updated successfully",
      });

      await fetchSettings();
      return data;
    } catch (error: any) {
      console.error('Error updating commission setting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update commission setting",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getSettingByName = (name: string) => {
    return settings.find(s => s.setting_name === name);
  };

  const getSettingValue = (name: string): number | undefined => {
    return settings.find(s => s.setting_name === name)?.setting_value;
  };

  return {
    settings,
    isLoading,
    updateSetting,
    getSettingByName,
    getSettingValue,
    refetch: fetchSettings,
  };
};
