import { motion } from "framer-motion";

export const StepTwoAnimation = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Isometric Data Center Grid */}
      <div 
        className="relative"
        style={{
          transform: "rotateX(60deg) rotateZ(45deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Server Racks Grid */}
        {[...Array(16)].map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-lg"
              style={{
                width: "60px",
                height: "80px",
                left: `${col * 70}px`,
                top: `${row * 90}px`,
                background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted)))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 12px rgba(0, 82, 255, 0.1)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: i * 0.05,
                duration: 0.4,
              }}
            >
              {/* LED Indicators */}
              <div className="flex flex-col gap-1 p-2">
                {[...Array(4)].map((_, ledIndex) => (
                  <motion.div
                    key={ledIndex}
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{
                      opacity: [1, 0.3, 1],
                      boxShadow: [
                        "0 0 4px rgba(34, 197, 94, 0.8)",
                        "0 0 2px rgba(34, 197, 94, 0.3)",
                        "0 0 4px rgba(34, 197, 94, 0.8)",
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1 + ledIndex * 0.2,
                    }}
                  />
                ))}
              </div>

              {/* Ventilation Lines */}
              <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
                {[...Array(3)].map((_, lineIndex) => (
                  <div
                    key={lineIndex}
                    className="h-0.5 bg-muted-foreground/20 rounded"
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Monitoring Dashboard Overlay */}
      <motion.div
        className="absolute top-8 right-8 w-48 rounded-xl backdrop-blur-md border border-primary/20 p-4"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card) / 0.9), hsl(var(--card) / 0.7))",
          boxShadow: "0 8px 32px rgba(0, 82, 255, 0.2)",
        }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="text-xs font-semibold text-foreground mb-3">System Status</div>
        
        {/* Uptime Indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Uptime</span>
          <motion.span
            className="text-xs font-bold text-green-500"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            99.98%
          </motion.span>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Temp</span>
          <span className="text-xs font-bold text-foreground">62°C</span>
        </div>

        {/* Hashrate Graph */}
        <div className="mt-3 h-12 flex items-end gap-1">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t"
              style={{ background: "hsl(var(--primary))" }}
              initial={{ height: 0 }}
              animate={{ height: `${40 + Math.random() * 60}%` }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Data Flow Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: "blur(1px)",
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};
