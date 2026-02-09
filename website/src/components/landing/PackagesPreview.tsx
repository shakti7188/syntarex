import { motion } from "framer-motion";
import { ArrowRight, Zap, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { usePackages } from "@/hooks/usePackages";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";

export const PackagesPreview = () => {
  const navigate = useNavigate();
  const { data: packagesData, isLoading: packagesLoading } = usePackages();
  const { data: marketData, isLoading: marketLoading } = useBitcoinMarketData();

  const getIcon = (tier: string) => {
    if (tier.toLowerCase().includes('starter') || tier.toLowerCase().includes('bronze')) return Zap;
    if (tier.toLowerCase().includes('diamond') || tier.toLowerCase().includes('gold')) return TrendingUp;
    return Crown;
  };

  const packages = packagesData?.slice(0, 3).map((pkg, index) => {
    const monthlyEarnings = marketData 
      ? (pkg.hashrate_ths * marketData.dailyEarningsPerThs * 30)
      : 0;

    return {
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier,
      hashrate: `${pkg.hashrate_ths} TH/s`,
      price: `$${pkg.price_usd.toLocaleString()}`,
      monthlyEst: marketLoading ? "..." : `$${monthlyEarnings.toFixed(0)}`,
      icon: getIcon(pkg.tier),
      color: index === 1 ? "text-primary" : index === 2 ? "text-accent" : "text-muted-foreground",
      popular: index === 1
    };
  }) || [];

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Mining Package
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the package that fits your investment goals
          </p>
        </motion.div>

        {packagesLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading packages...</div>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No packages available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {packages.map((pkg, index) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-8 relative overflow-hidden transition-all hover:shadow-xl ${
                pkg.popular ? 'border-primary border-2' : ''
              }`}>
                {pkg.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white">
                    Popular
                  </Badge>
                )}
                
                <pkg.icon className={`h-12 w-12 mb-4 ${pkg.color}`} />
                
                <div className="mb-2">
                  <h3 className="text-2xl font-bold">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.tier}</p>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold mb-1">{pkg.price}</div>
                  <div className="text-sm text-muted-foreground">{pkg.hashrate}</div>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Est. Monthly Earnings</div>
                  <div className="text-2xl font-bold text-success">{pkg.monthlyEst}</div>
                </div>

                <Button 
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => navigate("/mining/buy")}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            * Monthly earnings are estimates based on current Bitcoin price (${marketData?.price.toLocaleString()}) and network difficulty. 
            Actual returns will vary with market conditions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/mining/buy")}
          >
            View All Packages
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
