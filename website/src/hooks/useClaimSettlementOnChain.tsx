import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface ClaimSettlementParams {
  settlementId: string;
  walletAddress: string;
  merkleProof?: string[];
}

interface ClaimResult {
  success: boolean;
  settlement: any;
  txHash: string;
  message: string;
}

export const useClaimSettlementOnChain = () => {
  const queryClient = useQueryClient();
  const [isClaimingOnChain, setIsClaimingOnChain] = useState(false);

  const mutation = useMutation({
    mutationFn: async (params: ClaimSettlementParams): Promise<ClaimResult> => {
      setIsClaimingOnChain(true);
      
      const { data, error } = await supabase.functions.invoke("claim-settlement", {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      setIsClaimingOnChain(false);
      
      toast({
        title: "Settlement Claimed! 🎉",
        description: `Transaction hash: ${data.txHash.slice(0, 10)}...`,
        duration: 5000,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["claimable-settlements"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-settlements"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => {
      setIsClaimingOnChain(false);
      
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    claimSettlement: mutation.mutate,
    isClaimingOnChain,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
};
