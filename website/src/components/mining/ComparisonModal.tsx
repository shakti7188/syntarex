import { Package } from '@/hooks/usePackages';
import { useBitcoinMarketData } from '@/hooks/useBitcoinMarketData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: Package[];
  selectedPackage: Package | null;
  onSelect: (pkg: Package) => void;
}

const ComparisonModal = ({ 
  open, 
  onOpenChange, 
  packages, 
  selectedPackage,
  onSelect 
}: ComparisonModalProps) => {
  const { data: marketData } = useBitcoinMarketData();
  const sortedPackages = [...packages].sort((a, b) => a.price_usd - b.price_usd);

  const getTierLabel = (price: number) => {
    if (price >= 10000) return 'Diamond';
    if (price >= 5000) return 'Platinum';
    if (price >= 2500) return 'Gold';
    if (price >= 1000) return 'Silver';
    if (price >= 500) return 'Bronze';
    return 'Starter';
  };

  const getMonthlyEarnings = (hashrate: number) => {
    const daily = marketData?.dailyEarningsPerThs 
      ? hashrate * marketData.dailyEarningsPerThs 
      : hashrate * 0.08;
    return daily * 30;
  };

  const features = [
    { key: 'hashrate', label: 'Mining Power' },
    { key: 'tokens', label: 'XFLOW Tokens' },
    { key: 'earnings', label: 'Est. Monthly' },
    { key: 'daily', label: 'Daily Settlements' },
    { key: 'support', label: '24/7 Support' },
    { key: 'priority', label: 'Priority Allocation' },
    { key: 'manager', label: 'Account Manager' },
    { key: 'analytics', label: 'Advanced Analytics' },
  ];

  const getFeatureValue = (pkg: Package, key: string) => {
    const isPremium = pkg.price_usd >= 5000;
    const monthly = getMonthlyEarnings(pkg.hashrate_ths);
    
    switch (key) {
      case 'hashrate':
        return `${pkg.hashrate_ths} TH/s`;
      case 'tokens':
        return pkg.xflow_tokens.toLocaleString();
      case 'earnings':
        return `$${(monthly * 0.85).toFixed(0)}-${(monthly * 1.15).toFixed(0)}`;
      case 'daily':
      case 'support':
        return true;
      case 'priority':
      case 'manager':
      case 'analytics':
        return isPremium;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Compare All Packages</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 pt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 min-w-[140px]"></th>
                    {sortedPackages.map((pkg) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      const isPremium = pkg.price_usd >= 5000;
                      const tierLabel = getTierLabel(pkg.price_usd);
                      
                      return (
                        <th 
                          key={pkg.id} 
                          className={cn(
                            "p-4 min-w-[160px] text-center rounded-t-xl transition-colors",
                            isSelected && "bg-primary/5",
                            isPremium && "bg-slate-900 text-white"
                          )}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {isPremium && (
                              <Crown className="h-5 w-5 text-[hsl(var(--bitcoin))]" />
                            )}
                            <Badge 
                              variant={isPremium ? "outline" : "secondary"}
                              className={cn(
                                isPremium && "border-[hsl(var(--bitcoin))]/50 text-[hsl(var(--bitcoin))]"
                              )}
                            >
                              {tierLabel}
                            </Badge>
                            <div className={cn(
                              "text-2xl font-bold",
                              isPremium ? "text-white" : "text-foreground"
                            )}>
                              ${pkg.price_usd.toLocaleString()}
                            </div>
                            {pkg.price_usd === 2500 && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, idx) => (
                    <tr key={feature.key} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="p-3 text-sm font-medium text-muted-foreground">
                        {feature.label}
                      </td>
                      {sortedPackages.map((pkg) => {
                        const value = getFeatureValue(pkg, feature.key);
                        const isSelected = selectedPackage?.id === pkg.id;
                        const isPremium = pkg.price_usd >= 5000;
                        
                        return (
                          <td 
                            key={pkg.id} 
                            className={cn(
                              "p-3 text-center text-sm",
                              isSelected && "bg-primary/5",
                              isPremium && "bg-slate-900/50"
                            )}
                          >
                            {typeof value === 'boolean' ? (
                              value ? (
                                <CheckCircle2 className={cn(
                                  "h-5 w-5 mx-auto",
                                  isPremium ? "text-emerald-400" : "text-emerald-500"
                                )} />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )
                            ) : (
                              <span className={cn(
                                "font-medium",
                                feature.key === 'earnings' && (isPremium ? "text-emerald-400" : "text-emerald-600"),
                                isPremium && feature.key !== 'earnings' && "text-slate-200"
                              )}>
                                {value}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-3"></td>
                    {sortedPackages.map((pkg) => {
                      const isPremium = pkg.price_usd >= 5000;
                      
                      return (
                        <td key={pkg.id} className={cn(
                          "p-4 text-center rounded-b-xl",
                          isPremium && "bg-slate-900/50"
                        )}>
                          <Button
                            onClick={() => {
                              onSelect(pkg);
                              onOpenChange(false);
                            }}
                            variant={isPremium ? "outline" : "default"}
                            className={cn(
                              "w-full",
                              isPremium && "border-[hsl(var(--bitcoin))] text-[hsl(var(--bitcoin))] hover:bg-[hsl(var(--bitcoin))]/10"
                            )}
                          >
                            Select
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-6">
              * Earnings estimates are based on current network conditions and may vary with Bitcoin network difficulty and price fluctuations.
            </p>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonModal;
