import { motion } from "framer-motion";
import { Coins, Wallet } from "lucide-react";

export const TokenAcquireAnimation = () => {
  return (
    <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Central XFLOW token */}
      <motion.div
        className="relative z-10"
        animate={{
          rotateY: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl border-2 sm:border-4 border-background">
          <Coins className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Wallet connection indicator */}
      <motion.div
        className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 md:bottom-16 md:right-16 bg-card rounded-lg sm:rounded-2xl p-2 sm:p-3 md:p-4 shadow-lg border border-border"
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
          <span className="text-xs sm:text-sm font-semibold text-foreground">Connected</span>
        </div>
      </motion.div>

      {/* Floating token particles - reduced on mobile */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/30 items-center justify-center ${i > 7 ? 'hidden sm:flex' : 'flex'}`}
          style={{
            left: `${50 + Math.cos((i * Math.PI * 2) / 12) * 30}%`,
            top: `${50 + Math.sin((i * Math.PI * 2) / 12) * 30}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        >
          <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary" />
        </motion.div>
      ))}

      {/* Purchase platforms - stack vertically on mobile */}
      <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-2 sm:gap-4">
        {["DEX", "BNB Chain", "BEP-20"].map((platform, i) => (
          <motion.div
            key={platform}
            className="bg-card/80 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs font-semibold text-foreground border border-border whitespace-nowrap"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.2 }}
          >
          {platform}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
