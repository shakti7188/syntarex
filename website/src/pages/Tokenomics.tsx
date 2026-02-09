import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ChevronDown, Coins, TrendingUp, Shield, Zap, Users, Gamepad2, ShoppingCart, Wallet, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SupplyAnimation } from "@/components/tokenomics/SupplyAnimation";
import { RevenueAllocationChart } from "@/components/tokenomics/RevenueAllocationChart";
import { UtilityGrid } from "@/components/tokenomics/UtilityGrid";
import { FlywheelAnimation } from "@/components/tokenomics/FlywheelAnimation";
import { TokenomicsGlossary } from "@/components/tokenomics/TokenomicsGlossary";
import { TokenDistributionChart } from "@/components/tokenomics/TokenDistributionChart";
import { SupplyMechanicsAnimation } from "@/components/tokenomics/SupplyMechanicsAnimation";
import { QuickSummaryCard } from "@/components/tokenomics/QuickSummaryCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Section = ({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={`py-20 px-4 ${className}`}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.section>
  );
};

const faqs = [
  {
    question: "What backs the SynteraX token?",
    answer: "SynteraX tokens are backed by real Bitcoin mining operations. The platform generates actual BTC through mining, which funds buybacks, payouts, and treasury reserves. This creates real, sustainable value unlike purely speculative tokens.",
  },
  {
    question: "How do buybacks increase token value?",
    answer: "25% of all BTC mining revenue is used to purchase SynteraX tokens from the market using a TWAP (Time-Weighted Average Price) strategy. This constant buying pressure, combined with tokens being removed from circulation, creates deflationary pressure that can increase token value over time.",
  },
  {
    question: "What is real yield?",
    answer: "Real yield refers to returns generated from actual economic activity rather than token inflation or emissions. In SynteraX's case, real yield comes from Bitcoin mining profits - actual BTC earned from validating transactions on the Bitcoin network.",
  },
  {
    question: "How is this different from other crypto projects?",
    answer: "Most tokens have no underlying value generator. SynteraX is powered by physical Bitcoin mining infrastructure that produces real revenue. The token economy is designed around this revenue: payouts, buybacks, expansion, and reserves all funded by actual mining income.",
  },
  {
    question: "What happens if Bitcoin price crashes?",
    answer: "The 15% Treasury Reserve acts as a fail-safe insurance pool. Additionally, the mining expansion fund (10%) continuously adds capacity, meaning the ecosystem can mine more BTC to offset lower prices. The diversified revenue allocation provides resilience.",
  },
  {
    question: "Can I earn without buying tokens?",
    answer: "Yes! You can purchase mining packages and earn BTC directly. However, staking SynteraX tokens unlocks additional benefits like enhanced rewards, lottery access, and governance rights. The token amplifies your earning potential.",
  },
  {
    question: "How often are buybacks executed?",
    answer: "Buybacks are executed weekly using a TWAP strategy to minimize market impact. This consistent buying pressure from 25% of mining revenue provides steady demand for the token regardless of market conditions.",
  },
];

