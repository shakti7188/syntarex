import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Clock, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRPaymentProps {
  walletAddress: string;
  amount: number;
  expiresAt: string;
  chain: 'SOLANA' | 'ETHEREUM' | 'TRON';
  onPaymentSent: () => void;
}

export const QRPayment = ({ walletAddress, amount, expiresAt, chain, onPaymentSent }: QRPaymentProps) => {
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setCountdown("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Chain-specific configuration
  const chainConfig = {
    SOLANA: {
      name: 'Solana',
      token: 'USDT (SPL)',
      qrValue: `solana:${walletAddress}?amount=${amount}&spl-token=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`,
      explorerPrefix: 'https://solscan.io/tx/',
      warning: 'Send only USDT (SPL) on the Solana network. Other tokens will be lost.',
    },
    ETHEREUM: {
      name: 'Ethereum',
      token: 'USDT (ERC-20)',
      qrValue: walletAddress, // Ethereum doesn't have a standard payment URI for ERC-20
      explorerPrefix: 'https://etherscan.io/tx/',
      warning: 'Send only USDT (ERC-20) on the Ethereum network. Other tokens will be lost.',
    },
    TRON: {
      name: 'Tron',
      token: 'USDT (TRC-20)',
      qrValue: walletAddress, // Tron doesn't have a standard payment URI for TRC-20
      explorerPrefix: 'https://tronscan.org/#/transaction/',
      warning: 'Send only USDT (TRC-20) on the Tron network. Other tokens will be lost.',
    },
  };

  const config = chainConfig[chain];

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied('address');
    toast({ title: "Address copied!" });
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopied('amount');
    toast({ title: "Amount copied!" });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex flex-col items-center p-4 bg-white rounded-lg">
        <QRCodeSVG 
          value={config.qrValue} 
          size={180}
          level="H"
          includeMargin
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Scan with any {config.name} wallet app
        </p>
      </div>

      {/* Instructions */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-amber-500" />
        <span className="text-muted-foreground">Time remaining:</span>
        <span className={`font-mono font-bold ${countdown === "Expired" ? "text-destructive" : "text-foreground"}`}>
          {countdown}
        </span>
      </div>

      {/* Payment Details */}
      <div className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount ({config.token})</span>
            <Button variant="ghost" size="sm" onClick={copyAmount} className="h-8">
              {copied === 'amount' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="font-mono font-bold text-lg">{amount.toFixed(2)} USDT</p>
          <p className="text-xs text-amber-600 mt-1">
            Send exactly this amount (includes unique identifier)
          </p>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Send to Wallet ({config.name})</span>
            <Button variant="ghost" size="sm" onClick={copyAddress} className="h-8">
              {copied === 'address' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="font-mono text-sm break-all">{walletAddress}</p>
        </div>
      </div>

      {/* Network Warning */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          {config.warning}
        </AlertDescription>
      </Alert>

      <Button onClick={onPaymentSent} className="w-full" size="lg">
        I've Sent the Payment
      </Button>
    </div>
  );
};