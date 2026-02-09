import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  ExternalLink, 
  Copy, 
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Wallet,
  Zap,
  Calendar,
  Hash,
  Shield,
  Link2
} from "lucide-react";
import { PurchaseNFT } from "@/hooks/useUserNFTs";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface NFTDetailModalProps {
  nft: PurchaseNFT | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig = {
  PENDING: { 
    label: 'Preparing', 
    color: 'bg-muted text-muted-foreground', 
    icon: Clock
  },
  QUEUED: { 
    label: 'Queued for Minting', 
    color: 'bg-primary/20 text-primary', 
    icon: Clock
  },
  MINTING: { 
    label: 'Minting in Progress', 
    color: 'bg-amber-500/20 text-amber-600', 
    icon: Loader2
  },
  MINTED: { 
    label: 'Successfully Minted', 
    color: 'bg-green-500/20 text-green-600', 
    icon: CheckCircle2
  },
  FAILED: { 
    label: 'Minting Failed', 
    color: 'bg-destructive/20 text-destructive', 
    icon: AlertCircle
  },
  WALLET_REQUIRED: { 
    label: 'Wallet Verification Required', 
    color: 'bg-warning/20 text-warning', 
    icon: Wallet
  },
};

export const NFTDetailModal = ({ nft, open, onClose }: NFTDetailModalProps) => {
  if (!nft) return null;

  const pkg = nft.purchase?.package;
  const status = statusConfig[nft.mint_status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const explorerUrl = nft.chain === 'POLYGON' 
    ? `https://polygonscan.com/tx/${nft.tx_hash}`
    : `https://etherscan.io/tx/${nft.tx_hash}`;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            NFT Certificate Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Preview */}
          <motion.div 
            className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border border-primary/20 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Award className="h-16 w-16 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-1">{pkg?.name || 'Mining Package'}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Certificate #{nft.certificate_number}
              </p>
              <Badge className={status.color}>
                <StatusIcon className={`h-3 w-3 mr-1 ${nft.mint_status === 'MINTING' ? 'animate-spin' : ''}`} />
                {status.label}
              </Badge>
            </div>
            {/* Decorative corners */}
            <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
          </motion.div>

          {/* Package Details */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Package Details
            </h4>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Tier</p>
                <p className="font-medium">{pkg?.tier || 'STANDARD'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hashrate</p>
                <p className="font-medium">{pkg?.hashrate_ths || 0} TH/s</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XFLOW Tokens</p>
                <p className="font-medium">{pkg?.xflow_tokens?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price Paid</p>
                <p className="font-medium">${nft.purchase?.total_price?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Certificate Info */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Certificate Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Certificate #</span>
                </div>
                <span className="font-mono font-medium">{nft.certificate_number}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Issued</span>
                </div>
                <span className="font-medium">
                  {format(new Date(nft.created_at), 'MMM d, yyyy HH:mm')}
                </span>
              </div>

              {nft.is_soulbound && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    <span className="text-sm">Soulbound</span>
                  </div>
                  <Badge variant="outline" className="text-accent border-accent">
                    Non-Transferable
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Blockchain Info (if minted) */}
          {nft.mint_status === 'MINTED' && nft.tx_hash && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  Blockchain Verification
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Chain</span>
                    <Badge variant="outline">{nft.chain}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Token ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{nft.token_id}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(nft.token_id!, 'Token ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Transaction Hash</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(nft.tx_hash!, 'Transaction hash')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-xs break-all text-muted-foreground">
                      {nft.tx_hash}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {nft.mint_status === 'MINTED' && nft.tx_hash && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(explorerUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on {nft.chain === 'POLYGON' ? 'Polygonscan' : 'Explorer'}
              </Button>
            )}
            
            {nft.mint_status === 'WALLET_REQUIRED' && (
              <Button 
                className="flex-1"
                onClick={() => {
                  onClose();
                  window.location.href = '/settings?tab=wallet';
                }}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Verify Wallet to Mint
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
