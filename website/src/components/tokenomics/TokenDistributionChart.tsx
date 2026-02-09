import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Users, Award, Droplets, Lock, Rocket, Building2 } from 'lucide-react';

const distributions = [
  { label: 'Community Rewards', percentage: 35, color: 'hsl(var(--primary))', description: 'Mining rewards & referral bonuses', icon: Award },
  { label: 'Staking Pool', percentage: 25, color: 'hsl(221, 100%, 60%)', description: 'Reserved for staking rewards', icon: Lock },
  { label: 'Liquidity', percentage: 15, color: 'hsl(35, 92%, 50%)', description: 'DEX liquidity provision', icon: Droplets },
  { label: 'Team (Vested)', percentage: 10, color: 'hsl(280, 70%, 50%)', description: '4-year vesting schedule', icon: Users },
  { label: 'Treasury', percentage: 10, color: 'hsl(160, 60%, 45%)', description: 'Platform development & operations', icon: Building2 },
  { label: 'Public Sale', percentage: 5, color: 'hsl(340, 75%, 55%)', description: 'Initial token offering', icon: Rocket },
];

export const TokenDistributionChart = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  // Calculate pie chart segments
  let cumulativePercentage = 0;
  const segments = distributions.map((item, index) => {
    const startAngle = cumulativePercentage * 3.6; // Convert percentage to degrees
    cumulativePercentage += item.percentage;
    const endAngle = cumulativePercentage * 3.6;
    
    return {
      ...item,
      startAngle,
      endAngle,
      index,
    };
  });

  const createArcPath = (startAngle: number, endAngle: number, radius: number, innerRadius: number) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);
    
    const x3 = 100 + innerRadius * Math.cos(endRad);
    const y3 = 100 + innerRadius * Math.sin(endRad);
    const x4 = 100 + innerRadius * Math.cos(startRad);
    const y4 = 100 + innerRadius * Math.sin(startRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <div ref={ref} className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Donut Chart */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <svg viewBox="0 0 200 200" className="w-full max-w-md mx-auto">
          {segments.map((segment, i) => {
            const isActive = activeIndex === i;
            const radius = isActive ? 85 : 80;
            const innerRadius = isActive ? 45 : 50;
            
            return (
              <motion.path
                key={segment.label}
                d={createArcPath(segment.startAngle, segment.endAngle, radius, innerRadius)}
                fill={segment.color}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: isActive ? 1 : 0.85 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className="cursor-pointer transition-all duration-200"
                style={{ 
                  filter: isActive ? 'brightness(1.1)' : 'none',
                  transformOrigin: 'center',
                }}
              />
            );
          })}
          
          {/* Center text */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
          >
            <text 
              x="100" 
              y="95" 
              textAnchor="middle" 
              style={{ fill: 'hsl(var(--foreground))' }}
              className="text-2xl font-bold"
            >
              {activeIndex !== null ? `${distributions[activeIndex].percentage}%` : '1B'}
            </text>
            <text 
              x="100" 
              y="115" 
              textAnchor="middle" 
              style={{ fill: 'hsl(var(--muted-foreground))' }}
              className="text-xs"
            >
              {activeIndex !== null ? distributions[activeIndex].label : 'SYNX Total'}
            </text>
          </motion.g>
        </svg>
      </motion.div>

      {/* Legend */}
      <div className="space-y-3">
        {distributions.map((item, i) => {
          const Icon = item.icon;
          const isActive = activeIndex === i;
          
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive ? 'bg-muted/80 scale-[1.02]' : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: item.color }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="font-bold text-foreground">{item.percentage}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
