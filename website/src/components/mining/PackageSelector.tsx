import { cn } from '@/lib/utils';
import { Package } from '@/hooks/usePackages';
import { Crown, Star } from 'lucide-react';

interface PackageSelectorProps {
  packages: Package[];
  selectedPackage: Package | null;
  onSelect: (pkg: Package) => void;
}

const PackageSelector = ({ packages, selectedPackage, onSelect }: PackageSelectorProps) => {
  const sortedPackages = [...packages].sort((a, b) => a.price_usd - b.price_usd);

  const getTierStyle = (price: number) => {
    if (price >= 5000) return 'premium';
    if (price >= 1000) return 'professional';
    return 'standard';
  };

  const getPackageLabel = (pkg: Package) => {
    const price = pkg.price_usd;
    if (price >= 10000) return { label: 'Diamond', icon: Crown };
    if (price >= 5000) return { label: 'Platinum', icon: Crown };
    if (price >= 2500) return { label: 'Gold', icon: Star, popular: true };
    if (price >= 1000) return { label: 'Silver', icon: null };
    if (price >= 500) return { label: 'Bronze', icon: null };
    return { label: 'Starter', icon: null };
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {sortedPackages.map((pkg) => {
          const isSelected = selectedPackage?.id === pkg.id;
          const tier = getTierStyle(pkg.price_usd);
          const { label, icon: Icon, popular } = getPackageLabel(pkg);

          return (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg)}
              className={cn(
                "relative flex flex-col items-center px-6 py-4 rounded-2xl transition-all duration-200",
                "border-2 hover:shadow-lg",
                // Default state
                !isSelected && tier === 'standard' && "bg-card border-border hover:border-primary/50",
                !isSelected && tier === 'professional' && "bg-card border-border hover:border-primary/50",
                !isSelected && tier === 'premium' && "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400/50 hover:border-amber-400",
                // Selected state
                isSelected && tier !== 'premium' && "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-lg",
                isSelected && tier === 'premium' && "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-500 ring-2 ring-amber-400/30 shadow-lg"
              )}
            >
              {/* Popular badge */}
              {popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full whitespace-nowrap">
                  Popular
                </span>
              )}

              {/* Premium icon */}
              {Icon && tier === 'premium' && (
                <Icon className="h-4 w-4 text-amber-600 mb-1" />
              )}

              {/* Package name */}
              <span className={cn(
                "text-sm font-medium mb-1",
                tier === 'premium' ? "text-amber-600" : "text-muted-foreground"
              )}>
                {label}
              </span>

              {/* Price */}
              <span className={cn(
                "text-lg md:text-xl font-bold",
                tier === 'premium' ? "text-amber-900" : "text-foreground"
              )}>
                ${pkg.price_usd.toLocaleString()}
              </span>

              {/* Hashrate */}
              <span className={cn(
                "text-xs mt-1",
                tier === 'premium' ? "text-amber-700" : "text-muted-foreground"
              )}>
                {pkg.hashrate_ths} TH/s
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PackageSelector;
