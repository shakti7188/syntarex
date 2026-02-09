import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEncryptSecret = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      secretType, 
      value, 
      metadata 
    }: { 
      secretType: string; 
      value: string; 
      metadata?: Record<string, any> 
    }) => {
      const { data, error } = await supabase.functions.invoke('secrets-encrypt', {
        body: { secretType, value, metadata },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encrypted-secrets'] });
      toast({ title: 'Secret encrypted and stored securely' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to encrypt secret',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useRotateKeys = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('secrets-rotate');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['encrypted-secrets'] });
      queryClient.invalidateQueries({ queryKey: ['secret-audit-logs'] });
      toast({ 
        title: 'Key rotation completed',
        description: `Rotated ${data.secrets_rotated} secrets to version ${data.new_key_version}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Key rotation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
