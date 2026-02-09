import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ClaimableSettlement {
  weekStart: number;
  weekStartDate: string;
  weekEndDate: string;
  amount: number;
  amountWei: string;
  merkleProof: string[];
  merkleRoot: string;
  status: string;
  txHash?: string;
}

export const useClaimableSettlements = () => {
  const { user, isLoading: isAuthLoading, signOut } = useAuth();

  return useQuery({
    queryKey: ['claimable-settlements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-claimable-settlements', {
        method: 'POST',
      });

      if (error) {
        // Handle auth errors by signing out
        if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
          console.error('Session expired, signing out');
          await signOut();
        }
        throw error;
      }

      return {
        claimable: data.claimable as ClaimableSettlement[],
        walletAddress: data.walletAddress as string,
      };
    },
    enabled: !!user && !isAuthLoading,
    retry: false,
  });
};
