import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface MachineInventoryItem {
  id: string;
  userId: string;
  machineTypeId: string;
  purchaseId: string | null;
  status: 'AVAILABLE' | 'DEPLOYED' | 'HOSTED';
  tokenizedThs: number;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  machineType: {
    id: string;
    brand: string;
    model: string;
    hashRateThs: number;
    powerWatts: number;
    efficiencyJPerTh: number;
    priceUsdt: number;
    location: string | null;
    status: string;
    availableQuantity: number;
    imageUrl: string | null;
    description: string | null;
  };
}

export const useMachineInventory = () => {
  const query = useQuery({
    queryKey: ['machine-inventory'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('machine_inventory')
        .select(`
          *,
          machine_types (
            id,
            brand,
            model,
            hash_rate_ths,
            power_watts,
            efficiency_j_per_th,
            price_usdt,
            location,
            status,
            available_quantity,
            image_url,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        machineTypeId: item.machine_type_id,
        purchaseId: item.purchase_id,
        status: item.status,
        tokenizedThs: parseFloat(item.tokenized_ths || '0'),
        location: item.location,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        machineType: {
          id: item.machine_types.id,
          brand: item.machine_types.brand,
          model: item.machine_types.model,
          hashRateThs: parseFloat(item.machine_types.hash_rate_ths),
          powerWatts: parseFloat(item.machine_types.power_watts),
          efficiencyJPerTh: parseFloat(item.machine_types.efficiency_j_per_th),
          priceUsdt: parseFloat(item.machine_types.price_usdt),
          location: item.machine_types.location,
          status: item.machine_types.status,
          availableQuantity: item.machine_types.available_quantity,
          imageUrl: item.machine_types.image_url,
          description: item.machine_types.description,
        },
      })) as MachineInventoryItem[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('machine-inventory-changes')
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
