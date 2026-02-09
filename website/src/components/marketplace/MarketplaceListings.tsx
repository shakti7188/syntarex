import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, TrendingUp } from "lucide-react";
import { useMarketplaceListings } from "@/hooks/useMarketplace";
import { useBuyHashrate } from "@/hooks/useBuyHashrate";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { HashrateListin } from "@/hooks/useMarketplace";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { useNavigate } from "react-router-dom";

export const MarketplaceListings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: listings, isLoading } = useMarketplaceListings();
  const buyMutation = useBuyHashrate();
  const [selectedListing, setSelectedListing] = useState<HashrateListin | null>(null);
  const [buyAmount, setBuyAmount] = useState(0);

  const handleBuyClick = (listing: HashrateListin) => {
    setSelectedListing(listing);
    setBuyAmount(Number(listing.amount_ths));
  };

  const handleConfirmBuy = async () => {
    if (!selectedListing) return;
    
    await buyMutation.mutateAsync({
      listingId: selectedListing.id,
      amountThs: buyAmount,
    });
    setSelectedListing(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('marketplace.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner size="lg" text={t('common.loading')} />
        </CardContent>
      </Card>
    );
  }

  const totalVolume = listings?.reduce((sum, l) => sum + Number(l.amount_ths), 0) || 0;
  const avgPrice = listings?.length ? listings.reduce((sum, l) => sum + Number(l.price_per_ths), 0) / listings.length : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('marketplace.title')}
            </CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="text-right">
                <p className="text-muted-foreground">{t('marketplace.availableHashrate')}</p>
                <p className="text-lg font-semibold">{totalVolume.toFixed(2)} TH/s</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">{t('marketplace.avgPrice')}</p>
                <p className="text-lg font-semibold">${avgPrice.toFixed(2)}/TH</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('marketplace.seller')}</TableHead>
                  <TableHead>{t('marketplace.amount')}</TableHead>
                  <TableHead>{t('marketplace.pricePerThs')}</TableHead>
                  <TableHead>{t('marketplace.totalPrice')}</TableHead>
                  <TableHead>{t('marketplace.listed')}</TableHead>
                  <TableHead className="text-right">{t('marketplace.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!listings || listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        icon={ShoppingCart}
                        title={t('marketplace.noListings')}
                        description={t('marketplace.noListingsDesc')}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="font-medium">{listing.seller?.full_name || 'Anonymous'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{Number(listing.amount_ths).toFixed(4)}</span>
                          <span className="text-xs text-muted-foreground">TH/s</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${Number(listing.price_per_ths).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-primary">${Number(listing.total_price).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(listing.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleBuyClick(listing)}
                        >
                          <ShoppingCart className="mr-1 h-3 w-3" />
                          {t('marketplace.buy')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('marketplace.buyHashrate')}</DialogTitle>
            <DialogDescription>
              {t('marketplace.confirmPurchase')}
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('marketplace.amount')}</Label>
                <Input
                  type="number"
                  min={0.0001}
                  max={Number(selectedListing.amount_ths)}
                  step={0.0001}
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  {t('marketplace.available')}: {Number(selectedListing.amount_ths).toFixed(4)} TH/s
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('marketplace.pricePerThs')}</span>
                  <span className="font-medium">${Number(selectedListing.price_per_ths).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('marketplace.amount')}</span>
                  <span className="font-medium">{buyAmount.toFixed(4)} TH/s</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold">{t('marketplace.totalPrice')}</span>
                  <span className="font-bold text-lg">${(buyAmount * Number(selectedListing.price_per_ths)).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedListing(null)}
                  className="flex-1"
                  disabled={buyMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleConfirmBuy}
                  className="flex-1"
                  disabled={buyMutation.isPending || buyAmount <= 0}
                >
                  {buyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('marketplace.processing')}
                    </>
                  ) : (
                    t('marketplace.confirmBuy')
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SuccessDialog
        open={!!buyMutation.successData}
        onOpenChange={() => buyMutation.clearSuccess()}
        title="Purchase Successful!"
        description="Your hashrate purchase has been completed successfully."
        details={buyMutation.successData ? [
          { label: "Hashrate Acquired", value: `${buyMutation.successData.trade.amount_ths.toFixed(4)} TH/s` },
          { label: "Price per TH/s", value: `$${buyMutation.successData.trade.price_per_ths.toFixed(2)}` },
          { label: "Total Paid", value: `$${buyMutation.successData.trade.total_price.toFixed(2)}` },
        ] : []}
        onConfirm={() => {
          buyMutation.clearSuccess();
          navigate('/mining/my-machines');
        }}
        confirmText="View My Machines"
      />
    </>
  );
};
