import { motion } from "framer-motion";
import { TrendingUp, Calculator, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";

export const ProfitabilityPreview = () => {
  const navigate = useNavigate();
  const { data: marketData, isLoading } = useBitcoinMarketData();

  // Calculate realistic metrics
  const dailyEarningsPerThs = marketData?.dailyEarningsPerThs || 0.08;
  const monthlyEarningsPerThs = dailyEarningsPerThs * 30;
  const monthlyRoi = (monthlyEarningsPerThs / 125) * 100; // Assuming $125 per TH/s cost
  const breakEvenMonths = Math.ceil(125 / monthlyEarningsPerThs);

  const stats = [
    {
      label: "Est. Monthly ROI",
      value: isLoading ? "..." : `${monthlyRoi.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Based on current network conditions"
    },
    {
      label: "Break-Even Period",
      value: isLoading ? "..." : `${breakEvenMonths} mo`,
      icon: Calculator,
      description: "Estimated payback timeline"
    },
    {
      label: "Daily Earnings",
      value: isLoading ? "..." : `$${dailyEarningsPerThs.toFixed(2)}`,
      icon: DollarSign,
      description: "Per TH/s at current difficulty"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Calculate Your Returns
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how much you can earn with professional Bitcoin mining
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <stat.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="font-semibold mb-1">{stat.label}</div>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">ROI Calculator</h3>
                <p className="text-muted-foreground mb-6">
                  Enter your investment amount to see projected monthly and annual returns based on current Bitcoin mining performance.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    Real-time Bitcoin price data
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    Network difficulty adjusted
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    Includes operational costs
                  </li>
                </ul>
              </div>
              
              <div className="bg-secondary/50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Investment Amount</label>
                    <div className="bg-background p-4 rounded-md text-center text-2xl font-bold">
                      $10,000
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Est. Monthly</span>
                      <span className="font-bold text-success">
                        {isLoading ? "..." : `$${(10000 * monthlyRoi / 100).toFixed(0)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Est. Annual</span>
                      <span className="font-bold text-success">
                        {isLoading ? "..." : `$${(10000 * monthlyRoi / 100 * 12).toFixed(0)}`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    * Estimates based on current Bitcoin price and network difficulty. Actual returns may vary.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Button 
                size="lg"
                onClick={() => navigate("/mining/roi")}
                className="bg-primary hover:bg-primary/90"
              >
                Open Full Calculator
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
