import { motion } from "framer-motion";

export const MiningAnimation = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Isometric Mining Farm Grid */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1000px" }}>
        <div 
          className="grid grid-cols-4 gap-8"
          style={{ 
            transform: "rotateX(60deg) rotateZ(45deg)",
            transformStyle: "preserve-3d"
          }}
        >
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
            >
              {/* Mining Rig Container */}
              <div 
                className="w-20 h-28 relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front Face */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-800 rounded-sm border border-slate-600"
                  style={{
                    transform: "translateZ(10px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                  }}
                >
                  {/* LED Indicators */}
                  <div className="flex gap-1 p-2">
                    {[...Array(3)].map((_, j) => (
                      <motion.div
                        key={j}
                        className="w-1.5 h-1.5 rounded-full"
                        animate={{
                          backgroundColor: [
                            "rgb(34, 197, 94)",
                            "rgb(22, 163, 74)",
                            "rgb(34, 197, 94)"
                          ],
                          boxShadow: [
                            "0 0 4px rgb(34, 197, 94)",
                            "0 0 8px rgb(34, 197, 94)",
                            "0 0 4px rgb(34, 197, 94)"
                          ]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: (i + j) * 0.1
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Ventilation Grill Pattern */}
                  <div className="grid grid-cols-4 gap-0.5 p-2 mt-2">
                    {[...Array(16)].map((_, k) => (
                      <div key={k} className="w-full h-1 bg-slate-900 rounded-sm" />
                    ))}
                  </div>
                </motion.div>

                {/* Top Face */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 rounded-sm"
                  style={{
                    transform: "rotateX(90deg) translateZ(10px)",
                    transformOrigin: "top"
                  }}
                />

                {/* Side Face */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-sm"
                  style={{
                    transform: "rotateY(90deg) translateZ(10px)",
                    transformOrigin: "right"
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Central Bitcoin with Orbital Rings */}
      <div className="relative z-20 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {/* Rotating Bitcoin */}
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative w-48 h-48 md:w-64 md:h-64"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#F7931A] to-[#ff9500] shadow-2xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-32 h-32 md:w-40 md:h-40 text-white">
                  <path
                    fill="currentColor"
                    d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Orbital Rings */}
          {[1, 1.3, 1.6].map((scale, idx) => (
            <motion.div
              key={idx}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              animate={{ 
                rotate: 360,
                scale: [scale, scale * 1.05, scale]
              }}
              transition={{ 
                rotate: { duration: 15 + idx * 5, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div 
                className="rounded-full border-2 opacity-20"
                style={{ 
                  width: `${scale * 100}%`,
                  height: `${scale * 100}%`,
                  borderColor: idx === 1 ? "#F7931A" : "#0052FF"
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Data Particle Flow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              width: Math.random() > 0.5 ? "2px" : "3px",
              height: Math.random() > 0.5 ? "2px" : "3px",
              backgroundColor: Math.random() > 0.5 ? "#0052FF" : "#F7931A"
            }}
            animate={{
              y: ["100vh", "-20vh"],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Ambient Background Glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#0052FF]/5 via-transparent to-[#F7931A]/5"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Edge Fade Mask - Blends animation into background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        {/* Left fade */}
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
        {/* Right fade */}
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
};
