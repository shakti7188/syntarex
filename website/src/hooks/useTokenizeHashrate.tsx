import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { withRetry } from "@/lib/api-retry";
import { tokenizeHashrateSchema, type TokenizeHashrateFormData } from "@/lib/validation-schemas";
import { useState } from "react";

interface TokenizeHashrateParams {
  allocationId: string;
  amountThs: number;
  tokenSymbol: string;
}

interface TokenizeResult {
  tokenization: {
    id: string;
    amount_ths: number;
    tokens_minted: number;
    token_symbol: string;
  };
}

export const useTokenizeHashrate = () => {
  const queryClient = useQueryClient();
  const [successData, setSuccessData] = useState<TokenizeResult | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ allocationId, amountThs, tokenSymbol }: TokenizeHashrateParams) => {
      // Validate input
      const validated = tokenizeHashrateSchema.parse({ allocationId, amountThs });
      
      // Call API with retry logic
      return withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('api-mining-tokenize', {
            body: { ...validated, tokenSymbol },
          });

          if (error) throw error;
          return data;
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Retrying tokenization (attempt ${attempt})...`);
          },
        }
      );
    },
    onSuccess: (data: TokenizeResult) => {
      setSuccessData(data);
      
      queryClient.invalidateQueries({ queryKey: ['hashrate-stats'] });
      queryClient.invalidateQueries({ queryKey: ['hashrate-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['machine-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['tokenization-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Tokenization Failed",
        description: error.message || "Failed to tokenize hashrate. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    ...mutation,
    successData,
    clearSuccess: () => setSuccessData(null),
  };
};
