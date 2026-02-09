import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { withRetry } from "@/lib/api-retry";
import { createAllocationSchema, type CreateAllocationFormData } from "@/lib/validation-schemas";

interface CreateAllocationParams {
  machineInventoryId: string;
}

export const useCreateAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ machineInventoryId }: CreateAllocationParams) => {
      // Call API with retry logic
      return withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('api-mining-create-allocation', {
            body: { machineInventoryId },
          });

          if (error) throw error;
          return data;
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Retrying allocation creation (attempt ${attempt})...`);
          },
        }
      );
    },
    onSuccess: (data) => {
      toast({
        title: "Allocation Created",
        description: `Successfully created hashrate allocation for ${data.allocation.totalThs} TH/s.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['hashrate-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['hashrate-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Allocation",
        description: error.message || "Failed to create hashrate allocation. Please try again.",
        variant: "destructive",
      });
    },
  });
};
