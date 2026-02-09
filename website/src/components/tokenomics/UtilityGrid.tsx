import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Wallet, Award, Medal, Ticket, Gamepad2, ShoppingCart, TrendingUp } from "lucide-react";

const utilities = [
  {
    icon: Wallet,
    title: "Staking Required",
    description: "Lock SYNX tokens to activate and boost your BTC mining rewards. More staked = higher earnings multiplier.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Award,
    title: "XP Rewards",
    description: "Earn experience points for ecosystem activity. Complete tasks, refer users, and engage to level up.",
    color: "bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))]",
  },
  {
    icon: Medal,
    title: "NFT Mining Certificates",
    description: "Each mining package comes with an NFT certificate proving your hashrate ownership. Tradeable and verifiable.",
    color: "bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))]",
  },
  {
    icon: Ticket,
    title: "Lottery Participation",
    description: "Stake to unlock lottery tiers. Higher stakes = more lottery entries and bigger potential prizes.",
    color: "bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]",
  },
  {
    icon: Gamepad2,
    title: "Gaming Integration",
    description: "Use SYNX for in-game upgrades, boosts, and multipliers. Gaming ecosystem powered by real token utility.",
    color: "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce Spending",
    description: "Pay for products and services with SYNX. Exclusive discounts for token holders across partner merchants.",
    color: "bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]",
  },
  {
    icon: TrendingUp,
    title: "Treasury Growth",
    description: "Your staked tokens contribute to treasury growth, which funds new MW capacity and ecosystem expansion.",
    color: "bg-primary/10 text-primary",
  },
];

export const UtilityGrid = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {utilities.map((utility, i) => (
        <motion.div
          key={i}
          className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1 }}
        >
          <motion.div
            className={`w-14 h-14 rounded-2xl ${utility.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <utility.icon className="w-7 h-7" />
          </motion.div>
          <h3 className="font-bold text-lg mb-2 text-foreground">{utility.title}</h3>
          <p className="text-sm text-muted-foreground">{utility.description}</p>
        </motion.div>
      ))}
      
      {/* CTA Card */}
      <motion.div
        className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-center items-center text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: utilities.length * 0.1 }}
      >
        <p className="text-lg font-semibold text-foreground mb-2">
          SYNX is the economic engine
        </p>
        <p className="text-sm text-muted-foreground">
          Every utility creates demand. Every demand strengthens the ecosystem.
        </p>
      </motion.div>
    </div>
  );
};
