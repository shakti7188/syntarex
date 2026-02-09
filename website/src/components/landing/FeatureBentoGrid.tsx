import { AnimatedCard } from "./AnimatedCard";
import { TrendingUp, Users, Shield, BarChart3, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";

export const FeatureBentoGrid = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Intelligent 3-Tier Commissions",
      description: "Earn from three generations of partners with our proven 10%/5%/3% structure. Smart caps ensure fairness while maximizing your passive income potential. Build deep, earn automatically.",
      color: "hsl(var(--neon-cyan))",
      size: "large",
    },
    {
      icon: Users,
      title: "Balanced Binary System",
      description: "Revolutionary weak-leg distribution ensures your entire team grows together. 10% commissions with intelligent carry-forward protection means no effort goes unrewarded—ever.",
      color: "hsl(var(--neon-magenta))",
      size: "large",
    },
    {
      icon: Shield,
      title: "Bulletproof Sustainability",
      description: "Sleep soundly knowing our multi-layered 40% safety protocols and real-time auto-scaling prevent system collapse. Built to thrive for decades, not months.",
      color: "hsl(var(--neon-blue))",
      size: "medium",
    },
    {
      icon: BarChart3,
      title: "Set-and-Forget Settlements",
      description: "Every Monday morning, wake up to verified blockchain payments. Zero manual work, zero delays, zero disputes. Our automated engine handles thousands of transactions flawlessly.",
      color: "hsl(var(--neon-purple))",
      size: "medium",
    },
    {
      icon: Zap,
      title: "Crystal-Clear Intelligence",
      description: "See exactly where every dollar flows with real-time dashboards, predictive earnings forecasts, and interactive network maps. Make data-driven decisions with confidence.",
      color: "hsl(var(--primary))",
      size: "medium",
    },
    {
      icon: Award,
      title: "Merit-Based Ascension",
      description: "Climb the ranks and unlock exponential rewards. Each promotion brings enhanced multipliers, exclusive overrides, and recognition that compounds your income automatically.",
      color: "hsl(var(--accent))",
      size: "medium",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {features.map((feature, i) => {
        const Icon = feature.icon;
        const isLarge = feature.size === "large";
        
        return (
          <AnimatedCard
            key={i}
            delay={i * 0.1}
            className={`p-6 h-full flex flex-col ${isLarge ? "md:col-span-2 lg:col-span-1" : ""}`}
          >
            {/* Icon container with animated background */}
            <motion.div
              className="mb-4 relative"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: `${feature.color}20`,
                }}
              >
                {/* Animated glow */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    boxShadow: [
                      `0 0 20px ${feature.color}40`,
                      `0 0 40px ${feature.color}60`,
                      `0 0 20px ${feature.color}40`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                <Icon className="w-7 h-7 relative z-10" style={{ color: feature.color }} />
              </div>
            </motion.div>
            
            {/* Content */}
            <h3 className="text-lg md:text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed flex-grow">{feature.description}</p>
            
            {/* Decorative gradient line */}
            <motion.div
              className="mt-4 h-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${feature.color}, transparent)`,
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
            />
          </AnimatedCard>
        );
      })}
    </div>
  );
};
