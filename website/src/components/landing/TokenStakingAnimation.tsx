import { motion } from "framer-motion";
import { TrendingUp, Coins, Zap } from "lucide-react";
import CountUp from "react-countup";

export const TokenStakingAnimation = () => {
  return (
    <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] flex items-center justify-center overflow-hidden px-4">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-accent/20 to-transparent"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Central staking pool */}
      <motion.div
        className="relative z-10 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-primary/30 sm:border-2 max-w-[280px] sm:max-w-none"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.div
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-background" />
          </motion.div>
          
          <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Current APY</div>
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent mb-1">
            <CountUp end={18.5} decimals={1} duration={2} suffix="%" />
          </div>
          
          <motion.div
            className="text-[10px] sm:text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2 sm:mt-3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>Auto-compounding</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Coins flowing into the pool from mining - reduced on mobile */}
      {[...Array(10)].map((_, i) => {
        const angle = (i * Math.PI * 2) / 10;
        const radius = 180;
        
        return (
          <motion.div
            key={i}
            className={`absolute w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary items-center justify-center shadow-lg ${i % 2 !== 0 ? 'hidden sm:flex' : 'flex'}`}
            style={{
              left: `${50 + Math.cos(angle) * (radius / 4)}%`,
              top: `${50 + Math.sin(angle) * (radius / 4)}%`,
            }}
            animate={{
              x: [
                Math.cos(angle) * radius,
                Math.cos(angle) * (radius / 2),
                0,
              ],
              y: [
                Math.sin(angle) * radius,
                Math.sin(angle) * (radius / 2),
                0,
              ],
              scale: [1, 0.8, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          >
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary-foreground" />
          </motion.div>
        );
      })}

      {/* Mining revenue label */}
      <motion.div
        className="absolute top-2 left-2 sm:top-4 sm:left-4 md:top-8 md:left-8 bg-card/80 backdrop-blur-sm rounded-lg px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm font-semibold text-foreground border border-border flex items-center gap-1 sm:gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-pulse" />
        <span className="hidden sm:inline">Mining Revenue Share</span>
        <span className="sm:hidden">Mining</span>
      </motion.div>

      {/* Total staked indicator */}
      <motion.div
        className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 md:bottom-8 md:right-8 bg-primary/10 rounded-lg px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border border-primary/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Total Staked</div>
        <div className="text-sm sm:text-base md:text-lg font-bold text-primary">
          <CountUp end={2450000} duration={2} separator="," prefix="$" />
        </div>
      </motion.div>
    </div>
  );
};
