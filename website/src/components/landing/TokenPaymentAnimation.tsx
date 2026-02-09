import { motion } from "framer-motion";
import { Package, ArrowRight, BadgePercent } from "lucide-react";
import CountUp from "react-countup";

export const TokenPaymentAnimation = () => {
  return (
    <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] flex items-center justify-center overflow-hidden px-4">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-accent/10 to-transparent"
        style={{ willChange: "transform" }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Regular price package */}
      <motion.div
        className="absolute left-0 sm:left-[5%] md:left-[10%] lg:left-[15%] bg-card rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl border border-border max-w-[140px] sm:max-w-none"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Package className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground mb-2 sm:mb-3" />
        <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Regular Price</div>
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground line-through opacity-60">
          $10,000
        </div>
      </motion.div>

      {/* Arrow with flowing particles - hidden on very small screens */}
      <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
        <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{ willChange: "transform, opacity" }}
            animate={{
              x: [0, 60, 60],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* XFLOW discounted price */}
      <motion.div
        className="absolute right-0 sm:right-[5%] md:right-[10%] lg:right-[15%] bg-gradient-to-br from-primary to-primary/80 rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-primary sm:border-2 w-[160px] sm:w-[180px] md:w-[200px]"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        {/* Header with label and badge */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="text-xs sm:text-sm text-primary-foreground/90 font-semibold">With XFLOW</div>
          <motion.div
            className="bg-accent rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 flex items-center gap-0.5 sm:gap-1"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <BadgePercent className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-background" />
            <span className="text-[10px] sm:text-xs font-bold text-background">-10%</span>
          </motion.div>
        </div>

        {/* Package icon */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <Package className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary-foreground/90" />
        </div>

        {/* Price */}
        <div className="text-center mb-2 sm:mb-3">
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground">
            $<CountUp end={9000} duration={2} delay={0.8} separator="," />
          </div>
        </div>

        {/* Savings */}
        <div className="text-center">
          <div className="text-xs sm:text-sm text-primary-foreground/70">
            Save $<CountUp end={1000} duration={2} delay={1} separator="," />
          </div>
        </div>
      </motion.div>

      {/* Floating coins showing payment flow - hidden on mobile */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="hidden sm:block absolute w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-primary/40 border border-primary sm:border-2"
          style={{
            left: `${35 + i * 8}%`,
            top: "30%",
            willChange: "transform, opacity",
          }}
          animate={{
            x: [0, 100, 150],
            y: [0, Math.sin(i) * 15],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
