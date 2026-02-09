import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WalletNetwork } from '@/lib/validation-schemas';

interface VerificationState {
  isGeneratingNonce: boolean;
  isVerifying: boolean;
  nonce: string | null;
  nonceExpiresAt: Date | null;
  error: string | null;
}

interface UseWalletVerificationReturn extends VerificationState {
  generateNonce: () => Promise<{ nonce: string; expiresAt: Date } | null>;
  verifySignature: (
    walletAddress: string,
    signature: string,
    network: WalletNetwork
  ) => Promise<{ success: boolean; error?: string }>;
  getMessage: (walletAddress: string, nonce: string) => string;
  resetState: () => void;
}

export function useWalletVerification(): UseWalletVerificationReturn {
  const [state, setState] = useState<VerificationState>({
    isGeneratingNonce: false,
    isVerifying: false,
    nonce: null,
    nonceExpiresAt: null,
    error: null,
  });

  const resetState = useCallback(() => {
    setState({
      isGeneratingNonce: false,
      isVerifying: false,
      nonce: null,
      nonceExpiresAt: null,
      error: null,
    });
  }, []);

  const generateNonce = useCallback(async () => {
    setState(prev => ({ ...prev, isGeneratingNonce: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-wallet-nonce');

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.nonce) {
        throw new Error('Failed to generate verification nonce');
      }

      const expiresAt = new Date(data.expiresAt);
      
      setState(prev => ({
        ...prev,
        isGeneratingNonce: false,
        nonce: data.nonce,
        nonceExpiresAt: expiresAt,
      }));

      return { nonce: data.nonce, expiresAt };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate nonce';
      setState(prev => ({
        ...prev,
        isGeneratingNonce: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getMessage = useCallback((walletAddress: string, nonce: string) => {
    return `SynteraX Wallet Verification\n\nLink wallet ${walletAddress} to your SynteraX account.\n\nThis signature proves you own this wallet.\n\nNonce: ${nonce}`;
  }, []);

  const verifySignature = useCallback(async (
    walletAddress: string,
    signature: string,
    network: WalletNetwork
  ) => {
    if (!state.nonce) {
      return { success: false, error: 'No nonce available. Please generate a new one.' };
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      const message = getMessage(walletAddress, state.nonce);

      const { data, error } = await supabase.functions.invoke('api-wallet-verify-signature', {
        body: {
          walletAddress,
          signature,
          message,
          nonce: state.nonce,
          network,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Verification failed');
      }

      setState(prev => ({
        ...prev,
        isVerifying: false,
        nonce: null, // Clear used nonce
        nonceExpiresAt: null,
      }));

      toast.success('Wallet verified successfully!', {
        description: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)} is now linked to your account.`,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Verification failed';
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage,
      }));
      
      // Check for specific error codes
      if (errorMessage.includes('cooldown') || errorMessage.includes('pending')) {
        toast.error('Cannot change wallet', { description: errorMessage });
      } else {
        toast.error('Verification failed', { description: errorMessage });
      }
      
      return { success: false, error: errorMessage };
    }
  }, [state.nonce, getMessage]);

  return {
    ...state,
    generateNonce,
    verifySignature,
    getMessage,
    resetState,
  };
}
