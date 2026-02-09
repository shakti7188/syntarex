import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { DollarSign, TrendingUp, Shield, Zap } from "lucide-react";

const allocations = [
  {
    label: "Investor BTC Payouts",
    percentage: 50,
    color: "hsl(var(--chart-1))",
    bgColor: "bg-[hsl(var(--chart-1))]",
    description: "Real Yield",
    longDesc: "Direct BTC payouts to mining package holders. This is the 'real yield' that makes SynteraX unique—actual Bitcoin earnings, not token emissions.",
    icon: DollarSign,
  },
  {
    label: "Token Buybacks",
    percentage: 25,
    color: "hsl(var(--primary))",
    bgColor: "bg-primary",
    description: "Price Growth Engine",
    longDesc: "Weekly TWAP buybacks create constant buying pressure. Tokens are purchased from the market, reducing circulating supply and supporting price.",
    icon: TrendingUp,
  },
  {
    label: "Treasury Reserves",
    percentage: 15,
    color: "hsl(var(--chart-3))",
    bgColor: "bg-[hsl(var(--chart-3))]",
    description: "Fail-Safe Insurance",
    longDesc: "Emergency reserves for market downturns, unexpected expenses, and ecosystem stability. This buffer ensures long-term sustainability.",
    icon: Shield,
  },
  {
    label: "Mining Expansion",
    percentage: 10,
    color: "hsl(var(--chart-4))",
    bgColor: "bg-[hsl(var(--chart-4))]",
    description: "Guaranteed Growth",
    longDesc: "Reinvestment into new mining capacity (MW). More hashrate means more BTC generated, which fuels all other allocations—a growth loop.",
    icon: Zap,
  },
];

export const RevenueAllocationChart = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calculate pie chart segments
  let cumulativePercentage = 0;
  const segments = allocations.map((allocation) => {
    const startAngle = cumulativePercentage * 3.6; // 360 / 100
    cumulativePercentage += allocation.percentage;
    const endAngle = cumulativePercentage * 3.6;
    return { ...allocation, startAngle, endAngle };
  });

  return (
    <div ref={ref} className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Animated Pie Chart */}
      <motion.div
        className="relative aspect-square max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((segment, i) => {
            const startAngle = (segment.startAngle * Math.PI) / 180;
            const endAngle = (segment.endAngle * Math.PI) / 180;
            const largeArc = segment.percentage > 50 ? 1 : 0;
            
            const x1 = 50 + 40 * Math.cos(startAngle);
            const y1 = 50 + 40 * Math.sin(startAngle);
            const x2 = 50 + 40 * Math.cos(endAngle);
            const y2 = 50 + 40 * Math.sin(endAngle);
            
            const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
            return (
              <motion.path
                key={i}
                d={pathData}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={inView ? { 
                  opacity: activeIndex === null || activeIndex === i ? 1 : 0.3,
                  scale: activeIndex === i ? 1.05 : 1,
                } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className="cursor-pointer transition-all origin-center"
                style={{ transformOrigin: "50px 50px" }}
              />
            );
          })}
          {/* Center circle */}
          <circle cx="50" cy="50" r="20" fill="hsl(var(--card))" />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">100%</p>
            <p className="text-xs text-muted-foreground">BTC Revenue</p>
          </div>
        </div>
      </motion.div>

      {/* Allocation Cards */}
      <div className="space-y-4">
        {allocations.map((allocation, i) => (
          <motion.div
            key={i}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeIndex === i 
                ? "border-primary bg-primary/5 shadow-lg" 
                : "border-border bg-card hover:border-primary/50"
            }`}
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.1 }}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${allocation.bgColor} flex items-center justify-center flex-shrink-0`}>
                <allocation.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-foreground">{allocation.label}</h3>
                  <span className="text-2xl font-bold text-foreground">{allocation.percentage}%</span>
                </div>
                <p className="text-sm text-primary font-medium mb-2">{allocation.description}</p>
                <motion.p
                  className="text-sm text-muted-foreground"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: activeIndex === i ? "auto" : 0, 
                    opacity: activeIndex === i ? 1 : 0 
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {allocation.longDesc}
                </motion.p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
