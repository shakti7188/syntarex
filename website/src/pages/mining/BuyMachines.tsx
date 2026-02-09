import { useState, useEffect } from 'react';
import { usePackages, Package } from '@/hooks/usePackages';
import PackageHero from '@/components/mining/PackageHero';
import PackageSelector from '@/components/mining/PackageSelector';
import PackageDetailPanel from '@/components/mining/PackageDetailPanel';
import ComparisonModal from '@/components/mining/ComparisonModal';
import { PurchaseWizard } from '@/components/mining/PurchaseWizard';
import { PackageFAQ } from '@/components/mining/PackageFAQ';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyMachines() {
  const { data: packages, isLoading } = usePackages();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // Auto-select Gold package (popular) on load
  useEffect(() => {
    if (packages && packages.length > 0 && !selectedPackage) {
      const goldPackage = packages.find(p => p.price_usd === 2500);
      const defaultPackage = goldPackage || packages.find(p => p.price_usd === 1000) || packages[0];
      setSelectedPackage(defaultPackage);
    }
  }, [packages, selectedPackage]);

  const handlePurchase = () => {
    if (selectedPackage) {
      setPurchaseModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto mb-12" />
            <div className="flex justify-center gap-4 mb-12">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const sortedPackages = packages ? [...packages].sort((a, b) => a.price_usd - b.price_usd) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <PackageHero />

      {/* Package Selection */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Select Your Package</h2>
            <p className="text-muted-foreground">Choose the mining power that fits your investment goals</p>
          </div>

          {/* Package Selector Strip */}
          <div className="mb-12">
            <PackageSelector
              packages={sortedPackages}
              selectedPackage={selectedPackage}
              onSelect={setSelectedPackage}
            />
          </div>

          {/* Selected Package Details */}
          {selectedPackage && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <PackageDetailPanel
                package={selectedPackage}
                onPurchase={handlePurchase}
                onCompare={() => setComparisonOpen(true)}
              />
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <PackageFAQ />
        </div>
      </section>

      {/* Footer Trust Strip */}
      <section className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>Accepted Payment: USDT (Solana & Ethereum)</span>
            <span className="text-muted-foreground/30">|</span>
            <span>Secure Checkout</span>
            <span className="text-muted-foreground/30">|</span>
            <span>Instant Activation</span>
          </div>
        </div>
      </section>

      {/* Comparison Modal */}
      <ComparisonModal
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        packages={sortedPackages}
        selectedPackage={selectedPackage}
        onSelect={setSelectedPackage}
      />

      {/* Purchase Wizard */}
      <PurchaseWizard
        package={selectedPackage}
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
      />
    </div>
  );
}
