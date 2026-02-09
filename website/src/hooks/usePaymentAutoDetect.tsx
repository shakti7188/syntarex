import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoDetectResult {
  found: boolean;
  txHash?: string;
  amount?: number;
  alreadyConfirmed?: boolean;
  alreadySubmitted?: boolean;
  error?: string;
}

interface UsePaymentAutoDetectOptions {
  orderId: string | null;
  enabled: boolean;
  pollingInterval?: number; // in milliseconds
  onTransactionFound?: (txHash: string) => void;
}

export function usePaymentAutoDetect({
  orderId,
  enabled,
  pollingInterval = 10000, // 10 seconds
  onTransactionFound,
}: UsePaymentAutoDetectOptions) {
  const [isSearching, setIsSearching] = useState(false);
  const [lastResult, setLastResult] = useState<AutoDetectResult | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const checkForTransaction = useCallback(async (): Promise<AutoDetectResult> => {
    if (!orderId) return { found: false };

    try {
      const { data, error } = await supabase.functions.invoke('api-payment-auto-detect', {
        body: { orderId },
      });

      if (error) {
        console.error('Auto-detect error:', error);
        return { found: false, error: error.message };
      }

      return data as AutoDetectResult;
    } catch (err) {
      console.error('Auto-detect fetch error:', err);
      return { found: false, error: 'Network error' };
    }
  }, [orderId]);

  useEffect(() => {
    if (!enabled || !orderId) {
      setIsSearching(false);
      return;
    }

    let intervalId: NodeJS.Timeout;
    let mounted = true;

    const poll = async () => {
      if (!mounted) return;

      setIsSearching(true);
      const result = await checkForTransaction();
      
      if (!mounted) return;

      setLastResult(result);
      setPollCount(prev => prev + 1);

      if (result?.found && result.txHash) {
        setIsSearching(false);
        onTransactionFound?.(result.txHash);
        return; // Stop polling
      }

      // Continue polling
      intervalId = setTimeout(poll, pollingInterval);
    };

    // Start polling immediately
    poll();

    return () => {
      mounted = false;
      if (intervalId) clearTimeout(intervalId);
      setIsSearching(false);
    };
  }, [enabled, orderId, pollingInterval, checkForTransaction, onTransactionFound]);

  // Reset state when orderId changes
  useEffect(() => {
    setPollCount(0);
    setLastResult(null);
  }, [orderId]);

  return {
    isSearching,
    lastResult,
    pollCount,
    checkForTransaction,
  };
}
