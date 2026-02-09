import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Bitcoin } from "lucide-react";

const locations = ["Texas", "Germany", "Singapore", "UK", "Japan", "Canada", "Australia", "Brazil"];
const amounts = [0.0023, 0.0045, 0.0012, 0.0078, 0.0034, 0.0056, 0.0089, 0.0015];

const generatePayout = () => ({
  location: locations[Math.floor(Math.random() * locations.length)],
  amount: amounts[Math.floor(Math.random() * amounts.length)],
  time: Math.floor(Math.random() * 5) + 1,
});

export const PayoutTicker = () => {
  const [payout, setPayout] = useState(generatePayout());

  useEffect(() => {
    const interval = setInterval(() => {
      setPayout(generatePayout());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-success"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={`${payout.location}-${payout.amount}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-sm"
        >
          <Bitcoin className="h-3.5 w-3.5 text-chart-3" />
          <span className="text-muted-foreground">
            Miner in <span className="text-foreground font-medium">{payout.location}</span> earned{" "}
            <span className="text-success font-semibold">{payout.amount.toFixed(4)} BTC</span>
            <span className="text-muted-foreground/70"> • {payout.time}m ago</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
