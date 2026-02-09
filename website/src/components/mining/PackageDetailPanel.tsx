import { Package } from '@/hooks/usePackages';
import { useBitcoinMarketData } from '@/hooks/useBitcoinMarketData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Bitcoin, 
  Coins, 
  Shield, 
  Clock, 
  CheckCircle2,
  Crown,
  Headphones,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageDetailPanelProps {
  package: Package;
  onPurchase: () => void;
  onCompare: () => void;
}

const PackageDetailPanel = ({ package: pkg, onPurchase, onCompare }: PackageDetailPanelProps) => {
  const { data: marketData } = useBitcoinMarketData();
  
  const dailyEarnings = marketData?.dailyEarningsPerThs 
    ? pkg.hashrate_ths * marketData.dailyEarningsPerThs 
    : pkg.hashrate_ths * 0.08;
  
  const monthlyLow = dailyEarnings * 30 * 0.85;
  const monthlyHigh = dailyEarnings * 30 * 1.15;
  
  const isPremium = pkg.price_usd >= 5000;
  const tierLabel = pkg.price_usd >= 10000 ? 'Diamond' : 
                    pkg.price_usd >= 5000 ? 'Platinum' :
                    pkg.price_usd >= 2500 ? 'Gold' :
                    pkg.price_usd >= 1000 ? 'Silver' :
                    pkg.price_usd >= 500 ? 'Bronze' : 'Starter';

  const baseFeatures = [
    { icon: Zap, text: `${pkg.hashrate_ths} TH/s mining power` },
    { icon: Bitcoin, text: `~$${dailyEarnings.toFixed(2)}/day in BTC earnings` },
    { icon: Coins, text: `${pkg.xflow_tokens.toLocaleString()} XFLOW tokens included` },
    { icon: Clock, text: 'Daily settlements to your wallet' },
    { icon: Shield, text: '24/7 professional operations' },
  ];

  const premiumFeatures = isPremium ? [
    { icon: Crown, text: 'Priority mining allocation' },
    { icon: Headphones, text: 'Dedicated account manager' },
    { icon: BarChart3, text: 'Advanced analytics dashboard' },
  ] : [];

  const allFeatures = [...baseFeatures, ...premiumFeatures];

  return (
    <div className={cn(
      "rounded-3xl p-8 md:p-10 transition-all duration-300",
      isPremium 
        ? "bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-2 border-amber-400/50" 
        : "bg-card border border-border"
    )}>
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Left: Package visualization */}
        <div className="flex flex-col items-center justify-center text-center">
          {/* Hashrate circle */}
          <div className={cn(
            "relative w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center mb-6",
            isPremium 
              ? "bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-400/50"
              : "bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20"
          )}>
            <div className="text-center">
              <div className={cn(
                "text-4xl md:text-5xl font-bold",
                isPremium ? "text-amber-600" : "text-primary"
              )}>
                {pkg.hashrate_ths}
              </div>
              <div className={cn(
                "text-lg font-medium",
                isPremium ? "text-amber-700" : "text-muted-foreground"
              )}>
                TH/s
              </div>
            </div>
            
            {/* Animated ring */}
            <div className={cn(
              "absolute inset-0 rounded-full border-2 border-dashed animate-[spin_20s_linear_infinite]",
              isPremium ? "border-amber-400/30" : "border-primary/20"
            )} />
          </div>

          {/* Tier badge and price */}
          <Badge 
            variant="outline" 
            className={cn(
              "mb-3 px-4 py-1 text-sm font-medium",
              isPremium 
                ? "border-amber-400 text-amber-700 bg-amber-100" 
                : "border-primary/50 text-primary bg-primary/10"
            )}
          >
            {tierLabel} Package
          </Badge>

          <div className={cn(
            "text-4xl md:text-5xl font-bold mb-2",
            isPremium ? "text-foreground" : "text-foreground"
          )}>
            ${pkg.price_usd.toLocaleString()}
          </div>
          
          <p className={cn(
            "text-sm",
            isPremium ? "text-muted-foreground" : "text-muted-foreground"
          )}>
            One-time purchase • No hidden fees
          </p>
        </div>

        {/* Right: Features and CTA */}
        <div className="flex flex-col">
          {/* Features list */}
          <div className="space-y-4 flex-1">
            {allFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                  isPremium 
                    ? "bg-amber-100" 
                    : "bg-primary/10"
                )}>
                  <feature.icon className={cn(
                    "h-4 w-4",
                    isPremium ? "text-amber-600" : "text-primary"
                  )} />
                </div>
                <span className={cn(
                  "text-sm md:text-base",
                  isPremium ? "text-foreground" : "text-foreground"
                )}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Earnings estimate */}
          <div className={cn(
            "my-6 p-4 rounded-xl",
            isPremium ? "bg-amber-100/50" : "bg-muted/50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "text-sm font-medium",
                isPremium ? "text-amber-800" : "text-muted-foreground"
              )}>
                Estimated Monthly Earnings
              </span>
              <span className={cn(
                "text-xs",
                isPremium ? "text-amber-700" : "text-muted-foreground/70"
              )}>
                *Based on current network
              </span>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              isPremium ? "text-emerald-600" : "text-emerald-600"
            )}>
              ${monthlyLow.toFixed(0)} - ${monthlyHigh.toFixed(0)}/month
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button 
              onClick={onPurchase}
              size="lg"
              className={cn(
                "w-full text-base font-semibold h-14 rounded-xl",
                isPremium 
                  ? "bg-amber-500 hover:bg-amber-600 text-white" 
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              Start Mining – ${pkg.price_usd.toLocaleString()} USDT
            </Button>
            
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={onCompare}
                className={cn(
                  "text-sm underline-offset-4 hover:underline",
                  isPremium ? "text-amber-700 hover:text-amber-800" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Compare all packages
              </button>
              <span className={isPremium ? "text-amber-400" : "text-muted-foreground/50"}>•</span>
              <span className={cn(
                "text-sm",
                isPremium ? "text-amber-700" : "text-muted-foreground"
              )}>
                Pay with XFLOW for 10% off
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div className={cn(
            "flex items-center justify-center gap-4 mt-6 pt-6 border-t text-xs",
            isPremium ? "border-amber-200 text-amber-700" : "border-border text-muted-foreground"
          )}>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              <span>Instant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPanel;
