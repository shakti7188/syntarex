import { motion, useAnimation } from "framer-motion";
import { ShoppingCart, Cpu, Coins, ArrowRight } from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

export const HowItWorksSimple = () => {
  const steps = [
    {
      number: "01",
      icon: ShoppingCart,
      title: "Deploy Capital",
      description: "Select mining capacity aligned with your investment thesis. Flexible allocations from $10K to $10M+.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      metrics: [
        { label: "Min. Investment", value: 10000, prefix: "$", suffix: "", decimals: 0 },
        { label: "Avg. Position", value: 250000, prefix: "$", suffix: "", decimals: 0 }
      ]
    },
    {
      number: "02",
      icon: Cpu,
      title: "Professional Management",
      description: "Enterprise operations team manages infrastructure, optimization, and compliance. Real-time monitoring and reporting.",
      color: "text-accent",
      bgColor: "bg-accent/10",
      metrics: [
        { label: "Uptime", value: 99.7, prefix: "", suffix: "%", decimals: 1 },
        { label: "Managed Capacity", value: 850, prefix: "", suffix: " PH/s", decimals: 0 }
      ]
    },
    {
      number: "03",
      icon: Coins,
      title: "Transparent Returns",
      description: "Daily settlement of mining rewards to institutional custody. Full audit trail and tax reporting support.",
      color: "text-success",
      bgColor: "bg-success/10",
      metrics: [
        { label: "Daily Settlements", value: 24, prefix: "", suffix: "/7", decimals: 0 },
        { label: "Avg. Annual Return", value: 12.5, prefix: "", suffix: "%", decimals: 1 }
      ]
    }
  ];

  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (inView) {
      const timer = setInterval(() => {
        setActiveStep(prev => (prev + 1) % steps.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [inView, steps.length]);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/30" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simplified Access to Bitcoin Mining
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise infrastructure with institutional-grade operations
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Animated connector arrow - hidden on mobile */}
                  {index < steps.length - 1 && (
                    <motion.div 
                      className="hidden md:flex absolute top-24 left-[calc(100%+0.5rem)] items-center justify-center z-10"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: inView ? 1 : 0, 
                        x: inView ? 0 : -20,
                        scale: activeStep === index ? [1, 1.2, 1] : 1
                      }}
                      transition={{ 
                        delay: index * 0.3 + 0.5,
                        scale: { duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }
                      }}
                    >
                      <ArrowRight className="h-8 w-8 text-primary" />
                    </motion.div>
                  )}

                  <motion.div 
                    className={`text-center p-8 rounded-2xl border-2 transition-all duration-500 ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-xl scale-105' 
                        : 'border-transparent bg-card hover:border-border'
                    }`}
                    animate={{
                      scale: isActive ? 1.05 : 1,
                      y: isActive ? -10 : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Number with pulse animation */}
                    <motion.div 
                      className="text-6xl font-bold text-muted/20 mb-4"
                      animate={{
                        scale: isActive ? [1, 1.1, 1] : 1,
                        opacity: isActive ? [0.2, 0.4, 0.2] : 0.2
                      }}
                      transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                    >
                      {step.number}
                    </motion.div>

                    {/* Icon with rotation animation */}
                    <motion.div 
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${step.bgColor} mb-6 ${step.color}`}
                      animate={{
                        rotate: isActive ? [0, 5, -5, 0] : 0,
                        scale: isActive ? [1, 1.1, 1] : 1
                      }}
                      transition={{ 
                        duration: 0.5,
                        repeat: isActive ? Infinity : 0,
                        repeatDelay: 0.5
                      }}
                    >
                      <step.icon className="h-10 w-10" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-6 min-h-[4rem]">{step.description}</p>

                    {/* Animated Metrics with staggered appearance */}
                    <div className="flex justify-center gap-6 pt-4 border-t border-border/50">
                      {step.metrics.map((metric, idx) => (
                        <motion.div 
                          key={idx} 
                          className="text-center"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + idx * 0.1 + 0.5 }}
                        >
                          <div className="text-sm text-muted-foreground mb-1">
                            {metric.label}
                          </div>
                          <div className={`text-lg font-bold transition-colors ${isActive ? step.color : 'text-foreground'}`}>
                            {metric.prefix}
                            <CountUp 
                              end={metric.value} 
                              duration={2.5}
                              decimals={metric.decimals}
                              separator=","
                            />
                            {metric.suffix}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Progress indicator dots */}
          <div className="flex justify-center gap-2 mt-12">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ${
                  activeStep === index ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
                animate={{
                  scale: activeStep === index ? [1, 1.2, 1] : 1
                }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
