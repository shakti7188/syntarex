import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMachineInventory } from "@/hooks/useMachineInventory";
import { useHashrateAllocations } from "@/hooks/useHashrateAllocations";
import { MachineInventoryTable } from "@/components/mining/MachineInventoryTable";
import { HashrateAllocationsTable } from "@/components/mining/HashrateAllocationsTable";
import { RealtimeIndicator } from "@/components/dashboard/RealtimeIndicator";
import { Activity, Coins, Zap, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function MyMachines() {
  const { t } = useTranslation();
  const { data: machines, isLoading: machinesLoading } = useMachineInventory();
  const { data: allocations, isLoading: allocationsLoading } = useHashrateAllocations();

  const stats = useMemo(() => {
    if (!allocations) return { total: 0, tokenized: 0, untokenized: 0, estimatedDaily: 0 };

    const totalThs = allocations.reduce((sum, a) => sum + a.totalThs, 0);
    const tokenizedThs = allocations.reduce((sum, a) => sum + a.tokenizedThs, 0);
    const untokenizedThs = allocations.reduce((sum, a) => sum + a.untokenizedThs, 0);
    
    // Simple estimation: 1 TH/s ≈ 0.0000015 BTC/day (this is a placeholder)
    const estimatedDaily = totalThs * 0.0000015;

    return {
      total: totalThs,
      tokenized: tokenizedThs,
      untokenized: untokenizedThs,
      estimatedDaily,
    };
  }, [allocations]);

  const isLoading = machinesLoading || allocationsLoading;

  return (
    <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Purchased Packages</h1>
            <p className="text-muted-foreground">
              View and manage your mining package purchases and hashrate allocations
            </p>
          </div>
          <RealtimeIndicator />
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('mining.totalThsOwned')}
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {stats.total.toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    {t('mining.tokenizedThs')}
                  </CardDescription>
                  <CardTitle className="text-3xl text-primary">
                    {stats.tokenized.toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {t('mining.untokenizedThs')}
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {stats.untokenized.toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('mining.estDailyBtc')}
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {stats.estimatedDaily.toFixed(8)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>My Token & Hashrate</CardTitle>
                <CardDescription>
                  {allocations?.length || 0} active allocations
                </CardDescription>
              </CardHeader>
              <HashrateAllocationsTable allocations={allocations || []} />
            </Card>
          </>
        )}
      </div>
  );
}
