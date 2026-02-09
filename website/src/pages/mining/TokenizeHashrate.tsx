import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHashrateAllocations } from "@/hooks/useHashrateAllocations";
import { useTokenizeHashrate } from "@/hooks/useTokenizeHashrate";
import { useRedeemTokens } from "@/hooks/useRedeemTokens";
import { Info, ArrowRight, Coins, Activity, Zap, TrendingUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SuccessDialog } from "@/components/ui/success-dialog";

const THS_PER_TOKEN = 0.001; // 1 token = 0.001 TH/s
const TOKEN_SYMBOL = "WATT";

export default function TokenizeHashrate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: allocations, isLoading } = useHashrateAllocations();
  const tokenize = useTokenizeHashrate();
  const redeem = useRedeemTokens();
  
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>("");
  const [amountThs, setAmountThs] = useState("");

  // Prefill from URL params if available
  useEffect(() => {
    const allocationId = searchParams.get('allocationId');
    const prefillThs = searchParams.get('ths');
    
    if (allocationId) {
      setSelectedAllocationId(allocationId);
    }
    
    if (prefillThs) {
      setAmountThs(prefillThs);
    }
  }, [searchParams]);

  const selectedAllocation = useMemo(() => {
    if (!selectedAllocationId || !allocations) return null;
    return allocations.find(a => a.id === selectedAllocationId);
  }, [selectedAllocationId, allocations]);

  const stats = useMemo(() => {
    if (!allocations) return { total: 0, tokenized: 0, available: 0 };
    
    return {
      total: allocations.reduce((sum, a) => sum + a.totalThs, 0),
      tokenized: allocations.reduce((sum, a) => sum + a.tokenizedThs, 0),
      available: allocations.reduce((sum, a) => sum + a.untokenizedThs, 0),
    };
  }, [allocations]);

  const tokensToMint = useMemo(() => {
    const ths = parseFloat(amountThs || '0');
    if (isNaN(ths) || ths <= 0) return 0;
    return ths / THS_PER_TOKEN;
  }, [amountThs]);

  const canRedeem = useMemo(() => {
    return selectedAllocation && selectedAllocation.tokenizedThs > 0;
  }, [selectedAllocation]);

  const handleTokenize = () => {
    const ths = parseFloat(amountThs);
    if (isNaN(ths) || ths <= 0 || !selectedAllocationId) {
      return;
    }

    if (selectedAllocation && ths > selectedAllocation.untokenizedThs) {
      return;
    }

    tokenize.mutate({
      allocationId: selectedAllocationId,
      amountThs: ths,
      tokenSymbol: TOKEN_SYMBOL,
    });

    // Reset form after successful tokenization
    setAmountThs("");
    setSelectedAllocationId("");
  };

  const handleRedeem = () => {
    if (!selectedAllocation || !canRedeem) return;

    // Calculate max tokens that can be redeemed
    const maxTokens = selectedAllocation.tokenizedThs / THS_PER_TOKEN;
    const tokensToRedeem = tokensToMint > 0 && tokensToMint <= maxTokens 
      ? tokensToMint 
      : maxTokens;

    redeem.mutate({
      allocationId: selectedAllocationId,
      tokenAmount: tokensToRedeem,
      tokenSymbol: TOKEN_SYMBOL,
    });

    // Reset form
    setAmountThs("");
  };

  const isValid = useMemo(() => {
    const ths = parseFloat(amountThs);
    return (
      !isNaN(ths) && 
      ths > 0 && 
      selectedAllocationId && 
      selectedAllocation && 
      ths <= selectedAllocation.untokenizedThs
    );
  }, [amountThs, selectedAllocationId, selectedAllocation]);

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('tokenize.title')}</h1>
            <p className="text-muted-foreground">
              {t('tokenize.subtitle', { symbol: TOKEN_SYMBOL })}
            </p>
          </div>

          {isLoading ? (
            <>
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {t('tokenize.totalHashrate')}
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.total.toFixed(3)} TH/s
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      {t('tokenize.tokenized')}
                    </CardDescription>
                    <CardTitle className="text-3xl text-primary">
                      {stats.tokenized.toFixed(3)} TH/s
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {t('tokenize.available')}
                    </CardDescription>
                    <CardTitle className="text-3xl text-green-600">
                      {stats.available.toFixed(3)} TH/s
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('tokenize.cardTitle')}</CardTitle>
                  <CardDescription>
                    {t('tokenize.cardDesc', { symbol: TOKEN_SYMBOL })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {t('tokenize.infoAlert', { symbol: TOKEN_SYMBOL, rate: THS_PER_TOKEN })}
                    </AlertDescription>
                  </Alert>

                  {allocations && allocations.length === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {t('tokenize.noAllocations')} <a href="/mining/my-machines" className="underline">{t('tokenize.noAllocationsLink')}</a> {t('tokenize.noAllocationsEnd')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('tokenize.selectAllocation')}
                      </label>
                      <Select value={selectedAllocationId} onValueChange={setSelectedAllocationId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('tokenize.chooseAllocation')} />
                        </SelectTrigger>
                        <SelectContent>
                          {allocations?.map((allocation) => (
                            <SelectItem key={allocation.id} value={allocation.id}>
                              {t('tokenize.allocationId', { 
                                id: allocation.id.substring(0, 8), 
                                available: allocation.untokenizedThs.toFixed(3) 
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAllocation && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('tokenize.selectedInfo', { 
                            total: selectedAllocation.totalThs.toFixed(3), 
                            available: selectedAllocation.untokenizedThs.toFixed(3) 
                          })}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('tokenize.hashrateAmount')}
                      </label>
                      <Input
                        type="number"
                        placeholder={t('tokenize.enterAmount')}
                        className="w-full"
                        value={amountThs}
                        onChange={(e) => setAmountThs(e.target.value)}
                        min="0"
                        step="0.001"
                        max={selectedAllocation?.untokenizedThs}
                        disabled={!selectedAllocationId}
                      />
                      {selectedAllocation && selectedAllocation.untokenizedThs > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('tokenize.maximum', { max: selectedAllocation.untokenizedThs.toFixed(3) })}
                        </p>
                      )}
                      {selectedAllocation && selectedAllocation.untokenizedThs === 0 && (
                        <p className="text-sm text-destructive mt-1">
                          {t('tokenize.noHashrateAvailable')}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{t('tokenize.youWillReceive')}</span>
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="text-xl font-bold">
                            {tokensToMint.toLocaleString(undefined, { maximumFractionDigits: 2 })} {TOKEN_SYMBOL}
                          </span>
                        </div>
                      </div>
                      {tokensToMint > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t('tokenize.rate', { tokens: tokensToMint.toFixed(2), ths: amountThs })}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1" 
                        size="lg"
                        onClick={handleTokenize}
                        disabled={!isValid || tokenize.isPending || redeem.isPending}
                      >
                        {tokenize.isPending ? t('tokenize.processing') : t('tokenize.tokenizeButton')}
                        {!tokenize.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1" 
                        size="lg"
                        onClick={handleRedeem}
                        disabled={!canRedeem || tokenize.isPending || redeem.isPending}
                        title={!canRedeem ? "No tokenized hashrate available to redeem" : "Convert tokens back to hashrate"}
                      >
                        {redeem.isPending ? t('tokenize.processing') : t('tokenize.redeemButton')}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">{t('tokenize.benefitsTitle')}</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                        <span>{t('tokenize.benefit1')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Coins className="h-4 w-4 text-primary mt-0.5" />
                        <span>{t('tokenize.benefit2')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                        <span>{t('tokenize.benefit3')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-primary mt-0.5" />
                        <span>{t('tokenize.benefit4')}</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <SuccessDialog
        open={!!tokenize.successData}
        onOpenChange={() => tokenize.clearSuccess()}
        title="Tokenization Successful!"
        description="Your hashrate has been successfully tokenized."
        details={tokenize.successData ? [
          { label: "Hashrate Tokenized", value: `${tokenize.successData.tokenization.amount_ths.toFixed(3)} TH/s` },
          { label: "Tokens Minted", value: tokenize.successData.tokenization.tokens_minted.toLocaleString() },
          { label: "Token Symbol", value: tokenize.successData.tokenization.token_symbol },
        ] : []}
        onConfirm={() => {
          tokenize.clearSuccess();
          navigate('/mining/history');
        }}
        confirmText="View History"
      />

      <SuccessDialog
        open={!!redeem.successData}
        onOpenChange={() => redeem.clearSuccess()}
        title="Redemption Successful!"
        description="Your tokens have been redeemed and hashrate restored."
        details={redeem.successData ? [
          { label: "Hashrate Restored", value: `${redeem.successData.redemption.hashrateRestored.toFixed(3)} TH/s` },
          { label: "Tokens Burned", value: redeem.successData.redemption.tokensBurned.toLocaleString() },
        ] : []}
      />
    </>
  );
}
