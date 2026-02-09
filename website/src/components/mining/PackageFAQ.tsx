import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How soon will I start earning?",
    answer: "Your hashrate is allocated instantly upon payment confirmation. You'll start seeing BTC earnings within 24 hours of your package activation. Daily earnings are calculated based on network conditions and your allocated hashrate."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept USDT (Solana network) and XFLOW tokens. Paying with XFLOW tokens gives you a 10% discount on all packages. Credit card payments coming soon."
  },
  {
    question: "Can I upgrade my package later?",
    answer: "Yes! You can purchase additional packages at any time to increase your hashrate. Your earnings from multiple packages are combined in your dashboard."
  },
  {
    question: "What is the XFLOW discount?",
    answer: "When you pay with XFLOW tokens instead of USDT, you receive a 10% discount on your package purchase. XFLOW tokens can be acquired on supported DEX platforms."
  },
  {
    question: "How are earnings calculated?",
    answer: "Earnings are calculated based on your allocated hashrate (TH/s), current Bitcoin price, network difficulty, and block rewards. Actual earnings may vary daily based on these factors."
  },
  {
    question: "What does 'Team Rewards Unlock' mean?",
    answer: "Purchasing packages unlocks commission tiers for referral rewards. $500+ packages unlock Level 1-2 rewards (10%/5%), while $1,000+ packages unlock all 3 levels (10%/5%/5%) of team rewards."
  }
];

export const PackageFAQ = () => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Common Questions</h2>
        <p className="text-muted-foreground">Everything you need to know about mining packages</p>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
