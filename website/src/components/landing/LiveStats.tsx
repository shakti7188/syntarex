import { motion } from "framer-motion";
import CountUp from "react-countup";
import { TrendingUp, Zap, Activity } from "lucide-react";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";

export const LiveStats = () => {
  const { data: marketData, isLoading: marketLoading } = useBitcoinMarketData();

  const stats = [
    { 
      label: "Bitcoin Price", 
      value: marketData?.price || 95000, 
      icon: TrendingUp, 
      prefix: "$", 
      color: "hsl(var(--primary))",
      loading: marketLoading
    },
    { 
      label: "Network Hashrate", 
      value: marketData?.networkHashrate || 750, 
      icon: Zap, 
      suffix: " EH/s", 
      color: "hsl(var(--primary))",
      loading: marketLoading
    },
    { 
      label: "Energy Pipeline", 
      value: 1.35, 
      icon: Activity, 
      suffix: "GW", 
      decimals: 2,
      color: "hsl(var(--primary))",
      loading: false
    },
    { 
      label: "Uptime", 
      value: 99.9, 
      icon: Activity, 
      suffix: "%", 
      decimals: 1, 
      color: "hsl(var(--primary))",
      loading: false
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="relative rounded-2xl backdrop-blur-xl border border-border/30 p-6 overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.4))",
            }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at center, ${stat.color}10, transparent)`,
              }}
            />
            
            {/* Icon */}
            <div className="relative z-10 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${stat.color}20`,
                  boxShadow: `0 0 20px ${stat.color}40`,
                }}
              >
                <Icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
            
            {/* Value */}
            <div className="relative z-10">
              <div className="text-3xl font-bold mb-1">
                {stat.loading ? (
                  <span className="animate-pulse text-muted-foreground">--</span>
                ) : (
                  <>
                    {stat.prefix}
                    <CountUp
                      end={stat.value}
                      duration={2.5}
                      separator=","
                      decimals={stat.decimals || 0}
                      decimal="."
                    />
                    {stat.suffix}
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
            
            {/* Pulse indicator */}
            <div
              className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: stat.color }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
