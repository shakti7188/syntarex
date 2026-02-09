import { motion } from "framer-motion";
import { 
  Building2, 
  FileText, 
  Shield, 
  LineChart, 
  Vault, 
  Globe 
} from "lucide-react";
import { Card } from "@/components/ui/card";

export const BenefitsGrid = () => {
  const benefits = [
    {
      icon: Building2,
      title: "Institutional Infrastructure",
      description: "Tier-3 data centers with redundant power, cooling, and connectivity. 99.95% uptime SLA guaranteed."
    },
    {
      icon: FileText,
      title: "Regulatory Compliance",
      description: "Full KYC/AML compliance, tax reporting, and regulatory adherence. Built for institutional requirements."
    },
    {
      icon: Shield,
      title: "Multi-Layer Security",
      description: "SOC 2 Type II certified operations with institutional-grade custody and insurance coverage."
    },
    {
      icon: LineChart,
      title: "Performance Analytics",
      description: "Real-time operational metrics, detailed reporting, and comprehensive portfolio analytics dashboard."
    },
    {
      icon: Vault,
      title: "Professional Custody",
      description: "Multi-signature cold storage with institutional custodians. Your assets remain fully segregated and secure."
    },
    {
      icon: Globe,
      title: "Global Operations",
      description: "Geographically distributed mining operations across North America and Northern Europe for optimal efficiency."
    }
  ];

  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for Institutional Investors
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade mining infrastructure with full transparency and compliance
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
