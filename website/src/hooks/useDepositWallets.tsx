import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DepositWallet {
  id: string;
  wallet_address: string;
  chain: string;
  currency: string;
  is_active: boolean;
  label: string | null;
  total_received: number;
  created_at: string;
  updated_at: string;
}

// Wallet address validation
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidSolanaAddress = (address: string): boolean => {
  // Base58 characters (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address) && !address.startsWith('0x');
};

export const isValidTronAddress = (address: string): boolean => {
  // Tron addresses start with 'T' and are 34 characters Base58
  const base58Regex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
  return base58Regex.test(address);
};

export const validateWalletForChain = (address: string, chain: string): { valid: boolean; error?: string } => {
  if (chain === 'ETHEREUM') {
    if (!isValidEthereumAddress(address)) {
      return { valid: false, error: 'Invalid Ethereum address. Must start with 0x and be 42 characters.' };
    }
  } else if (chain === 'SOLANA') {
    if (!isValidSolanaAddress(address)) {
      return { valid: false, error: 'Invalid Solana address. Must be 32-44 Base58 characters.' };
    }
  } else if (chain === 'TRON') {
    if (!isValidTronAddress(address)) {
      return { valid: false, error: 'Invalid Tron address. Must start with T and be 34 Base58 characters.' };
    }
  }
  return { valid: true };
};

export const useDepositWallets = () => {
  const queryClient = useQueryClient();

  const { data: wallets, isLoading, error } = useQuery({
    queryKey: ["deposit-wallets-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposit_wallets")
        .select("*")
        .order("chain", { ascending: true });

      if (error) throw error;
      return data as DepositWallet[];
    },
  });

  const updateWallet = useMutation({
    mutationFn: async ({ 
      id, 
      wallet_address, 
      chain, 
      is_active, 
      label 
    }: { 
      id: string; 
      wallet_address: string; 
      chain: string; 
      is_active: boolean; 
      label: string | null;
    }) => {
      // Validate wallet address matches chain
      const validation = validateWalletForChain(wallet_address, chain);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const { data, error } = await supabase
        .from("deposit_wallets")
        .update({ 
          wallet_address, 
          chain, 
          is_active, 
          label,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposit-wallets-admin"] });
      toast.success("Deposit wallet updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update deposit wallet");
    },
  });

  return {
    wallets,
    isLoading,
    error,
    updateWallet,
  };
};
