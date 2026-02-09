import { Bitcoin, Zap, Shield } from 'lucide-react';
import { useBitcoinMarketData } from '@/hooks/useBitcoinMarketData';

const PackageHero = () => {
  const { data: marketData } = useBitcoinMarketData();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 py-16 md:py-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary/50 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Live BTC Price Badge */}
          {marketData?.price && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 mb-6">
              <Bitcoin className="h-4 w-4 text-[hsl(var(--bitcoin))]" />
              <span className="text-sm font-medium">
                BTC ${marketData.price.toLocaleString()}
              </span>
              {marketData.priceChange24h !== undefined && (
                <span className={`text-xs ${marketData.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(1)}%
                </span>
              )}
            </div>
          )}

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Invest in Bitcoin Mining
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose your mining package and start earning daily BTC with our professional infrastructure
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Instant Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-[hsl(var(--bitcoin))]" />
              <span>Daily BTC Settlements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageHero;
