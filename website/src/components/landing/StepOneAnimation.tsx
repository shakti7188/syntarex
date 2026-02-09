import { motion } from "framer-motion";

export const StepOneAnimation = () => {
  const packages = [
    { name: "Starter", value: "$10K", ths: "5 TH/s", color: "#0052FF" },
    { name: "Growth", value: "$50K", ths: "30 TH/s", color: "#F7931A" },
    { name: "Enterprise", value: "$500K", ths: "350 TH/s", color: "#0052FF" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Ambient Background */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 70%)",
          filter: "blur(40px)",
          willChange: "transform",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Package Cards */}
      <div className="relative z-10 flex gap-8">
        {packages.map((pkg, i) => (
          <motion.div
            key={i}
            className="relative w-40 h-52 rounded-2xl backdrop-blur-sm border border-primary/20 p-4 flex flex-col justify-between"
            style={{
              background: "linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.4))",
              boxShadow: "0 8px 32px rgba(0, 82, 255, 0.15)",
              willChange: "transform",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: 1,
              y: [0, -8, 0],
            }}
            transition={{
              opacity: { delay: i * 0.15, duration: 0.5 },
              y: { delay: i * 0.15 + 0.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            {/* Package Icon */}
            <motion.div
              className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center"
              style={{ background: pkg.color, willChange: "transform" }}
            >
              <div className="text-white font-bold text-xl">⚡</div>
            </motion.div>

            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">{pkg.name}</div>
              <div className="text-2xl font-bold text-foreground mt-1">{pkg.value}</div>
              <div className="text-xs text-primary mt-2">{pkg.ths}</div>
            </div>

            {/* Selection Pulse - simplified */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary"
              style={{ willChange: "opacity" }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 1 + 1,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Coin Particles Flowing - reduced count */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{
            background: i % 2 === 0 ? "#F7931A" : "#0052FF",
            left: "50%",
            bottom: "10%",
            willChange: "transform, opacity",
          }}
          animate={{
            y: [0, -300],
            x: [0, Math.sin(i) * 80],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
