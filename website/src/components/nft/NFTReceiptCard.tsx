import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Wallet,
  Zap
} from "lucide-react";
import { PurchaseNFT } from "@/hooks/useUserNFTs";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface NFTReceiptCardProps {
  nft: PurchaseNFT;
  onClick?: () => void;
  compact?: boolean;
}

const statusConfig = {
  PENDING: { 
    label: 'Preparing', 
    color: 'bg-muted text-muted-foreground', 
    icon: Clock,
    description: 'Your NFT receipt is being prepared'
  },
  QUEUED: { 
    label: 'Queued', 
    color: 'bg-primary/20 text-primary', 
    icon: Clock,
    description: 'Queued for minting'
  },
  MINTING: { 
    label: 'Minting...', 
    color: 'bg-amber-500/20 text-amber-600', 
    icon: Loader2,
    description: 'Your NFT is being minted on-chain'
  },
  MINTED: { 
    label: 'Minted', 
    color: 'bg-green-500/20 text-green-600', 
    icon: CheckCircle2,
    description: 'Successfully minted on blockchain'
  },
  FAILED: { 
    label: 'Failed', 
    color: 'bg-destructive/20 text-destructive', 
    icon: AlertCircle,
    description: 'Minting failed - will retry'
  },
  WALLET_REQUIRED: { 
    label: 'Wallet Required', 
    color: 'bg-warning/20 text-warning', 
    icon: Wallet,
    description: 'Verify your wallet to receive NFT'
  },
};

export const NFTReceiptCard = ({ nft, onClick, compact = false }: NFTReceiptCardProps) => {
  const pkg = nft.purchase?.package;
  const status = statusConfig[nft.mint_status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  if (compact) {
    return (
      <Card 
        className="cursor-pointer hover:border-primary/50 transition-colors"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{pkg?.name || 'Mining Package'}</p>
                <p className="text-xs text-muted-foreground">#{nft.certificate_number}</p>
              </div>
            </div>
            <Badge className={status.color}>
              <StatusIcon className={`h-3 w-3 mr-1 ${nft.mint_status === 'MINTING' ? 'animate-spin' : ''}`} />
              {status.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
        onClick={onClick}
      >
        {/* Certificate Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">{pkg?.name || 'Mining Package'}</p>
                <p className="text-sm text-muted-foreground">
                  Certificate #{nft.certificate_number}
                </p>
              </div>
            </div>
            <Badge className={status.color}>
              <StatusIcon className={`h-3 w-3 mr-1 ${nft.mint_status === 'MINTING' ? 'animate-spin' : ''}`} />
              {status.label}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Package Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Hashrate</p>
              <p className="font-semibold flex items-center gap-1">
                <Zap className="h-4 w-4 text-amber-500" />
                {pkg?.hashrate_ths || 0} TH/s
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">XFLOW Tokens</p>
              <p className="font-semibold">{pkg?.xflow_tokens?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price Paid</p>
              <p className="font-semibold">
                ${nft.purchase?.total_price?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="font-semibold text-sm">
                {format(new Date(nft.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Status Message */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">{status.description}</p>
          </div>

          {/* Blockchain Info (if minted) */}
          {nft.mint_status === 'MINTED' && nft.tx_hash && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Token ID</p>
                <p className="font-mono text-sm">{nft.token_id}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://polygonscan.com/tx/${nft.tx_hash}`, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View on Chain
              </Button>
            </div>
          )}

          {/* Wallet Required Action */}
          {nft.mint_status === 'WALLET_REQUIRED' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to wallet settings
                window.location.href = '/settings?tab=wallet';
              }}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect & Verify Wallet
            </Button>
          )}

          {/* Soulbound Badge */}
          {nft.is_soulbound && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-accent" />
              Soulbound NFT - Non-transferable
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
