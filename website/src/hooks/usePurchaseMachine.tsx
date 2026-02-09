import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { withRetry } from "@/lib/api-retry";
import { purchaseSchema, type PurchaseFormData } from "@/lib/validation-schemas";

interface PurchaseMachineParams {
  machineId: string;
  quantity: number;
  paymentCurrency: 'USDT' | 'MUSD';
}

export const usePurchaseMachine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ machineId, quantity, paymentCurrency }: PurchaseMachineParams) => {
      // Validate session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call API with retry logic
      return withRetry(
        async () => {
          const response = await supabase.functions.invoke(`api-machines-purchase/${machineId}`, {
            body: { quantity, paymentCurrency },
          });

          if (response.error) {
            throw new Error(response.error.message || 'Failed to purchase machine');
          }

          return response.data;
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Retrying machine purchase (attempt ${attempt})...`);
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machine-types'] });
      queryClient.invalidateQueries({ queryKey: ['machine-purchases'] });
      toast({
        title: "Purchase Successful",
        description: "Machine purchase created. This transaction will feed into your mining and commission rewards.",
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
