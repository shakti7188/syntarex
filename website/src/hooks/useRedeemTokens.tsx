import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { withRetryAndToast } from "@/lib/api-retry";
import { useState } from "react";

interface RedeemTokensParams {
  allocationId: string;
  tokenAmount: number;
  tokenSymbol: string;
}

interface RedeemResult {
  redemption: {
    id: string;
    hashrateRestored: number;
    tokensBurned: number;
  };
}

export const useRedeemTokens = () => {
  const queryClient = useQueryClient();
  const [successData, setSuccessData] = useState<RedeemResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: RedeemTokensParams) => {
      return withRetryAndToast(
        async () => {
          const { data, error } = await supabase.functions.invoke(
            'api-mining-redeem-tokens',
            {
              body: params,
            }
          );

          if (error) throw error;
          if (data.error) throw new Error(data.error);

          return data;
        },
        {
          errorTitle: "Failed to Redeem Tokens",
          errorDescription: "Could not redeem your tokens. Please try again.",
        }
      );
    },
    onSuccess: (data: RedeemResult) => {
      setSuccessData(data);
      
      queryClient.invalidateQueries({ queryKey: ['hashrate-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['token-balances'] });
    },
  });

  return {
    ...mutation,
    successData,
    clearSuccess: () => setSuccessData(null),
  };
};
