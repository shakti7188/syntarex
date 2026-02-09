import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Coins, TrendingUp, Shield, Zap } from 'lucide-react';

const summaryPoints = [
  {
    icon: Coins,
    title: '1 Billion Fixed Supply',
    description: 'No inflation, ever. Total supply is permanently capped.',
  },
  {
    icon: TrendingUp,
    title: 'Deflationary Mechanics',
    description: 'Buyback & burn reduces supply over time, increasing scarcity.',
  },
  {
    icon: Shield,
    title: 'Bitcoin-Backed Value',
    description: 'Token value tied to real Bitcoin mining operations.',
  },
  {
    icon: Zap,
    title: 'Multi-Utility Token',
    description: 'Discounts, staking rewards, governance, and priority access.',
  },
];

export const QuickSummaryCard = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-2xl p-8"
    >
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
          TL;DR
        </span>
        <h3 className="text-2xl font-bold text-foreground">
          SYNX Token in 30 Seconds
        </h3>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryPoints.map((point, index) => {
          const Icon = point.icon;
          return (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">{point.title}</h4>
              <p className="text-sm text-muted-foreground">{point.description}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
