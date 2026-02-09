import { motion } from "framer-motion";
import { Shield, Lock, TrendingUp, Users, Award, FileCheck } from "lucide-react";

export const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: "Industrial-Scale Power",
      description: "Enterprise security standards"
    },
    {
      icon: Lock,
      title: "Secured",
      description: "Multi-signature cold storage"
    },
    {
      icon: FileCheck,
      title: "Energized",
      description: "Third-party verified"
    },
    {
      icon: Award,
      title: "Operational",
      description: "Full KYC/AML compliance"
    },
  
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              {/* <p className="text-xs text-muted-foreground">{badge.description}</p> */}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
