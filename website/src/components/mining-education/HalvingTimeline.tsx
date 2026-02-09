import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";

const halvingEvents = [
  { year: 2009, block: 0, reward: 50, status: "past", btcPrice: "$0" },
  { year: 2012, block: 210000, reward: 25, status: "past", btcPrice: "$12" },
  { year: 2016, block: 420000, reward: 12.5, status: "past", btcPrice: "$650" },
  { year: 2020, block: 630000, reward: 6.25, status: "past", btcPrice: "$8,800" },
  { year: 2024, block: 840000, reward: 3.125, status: "current", btcPrice: "$64,000" },
  { year: 2028, block: 1050000, reward: 1.5625, status: "future", btcPrice: "?" },
  { year: 2032, block: 1260000, reward: 0.78125, status: "future", btcPrice: "?" },
];

// Next halving countdown (approximate)
const NEXT_HALVING_DATE = new Date("2028-04-01T00:00:00Z");

export function HalvingTimeline() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = NEXT_HALVING_DATE.getTime() - now.getTime();
      
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto">
      {/* Countdown to next halving */}
      <motion.div
        className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        <h3 className="text-xl font-bold mb-4">Next Bitcoin Halving (Est. 2028)</h3>
        <div className="flex justify-center gap-4 md:gap-8">
          {[
            { value: countdown.days, label: "Days" },
            { value: countdown.hours, label: "Hours" },
            { value: countdown.minutes, label: "Minutes" },
            { value: countdown.seconds, label: "Seconds" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="text-center"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-5xl font-bold text-primary">
                {String(item.value).padStart(2, "0")}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">{item.label}</div>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Block reward will decrease from 3.125 BTC to 1.5625 BTC
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-4">
          {halvingEvents.map((event, index) => (
            <motion.div
              key={index}
              className={`relative flex flex-col items-center ${
                event.status === "current" ? "z-10" : ""
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
            >
              {/* Card */}
              <motion.div
                className={`w-40 p-4 rounded-xl border transition-all ${
                  event.status === "current"
                    ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg"
                    : event.status === "past"
                    ? "bg-card border-border"
                    : "bg-muted/50 border-dashed border-muted-foreground/30"
                }`}
                whileHover={{ scale: event.status === "current" ? 1.1 : 1.05 }}
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold ${event.status === "current" ? "" : "text-foreground"}`}>
                    {event.year}
                  </div>
                  <div className={`text-xs mb-2 ${event.status === "current" ? "opacity-80" : "text-muted-foreground"}`}>
                    Block {event.block.toLocaleString()}
                  </div>
                  <div className={`text-lg font-bold ${event.status === "future" ? "text-muted-foreground" : ""}`}>
                    {event.reward} BTC
                  </div>
                  <div className={`text-xs ${event.status === "current" ? "opacity-80" : "text-muted-foreground"}`}>
                    per block
                  </div>
                  <div className={`mt-2 text-sm font-medium ${
                    event.status === "current" ? "" : event.status === "past" ? "text-green-600" : "text-muted-foreground"
                  }`}>
                    {event.btcPrice}
                  </div>
                </div>
              </motion.div>

              {/* Connection line */}
              {index < halvingEvents.length - 1 && (
                <div className="absolute top-1/2 left-full w-4 h-0.5 bg-border" />
              )}

              {/* Status indicator */}
              {event.status === "current" && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Current
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Supply info */}
      <motion.div
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
      >
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <div className="text-2xl font-bold text-primary">21M</div>
          <div className="text-sm text-muted-foreground">Maximum Supply</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <div className="text-2xl font-bold text-primary">~19.6M</div>
          <div className="text-sm text-muted-foreground">Currently Mined</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <div className="text-2xl font-bold text-primary">~2140</div>
          <div className="text-sm text-muted-foreground">Last BTC Mined</div>
        </div>
      </motion.div>
    </div>
  );
}
