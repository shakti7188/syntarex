import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MachineType {
  id: string;
  brand: string;
  model: string;
  hash_rate_ths: number;
  power_watts: number;
  efficiency_j_per_th: number;
  price_usdt: number;
  location: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PRE_ORDER';
  available_quantity: number;
  image_url: string | null;
  description: string | null;
}

export const useMachineTypes = () => {
  return useQuery({
    queryKey: ['machine-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('machine_types')
        .select('*')
        .in('status', ['ACTIVE', 'PRE_ORDER'])
        .order('brand', { ascending: true });

      if (error) throw error;
      return data as MachineType[];
    },
  });
};
