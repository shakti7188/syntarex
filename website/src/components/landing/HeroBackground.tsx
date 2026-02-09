import { motion } from "framer-motion";

// Soft gradient orb component
const GradientOrb = ({ 
  color, 
  size, 
  initialX, 
  initialY, 
  animateX, 
  animateY,
  duration,
  blur = 100
}: { 
  color: string; 
  size: number; 
  initialX: string; 
  initialY: string;
  animateX: string[];
  animateY: string[];
  duration: number;
  blur?: number;
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ 
      background: color,
      width: size,
      height: size,
      left: initialX,
      top: initialY,
      filter: `blur(${blur}px)`,
    }}
    animate={{ 
      x: animateX,
      y: animateY,
      scale: [1, 1.1, 0.95, 1.05, 1],
    }}
    transition={{ 
      duration,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }}
  />
);

export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary blue orb - top left area */}
      <GradientOrb
        color="hsla(221, 100%, 50%, 0.25)"
        size={600}
        initialX="-10%"
        initialY="-20%"
        animateX={["0%", "5%", "-3%", "2%"]}
        animateY={["0%", "8%", "3%", "-2%"]}
        duration={20}
        blur={120}
      />
      
      {/* Bitcoin orange accent - right side */}
      <GradientOrb
        color="hsla(38, 92%, 53%, 0.12)"
        size={500}
        initialX="60%"
        initialY="20%"
        animateX={["0%", "-4%", "3%", "-2%"]}
        animateY={["0%", "5%", "-3%", "4%"]}
        duration={25}
        blur={100}
      />
      
      {/* Secondary lighter blue - bottom center */}
      <GradientOrb
        color="hsla(221, 100%, 65%, 0.15)"
        size={450}
        initialX="30%"
        initialY="50%"
        animateX={["0%", "3%", "-2%", "1%"]}
        animateY={["0%", "-4%", "2%", "-1%"]}
        duration={18}
        blur={110}
      />

      {/* Subtle grid pattern - very faint */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />

      {/* Edge fade masks for smooth blending */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background opacity-40" />
    </div>
  );
};
