import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Package, Bitcoin, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "User Buys Package",
    description: "Hashrate activates",
    position: { top: "5%", left: "50%", transform: "translateX(-50%)" },
  },
  {
    icon: Bitcoin,
    title: "BTC Generated",
    description: "Daily mining rewards",
    position: { top: "22%", right: "5%" },
  },
  {
    icon: TrendingDown,
    title: "Buybacks Execute",
    description: "Supply reduced",
    position: { top: "55%", right: "5%" },
  },
  {
    icon: TrendingUp,
    title: "Price Strengthens",
    description: "More staking demand",
    position: { bottom: "5%", left: "50%", transform: "translateX(-50%)" },
  },
  {
    icon: Users,
    title: "More Users Join",
    description: "Network effect",
    position: { top: "55%", left: "5%" },
  },
  {
    icon: Zap,
    title: "Treasury Reinvests",
    description: "More MW capacity",
    position: { top: "22%", left: "5%" },
  },
];

export const FlywheelAnimation = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <div ref={ref} className="relative max-w-4xl mx-auto">
      {/* Desktop circular layout */}
      <div className="hidden md:block relative aspect-square max-w-2xl mx-auto">
        {/* Central spinning circle */}
        <motion.div
          className="absolute inset-[25%] rounded-full border-4 border-dashed border-primary/30"
          animate={inView ? { rotate: 360 } : {}}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner glow */}
        <motion.div
          className="absolute inset-[30%] rounded-full bg-primary/10"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Center text */}
        <div className="absolute inset-[32%] flex items-center justify-center">
          <div className="text-center">
            <motion.p
              className="text-2xl font-bold text-primary"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Flywheel
            </motion.p>
            <p className="text-sm text-muted-foreground">Self-reinforcing</p>
          </div>
        </div>
        
        {/* Connecting arrows (animated) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <motion.path
            d="M 50 12 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.3"
            strokeDasharray="5 5"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.path
            d="M 88 50 A 38 38 0 0 1 50 88"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.3"
            strokeDasharray="5 5"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
          />
          <motion.path
            d="M 50 88 A 38 38 0 0 1 12 50"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.3"
            strokeDasharray="5 5"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1, delay: 1.1 }}
          />
          <motion.path
            d="M 12 50 A 38 38 0 0 1 50 12"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.3"
            strokeDasharray="5 5"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1, delay: 1.4 }}
          />
        </svg>
        
        {/* Step nodes */}
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="absolute w-32 text-center"
            style={step.position as any}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
          >
            <motion.div
              className="w-14 h-14 rounded-2xl bg-card border border-border shadow-lg flex items-center justify-center mx-auto mb-2"
              whileHover={{ scale: 1.1, borderColor: "hsl(var(--primary))" }}
            >
              <step.icon className="w-7 h-7 text-primary" />
            </motion.div>
            <p className="font-semibold text-sm text-foreground">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Mobile vertical layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1 }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent mt-2" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </motion.div>
        ))}
        
        {/* Loop back indicator */}
        <motion.div
          className="flex items-center gap-4 pt-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <div className="w-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary flex items-center justify-center">
              <motion.span
                className="text-primary text-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                ↻
              </motion.span>
            </div>
          </div>
          <p className="text-sm text-primary font-medium">Cycle repeats exponentially</p>
        </motion.div>
      </div>
    </div>
  );
};
