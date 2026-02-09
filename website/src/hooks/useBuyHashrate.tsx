import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { withRetry } from "@/lib/api-retry";
import { marketplaceBuySchema, type MarketplaceBuyFormData } from "@/lib/validation-schemas";
import { useState } from "react";

interface BuyHashrateParams {
  listingId: string;
  amountThs: number;
}

interface BuyHashrateResult {
  trade: {
    id: string;
    amount_ths: number;
    price_per_ths: number;
    total_price: number;
  };
}

export const useBuyHashrate = () => {
  const queryClient = useQueryClient();
  const [successData, setSuccessData] = useState<BuyHashrateResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: BuyHashrateParams) => {
      // Validate input
      const validated = marketplaceBuySchema.parse(params);
      
      // Call API with retry logic
      return withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('api-marketplace-buy', {
            body: validated,
          });

          if (error) throw error;
          return data;
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Retrying marketplace purchase (attempt ${attempt})...`);
          },
        }
      );
    },
    onSuccess: (data: BuyHashrateResult) => {
      setSuccessData(data);
      
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-trades'] });
      queryClient.invalidateQueries({ queryKey: ['hashrate-allocations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to execute trade. Please try again.",
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
