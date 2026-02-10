import { motion } from "framer-motion";
import CountUp from "react-countup";
import xIcon from "@/assets/syntarex-x-icon-3d.png";

export const DataCenterAnimation = () => {
  // Server rack configuration - 6 units for optimal performance
  const servers = [
    { id: 1, row: 0, col: 0, delay: 0 },
    { id: 2, row: 0, col: 1, delay: 0.2 },
    { id: 3, row: 0, col: 2, delay: 0.4 },
    { id: 4, row: 1, col: 0, delay: 0.6 },
    { id: 5, row: 1, col: 1, delay: 0.8 },
    { id: 6, row: 1, col: 2, delay: 1.0 },
  ];

  // Energy flow particles - reduced from 40 to 10 for performance
  const energyParticles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    duration: 3 + (i % 3),
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background ambient glow */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15), transparent 70%)`,
        }}
      />

      {/* Main container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-8">
        
        {/* Hashrate display */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-4"
        >
          <div className="text-sm text-muted-foreground mb-1">Processing Power</div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp end={850} duration={3} /> PH/s
          </div>
        </motion.div>

        {/* Server rack grid */}
        <div className="relative grid grid-cols-3 gap-8 mb-8">
          {servers.map((server) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: server.delay, duration: 0.5 }}
              className="relative"
              style={{ willChange: "transform" }}
            >
              {/* Server rack body */}
              <div className="relative w-24 h-32 bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg border border-slate-600 shadow-lg">
                {/* LED indicators - top */}
                <div className="absolute top-2 left-2 right-2 flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: server.delay,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-green-400"
                    style={{ willChange: "opacity" }}
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: server.delay + 0.3,
                    }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      background: "hsl(var(--primary))",
                      willChange: "opacity" 
                    }}
                  />
                </div>

                {/* Server slots */}
                <div className="absolute top-6 left-2 right-2 space-y-1">
                  {[1, 2, 3, 4].map((slot) => (
                    <div
                      key={slot}
                      className="h-1.5 bg-slate-900 rounded-sm border border-slate-600"
                    />
                  ))}
                </div>

                {/* SynteraX logo */}
                <motion.div
                  className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-500/50 flex items-center justify-center overflow-hidden"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                    delay: server.delay,
                  }}
                  style={{ willChange: "transform" }}
                >
                  <img src={xIcon} alt="" className="w-5 h-5 object-contain" />
                </motion.div>

                {/* Data processing glow */}
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: server.delay,
                  }}
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: `radial-gradient(circle at center, hsl(var(--primary) / 0.2), transparent 60%)`,
                    willChange: "opacity",
                  }}
                />
              </div>

              {/* Energy flow connection lines to center */}
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                width="400"
                height="400"
                style={{ overflow: "visible" }}
              >
                <motion.path
                  d={`M ${server.col * 32 - 48} ${server.row * 40 - 20} L 0 0`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{
                    delay: server.delay + 1,
                    duration: 1,
                    opacity: { delay: server.delay + 1, duration: 0.5 },
                  }}
                  style={{ willChange: "auto" }}
                />
                <motion.path
                  d={`M ${server.col * 32 - 48} ${server.row * 40 - 20} L 0 0`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  fill="none"
                  strokeDashoffset={0}
                  animate={{ strokeDashoffset: [-8, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                    delay: server.delay,
                  }}
                  style={{ opacity: 0.6, willChange: "auto" }}
                />
              </svg>
            </motion.div>
          ))}
        </div>

        {/* Central mining core - Bitcoin symbol */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {/* Pulsing glow ring */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 -m-8 rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)`,
              willChange: "transform, opacity",
            }}
          />

          {/* Bitcoin core icon */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl border-4 border-background">
            <span className="text-4xl font-bold text-white">₿</span>
            
            {/* Active status indicator */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background"
              style={{ willChange: "transform" }}
            />
          </div>

          {/* Orbital ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 -m-12"
            style={{ willChange: "transform" }}
          >
            <div
              className="w-full h-full rounded-full border-2 border-dashed opacity-20"
              style={{ borderColor: "hsl(var(--primary))" }}
            />
          </motion.div>
        </motion.div>

        {/* Energy flow particles */}
        {energyParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [100, -100],
              x: [
                Math.sin(particle.id) * 50,
                Math.sin(particle.id + Math.PI) * 50,
              ],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear",
            }}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: "hsl(var(--primary))",
              left: "50%",
              top: "50%",
              willChange: "transform, opacity",
            }}
          />
        ))}

        {/* Status text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center mt-8"
        >
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">
              All Systems Operational
            </span>
          </div>
        </motion.div>
      </div>

      {/* Fade mask edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, 
              hsl(var(--background)) 0%, 
              transparent 15%, 
              transparent 85%, 
              hsl(var(--background)) 100%)`,
          }}
        />
      </div>
    </div>
  );
};
