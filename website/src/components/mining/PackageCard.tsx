import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingUp, Shield, Clock } from "lucide-react";
import { Package } from "@/hooks/usePackages";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";

interface PackageCardProps {
  package: Package;
  onPurchase: (pkg: Package) => void;
  isPopular?: boolean;
  isBestValue?: boolean;
  isRecommended?: boolean;
  isAffordable?: boolean;
}

export const PackageCard = ({ 
  package: pkg, 
  onPurchase, 
  isPopular = false,
  isBestValue = false,
  isRecommended = false,
  isAffordable = true
}: PackageCardProps) => {
  const { data: marketData } = useBitcoinMarketData();
  
  // Calculate estimated earnings with realistic range (±20%)
  const dailyRate = marketData?.dailyEarningsPerThs || 0.08;
  const baseDailyUsd = pkg.hashrate_ths * dailyRate;
  const monthlyLow = baseDailyUsd * 30 * 0.8;
  const monthlyHigh = baseDailyUsd * 30 * 1.2;
  
  // Determine if this is a premium tier
  const isPremium = pkg.tier === 'platinum' || pkg.tier === 'diamond' || pkg.price_usd >= 5000;
  const isEnterprise = pkg.price_usd >= 10000;
  
  // Get tier display name
  const getTierLabel = () => {
    if (isEnterprise) return 'Enterprise';
    if (isPremium) return 'Premium';
    if (pkg.price_usd >= 1000) return 'Professional';
    return 'Standard';
  };

  const features = [
    "Instant activation",
    "Daily BTC settlements",
    "24/7 mining operations",
    "No maintenance fees"
  ];

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-300 h-full flex flex-col
        ${isPremium 
          ? 'bg-slate-900 text-white border-amber-500/30 hover:border-amber-500/50' 
          : 'bg-card hover:shadow-lg border-border/50 hover:border-primary/30'
        }
        ${isRecommended ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''}
        ${!isAffordable ? 'opacity-60' : ''}
      `}
    >
      {/* Top Badge Area */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3">
        <Badge 
          variant="outline" 
          className={`
            text-[10px] font-medium uppercase tracking-wider
            ${isPremium 
              ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' 
              : 'border-muted-foreground/30 text-muted-foreground bg-muted/50'
            }
          `}
        >
          {getTierLabel()}
        </Badge>
        
        {isPopular && (
          <Badge className="bg-primary text-primary-foreground text-[10px]">
            Most Popular
          </Badge>
        )}
        {isBestValue && !isPopular && (
          <Badge variant="secondary" className="text-[10px]">
            Best Value
          </Badge>
        )}
        {isRecommended && !isPopular && !isBestValue && (
          <Badge className="bg-green-600 text-white text-[10px]">
            Recommended
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 pt-12 flex-1 flex flex-col">
        {/* Package Name */}
        <div className="mb-4">
          <h3 className={`text-xl font-semibold ${isPremium ? 'text-white' : 'text-foreground'}`}>
            {pkg.name}
          </h3>
          <p className={`text-sm ${isPremium ? 'text-slate-400' : 'text-muted-foreground'}`}>
            Bitcoin Mining Package
          </p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-bold ${isPremium ? 'text-white' : 'text-foreground'}`}>
              ${pkg.price_usd.toLocaleString()}
            </span>
          </div>
          <p className={`text-xs mt-1 ${isPremium ? 'text-slate-500' : 'text-muted-foreground'}`}>
            One-time purchase
          </p>
        </div>

        {/* Specs */}
        <div className={`space-y-3 pb-4 mb-4 border-b ${isPremium ? 'border-slate-700' : 'border-border'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm flex items-center gap-2 ${isPremium ? 'text-slate-300' : 'text-muted-foreground'}`}>
              <Zap className="h-4 w-4 text-amber-500" />
              Mining Power
            </span>
            <span className={`font-semibold ${isPremium ? 'text-white' : 'text-foreground'}`}>
              {pkg.hashrate_ths} TH/s
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm flex items-center gap-2 ${isPremium ? 'text-slate-300' : 'text-muted-foreground'}`}>
              <TrendingUp className="h-4 w-4 text-green-500" />
              XFLOW Bonus
            </span>
            <span className={`font-semibold ${isPremium ? 'text-white' : 'text-foreground'}`}>
              {pkg.xflow_tokens.toLocaleString()} tokens
            </span>
          </div>
        </div>

        {/* Estimated Returns */}
        <div className={`rounded-lg p-4 mb-4 ${isPremium ? 'bg-slate-800' : 'bg-muted/50'}`}>
          <p className={`text-xs uppercase tracking-wider mb-2 ${isPremium ? 'text-slate-400' : 'text-muted-foreground'}`}>
            Estimated Monthly Return
          </p>
          <p className={`text-2xl font-bold ${isPremium ? 'text-amber-400' : 'text-primary'}`}>
            ${monthlyLow.toFixed(0)} - ${monthlyHigh.toFixed(0)}
            <span className={`text-xs font-normal ml-1 ${isPremium ? 'text-slate-500' : 'text-muted-foreground'}`}>*</span>
          </p>
          <p className={`text-[10px] mt-1 ${isPremium ? 'text-slate-500' : 'text-muted-foreground'}`}>
            Based on current network conditions
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6 flex-1">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className={`h-4 w-4 ${isPremium ? 'text-amber-500' : 'text-green-500'}`} />
              <span className={`text-sm ${isPremium ? 'text-slate-300' : 'text-muted-foreground'}`}>
                {feature}
              </span>
            </div>
          ))}
          
          {isPremium && (
            <>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-slate-300">Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-slate-300">Dedicated account manager</span>
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <Button 
          onClick={() => onPurchase(pkg)}
          className={`w-full ${
            isPremium 
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold' 
              : ''
          }`}
          size="lg"
        >
          {isEnterprise ? 'Get Started' : 'Start Mining'}
        </Button>

        {/* Disclaimer */}
        <p className={`text-[9px] text-center mt-3 ${isPremium ? 'text-slate-600' : 'text-muted-foreground/60'}`}>
          * Estimates vary with network difficulty and BTC price
        </p>
      </div>
    </Card>
  );
};
