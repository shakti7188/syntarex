import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { StepOneAnimation } from "./StepOneAnimation";
import { StepTwoAnimation } from "./StepTwoAnimation";
import { StepThreeAnimation } from "./StepThreeAnimation";

export const HowItWorksAnimated = () => {
  const [ref1, inView1] = useInView({ threshold: 0.3, triggerOnce: true });
  const [ref2, inView2] = useInView({ threshold: 0.3, triggerOnce: true });
  const [ref3, inView3] = useInView({ threshold: 0.3, triggerOnce: true });

  const steps = [
    {
      number: "01",
      title: "Choose Your Package",
      description: "Browse curated mining packages tailored to your investment goals",
      details: [
        "Flexible investment tiers ($10K - $10M+)",
        "Select hashrate allocation (TH/s)",
        "One-click deployment",
        "Transparent pricing & projections",
      ],
      animation: StepOneAnimation,
      ref: ref1,
      inView: inView1,
      reverse: false,
    },
    {
      number: "02",
      title: "We Handle Everything",
      description: "Professional 24/7 operations team manages your mining infrastructure",
      details: [
        "Enterprise-grade hosting facilities",
        "Automatic hardware optimization",
        "Real-time performance monitoring",
        "Regulatory compliance (KYC/AML)",
      ],
      animation: StepTwoAnimation,
      ref: ref2,
      inView: inView2,
      reverse: true,
    },
    {
      number: "03",
      title: "Earn Bitcoin Daily",
      description: "Receive daily mining rewards directly to your custody wallet",
      details: [
        "Daily settlement to your wallet",
        "Full transparency dashboard",
        "Directly eWallet",
        "Withdraw anytime",
      ],
      animation: StepThreeAnimation,
      ref: ref3,
      inView: inView3,
      reverse: false,
    },
  ];

  return (
    <section className="py-8 md:py-12 lg:py-16 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Section Header */}
      <div className="container mx-auto px-4 sm:px-6 text-center mb-8 md:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6">
            Simplified Access to Bitcoin Mining
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Deploy capital into institutional-grade mining infrastructure in three simple steps
          </p>
        </motion.div>
      </div>

      {/* Steps */}
      <div className="space-y-12 md:space-y-16">
        {steps.map((step, index) => {
          const AnimationComponent = step.animation;
          
          return (
            <div
              key={index}
              ref={step.ref}
              className="container mx-auto px-4 sm:px-6"
            >
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center ${step.reverse ? 'md:grid-flow-dense' : ''}`}>
                {/* Text Content */}
                <motion.div
                  className={step.reverse ? 'md:col-start-2' : ''}
                  initial={{ opacity: 0, x: step.reverse ? 50 : -50 }}
                  animate={step.inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {/* Step Number */}
                  <motion.div
                    className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-full mb-4 md:mb-6"
                    style={{
                      background: "hsl(var(--primary) / 0.1)",
                      border: "1px solid hsl(var(--primary) / 0.2)",
                    }}
                    initial={{ scale: 0 }}
                    animate={step.inView ? { scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{step.number}</span>
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base sm:text-lg text-muted-foreground mb-6 md:mb-8">
                    {step.description}
                  </p>

                  {/* Details List */}
                  <ul className="space-y-3 md:space-y-4">
                    {step.details.map((detail, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 sm:gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={step.inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-sm sm:text-base text-foreground">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Animation */}
                <motion.div
                  className={`relative h-[300px] sm:h-[400px] md:h-[500px] ${step.reverse ? 'md:col-start-1' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={step.inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <AnimationComponent />
                </motion.div>
              </div>

              {/* Connector Line (except after last step) */}
              {index < steps.length - 1 && (
                <motion.div
                  className="w-px h-12 md:h-16 mx-auto mt-8 md:mt-12 lg:mt-16 bg-gradient-to-b from-primary/50 to-transparent"
                  initial={{ height: 0, opacity: 0 }}
                  animate={step.inView ? { height: 64, opacity: 1 } : {}}
                  transition={{ duration: 1, delay: 1 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 300 + i * 100,
              height: 300 + i * 100,
              left: i % 2 === 0 ? '10%' : '80%',
              top: `${20 + i * 30}%`,
              background: `radial-gradient(circle, hsl(var(--primary) / ${0.05 - i * 0.01}), transparent 70%)`,
              filter: "blur(60px)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 2,
            }}
          />
        ))}
      </div>
    </section>
  );
};
