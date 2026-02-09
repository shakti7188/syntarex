import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePackagePurchases } from "@/hooks/usePackagePurchases";
import { Package, ArrowRight, Cpu, Calendar, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PackageDetailModal } from "./PackageDetailModal";
import { PLUG_IN_DATE } from "@/hooks/usePackageDetails";

export const MyPackagesWidget = () => {
  const { purchases, isLoading } = usePackagePurchases();
  const navigate = useNavigate();
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  const daysUntilPlugIn = Math.max(0, differenceInDays(PLUG_IN_DATE, new Date()));
  const isLive = daysUntilPlugIn === 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </Card>
    );
  }

  const completedPurchases = purchases.filter(p => p.status?.toLowerCase() === 'completed');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">My Mining Packages</h3>
        </div>
        <Button onClick={() => navigate('/mining/buy')} className="gap-2">
          Buy More <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {completedPurchases.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold mb-2">No Packages Yet</h4>
          <p className="text-muted-foreground mb-4">
            Start your mining journey by purchasing your first package
          </p>
          <Button onClick={() => navigate('/mining/buy')}>
            Browse Packages
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {completedPurchases.map((purchase) => (
            <div
              key={purchase.id}
              onClick={() => setSelectedPurchaseId(purchase.id)}
              className="p-4 rounded-xl border border-border bg-gradient-to-br from-card to-secondary hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                    {purchase.package?.name || 'Unknown Package'}
                  </h4>
                  <Badge variant="outline" className="mt-1">
                    {purchase.package?.tier || 'Standard'}
                  </Badge>
                </div>
                <Badge 
                  variant="default" 
                  className={isLive ? "bg-accent text-accent-foreground" : "bg-warning/20 text-warning"}
                >
                  {isLive ? "Live" : "Scheduled"}
                </Badge>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Hashrate:</span>
                  <span className="font-semibold ml-auto">
                    {purchase.package?.hashrate_ths || 0} TH/s
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Plug-in Date:</span>
                  <span className="font-medium ml-auto">
                    {format(PLUG_IN_DATE, 'MMM dd, yyyy')}
                  </span>
                </div>
                {!isLive && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-muted-foreground">Countdown:</span>
                    <span className="font-medium ml-auto text-warning">
                      {daysUntilPlugIn} days
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Investment</span>
                  <span className="font-bold text-primary">
                    ${purchase.total_price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PackageDetailModal
        purchaseId={selectedPurchaseId}
        open={!!selectedPurchaseId}
        onOpenChange={(open) => !open && setSelectedPurchaseId(null)}
      />

      {purchases.some(p => p.status?.toLowerCase() === 'pending') && (
        <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning font-medium">
            You have {purchases.filter(p => p.status === 'pending').length} pending package(s) awaiting confirmation
          </p>
        </div>
      )}
    </Card>
  );
};
