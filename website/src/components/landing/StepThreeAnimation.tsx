import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CountUp from "react-countup";

export const StepThreeAnimation = () => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBalance((prev) => {
        const newBalance = prev + 0.00024;
        return newBalance > 0.05 ? 0.03 : newBalance; // Cap and reset
      });
    }, 2000); // Slowed down from 500ms to 2000ms
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central Wallet */}
      <motion.div
        className="relative z-20 w-64 h-80 rounded-3xl backdrop-blur-sm border-2 border-primary/30 p-6 flex flex-col justify-between"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--card) / 0.8))",
          boxShadow: "0 20px 60px rgba(0, 82, 255, 0.3)",
          willChange: "transform",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Wallet Icon */}
        <motion.div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: "hsl(var(--primary))", willChange: "transform" }}
        >
          <div className="text-white text-3xl">₿</div>
        </motion.div>

        {/* Balance Display */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Your Balance</div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp
              start={0}
              end={balance}
              decimals={8}
              duration={1.5}
              separator=","
              suffix=" BTC"
            />
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-20 flex items-end gap-1 px-2">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t"
              style={{ background: "hsl(var(--primary) / 0.6)" }}
              initial={{ height: 0 }}
              animate={{ height: `${30 + (i * 5)}%` }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
              }}
            />
          ))}
        </div>

        {/* Settlement Notification */}
        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 px-4 py-2 rounded-full backdrop-blur-sm border border-green-500/50 text-center"
          style={{
            background: "hsl(var(--card) / 0.9)",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
            willChange: "opacity, transform",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, 20] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
        >
          <div className="text-xs text-green-500 font-semibold">Daily Settlement Received</div>
        </motion.div>
      </motion.div>

      {/* Bitcoin Coins Flowing In - reduced count */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 220;
        
        return (
          <motion.div
            key={i}
            className="absolute w-7 h-7 rounded-full flex items-center justify-center text-base"
            style={{
              background: "linear-gradient(135deg, #F7931A, #FF9500)",
              boxShadow: "0 4px 12px rgba(247, 147, 26, 0.4)",
              left: "50%",
              top: "50%",
              willChange: "transform, opacity",
            }}
            initial={{
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: 0,
              y: 0,
              opacity: [1, 1, 0],
              scale: [1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeIn",
            }}
          >
            ₿
          </motion.div>
        );
      })}

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #F7931A, transparent 70%)",
          filter: "blur(50px)",
          willChange: "transform",
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
