import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { UserPlus, Target, Zap, TrendingUp, Award, Wallet } from "lucide-react";

export const InteractiveTimeline = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Join in 60 Seconds",
      description: "Sign up and connect your Web3 wallet. No lengthy applications, no waiting periods. Start building your empire immediately with enterprise-grade security from day one.",
      color: "hsl(var(--neon-cyan))",
    },
    {
      icon: Target,
      title: "Design Your Dynasty",
      description: "Invite partners and watch your network materialize in real-time. Our intelligent placement algorithm optimizes your binary structure while you focus on relationships, not spreadsheets.",
      color: "hsl(var(--neon-magenta))",
    },
    {
      icon: Zap,
      title: "Power Up Revenue Streams",
      description: "Activate mining operations or leverage other transaction sources. Every dollar flowing through your network triggers the commission engine automatically—no manual tracking required.",
      color: "hsl(var(--neon-blue))",
    },
    {
      icon: TrendingUp,
      title: "Watch Money Flow In",
      description: "Commission calculations happen instantly with every transaction. Direct referrals, binary volume, leadership overrides—all calculated and tracked in real-time. Zero guesswork, pure mathematics.",
      color: "hsl(var(--neon-purple))",
    },
    {
      icon: Award,
      title: "Accelerate Your Ascent",
      description: "Hit milestones, climb ranks, multiply earnings. Each promotion permanently increases your commission rates and unlocks new passive income streams from your entire downline.",
      color: "hsl(var(--primary))",
    },
    {
      icon: Wallet,
      title: "Get Paid Automatically",
      description: "Every Monday at 9 AM UTC, verified stablecoin settlements hit your wallet. Blockchain-certified, audit-ready, dispute-proof. Your earnings, delivered like clockwork.",
      color: "hsl(var(--accent))",
    },
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <div className="relative py-16" ref={ref}>
      <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
        From Zero to Earning in 6 Steps
      </h2>
      
      <div className="relative max-w-4xl mx-auto">
        {/* Animated line */}
        <motion.div
          className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary hidden md:block"
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
        
        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 0;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className={`flex items-center gap-8 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                {/* Content */}
                <div className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-block rounded-2xl backdrop-blur-xl border border-border/30 p-6"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--card) / 0.9), hsl(var(--card) / 0.6))",
                    }}
                  >
                    <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </motion.div>
                </div>
                
                {/* Icon node */}
                <motion.div
                  className="relative z-10 shrink-0"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl border-2"
                    style={{
                      backgroundColor: `${step.color}20`,
                      borderColor: step.color,
                      boxShadow: `0 0 30px ${step.color}60`,
                    }}
                  >
                    <Icon className="w-8 h-8" style={{ color: step.color }} />
                  </div>
                  
                  {/* Pulse rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: step.color }}
                    animate={{
                      scale: [1, 1.5, 1.5],
                      opacity: [0.8, 0, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                </motion.div>
                
                {/* Spacer for alignment */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
