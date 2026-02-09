import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface HashrateListin {
  id: string;
  seller_id: string;
  allocation_id: string;
  amount_ths: number;
  price_per_ths: number;
  total_price: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'EXPIRED';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  seller?: {
    full_name: string;
    email: string;
  } | null;
}

export interface HashrateTrade {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount_ths: number;
  price_per_ths: number;
  total_price: number;
  transaction_hash: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useMarketplaceListings = () => {
  const query = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hashrate_listings')
        .select(`
          *,
          seller:profiles!hashrate_listings_seller_id_fkey (
            full_name,
            email
          )
        `)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as HashrateListin[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('marketplace-listings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hashrate_listings'
        },
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

export const useMyTrades = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['my-trades', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hashrate_trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HashrateTrade[];
    },
    enabled: !!user?.id,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('my-trades')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hashrate_trades'
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
