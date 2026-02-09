import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Coins, ArrowRight } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { AnimatedCard } from "./AnimatedCard";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TokenAcquireAnimation } from "./TokenAcquireAnimation";

export const TokenSection = () => {
  const { t } = useTranslation();
  const { data: tokenInfo, isLoading } = useTokenInfo("XFLOW");

  const steps = [
    {
      number: "01",
      title: "Acquire XFLOW Tokens",
      description: "Purchase XFLOW tokens to unlock exclusive platform benefits and features",
      details: [
        "Available on major DEX platforms",
        "BNB Chain (BEP-20) for low gas fees",
        "Instant wallet integration",
        "Secure and decentralized trading"
      ],
      animation: TokenAcquireAnimation,
      ref: useInView({ triggerOnce: true, threshold: 0.2 }),
      reverse: false,
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-accent/5 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">The XFLOW Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-foreground px-4">
            More Than Just a Token
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            XFLOW is the utility token that powers the SynteraX ecosystem. From discounted mining packages to governance rights, discover how XFLOW connects every aspect of our platform.
          </p>

          {/* Token info card */}
          {!isLoading && tokenInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto mt-6 sm:mt-8 px-4"
            >
              <AnimatedCard className="p-4 sm:p-6 bg-card border border-border" hover3d={false}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="text-left sm:text-left text-center">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">{tokenInfo.token_name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{tokenInfo.token_symbol}</p>
                    </div>
                  </div>
                  {tokenInfo.current_price_usd && (
                    <div className="text-center sm:text-right">
                      <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        ${tokenInfo.current_price_usd.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </motion.div>
          )}
        </motion.div>

        {/* Steps with animations */}
        <div className="space-y-16 sm:space-y-24 md:space-y-32 max-w-7xl mx-auto px-4">
          {steps.map((step, index) => {
            const [ref, inView] = step.ref;
            const AnimationComponent = step.animation;

            return (
              <div key={index} ref={ref}>
                <div className={`grid lg:grid-cols-2 gap-8 sm:gap-12 items-center ${step.reverse ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Text content */}
                  <motion.div
                    initial={{ opacity: 0, x: step.reverse ? 50 : -50 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`${step.reverse ? 'lg:order-2' : 'lg:order-1'}`}
                  >
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">
                      {step.description}
                    </p>
                    <ul className="space-y-2 sm:space-y-3">
                      {step.details.map((detail, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: step.reverse ? 20 : -20 }}
                          animate={inView ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                          className="flex items-start gap-2 sm:gap-3"
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                          </div>
                          <span className="text-sm sm:text-base text-foreground">{detail}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Animation */}
                  <motion.div
                    initial={{ opacity: 0, x: step.reverse ? -50 : 50 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className={`${step.reverse ? 'lg:order-1' : 'lg:order-2'}`}
                  >
                    <div className="relative">
                      <AnimationComponent />
                    </div>
                  </motion.div>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={inView ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="hidden sm:block w-0.5 h-16 sm:h-24 bg-gradient-to-b from-primary/50 to-transparent mx-auto mt-12 sm:mt-16 origin-top"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16 md:mt-20 px-4"
        >
          <Link to="/token-info">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 sm:px-8 text-sm sm:text-base"
            >
              Learn More About XFLOW
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
