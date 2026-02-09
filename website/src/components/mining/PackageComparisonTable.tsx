import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Award, Crown } from "lucide-react";
import { Package } from "@/hooks/usePackages";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";

interface PackageComparisonTableProps {
  packages: Package[];
  onPurchase: (pkg: Package) => void;
}

export const PackageComparisonTable = ({ packages, onPurchase }: PackageComparisonTableProps) => {
  const { data: marketData } = useBitcoinMarketData();
  
  const getCommissionLevel = (price: number) => {
    if (price >= 1000) return "All 3 Levels";
    if (price >= 500) return "Level 1-2";
    return "Level 1";
  };

  const calculateEarnings = (hashrate: number) => {
    const dailyBtc = marketData?.dailyEarningsPerThs 
      ? hashrate * marketData.dailyEarningsPerThs 
      : 0;
    const dailyUsd = dailyBtc * (marketData?.price || 0);
    return { dailyBtc, dailyUsd, monthlyUsd: dailyUsd * 30 };
  };

  // Sort packages by price
  const sortedPackages = [...packages].sort((a, b) => a.price_usd - b.price_usd);

  // Determine popular and best value
  const getPackageBadge = (pkg: Package, index: number) => {
    if (index === Math.floor(sortedPackages.length / 2)) {
      return { type: 'popular', icon: Star, text: 'Popular', color: 'bg-primary' };
    }
    if (index === sortedPackages.length - 2 && sortedPackages.length > 2) {
      return { type: 'value', icon: Award, text: 'Best Value', color: 'bg-amber-500' };
    }
    if ((pkg as any).is_premium_bonus_eligible) {
      return { type: 'premium', icon: Crown, text: 'Premium', color: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    }
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Package</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Hashrate</TableHead>
            <TableHead className="text-right">XFLOW</TableHead>
            <TableHead className="text-right">Est. Daily</TableHead>
            <TableHead className="text-right">Est. Monthly</TableHead>
            <TableHead className="text-center">Team Rewards</TableHead>
            <TableHead className="text-center">Premium Bonus</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPackages.map((pkg, index) => {
            const earnings = calculateEarnings(pkg.hashrate_ths);
            const badge = getPackageBadge(pkg, index);
            
            return (
              <TableRow key={pkg.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {pkg.name}
                    {badge && (
                      <Badge className={`${badge.color} text-white text-xs`}>
                        <badge.icon className="h-3 w-3 mr-1" />
                        {badge.text}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${pkg.price_usd.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{pkg.hashrate_ths} TH/s</TableCell>
                <TableCell className="text-right">{pkg.xflow_tokens.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div>~${earnings.dailyUsd.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{earnings.dailyBtc.toFixed(6)} BTC</div>
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  ~${earnings.monthlyUsd.toFixed(0)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={pkg.price_usd >= 1000 ? 'text-yellow-500 font-medium' : pkg.price_usd >= 500 ? 'text-blue-500' : 'text-muted-foreground'}>
                    {getCommissionLevel(pkg.price_usd)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {(pkg as any).is_premium_bonus_eligible ? (
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => onPurchase(pkg)} className="w-full">
                    Purchase
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