const Tokenomics = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Token Education</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Understanding
              <span className="block text-primary">SynteraX Tokenomics</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Learn how our token economy creates sustainable value backed by real Bitcoin mining. 
              From basics to advanced concepts, everything you need to know.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full" onClick={() => document.getElementById("basics")?.scrollIntoView({ behavior: "smooth" })}>
                Start Learning
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/mining/buy")}>
                Start Mining Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Summary TL;DR */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <QuickSummaryCard />
        </div>
      </Section>

      {/* What is Tokenomics */}
      <Section className="bg-muted/30" id="basics">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What is Tokenomics?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            <span className="font-semibold text-foreground">Token + Economics = Tokenomics.</span> It's the study of how 
            a cryptocurrency token's supply, distribution, and utility work together to create (or destroy) value.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📊", title: "Supply", desc: "How many tokens exist and how that changes over time" },
              { icon: "🎯", title: "Distribution", desc: "Who holds tokens and how they're allocated" },
              { icon: "⚡", title: "Utility", desc: "What tokens can be used for and why people want them" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-bold text-xl mb-3">Why Tokenomics Matter</h3>
            <p className="text-muted-foreground">
              Good tokenomics create sustainable value and aligned incentives. Bad tokenomics lead to pump-and-dumps 
              and worthless tokens. Understanding tokenomics helps you evaluate whether a project has long-term potential 
              or is just hype.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Token Overview */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">SynteraX Token Overview</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            A fixed-supply, BTC-backed token with real utility and deflationary mechanics.
          </p>
          <SupplyAnimation />
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Coins, label: "Fixed Supply", value: "1B Tokens", desc: "No inflation ever" },
              { icon: TrendingUp, label: "BTC-Backed", value: "Real Yield", desc: "Mining revenue funds ecosystem" },
              { icon: Shield, label: "Weekly Buybacks", value: "25% Revenue", desc: "Constant buying pressure" },
              { icon: Wallet, label: "Staking Rewards", value: "Lock & Earn", desc: "Reduce circulating supply" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-5 rounded-2xl bg-card border border-border text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Token Distribution */}
      <Section className="bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Token Distribution</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            A balanced allocation ensuring long-term sustainability, community rewards, and ecosystem growth.
          </p>
          <TokenDistributionChart />
        </div>
      </Section>

      {/* Supply Mechanics */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Supply Mechanics Over Time</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Watch how our deflationary model reduces circulating supply through staking and burns.
          </p>
          <SupplyMechanicsAnimation />
        </div>
      </Section>

      {/* Revenue Allocation */}
      <Section className="bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">BTC Revenue Allocation</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Every satoshi of BTC mined is strategically allocated to create a balanced economy 
            with real yield, deflation, and resilience.
          </p>
          <RevenueAllocationChart />
        </div>
      </Section>

      {/* Token Utility */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Token Utility</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            SynteraX isn't just a token—it's the economic engine powering the entire mining ecosystem.
          </p>
          <UtilityGrid />
        </div>
      </Section>

      {/* The Flywheel */}
      <Section className="bg-muted/30" id="flywheel">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">The Economic Flywheel</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            This is the magic: a self-reinforcing cycle where each element strengthens the next. 
            Real Bitcoin revenue powers the entire loop.
          </p>
          <FlywheelAnimation />
          
          <motion.div
            className="mt-12 p-6 rounded-2xl bg-card border border-border max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-bold text-xl mb-3 text-primary">The Outcome</h3>
            <p className="text-muted-foreground">
              A self-sustaining closed-loop economy driven by real Bitcoin revenue. As more users join, 
              more BTC is generated, more tokens are bought back, prices strengthen, and the cycle accelerates.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Comparison */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why SynteraX is Different</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Traditional Tokens</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary">SynteraX</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Value Backing", traditional: "None / Speculation", synterax: "Real BTC Mining" },
                  { feature: "Supply", traditional: "Inflationary", synterax: "Fixed 1B Supply" },
                  { feature: "Yield Source", traditional: "Token Emissions", synterax: "Mining Revenue" },
                  { feature: "Buyback Mechanism", traditional: "None / Manual", synterax: "25% Auto Weekly TWAP" },
                  { feature: "Treasury", traditional: "Marketing Funds", synterax: "15% Fail-Safe Reserve" },
                  { feature: "Growth Fund", traditional: "None", synterax: "10% Mining Expansion" },
                ].map((row, i) => (
                  <motion.tr 
                    key={i}
                    className="border-b border-border"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">{row.traditional}</td>
                    <td className="py-4 px-4 text-center text-primary font-medium">{row.synterax}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Glossary */}
      <Section className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Key Terms Glossary</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            New to tokenomics? Here are the essential terms you need to understand.
          </p>
          <TokenomicsGlossary />
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Now that you understand how SynteraX tokenomics work, start mining and earning real Bitcoin.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full" onClick={() => navigate("/mining/buy")}>
              Start Mining
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/token-info")}>
              View Token Details
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
};

export default Tokenomics;
