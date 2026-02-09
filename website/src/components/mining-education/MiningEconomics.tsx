import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export function MiningEconomics() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [hashrate, setHashrate] = useState(100); // TH/s
  const [electricityRate, setElectricityRate] = useState(0.08); // $/kWh
  const [btcPrice, setBtcPrice] = useState(100000); // $

  // Simplified mining calculations
  const powerConsumption = hashrate * 25; // ~25W per TH/s for modern ASICs
  const dailyPowerKwh = (powerConsumption * 24) / 1000;
  const dailyElectricityCost = dailyPowerKwh * electricityRate;
  const monthlyElectricityCost = dailyElectricityCost * 30;
  
  // Estimated BTC earnings (simplified - actual depends on network difficulty)
  const dailyBtcEarnings = (hashrate / 600000000) * 450; // Rough estimate
  const dailyUsdEarnings = dailyBtcEarnings * btcPrice;
  const monthlyUsdEarnings = dailyUsdEarnings * 30;
  const monthlyProfit = monthlyUsdEarnings - monthlyElectricityCost;

  const profitabilityFactors = [
    {
      factor: "Bitcoin Price",
      impact: "High",
      description: "Higher BTC price directly increases USD value of mined coins",
      icon: "📈",
    },
    {
      factor: "Network Difficulty",
      impact: "High",
      description: "Higher difficulty means more competition and less BTC per hashrate",
      icon: "🎯",
    },
    {
      factor: "Electricity Cost",
      impact: "High",
      description: "Electricity is the largest ongoing expense for miners",
      icon: "⚡",
    },
    {
      factor: "Hardware Efficiency",
      impact: "Medium",
      description: "More efficient ASICs produce more hashrate per watt",
      icon: "🔧",
    },
    {
      factor: "Block Reward",
      impact: "Medium",
      description: "Halving events reduce new BTC creation by 50%",
      icon: "🎁",
    },
    {
      factor: "Pool Fees",
      impact: "Low",
      description: "Mining pools typically charge 1-3% of earnings",
      icon: "🏊",
    },
  ];

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto">
      {/* Interactive Calculator */}
      <motion.div
        className="p-8 rounded-2xl bg-card border border-border mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        <h3 className="text-xl font-bold mb-6 text-center">Mining Profitability Calculator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Hashrate slider */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Hashrate: <span className="text-primary">{hashrate} TH/s</span>
            </label>
            <Slider
              value={[hashrate]}
              onValueChange={(v) => setHashrate(v[0])}
              min={10}
              max={500}
              step={10}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Your mining power</p>
          </div>

          {/* Electricity rate slider */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Electricity: <span className="text-primary">${electricityRate.toFixed(2)}/kWh</span>
            </label>
            <Slider
              value={[electricityRate * 100]}
              onValueChange={(v) => setElectricityRate(v[0] / 100)}
              min={3}
              max={20}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Your power cost</p>
          </div>

          {/* BTC price slider */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              BTC Price: <span className="text-primary">${btcPrice.toLocaleString()}</span>
            </label>
            <Slider
              value={[btcPrice / 1000]}
              onValueChange={(v) => setBtcPrice(v[0] * 1000)}
              min={20}
              max={200}
              step={5}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Current Bitcoin price</p>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            className="p-4 rounded-xl bg-muted text-center"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-2xl font-bold text-primary">
              {dailyBtcEarnings.toFixed(6)}
            </div>
            <div className="text-xs text-muted-foreground">Daily BTC</div>
          </motion.div>
          <div className="p-4 rounded-xl bg-muted text-center">
            <div className="text-2xl font-bold">${dailyUsdEarnings.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Daily Revenue</div>
          </div>
          <div className="p-4 rounded-xl bg-muted text-center">
            <div className="text-2xl font-bold text-red-500">
              -${monthlyElectricityCost.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Monthly Power</div>
          </div>
          <div className={`p-4 rounded-xl text-center ${monthlyProfit > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <div className={`text-2xl font-bold ${monthlyProfit > 0 ? "text-green-500" : "text-red-500"}`}>
              ${monthlyProfit.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Monthly Profit</div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          * Estimates only. Actual earnings depend on network difficulty and other factors.
        </p>
      </motion.div>

      {/* Profitability Factors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold mb-6 text-center">Factors Affecting Mining Profitability</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profitabilityFactors.map((item, index) => (
            <motion.div
              key={item.factor}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{item.factor}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.impact === "High" 
                        ? "bg-red-500/10 text-red-500" 
                        : item.impact === "Medium"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-green-500/10 text-green-500"
                    }`}>
                      {item.impact} Impact
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Cost Breakdown Pie Chart Visual */}
      <motion.div
        className="mt-12 p-8 rounded-2xl bg-card border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-bold mb-6 text-center">Typical Mining Cost Breakdown</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Visual pie representation */}
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Electricity - 70% */}
              <circle
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="hsl(var(--primary))"
                strokeWidth="20"
                strokeDasharray="175.93 251.33"
                strokeDashoffset="0"
              />
              {/* Hardware depreciation - 20% */}
              <circle
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="hsl(var(--chart-2))"
                strokeWidth="20"
                strokeDasharray="50.27 251.33"
                strokeDashoffset="-175.93"
              />
              {/* Other - 10% */}
              <circle
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="hsl(var(--chart-3))"
                strokeWidth="20"
                strokeDasharray="25.13 251.33"
                strokeDashoffset="-226.2"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <span className="font-medium">Electricity</span>
              <span className="text-muted-foreground">~70%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-chart-2" />
              <span className="font-medium">Hardware Depreciation</span>
              <span className="text-muted-foreground">~20%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-chart-3" />
              <span className="font-medium">Cooling & Maintenance</span>
              <span className="text-muted-foreground">~10%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
