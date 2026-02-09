import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePackageDetails, PLUG_IN_DATE, getTimeUntilPlugIn } from "@/hooks/usePackageDetails";
import { 
  Cpu, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Timer,
  Coins,
  TrendingUp,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PackageDetailModalProps {
  purchaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PackageDetailModal = ({ purchaseId, open, onOpenChange }: PackageDetailModalProps) => {
  const { data: details, isLoading } = usePackageDetails(purchaseId);
  const [countdown, setCountdown] = useState(getTimeUntilPlugIn());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setCountdown(getTimeUntilPlugIn());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [open]);

  const copyTxHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success("Transaction hash copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    if (chain === 'SOLANA') {
      return `https://solscan.io/tx/${txHash}`;
    }
    if (chain === 'TRON') {
      return `https://tronscan.org/#/transaction/${txHash}`;
    }
    return `https://etherscan.io/tx/${txHash}`;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) return null;

  const { purchase, paymentOrder, earnings } = details;
  const pkg = purchase.package;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto overflow-x-hidden box-border">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <span className="truncate">{pkg?.name || 'Mining Package'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 w-full overflow-hidden">
          {/* Package Overview */}
          <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border w-full overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="mb-2 text-xs">{pkg?.tier || 'Standard'}</Badge>
                <p className="text-xl sm:text-2xl font-bold">{pkg?.hashrate_ths || 0} TH/s</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Hashrate Allocated</p>
              </div>
              <Badge 
                variant={purchase.status?.toLowerCase() === 'completed' ? 'default' : 'secondary'}
                className={`text-xs flex-shrink-0 ${purchase.status?.toLowerCase() === 'completed' ? 'bg-accent text-accent-foreground' : ''}`}
              >
                {purchase.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-xs sm:text-sm text-muted-foreground">XFLOW Tokens</span>
                <p className="font-semibold">{pkg?.xflow_tokens?.toLocaleString() || 0}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-muted-foreground">Investment</span>
                <p className="font-semibold text-primary">${purchase.total_price.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Mining Status & Countdown */}
          <div className="p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Mining Status</h4>
            </div>

            {countdown.isLive ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-2">
                  <Zap className="w-4 h-4 animate-pulse" />
                  <span className="font-semibold">LIVE - Mining Active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your hashrate is actively mining Bitcoin
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning mb-4">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Scheduled</span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-secondary/50 text-center min-w-0">
                    <p className="text-lg sm:text-2xl font-bold truncate">{countdown.days}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Days</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-secondary/50 text-center min-w-0">
                    <p className="text-lg sm:text-2xl font-bold truncate">{countdown.hours}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Hours</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-secondary/50 text-center min-w-0">
                    <p className="text-lg sm:text-2xl font-bold truncate">{countdown.minutes}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Mins</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Plug-in Date: {format(PLUG_IN_DATE, 'MMMM d, yyyy')}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, 100 - (countdown.days / 365) * 100))}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Progress to activation</p>
                </div>
              </div>
            )}
          </div>

          {/* Earnings Section */}
          <div className="p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Earnings</h4>
            </div>

            {countdown.isLive && earnings.total_btc > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <p className="text-lg font-bold">{earnings.total_btc.toFixed(8)} BTC</p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-lg font-bold">${earnings.total_usd.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">USD Value</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-secondary/20 rounded-lg">
                <Coins className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-semibold">$0.00</p>
                <p className="text-sm text-muted-foreground">
                  {countdown.isLive 
                    ? "No earnings recorded yet" 
                    : "Earnings begin after plug-in date"}
                </p>
              </div>
            )}
          </div>

          {/* Transaction History */}
          {paymentOrder && (
            <div className="p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <h4 className="font-semibold">Transaction Details</h4>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <Badge variant="outline">{paymentOrder.chain}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{paymentOrder.currency}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    ${paymentOrder.amount_received?.toLocaleString() || paymentOrder.amount_expected.toLocaleString()}
                  </span>
                </div>

                {paymentOrder.confirmed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Confirmed</span>
                    <span className="font-medium">
                      {format(new Date(paymentOrder.confirmed_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                )}

                {paymentOrder.tx_hash && (
                  <div className="pt-3 border-t border-border overflow-hidden">
                    <span className="text-muted-foreground text-xs">Transaction Hash</span>
                    <div className="flex items-center gap-1 mt-1 w-full">
                      <code className="flex-1 min-w-0 text-xs bg-secondary/50 px-2 py-1 rounded truncate">
                        {paymentOrder.tx_hash}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => copyTxHash(paymentOrder.tx_hash!)}
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0"
                        asChild
                      >
                        <a 
                          href={getExplorerUrl(paymentOrder.chain, paymentOrder.tx_hash)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase Date */}
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>Purchased</span>
            <span>{format(new Date(purchase.created_at), 'MMMM d, yyyy')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
