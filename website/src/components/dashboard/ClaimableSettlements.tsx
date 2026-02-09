import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { useClaimableSettlements } from "@/hooks/useClaimableSettlements";
import { useClaimSettlementOnChain } from "@/hooks/useClaimSettlementOnChain";
import { useTranslation } from "react-i18next";

export const ClaimableSettlements = () => {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useClaimableSettlements();
  const { claimSettlement, isClaimingOnChain } = useClaimSettlementOnChain();

  const walletAddress = data?.walletAddress;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!data?.claimable || data.claimable.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          <p>{t('settlements.noUnclaimed')}</p>
        </div>
      </Card>
    );
  }

  const handleClaim = async (settlement: any) => {
    if (!walletAddress) return;
    
    claimSettlement({
      settlementId: settlement.id || `${settlement.weekStart}`,
      walletAddress,
      merkleProof: settlement.merkleProof,
    });
    
    // Refetch after a delay to allow backend to update
    setTimeout(() => refetch(), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('settlements.unclaimedSettlements')}</h3>
        {walletAddress && (
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-lg">
            <Wallet className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
        )}
      </div>

      {data.claimable.map((settlement, i) => (
        <Card key={i} className="p-6 bg-gradient-to-br from-card to-secondary border-border hover:border-accent/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">
                {t('settlements.weekOf')} {new Date(settlement.weekStartDate).toLocaleDateString()}
              </h4>
              <p className="text-sm text-muted-foreground">
                {settlement.weekStartDate} to {settlement.weekEndDate}
              </p>
            </div>
            <div className="text-right">
              <Badge 
                variant={settlement.status === 'claimed' ? 'secondary' : 'default'}
                className={settlement.status === 'claimed' ? '' : 'bg-accent'}
              >
                {settlement.status === 'claimed' ? t('settlements.claimed') : t('settlements.readyToClaim')}
              </Badge>
              <p className="text-2xl font-bold text-accent mt-1">
                ${settlement.amount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>{t('settlements.merkleRoot')}: {settlement.merkleRoot.slice(0, 10)}...{settlement.merkleRoot.slice(-8)}</span>
          </div>

          {settlement.status !== 'claimed' && (
            <Button 
              onClick={() => handleClaim(settlement)}
              disabled={isClaimingOnChain || !walletAddress}
              className="w-full bg-gradient-to-r from-accent to-accent-glow hover:opacity-90"
            >
              {isClaimingOnChain ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settlements.claiming')}
                </>
              ) : !walletAddress ? (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  {t('settlements.linkWalletFirst') || 'Link wallet first'}
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  {t('settlements.claimViaWallet')}
                </>
              )}
            </Button>
          )}

          {settlement.txHash && (
            <p className="text-xs text-muted-foreground mt-2">
              TX: {settlement.txHash.slice(0, 10)}...{settlement.txHash.slice(-8)}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
};
