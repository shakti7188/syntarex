import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateOrderResponse {
  success: boolean;
  order: {
    id: string;
    status: string;
    expires_at: string;
  };
  walletAddress: string;
  amountUsdt: number;
  expiresAt: string;
}

interface SubmitTxResponse {
  success: boolean;
  order: {
    id: string;
    status: string;
  };
  message: string;
}

interface VerifyResponse {
  success: boolean;
  verified: boolean;
  order?: any;
  purchase?: any;
  message?: string;
  error?: string;
  amountReceived?: number;
}

interface PaymentStatusResponse {
  success: boolean;
  order: {
    id: string;
    status: string;
    amountExpected: number;
    amountReceived: number | null;
    currency: string;
    chain: string;
    txHash: string | null;
    expiresAt: string;
    confirmedAt: string | null;
    createdAt: string;
  };
  package: {
    name: string;
    price_usd: number;
    hashrate_ths: number;
    tier: string;
  };
  walletAddress: string;
  timeRemainingSeconds: number;
  isExpired: boolean;
}

export const useCreatePaymentOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, chain = 'SOLANA' }: { packageId: string; chain?: 'SOLANA' | 'ETHEREUM' | 'TRON' }): Promise<CreateOrderResponse> => {
      const response = await supabase.functions.invoke('api-payment-create-order', {
        body: { packageId, chain },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create payment order');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create payment order');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useSubmitTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, txSignature }: { orderId: string; txSignature: string }): Promise<SubmitTxResponse> => {
      const response = await supabase.functions.invoke('api-payment-submit-tx', {
        body: { orderId, txSignature },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to submit transaction');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to submit transaction');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string): Promise<VerifyResponse> => {
      const response = await supabase.functions.invoke('api-payment-verify', {
        body: { orderId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to verify payment');
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        queryClient.invalidateQueries({ queryKey: ['payment-orders'] });
        queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
        queryClient.invalidateQueries({ queryKey: ['hashrate-allocations'] });
        toast({
          title: "Payment Confirmed!",
          description: "Your package has been activated successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const usePaymentStatus = (orderId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: async (): Promise<PaymentStatusResponse> => {
      const response = await supabase.functions.invoke('api-payment-status', {
        body: null,
        headers: {},
      });
      
      // Use fetch directly since invoke doesn't support query params well
      const { data: { session } } = await supabase.auth.getSession();
      
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-payment-status?orderId=${orderId}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to get payment status');
      }

      return res.json();
    },
    enabled: !!orderId && enabled,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  });
};

export const usePendingPayments = () => {
  return useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_orders')
        .select(`
          *,
          packages!inner(name, price_usd, hashrate_ths, tier)
        `)
        .in('status', ['PENDING', 'AWAITING_CONFIRMATION'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
