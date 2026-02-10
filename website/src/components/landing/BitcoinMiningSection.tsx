import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu, Shield, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";


export function BitcoinMiningSection() {
  const navigate = useNavigate();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const keyPoints = [
    {
      icon: Cpu,
      title: "Digital Gold Creation",
      description: "Mining is how new Bitcoin enters circulation - like digital gold extraction using powerful computers.",
    },
    {
      icon: Shield,
      title: "Network Security",
      description: "Miners validate every transaction and protect the network from fraud and attacks.",
    },
    {
      icon: Coins,
      title: "Earn Bitcoin Rewards",
      description: "Successful miners receive newly created Bitcoin plus transaction fees as rewards.",
    },
  ];

  return (
    <section ref={ref} className="py-24 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary">Understanding the Basics</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What is Bitcoin Mining?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Bitcoin mining is the backbone of the world's largest cryptocurrency network. 
              Miners use specialized hardware to solve complex mathematical puzzles, 
              securing transactions and earning Bitcoin rewards in the process.
            </p>

            {/* Key points */}
            <div className="space-y-6 mb-8">
              {keyPoints.map((point, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <point.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{point.title}</h3>
                    <p className="text-muted-foreground">{point.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="rounded-full"
              onClick={() => navigate("/bitcoin-mining")}
            >
              Learn More About Mining
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          {/* Right side - Animated Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl" />
              
              {/* Mining visualization */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {/* Central Bitcoin */}
                <motion.div
                  className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <span className="text-5xl font-bold text-white">₿</span>
                </motion.div>

                {/* Orbiting elements */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-full h-full"
                    style={{ rotate: i * 60 }}
                  >
                    <motion.div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      animate={{
                        rotate: [-i * 60, -i * 60 - 360],
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center shadow-lg">
                        <Cpu className="w-6 h-6 text-primary" />
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                {/* Data streams */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary"
                    initial={{ 
                      x: Math.cos(i * 45 * Math.PI / 180) * 150,
                      y: Math.sin(i * 45 * Math.PI / 180) * 150,
                      opacity: 0 
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.25,
                    }}
                  />
                ))}
              </div>

              {/* Stats cards */}
              <motion.div
                className="absolute -bottom-4 -left-4 p-4 rounded-xl bg-card border border-border shadow-lg"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="text-sm text-muted-foreground">Block Reward</div>
                <div className="text-xl font-bold">3.125 BTC</div>
              </motion.div>

              <motion.div
                className="absolute -top-4 -right-4 p-4 rounded-xl bg-card border border-border shadow-lg"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                <div className="text-sm text-muted-foreground">Network Hashrate</div>
                <div className="text-xl font-bold">~700 EH/s</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
