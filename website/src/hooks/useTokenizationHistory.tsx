import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface TokenizationRecord {
  id: string;
  userId: string;
  allocationId: string | null;
  amountThs: number;
  tokenSymbol: string;
  tokensMinted: number;
  txHash: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export const useTokenizationHistory = () => {
  const query = useQuery({
    queryKey: ['tokenization-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hashrate_tokenizations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        allocationId: item.allocation_id,
        amountThs: parseFloat(item.amount_ths),
        tokenSymbol: item.token_symbol,
        tokensMinted: parseFloat(item.tokens_minted),
        txHash: item.tx_hash,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as TokenizationRecord[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tokenization-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hashrate_tokenizations',
        },
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
