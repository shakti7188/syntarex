import { motion } from "framer-motion";
import { Zap, ShieldCheck, BatteryCharging, Server } from "lucide-react";

export const TrustBadges = () => {
  const badges = [
    {
      icon: Zap,
      title: "Industrial-Scale Power",
    },
    {
      icon: ShieldCheck,
      title: "Secured",
    },
    {
      icon: BatteryCharging,
      title: "Energized",
    },
    {
      icon: Server,
      title: "Operational",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            THE FOUNDATION
          </h2>
          <p className="text-lg text-muted-foreground">
            BLOCK 0 : $0 Market Cap
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                <badge.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">{badge.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
