import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCreatePaymentOrder, useSubmitTransaction, useVerifyPayment, usePaymentStatus } from "@/hooks/usePaymentOrder";
import { usePaymentAutoDetect } from "@/hooks/usePaymentAutoDetect";
import { Copy, Check, ExternalLink, Loader2, AlertCircle, Clock, CheckCircle2, RefreshCw, Radio } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PaymentFlowProps {
  packageId: string;
  packageName: string;
  priceUsd: number;
  hashrateThs: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentStep = 'selecting_chain' | 'creating' | 'awaiting_payment' | 'submit_tx' | 'verifying' | 'success' | 'failed';
type Chain = 'SOLANA' | 'ETHEREUM' | 'TRON';

const chainConfig = {
  SOLANA: {
    name: 'Solana',
    tokenName: 'USDT (SPL)',
    explorerUrl: 'https://solscan.io/tx/',
    explorerName: 'Solscan',
    icon: '◎',
    description: 'Fast & low fees (~$0.01)',
  },
  ETHEREUM: {
    name: 'Ethereum',
    tokenName: 'USDT (ERC-20)',
    explorerUrl: 'https://etherscan.io/tx/',
    explorerName: 'Etherscan',
    icon: 'Ξ',
    description: 'Most widely supported',
  },
  TRON: {
    name: 'Tron',
    tokenName: 'USDT (TRC-20)',
    explorerUrl: 'https://tronscan.org/#/transaction/',
    explorerName: 'Tronscan',
    icon: '◆',
    description: 'Low fees (~$1)',
  },
};

export const PaymentFlow = ({
  packageId,
  packageName,
  priceUsd,
  hashrateThs,
  onSuccess,
  onCancel,
}: PaymentFlowProps) => {
  const [step, setStep] = useState<PaymentStep>('selecting_chain');
  const [selectedChain, setSelectedChain] = useState<Chain>('SOLANA');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [txSignature, setTxSignature] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const createOrder = useCreatePaymentOrder();
  const submitTx = useSubmitTransaction();
  const verifyPayment = useVerifyPayment();
  const { data: statusData } = usePaymentStatus(orderId, step === 'verifying');

  // Auto-detection for transactions
  const handleTransactionFound = useCallback((txHash: string) => {
    setTxSignature(txHash);
    toast({
      title: "Transaction Detected!",
      description: "We found your payment. Verifying now...",
    });
    // Auto-submit and verify
    submitTx.mutateAsync({ orderId: orderId!, txSignature: txHash })
      .then(() => setStep('verifying'))
      .catch(() => {});
  }, [orderId, submitTx]);

  const { isSearching, pollCount, lastResult } = usePaymentAutoDetect({
    orderId,
    enabled: step === 'awaiting_payment',
    pollingInterval: 10000,
    onTransactionFound: handleTransactionFound,
  });

  const currentChainConfig = chainConfig[selectedChain];

  // Initialize payment order after chain selection
  const initPayment = async (chain: Chain) => {
    setStep('creating');
    setErrorMessage('');
    try {
      const result = await createOrder.mutateAsync({ packageId, chain });
      setOrderId(result.order.id);
      setWalletAddress(result.walletAddress);
      setExpiresAt(new Date(result.expiresAt));
      setStep('awaiting_payment');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to create payment order. Please try again.');
      setStep('failed');
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || step !== 'awaiting_payment') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setErrorMessage('Payment order expired. Please try again.');
        setStep('failed');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, step]);

  // Auto-verify when in verifying state
  useEffect(() => {
    if (step === 'verifying' && orderId) {
      const verify = async () => {
        try {
          const result = await verifyPayment.mutateAsync(orderId);
          if (result.verified) {
            setStep('success');
            setTimeout(onSuccess, 2000);
          } else if (result.error?.includes('not found') || result.error?.includes('not finalized') || result.error?.includes('pending')) {
            // Transaction not yet confirmed, keep polling
          } else {
            setErrorMessage(result.error || 'Payment verification failed');
            toast({
              title: "Verification Failed",
              description: result.error,
              variant: "destructive",
            });
          }
        } catch (error: any) {
          setErrorMessage(error?.message || 'Verification error');
        }
      };
      verify();
    }
  }, [step, statusData, orderId, verifyPayment, onSuccess]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTransaction = async () => {
    if (!txSignature.trim() || !orderId) return;

    try {
      await submitTx.mutateAsync({ orderId, txSignature: txSignature.trim() });
      setStep('verifying');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to submit transaction');
    }
  };

  const handleRetry = () => {
    setStep('selecting_chain');
    setOrderId(null);
    setWalletAddress('');
    setExpiresAt(null);
    setTxSignature('');
    setErrorMessage('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Chain Selection Screen
  if (step === 'selecting_chain') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{packageName}</CardTitle>
              <Badge variant="outline">{hashrateThs} TH/s</Badge>
            </div>
            <CardDescription>Mining Package</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">${priceUsd.toLocaleString()} USDT</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Payment Network</CardTitle>
            <CardDescription>Choose which blockchain to send USDT on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(chainConfig) as Chain[]).map((chain) => {
              const config = chainConfig[chain];
              const isSelected = selectedChain === chain;
              
              return (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(chain)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <div className="font-semibold">{config.name}</div>
                        <div className="text-sm text-muted-foreground">{config.tokenName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{config.description}</div>
                      {isSelected && (
                        <Badge variant="default" className="mt-1">Selected</Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => initPayment(selectedChain)} className="flex-1">
                Continue with {chainConfig[selectedChain].name}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'creating') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Creating payment order...</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold">Payment Confirmed!</h3>
        <p className="text-muted-foreground text-center">
          Your {packageName} package has been activated with {hashrateThs} TH/s hashrate.
        </p>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold">Payment Failed</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          {errorMessage || 'The payment order has expired or there was an error.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Package Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{packageName}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{currentChainConfig.name}</Badge>
              <Badge variant="outline">{hashrateThs} TH/s</Badge>
            </div>
          </div>
          <CardDescription>Mining Package</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total Amount:</span>
            <span className="text-primary">${priceUsd.toLocaleString()} USDT</span>
          </div>
        </CardContent>
      </Card>

      {/* Timer with Progress */}
      {step === 'awaiting_payment' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                Time remaining: {formatTime(timeRemaining)}
              </span>
            </div>
            {timeRemaining < 300 && (
              <Badge variant="destructive" className="animate-pulse">
                Expiring Soon!
              </Badge>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${Math.max(0, (timeRemaining / 1800) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Auto-Detection Status */}
      {step === 'awaiting_payment' && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            {isSearching ? (
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            ) : (
              <Radio className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-sm text-blue-700 dark:text-blue-400">
              {isSearching ? 'Scanning blockchain for your payment...' : 'Auto-detection ready'}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Scans: {pollCount}
          </Badge>
          {lastResult?.error && (
            <span className="text-xs text-red-500">{lastResult.error}</span>
          )}
        </div>
      )}

      {/* Payment Instructions */}
      {(step === 'awaiting_payment' || step === 'submit_tx') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Send USDT to this {currentChainConfig.name} wallet
            </CardTitle>
            <CardDescription>
              Send exactly ${priceUsd.toLocaleString()} {currentChainConfig.tokenName} to the address below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Deposit Address</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  value={walletAddress}
                  readOnly
                  className="font-mono text-xs sm:text-sm flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(walletAddress)}
                  className="w-full sm:w-auto"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  value={`${priceUsd.toLocaleString()} USDT`}
                  readOnly
                  className="font-mono flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(priceUsd.toString())}
                  className="w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-foreground mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Send only {currentChainConfig.tokenName} on {currentChainConfig.name} network</li>
                <li>Send the exact amount shown above</li>
                <li>Transaction must be completed before timer expires</li>
                <li className="text-green-600 dark:text-green-400">✓ Auto-detection enabled - we'll find your payment automatically!</li>
                {selectedChain === 'ETHEREUM' && (
                  <li>Ensure you have enough ETH for gas fees</li>
                )}
                {selectedChain === 'TRON' && (
                  <li>Ensure you have enough TRX for transaction fees</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Submit Transaction Signature (backup) */}
      {step === 'awaiting_payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Manual Verification
              <Badge variant="secondary">Optional</Badge>
            </CardTitle>
            <CardDescription>
              If auto-detection doesn't find your payment, paste the transaction {selectedChain === 'SOLANA' ? 'signature' : 'hash'} here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder={`Enter ${currentChainConfig.name} transaction ${selectedChain === 'SOLANA' ? 'signature' : 'hash'}...`}
              value={txSignature}
              onChange={(e) => setTxSignature(e.target.value)}
              className="font-mono text-sm"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitTransaction}
                disabled={!txSignature.trim() || submitTx.isPending}
                className="flex-1"
              >
                {submitTx.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Verify Payment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verifying State */}
      {step === 'verifying' && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-semibold">Verifying Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Checking transaction on {currentChainConfig.name} blockchain...
                </p>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {txSignature.slice(0, 20)}...{txSignature.slice(-20)}
              </div>
              <a
                href={`${currentChainConfig.explorerUrl}${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                View on {currentChainConfig.explorerName} <ExternalLink className="w-3 h-3" />
              </a>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
