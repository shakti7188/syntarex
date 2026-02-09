import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validateWalletAddress, WalletNetwork } from "@/lib/validation-schemas";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualWalletEntryProps {
  onSubmit: (address: string, network: WalletNetwork) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  showCancel?: boolean;
}

export const ManualWalletEntry = ({ 
  onSubmit, 
  onCancel,
  isSubmitting = false,
  showCancel = false
}: ManualWalletEntryProps) => {
  const [network, setNetwork] = useState<WalletNetwork>('SOLANA');
  const [address, setAddress] = useState("");
  const [confirmAddress, setConfirmAddress] = useState("");
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Validation states
  const [addressValidation, setAddressValidation] = useState<{
    valid: boolean;
    error?: string;
    formatted?: string;
  }>({ valid: false });

  // Reset form when network changes
  useEffect(() => {
    setAddress("");
    setConfirmAddress("");
    setAddressValidation({ valid: false });
    setConfirmed(false);
  }, [network]);

  // Validate primary address on change
  useEffect(() => {
    if (address.length > 0) {
      const result = validateWalletAddress(address, network);
      setAddressValidation(result);
    } else {
      setAddressValidation({ valid: false });
    }
  }, [address, network]);

  // Check if addresses match
  const addressesMatch = address.length > 0 && 
    confirmAddress.length > 0 && 
    address.toLowerCase() === confirmAddress.toLowerCase();

  // Check if form is complete
  const isFormValid = addressValidation.valid && addressesMatch && confirmed;

  // Handle countdown and submission
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && addressValidation.formatted) {
      onSubmit(addressValidation.formatted, network);
    }
  }, [countdown, addressValidation.formatted, onSubmit, network]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    setCountdown(3);
  };

  const cancelCountdown = () => {
    setCountdown(null);
  };

  const formatAddressPreview = (addr: string) => {
    if (showFullAddress || addr.length < 10) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  return (
    <div className="space-y-4">
      {/* Network Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Network</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={network === 'SOLANA' ? 'default' : 'outline'}
            onClick={() => setNetwork('SOLANA')}
            disabled={countdown !== null || isSubmitting}
            className={cn(
              "flex-1 min-w-[100px]",
              network === 'SOLANA' && "bg-purple-600 hover:bg-purple-700"
            )}
          >
            <span className="mr-2">◎</span>
            Solana
          </Button>
          <Button
            type="button"
            variant={network === 'ETHEREUM' ? 'default' : 'outline'}
            onClick={() => setNetwork('ETHEREUM')}
            disabled={countdown !== null || isSubmitting}
            className={cn(
              "flex-1 min-w-[100px]",
              network === 'ETHEREUM' && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            <span className="mr-2">Ξ</span>
            Ethereum
          </Button>
          <Button
            type="button"
            variant={network === 'TRON' ? 'default' : 'outline'}
            onClick={() => setNetwork('TRON')}
            disabled={countdown !== null || isSubmitting}
            className={cn(
              "flex-1 min-w-[100px]",
              network === 'TRON' && "bg-red-600 hover:bg-red-700"
            )}
          >
            <span className="mr-2">◆</span>
            Tron
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Warning</AlertTitle>
        <AlertDescription className="text-sm">
          Manually entered addresses cannot be verified for ownership. 
          <strong> If you enter the wrong address, any funds sent there will be permanently lost.</strong>
        </AlertDescription>
      </Alert>

      {/* Primary Address Input */}
      <div className="space-y-2">
        <Label htmlFor="wallet-address" className="text-sm font-medium">
          {network === 'SOLANA' ? 'Solana' : network === 'TRON' ? 'Tron' : 'Ethereum'} Wallet Address
        </Label>
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
            disabled={countdown !== null || isSubmitting}
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
        {addressValidation.valid && addressValidation.formatted && (
          <p className="text-xs text-green-600">
            ✓ Valid {network === 'SOLANA' ? 'Solana' : network === 'TRON' ? 'Tron' : 'Ethereum'} address
          </p>
        )}
      </div>

      {/* Confirm Address Input */}
      <div className="space-y-2">
        <Label htmlFor="confirm-wallet-address" className="text-sm font-medium">
          Confirm Wallet Address
        </Label>
        <div className="relative">
          <Input
            id="confirm-wallet-address"
            placeholder="Enter address again to confirm"
            value={confirmAddress}
            onChange={(e) => setConfirmAddress(e.target.value)}
            className={cn(
              "font-mono text-sm pr-10",
              confirmAddress.length > 0 && (
                addressesMatch 
                  ? "border-green-500 focus-visible:ring-green-500" 
                  : "border-destructive focus-visible:ring-destructive"
              )
            )}
            disabled={countdown !== null || isSubmitting}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {confirmAddress.length > 0 && (
              addressesMatch 
                ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                : <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {confirmAddress.length > 0 && !addressesMatch && (
          <p className="text-xs text-destructive">Addresses do not match</p>
        )}
      </div>

      {/* Address Preview */}
      {addressValidation.valid && addressValidation.formatted && (
        <div className="p-3 bg-muted rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Address Preview
              </span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                network === 'SOLANA' 
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  : network === 'TRON'
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              )}>
                {network}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setShowFullAddress(!showFullAddress)}
            >
              {showFullAddress ? (
                <EyeOff className="h-3 w-3 mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              {showFullAddress ? "Hide" : "Show full"}
            </Button>
          </div>
          <p className="font-mono text-sm break-all">
            {showFullAddress 
              ? addressValidation.formatted 
              : formatAddressPreview(addressValidation.formatted)
            }
          </p>
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <Checkbox
          id="confirm-ownership"
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked as boolean)}
          disabled={countdown !== null || isSubmitting}
          className="mt-0.5"
        />
        <Label 
          htmlFor="confirm-ownership" 
          className="text-sm leading-relaxed cursor-pointer"
        >
          I confirm this is <strong>my {network === 'SOLANA' ? 'Solana' : network === 'TRON' ? 'Tron' : 'Ethereum'} wallet address</strong> and I understand that 
          funds sent to an incorrect address <strong>cannot be recovered</strong>.
        </Label>
      </div>

      {/* Countdown Display */}
      {countdown !== null && (
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
          <p className="text-sm font-medium mb-2">
            Saving wallet in {countdown} seconds...
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={cancelCountdown}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className={cn("flex gap-3 pt-2", !showCancel && "flex-col")}>
        {showCancel && onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={countdown !== null || isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || countdown !== null || isSubmitting}
          className={cn(
            "flex-1",
            network === 'SOLANA' ? "bg-purple-600 hover:bg-purple-700" : 
            network === 'TRON' ? "bg-red-600 hover:bg-red-700" : 
            "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : countdown !== null ? (
            `Saving in ${countdown}...`
          ) : (
            "Save Wallet Address"
          )}
        </Button>
      </div>
    </div>
  );
};