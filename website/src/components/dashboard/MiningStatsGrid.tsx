import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePackagePurchases } from "@/hooks/usePackagePurchases";
import { Cpu, Package, Bitcoin, Coins } from "lucide-react";

export const MiningStatsGrid = () => {
  const { stats, isLoading } = usePackagePurchases();

  // Estimated daily BTC based on hashrate (simplified calculation)
  // Using approximate value: 1 TH/s ≈ 0.000001 BTC/day at current difficulty
  const estimatedDailyBtc = stats.totalHashrate * 0.000001;

  const statCards = [
    {
      label: "Total Hashrate",
      value: `${stats.totalHashrate.toFixed(1)} TH/s`,
      icon: Cpu,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Active Packages",
      value: stats.totalPackages.toString(),
      icon: Package,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Est. Daily BTC",
      value: estimatedDailyBtc.toFixed(8),
      icon: Bitcoin,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "XFLOW Tokens",
      value: stats.totalXflowTokens.toLocaleString(),
      icon: Coins,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-12 w-12 rounded-full mb-4" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="p-6 bg-gradient-to-br from-card to-secondary border-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
