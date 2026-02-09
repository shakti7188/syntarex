import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWalletVerification } from '@/hooks/useWalletVerification';
import { validateWalletAddress, WalletNetwork } from '@/lib/validation-schemas';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Copy, 
  RefreshCw,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WalletVerificationProps {
  onVerified?: (address: string, network: WalletNetwork) => void;
  onCancel?: () => void;
}

export const WalletVerification = ({ onVerified, onCancel }: WalletVerificationProps) => {
  const [network, setNetwork] = useState<WalletNetwork>('SOLANA');
  const [address, setAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [step, setStep] = useState<'address' | 'sign' | 'verify'>('address');
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const {
    isGeneratingNonce,
    isVerifying,
    nonce,
    nonceExpiresAt,
    error,
    generateNonce,
    verifySignature,
    getMessage,
    resetState,
  } = useWalletVerification();

  // Validation
  const addressValidation = address.length > 0 ? validateWalletAddress(address, network) : { valid: false };

  // Countdown for nonce expiry
  useEffect(() => {
    if (!nonceExpiresAt) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((nonceExpiresAt.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      
      if (remaining === 0) {
        toast.error('Verification nonce expired. Please start over.');
        setStep('address');
        resetState();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nonceExpiresAt, resetState]);

  // Reset when network changes
  useEffect(() => {
    setAddress('');
    setSignature('');
    setStep('address');
    resetState();
  }, [network, resetState]);

  const handleProceedToSign = async () => {
    if (!addressValidation.valid || !addressValidation.formatted) return;
    
    const result = await generateNonce();
    if (result) {
      setStep('sign');
    }
  };

  const handleCopyMessage = useCallback(() => {
    if (!nonce || !addressValidation.formatted) return;
    const message = getMessage(addressValidation.formatted, nonce);
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard');
  }, [nonce, addressValidation.formatted, getMessage]);

  const handleVerify = async () => {
    if (!addressValidation.formatted || !signature) return;
    
    const result = await verifySignature(addressValidation.formatted, signature, network);
    if (result.success) {
      onVerified?.(addressValidation.formatted, network);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Network Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Network</Label>
        <div className="flex flex-wrap gap-2">
          {(['SOLANA', 'ETHEREUM', 'TRON'] as WalletNetwork[]).map((net) => (
            <Button
              key={net}
              type="button"
              variant={network === net ? 'default' : 'outline'}
              onClick={() => setNetwork(net)}
              disabled={step !== 'address' || isGeneratingNonce}
              className={cn(
                "flex-1 min-w-[100px]",
                network === net && (
                  net === 'SOLANA' ? "bg-purple-600 hover:bg-purple-700" :
                  net === 'TRON' ? "bg-red-600 hover:bg-red-700" :
                  "bg-blue-600 hover:bg-blue-700"
                )
              )}
            >
              <span className="mr-2">
                {net === 'SOLANA' ? '◎' : net === 'TRON' ? '◆' : 'Ξ'}
              </span>
              {net.charAt(0) + net.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <Alert className="bg-primary/5 border-primary/20">
        <Shield className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Secure Wallet Verification</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          Sign a message with your wallet to prove ownership. This ensures only you can receive payments to this address.
        </AlertDescription>
      </Alert>

      {/* Step 1: Enter Address */}
      {step === 'address' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <div className="relative">
              <Input
                id="wallet-address"
                placeholder={network === 'SOLANA' ? 'Enter Solana address...' : network === 'TRON' ? 'T...' : '0x...'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={cn(
                  "font-mono text-sm pr-10",
                  address.length > 0 && (
                    addressValidation.valid 
                      ? "border-green-500 focus-visible:ring-green-500" 
                      : "border-destructive focus-visible:ring-destructive"
                  )
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {address.length > 0 && (
                  addressValidation.valid 
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {address.length > 0 && !addressValidation.valid && addressValidation.error && (
              <p className="text-xs text-destructive">{addressValidation.error}</p>
            )}
          </div>

          <Button
            onClick={handleProceedToSign}
            disabled={!addressValidation.valid || isGeneratingNonce}
            className="w-full"
          >
            {isGeneratingNonce ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating verification...
              </>
            ) : (
              'Continue to Sign Message'
            )}
          </Button>

          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Step 2: Sign Message */}
      {step === 'sign' && nonce && addressValidation.formatted && (
        <div className="space-y-4">
          {/* Countdown Timer */}
          {countdown !== null && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              countdown < 60 ? "bg-destructive/10 text-destructive" : "bg-muted"
            )}>
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Sign within: {formatTime(countdown)}
              </span>
            </div>
          )}

          {/* Message to Sign */}
          <div className="space-y-2">
            <Label>Message to Sign</Label>
            <Card className="p-4 bg-muted/50">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {getMessage(addressValidation.formatted, nonce)}
              </pre>
            </Card>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMessage}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Message
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>How to sign</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the message above</li>
                <li>Open your {network.toLowerCase()} wallet (e.g., {
                  network === 'SOLANA' ? 'Phantom, Solflare' : 
                  network === 'TRON' ? 'TronLink' : 
                  'MetaMask, Rabby'
                })</li>
                <li>Sign the message using "Sign Message" feature</li>
                <li>Paste the signature below</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Signature Input */}
          <div className="space-y-2">
            <Label htmlFor="signature">Signature</Label>
            <Input
              id="signature"
              placeholder="Paste your signature here..."
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep('address');
                setSignature('');
                resetState();
              }}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!signature || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Signature
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
