import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { TokenBalanceDisplay } from "@/components/payment/TokenBalanceDisplay";
import {
  Wallet,
  TrendingUp,
  Info,
  ExternalLink,
  AlertTriangle,
  Percent,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TokenInfo() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: xflowInfo, isLoading } = useTokenInfo("XFLOW");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: t("common.copied"),
      description: t("token.contractCopied"),
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!xflowInfo) {
    return (
      <div className="container mx-auto p-6">
        <p>Token information not available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{t("token.title")}</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Token Overview */}
          <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-card to-secondary border-2 border-accent">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{xflowInfo.token_name}</h2>
                  <p className="text-muted-foreground">{xflowInfo.token_symbol}</p>
                  <Badge variant="outline" className="mt-2">
                    {xflowInfo.blockchain}
                  </Badge>
                </div>
              </div>
              {xflowInfo.payment_discount_percent > 0 && (
                <Badge variant="default" className="text-lg px-4 py-2">
                  <Percent className="w-4 h-4 mr-1" />
                  {xflowInfo.payment_discount_percent}% {t("token.discount")}
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground mb-6">{xflowInfo.description}</p>

            {/* Contract Address */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
              <p className="text-sm font-semibold mb-2">{t("token.contractAddress")}</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono break-all">{xflowInfo.contract_address}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(xflowInfo.contract_address)}
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                {t("token.benefits")}
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
                  <Percent className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{t("token.paymentDiscount")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("token.paymentDiscountDesc", {
                        percent: xflowInfo.payment_discount_percent,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{t("token.lotteryAccess")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("token.lotteryAccessDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <TrendingUp className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{t("token.nftBenefits")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("token.nftBenefitsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Disclaimer */}
            <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-warning mb-1">{t("token.disclaimer")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("token.disclaimerText")}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <TokenBalanceDisplay />

            {/* Token Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                {t("token.tokenStats")}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("token.decimals")}</span>
                  <span className="font-semibold">{xflowInfo.decimals}</span>
                </div>
                {xflowInfo.current_price_usd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("token.currentPrice")}</span>
                    <span className="font-semibold">
                      ${xflowInfo.current_price_usd.toFixed(4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("token.blockchain")}</span>
                  <span className="font-semibold">{xflowInfo.blockchain}</span>
                </div>
              </div>
            </Card>

            {/* How to Acquire */}
            <Card className="p-6 bg-gradient-to-br from-card to-secondary">
              <h3 className="text-lg font-semibold mb-4">{t("token.howToAcquire")}</h3>
              <div className="space-y-2 text-sm">
                <p>• {t("token.acquireMethod1")}</p>
                <p>• {t("token.acquireMethod2")}</p>
                <p>• {t("token.acquireMethod3")}</p>
              </div>
              {xflowInfo.website_url && (
                <Button variant="outline" className="w-full mt-4" asChild>
                  <a href={xflowInfo.website_url} target="_blank" rel="noopener noreferrer">
                    {t("token.learnMore")}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
  );
}
