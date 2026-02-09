import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface HostingFee {
  id: string;
  machine_inventory_id: string;
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  fee_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  transaction_hash: string | null;
  created_at: string;
  updated_at: string;
  machine_inventory?: {
    machine_types: {
      brand: string;
      model: string;
    };
  };
}

export const useHostingFees = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['hosting-fees', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hosting_fees')
        .select(`
          *,
          machine_inventory (
            machine_types (
              brand,
              model
            )
          )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data as HostingFee[];
    },
    enabled: !!user?.id,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('hosting-fees')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hosting_fees',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, query]);

  return query;
};
