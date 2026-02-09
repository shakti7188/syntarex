import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface PaymentMethod {
  id: string;
  method_type: "BTC" | "USDC" | "USDT" | "XFLOW" | "CARD";
  wallet_address?: string;
  card_last_four?: string;
  card_brand?: string;
  is_default: boolean;
}

export const usePaymentMethods = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["payment-methods", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!user,
  });

  const addPaymentMethod = useMutation({
    mutationFn: async (method: Omit<PaymentMethod, "id">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("payment_methods")
        .insert([{ ...method, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast({
        title: "Payment method added",
        description: "Your payment method has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setDefaultMethod = useMutation({
    mutationFn: async (methodId: string) => {
      if (!user) throw new Error("User not authenticated");

      // First, unset all default flags
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Then set the selected method as default
      const { data, error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", methodId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast({
        title: "Default payment method updated",
        description: "Your default payment method has been updated",
      });
    },
  });

  return {
    paymentMethods,
    isLoading,
    addPaymentMethod,
    setDefaultMethod,
  };
};
