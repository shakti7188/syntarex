import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const hardwareData = [
  {
    year: "2009",
    type: "CPU",
    name: "Intel Core 2 Duo",
    hashrate: "2 MH/s",
    efficiency: "Very Low",
    icon: "💻",
    description: "The first Bitcoin miners used regular computer processors. Satoshi Nakamoto mined the genesis block with a CPU.",
    color: "from-blue-500 to-blue-600",
  },
  {
    year: "2010",
    type: "GPU",
    name: "AMD Radeon HD 5870",
    hashrate: "400 MH/s",
    efficiency: "Low",
    icon: "🎮",
    description: "Graphics cards proved 200x more efficient than CPUs. Miners started building GPU rigs with multiple cards.",
    color: "from-green-500 to-green-600",
  },
  {
    year: "2011",
    type: "FPGA",
    name: "Butterfly Labs",
    hashrate: "800 MH/s",
    efficiency: "Medium",
    icon: "🔧",
    description: "Field-Programmable Gate Arrays offered better efficiency than GPUs but were expensive and complex to configure.",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    year: "2013",
    type: "ASIC Gen 1",
    name: "Antminer S1",
    hashrate: "180 GH/s",
    efficiency: "High",
    icon: "⚡",
    description: "Application-Specific Integrated Circuits revolutionized mining. Purpose-built chips made GPU mining obsolete.",
    color: "from-orange-500 to-orange-600",
  },
  {
    year: "2018",
    type: "ASIC Gen 2",
    name: "Antminer S9",
    hashrate: "14 TH/s",
    efficiency: "Very High",
    icon: "🚀",
    description: "7nm chip technology dramatically improved efficiency. The S9 became the most popular miner in history.",
    color: "from-red-500 to-red-600",
  },
  {
    year: "2024",
    type: "ASIC Gen 3",
    name: "Antminer S21 Pro",
    hashrate: "234 TH/s",
    efficiency: "Ultra High",
    icon: "🔥",
    description: "Modern ASICs use 5nm chips with hydro cooling. Single machines now match early mining pools.",
    color: "from-purple-500 to-purple-600",
  },
];

export function HardwareEvolution() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />

        {hardwareData.map((item, index) => (
          <motion.div
            key={index}
            className={`relative flex items-center gap-8 mb-12 ${
              index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            }`}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.15, duration: 0.5 }}
          >
            {/* Content */}
            <div className={`flex-1 pl-12 md:pl-0 ${index % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
              <motion.div
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? "md:justify-end" : ""}`}>
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                      {item.year}
                    </span>
                    <span className="ml-2 text-sm font-medium text-muted-foreground">{item.type}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold mb-2">{item.name}</h4>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                <div className={`flex gap-4 text-sm ${index % 2 === 0 ? "md:justify-end" : ""}`}>
                  <div className="px-3 py-1 rounded-full bg-muted">
                    <span className="font-semibold">{item.hashrate}</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-muted">
                    <span className="text-muted-foreground">Efficiency: </span>
                    <span className="font-semibold">{item.efficiency}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Timeline dot */}
            <motion.div
              className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center md:-translate-x-1/2 z-10"
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: index * 0.15 + 0.2 }}
            >
              <span className="text-sm">{item.icon}</span>
            </motion.div>

            {/* Hidden spacer for alternating layout */}
            <div className="flex-1 hidden md:block" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
