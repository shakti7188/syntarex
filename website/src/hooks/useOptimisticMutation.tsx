import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface OptimisticUpdateConfig<TData, TVariables, TResult = unknown> {
  queryKey: string[];
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  successMessage?: string;
  errorMessage?: string;
}

interface MutationContext<TData> {
  previousData?: TData;
}

export function useOptimisticMutation<TData, TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  config: OptimisticUpdateConfig<TData, TVariables, TResult>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(config.queryKey);

      // Optimistically update
      queryClient.setQueryData<TData>(config.queryKey, (old) =>
        config.updateFn(old, variables)
      );

      return { previousData };
    },
    onError: (err: Error, _variables: TVariables, context: MutationContext<TData> | undefined) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(config.queryKey, context.previousData);
      }
      
      toast({
        title: "Error",
        description: config.errorMessage || err.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      if (config.successMessage) {
        toast({
          title: "Success",
          description: config.successMessage,
        });
      }
    },
    onSettled: () => {
      // Refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  });
}
