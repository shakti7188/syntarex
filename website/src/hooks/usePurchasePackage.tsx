import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { withRetry } from "@/lib/api-retry";

interface PurchasePackageParams {
  packageId: string;
  paymentCurrency: 'USDT' | 'XFLOW';
}

export const usePurchasePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, paymentCurrency }: PurchasePackageParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      return withRetry(
        async () => {
          const response = await supabase.functions.invoke('api-packages-purchase', {
            body: { packageId, paymentCurrency },
          });

          if (response.error) {
            throw new Error(response.error.message || 'Failed to purchase package');
          }

          return response.data;
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Retrying package purchase (attempt ${attempt})...`);
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['hashrate-allocations'] });
      toast({
        title: "Package Purchase Successful",
        description: "Your package has been activated and hashrate allocated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
