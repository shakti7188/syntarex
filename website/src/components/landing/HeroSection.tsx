import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, TrendingUp, Zap, Activity } from "lucide-react";
import CountUp from "react-countup";
import { DataCenterAnimation } from "./DataCenterAnimation";
import { useBitcoinMarketData } from "@/hooks/useBitcoinMarketData";
import { HeroBackground } from "./HeroBackground";
import { TrustBadgeRow } from "./TrustBadgeRow";
import { PayoutTicker } from "./PayoutTicker";
import { useState, useEffect } from "react";

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [text, started]);

  return (
    <span>
      {displayedText}
      {displayedText.length < text.length && started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[3px] h-[1em] bg-primary ml-1 align-middle"
        />
      )}
    </span>
  );
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: marketData, isLoading: marketLoading } = useBitcoinMarketData();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      <HeroBackground />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left space-y-6"
          >
            {/* Payout Ticker */}
            <div className="hidden sm:block">
              <PayoutTicker />
            </div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-sm font-medium text-foreground">THE SynteraX AWAKENING</span>
            </motion.div>

            {/* Main Headline with Typewriter */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight"
            >
              The world is
{" "}
              <span className="text-foreground">
                <TypewriterText text=" shifting" delay={0.8} />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
            >
             For the first time, the public enters before the insiders.
The door that was always closed is finally opened.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {user ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate("/mining/buy")}
                    className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Choose Your Package
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate("/dashboard")}
                    className="text-lg px-8 py-6 rounded-full"
                  >
                    View Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate("/mining/roi")}
                    className="text-lg px-8 py-6 rounded-full"
                  >
                    View Projections
                  </Button>
                </>
              )}
            </motion.div>

            {/* Live Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 md:gap-6 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">BTC Price</div>
                  <div className="font-bold">
                    {marketLoading ? (
                      <span className="animate-pulse">$--,---</span>
                    ) : (
                      <>$<CountUp end={marketData?.price || 95000} duration={2} separator="," decimals={0} /></>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Network Hashrate</div>
                  <div className="font-bold">
                    {marketLoading ? (
                      <span className="animate-pulse">--- EH/s</span>
                    ) : (
                      <><CountUp end={marketData?.networkHashrate || 750} duration={2} decimals={0} /> EH/s</>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Energy Pipeline</div>
                  <div className="font-bold">
                    <CountUp end={1.35} duration={2} decimals={2} /> GW
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <TrustBadgeRow />
          </motion.div>

          {/* Right side - Animation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block h-[600px]"
          >
            <DataCenterAnimation />
          </motion.div>
        </div>
      </div>


      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
        >
          <div className="w-1.5 h-3 bg-muted-foreground/30 rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  );
};
