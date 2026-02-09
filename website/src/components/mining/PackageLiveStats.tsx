import { Activity, Package, Bitcoin } from "lucide-react";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";
import { usePlatformStats } from "@/hooks/usePlatformStats";

export const PackageLiveStats = () => {
  const { data: marketData } = useBitcoinMarketData();
  const { data: platformStats } = usePlatformStats();

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">Total Hashrate:</span>
        <span className="font-semibold">
          {platformStats?.totalHashrateThs ? (platformStats.totalHashrateThs / 1000).toLocaleString() : '850'} PH/s
        </span>
      </div>
      
      <div className="w-px h-4 bg-border hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">Active Packages:</span>
        <span className="font-semibold">
          {platformStats?.activePackages?.toLocaleString() || '2,847'}
        </span>
      </div>
      
      <div className="w-px h-4 bg-border hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <Bitcoin className="h-4 w-4 text-amber-500" />
        <span className="text-muted-foreground">BTC Price:</span>
        <span className="font-semibold text-amber-500">
          ${marketData?.price?.toLocaleString() || '—'}
        </span>
        {marketData?.priceChange24h !== undefined && (
          <span className={`text-xs ${marketData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ({marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
};
