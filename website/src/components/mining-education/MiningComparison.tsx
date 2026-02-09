import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Check, X, Minus } from "lucide-react";

const comparisonData = [
  {
    feature: "Upfront Hardware Cost",
    traditional: { value: "$3,000 - $15,000+", status: "negative" },
    cloud: { value: "Included in package", status: "positive" },
  },
  {
    feature: "Technical Knowledge Required",
    traditional: { value: "High - setup, configuration, troubleshooting", status: "negative" },
    cloud: { value: "None - fully managed", status: "positive" },
  },
  {
    feature: "Physical Space Needed",
    traditional: { value: "Dedicated room/facility", status: "negative" },
    cloud: { value: "None", status: "positive" },
  },
  {
    feature: "Electricity Management",
    traditional: { value: "Your responsibility - high bills", status: "negative" },
    cloud: { value: "Included - industrial rates", status: "positive" },
  },
  {
    feature: "Cooling Infrastructure",
    traditional: { value: "Required - expensive", status: "negative" },
    cloud: { value: "Professional data centers", status: "positive" },
  },
  {
    feature: "Noise Level",
    traditional: { value: "80+ dB - very loud", status: "negative" },
    cloud: { value: "None - remote hosting", status: "positive" },
  },
  {
    feature: "24/7 Monitoring",
    traditional: { value: "Self-managed", status: "neutral" },
    cloud: { value: "Professional team", status: "positive" },
  },
  {
    feature: "Hardware Maintenance",
    traditional: { value: "Your responsibility", status: "negative" },
    cloud: { value: "Included", status: "positive" },
  },
  {
    feature: "Scalability",
    traditional: { value: "Limited by space/power", status: "negative" },
    cloud: { value: "Instant - buy more hashrate", status: "positive" },
  },
  {
    feature: "Setup Time",
    traditional: { value: "Days to weeks", status: "negative" },
    cloud: { value: "Minutes", status: "positive" },
  },
  {
    feature: "Hardware Obsolescence Risk",
    traditional: { value: "You bear the risk", status: "negative" },
    cloud: { value: "Provider handles upgrades", status: "positive" },
  },
  {
    feature: "Geographic Flexibility",
    traditional: { value: "Tied to location", status: "negative" },
    cloud: { value: "Access from anywhere", status: "positive" },
  },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "positive") return <Check className="w-5 h-5 text-green-500" />;
  if (status === "negative") return <X className="w-5 h-5 text-red-500" />;
  return <Minus className="w-5 h-5 text-yellow-500" />;
};

export function MiningComparison() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div ref={ref} className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div />
        <motion.div
          className="text-center p-4 rounded-t-xl bg-muted"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <div className="text-3xl mb-2">🏠</div>
          <h3 className="font-bold">Traditional Mining</h3>
          <p className="text-xs text-muted-foreground">Self-managed at home</p>
        </motion.div>
        <motion.div
          className="text-center p-4 rounded-t-xl bg-primary text-primary-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
        >
          <div className="text-3xl mb-2">☁️</div>
          <h3 className="font-bold">Cloud Mining</h3>
          <p className="text-xs opacity-80">SynteraX managed</p>
        </motion.div>
      </div>

      {/* Comparison rows */}
      <div className="border rounded-xl overflow-hidden">
        {comparisonData.map((row, index) => (
          <motion.div
            key={row.feature}
            className={`grid grid-cols-3 gap-4 ${
              index % 2 === 0 ? "bg-card" : "bg-muted/30"
            } ${index === comparisonData.length - 1 ? "" : "border-b"}`}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.05 }}
          >
            <div className="p-4 font-medium text-sm flex items-center">
              {row.feature}
            </div>
            <div className="p-4 flex items-center gap-2 text-sm border-l">
              <StatusIcon status={row.traditional.status} />
              <span className={row.traditional.status === "negative" ? "text-muted-foreground" : ""}>
                {row.traditional.value}
              </span>
            </div>
            <div className="p-4 flex items-center gap-2 text-sm border-l bg-primary/5">
              <StatusIcon status={row.cloud.status} />
              <span className={row.cloud.status === "positive" ? "font-medium" : ""}>
                {row.cloud.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom summary */}
      <motion.div
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5 }}
      >
        <div className="p-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <h4 className="font-bold text-lg mb-2 text-red-700 dark:text-red-400">Traditional Mining Challenges</h4>
          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
            <li>• High initial investment ($10,000+)</li>
            <li>• Ongoing maintenance headaches</li>
            <li>• Loud, hot, power-hungry equipment</li>
            <li>• Risk of hardware becoming obsolete</li>
          </ul>
        </div>
        <div className="p-6 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <h4 className="font-bold text-lg mb-2 text-green-700 dark:text-green-400">Cloud Mining Benefits</h4>
          <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
            <li>• Start mining in minutes</li>
            <li>• No technical knowledge needed</li>
            <li>• Professional 24/7 management</li>
            <li>• Transparent, predictable returns</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
