import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

export const SupplyAnimation = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <div ref={ref} className="relative">
      {/* Main supply display */}
      <motion.div
        className="relative bg-card border border-border rounded-3xl p-8 md:p-12 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)'
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Floating tokens */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <Coins className="w-6 h-6 md:w-8 md:h-8 text-primary/40" />
          </motion.div>
        ))}
        
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <p className="text-muted-foreground mb-2">Total Fixed Supply</p>
            <div className="text-5xl md:text-7xl font-bold text-foreground mb-4">
              {inView && (
                <CountUp
                  end={1000000000}
                  duration={2.5}
                  separator=","
                  suffix=" "
                />
              )}
              <span className="text-primary">SYNX</span>
            </div>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              One billion tokens. Fixed forever. No inflation, no minting, no surprises.
            </p>
          </motion.div>
          
          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            {[
              "BTC-Backed",
              "Weekly TWAP Buybacks",
              "Staking Lockups",
              "NFT Mining Certificates",
            ].map((feature, i) => (
              <motion.span
                key={i}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {feature}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
