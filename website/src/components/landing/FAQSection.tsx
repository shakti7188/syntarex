import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQSection = () => {
  const faqs = [
    {
      question: "What regulatory compliance measures are in place?",
      answer: "SynteraX operates under full KYC/AML compliance protocols, maintains SOC 2 Type II certification, and adheres to all applicable financial regulations. We provide complete audit trails, tax reporting support (IRS Form 1099), and work with institutional custodians to ensure regulatory adherence."
    },
    {
      question: "How is asset custody handled?",
      answer: "All Bitcoin mining rewards are held in institutional-grade cold storage with multi-signature security. We partner with regulated custodians who maintain insurance coverage and operate under strict fiduciary standards. Your assets are fully segregated and never commingled."
    },
    {
      question: "What are the minimum investment requirements?",
      answer: "Retail investors can start with packages from $1,000. Institutional allocations begin at $100,000 with dedicated account management. We offer customized mining capacity for family offices and institutions deploying $1M+ with flexible terms and dedicated infrastructure."
    },
    {
      question: "How is operational performance audited?",
      answer: "All mining operations are subject to third-party audits conducted quarterly. We provide real-time dashboards with independently verified hashrate, uptime metrics, and settlement data. Historical performance reports are available with full transparency into operational efficiency and Bitcoin production."
    },
    {
      question: "What is the typical investment horizon?",
      answer: "Historical data shows institutional investors achieve ROI within 12-18 months based on current network conditions. We provide detailed financial modeling and stress-tested projections. Performance varies with Bitcoin price, network difficulty, and energy costs—use our institutional calculator for scenario analysis."
    },
    {
      question: "How do you handle tax reporting?",
      answer: "We provide comprehensive tax documentation including daily settlement records, cost basis tracking, and IRS Form 1099-MISC for all mining income. Our systems integrate with major tax software and accounting platforms. Institutional clients receive detailed K-1 documentation and audit support."
    },
    {
      question: "What insurance coverage protects investments?",
      answer: "Our facilities maintain $50M+ in comprehensive insurance covering equipment damage, business interruption, and cyber liability. Mining hardware is insured at replacement value. Bitcoin custody is protected by institutional custodial insurance. Coverage details available under NDA."
    },
    {
      question: "Can institutional investors customize their allocation?",
      answer: "Yes. Institutions can deploy custom mining capacity with dedicated infrastructure, white-label reporting, and flexible settlement terms. We support direct energy procurement, geographic preferences, and ESG-compliant operations. Contact our institutional team for tailored solutions."
    }
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Investor Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive answers for institutional and retail investors
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
