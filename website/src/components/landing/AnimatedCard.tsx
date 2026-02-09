import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover3d?: boolean;
}

export const AnimatedCard = ({ children, className, delay = 0, hover3d = true }: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover3d ? { scale: 1.01 } : {}}
      className={cn(
        "relative rounded-2xl overflow-hidden group",
        "bg-card",
        "shadow-sm hover:shadow-md",
        "transition-all duration-300",
        className
      )}
      style={{
        willChange: "transform",
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
