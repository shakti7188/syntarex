import { MarketplaceListings } from "@/components/marketplace/MarketplaceListings";
import { CreateListingModal } from "@/components/marketplace/CreateListingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyTrades } from "@/hooks/useMarketplace";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Store, Plus } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const Marketplace = () => {
  const { t } = useTranslation();
  const { data: trades } = useMyTrades();
  const [createListingModalOpen, setCreateListingModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "outline" as const, label: t('marketplace.pending') },
      COMPLETED: { variant: "default" as const, label: t('marketplace.completed') },
      FAILED: { variant: "destructive" as const, label: t('marketplace.failed') },
      CANCELLED: { variant: "secondary" as const, label: t('marketplace.cancelled') },
    };
    return variants[status as keyof typeof variants] || variants.PENDING;
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Store className="h-8 w-8" />
              {t('marketplace.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('marketplace.subtitle')}
            </p>
          </div>
          <Button size="lg" onClick={() => setCreateListingModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('marketplace.createListing')}
          </Button>
        </div>

        <MarketplaceListings />

        {/* My Trades History */}
        <Card>
          <CardHeader>
            <CardTitle>{t('marketplace.myTradeHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('marketplace.date')}</TableHead>
                    <TableHead>{t('marketplace.type')}</TableHead>
                    <TableHead>{t('marketplace.amount')}</TableHead>
                    <TableHead>{t('marketplace.price')}</TableHead>
                    <TableHead>{t('marketplace.total')}</TableHead>
                    <TableHead>{t('marketplace.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!trades || trades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('marketplace.noTrades')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    trades.map((trade) => {
                      const statusConfig = getStatusBadge(trade.status);
                      return (
                        <TableRow key={trade.id}>
                          <TableCell>
                            {format(new Date(trade.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{t('marketplace.buyType')}</Badge>
                          </TableCell>
                          <TableCell>{Number(trade.amount_ths).toFixed(4)} TH/s</TableCell>
                          <TableCell>${Number(trade.price_per_ths).toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">${Number(trade.total_price).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <CreateListingModal
          open={createListingModalOpen}
          onClose={() => setCreateListingModalOpen(false)}
        />
      </main>
  );
};

export default Marketplace;
