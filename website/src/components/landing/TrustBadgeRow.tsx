import { motion } from "framer-motion";
import { Shield, CheckCircle, Clock, Lock } from "lucide-react";

const badges = [
  { icon: Shield, label: "SOC 2 Certified" },
  { icon: CheckCircle, label: "KYC/AML Compliant" },
  { icon: Lock, label: "Audited Operations" },
  { icon: Clock, label: "24/7 Monitoring" },
];

export const TrustBadgeRow = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="flex flex-wrap gap-4 justify-center lg:justify-start mt-8"
    >
      {badges.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 + index * 0.1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
        >
          <badge.icon className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">{badge.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};
