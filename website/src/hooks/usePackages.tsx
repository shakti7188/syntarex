import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Package {
  id: string;
  name: string;
  tier: string;
  price_usd: number;
  hashrate_ths: number;
  xflow_tokens: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePackages = () => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: true });

      if (error) throw error;
      return data as Package[];
    },
  });
};
