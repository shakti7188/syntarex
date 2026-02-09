import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Flame, Lock, TrendingDown, Coins, ArrowRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const supplyData = [
  { year: 2024, circulating: 100, staked: 0, burned: 0 },
  { year: 2025, circulating: 75, staked: 20, burned: 5 },
  { year: 2026, circulating: 55, staked: 35, burned: 10 },
  { year: 2027, circulating: 40, staked: 45, burned: 15 },
  { year: 2028, circulating: 30, staked: 50, burned: 20 },
];

export const SupplyMechanicsAnimation = () => {
  const [yearIndex, setYearIndex] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  
  const currentData = supplyData[yearIndex];
  const totalSupply = 1000000000;

  const formatNumber = (num: number) => {
    return (num * 10000000).toLocaleString();
  };

  return (
    <div ref={ref} className="space-y-8">
      {/* Timeline Slider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-muted/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">Year</span>
          <span className="text-2xl font-bold text-foreground">{currentData.year}</span>
        </div>
        <Slider
          value={[yearIndex]}
          onValueChange={(value) => setYearIndex(value[0])}
          max={supplyData.length - 1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {supplyData.map((d) => (
            <span key={d.year}>{d.year}</span>
          ))}
        </div>
      </motion.div>

      {/* Supply Visualization */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Circulating Supply */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-muted/30 rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">Circulating</span>
            </div>
            
            {/* Animated Bar */}
            <div className="h-4 bg-muted rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${currentData.circulating}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentData.circulating}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-foreground"
              >
                {currentData.circulating}%
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground">
              {formatNumber(currentData.circulating)} SYNX
            </p>
          </div>
        </motion.div>

        {/* Staked Supply */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-muted/30 rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-medium text-foreground">Staked</span>
            </div>
            
            <div className="h-4 bg-muted rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${currentData.staked}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentData.staked}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-foreground"
              >
                {currentData.staked}%
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground">
              {formatNumber(currentData.staked)} SYNX
            </p>
          </div>
        </motion.div>

        {/* Burned Supply */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-muted/30 rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <span className="font-medium text-foreground">Burned</span>
            </div>
            
            <div className="h-4 bg-muted rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-orange-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${currentData.burned}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentData.burned}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-foreground"
              >
                {currentData.burned}%
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground">
              {formatNumber(currentData.burned)} SYNX
            </p>
          </div>
        </motion.div>
      </div>

      {/* Deflationary Mechanics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-orange-500/10 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="w-6 h-6 text-primary" />
          <h4 className="text-lg font-semibold text-foreground">Deflationary Model</h4>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Buyback & Burn:</strong> 20% of platform revenue used to buy and burn SYNX
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Staking Incentives:</strong> High APY rewards lock tokens, reducing supply
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Fee Burns:</strong> Portion of transaction fees permanently burned
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
