import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function MiningProcessAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: "Transactions", icon: "📤", description: "Users send Bitcoin transactions" },
    { label: "Mempool", icon: "📋", description: "Transactions wait in the mempool" },
    { label: "Mining", icon: "⛏️", description: "Miners compete to solve puzzles" },
    { label: "Block Found", icon: "🎯", description: "Winner creates new block" },
    { label: "Blockchain", icon: "🔗", description: "Block added to the chain" },
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Connection lines */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 hidden md:block" />
      
      {/* Steps */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 relative">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-500 ${
                activeStep === index
                  ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                  : "bg-muted text-muted-foreground"
              }`}
              animate={{
                scale: activeStep === index ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {step.icon}
            </motion.div>
            <motion.p
              className={`mt-3 font-semibold text-sm ${
                activeStep === index ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </motion.p>
            <motion.p
              className={`text-xs text-center max-w-[120px] ${
                activeStep === index ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.description}
            </motion.p>
          </motion.div>
        ))}
      </div>

      {/* Animated particle flow */}
      {activeStep < 4 && (
        <motion.div
          className="absolute top-1/2 h-3 w-3 rounded-full bg-primary hidden md:block"
          initial={{ left: `${activeStep * 25}%`, opacity: 0 }}
          animate={{ 
            left: `${(activeStep + 1) * 25}%`,
            opacity: [0, 1, 1, 0]
          }}
          transition={{ duration: 2.5, ease: "linear" }}
          style={{ transform: "translateY(-50%)" }}
        />
      )}
    </div>
  );
}
