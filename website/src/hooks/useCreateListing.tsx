import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { withRetryAndToast } from "@/lib/api-retry";

interface CreateListingParams {
  allocationId: string;
  amountThs: number;
  pricePerThs: number;
  expiresInDays?: number;
}

export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateListingParams) => {
      return withRetryAndToast(
        async () => {
          const { data, error } = await supabase.functions.invoke(
            'api-marketplace-create-listing',
            {
              body: params,
            }
          );

          if (error) throw error;
          if (data.error) throw new Error(data.error);

          return data;
        },
        {
          errorTitle: "Failed to Create Listing",
          errorDescription: "Could not create your hashrate listing. Please try again.",
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['hashrate-allocations'] });
      
      toast({
        title: "Listing Created",
        description: "Your hashrate is now listed on the marketplace",
      });
    },
  });
};
