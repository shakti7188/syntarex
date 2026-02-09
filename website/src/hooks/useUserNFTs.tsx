import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface PurchaseNFT {
  id: string;
  purchase_id: string;
  user_id: string;
  certificate_number: number;
  token_id: string | null;
  contract_address: string | null;
  chain: string;
  tx_hash: string | null;
  metadata_uri: string | null;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
      display_type?: string;
    }>;
    properties?: {
      purchase_id?: string;
      package_id?: string;
      user_id?: string;
      transaction_hash?: string;
      payment_order_id?: string;
      issued_at?: string;
    };
  };
  mint_status: 'PENDING' | 'QUEUED' | 'MINTING' | 'MINTED' | 'FAILED' | 'WALLET_REQUIRED';
  mint_error: string | null;
  mint_attempts: number;
  minted_at: string | null;
  is_soulbound: boolean;
  created_at: string;
  updated_at: string;
  purchase?: {
    id: string;
    total_price: number;
    payment_currency: string;
    created_at: string;
    package?: {
      id: string;
      name: string;
      tier: string;
      hashrate_ths: number;
      xflow_tokens: number;
    };
  };
}

export interface NFTStats {
  total: number;
  minted: number;
  pending: number;
  failed: number;
  walletRequired: number;
}

export const useUserNFTs = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-nfts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('purchase_nfts')
        .select(`
          *,
          purchase:package_purchases (
            id,
            total_price,
            payment_currency,
            created_at,
            package:packages (
              id,
              name,
              tier,
              hashrate_ths,
              xflow_tokens
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user NFTs:', error);
        throw error;
      }

      return (data || []) as PurchaseNFT[];
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-nfts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_nfts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[NFT Realtime] Change received:', payload);
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, query.refetch]);

  // Calculate stats
  const stats: NFTStats = {
    total: query.data?.length || 0,
    minted: query.data?.filter(n => n.mint_status === 'MINTED').length || 0,
    pending: query.data?.filter(n => ['PENDING', 'QUEUED', 'MINTING'].includes(n.mint_status)).length || 0,
    failed: query.data?.filter(n => n.mint_status === 'FAILED').length || 0,
    walletRequired: query.data?.filter(n => n.mint_status === 'WALLET_REQUIRED').length || 0,
  };

  return {
    nfts: query.data || [],
    stats,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useNFTById = (nftId: string | null) => {
  return useQuery({
    queryKey: ['nft-detail', nftId],
    queryFn: async () => {
      if (!nftId) return null;

      const { data, error } = await supabase
        .from('purchase_nfts')
        .select(`
          *,
          purchase:package_purchases (
            id,
            total_price,
            payment_currency,
            transaction_hash,
            created_at,
            package:packages (
              id,
              name,
              tier,
              hashrate_ths,
              xflow_tokens,
              description
            )
          )
        `)
        .eq('id', nftId)
        .single();

      if (error) {
        console.error('Error fetching NFT:', error);
        throw error;
      }

      return data as PurchaseNFT;
    },
    enabled: !!nftId,
  });
};
