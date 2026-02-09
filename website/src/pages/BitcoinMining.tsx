import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ChevronDown, Bitcoin, Cpu, Shield, Zap, Globe, Leaf, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { MiningProcessAnimation } from "@/components/mining-education/MiningProcessAnimation";
import { HashingAnimation } from "@/components/mining-education/HashingAnimation";
import { HardwareEvolution } from "@/components/mining-education/HardwareEvolution";
import { HalvingTimeline } from "@/components/mining-education/HalvingTimeline";
import { MiningGlossary } from "@/components/mining-education/MiningGlossary";
import { MiningComparison } from "@/components/mining-education/MiningComparison";
import { MiningEconomics } from "@/components/mining-education/MiningEconomics";
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

const keyConcepts = [
  {
    icon: Zap,
    title: "Hashrate",
    description: "Hashrate measures the computational power used to mine Bitcoin. It's expressed in hashes per second (H/s). The global Bitcoin network currently operates at around 600-700 Exahashes per second (EH/s) - that's 600 quintillion calculations every second!",
    stat: "~700 EH/s",
    statLabel: "Network Hashrate",
  },
  {
    icon: Cpu,
    title: "Difficulty Adjustment",
    description: "Every 2,016 blocks (approximately 2 weeks), Bitcoin automatically adjusts how hard it is to mine. If blocks are being found too quickly, difficulty increases. This mechanism ensures new blocks are created roughly every 10 minutes, regardless of how much mining power joins or leaves the network.",
    stat: "10 min",
    statLabel: "Target Block Time",
  },
  {
    icon: Bitcoin,
    title: "Block Reward",
    description: "When a miner successfully mines a block, they receive newly created Bitcoin as a reward. This is currently 3.125 BTC per block. This reward is how new Bitcoin enters circulation - there will only ever be 21 million Bitcoin in existence.",
    stat: "3.125 BTC",
    statLabel: "Current Reward",
  },
  {
    icon: Shield,
    title: "Proof of Work",
    description: "Bitcoin uses Proof of Work (PoW) as its consensus mechanism. Miners must prove they've done computational work (solved a cryptographic puzzle) before they can add a block. This makes it extremely expensive to attack the network.",
    stat: "99.99%",
    statLabel: "Attack Resistance",
  },
];

const faqs = [
  {
    question: "Is Bitcoin mining legal?",
    answer: "Bitcoin mining is legal in most countries, including the United States, Canada, most of Europe, and many others. However, some countries have restrictions or outright bans. Always check your local regulations before mining.",
  },
  {
    question: "How long does it take to mine 1 Bitcoin?",
    answer: "For an individual miner with a single ASIC (e.g., 100 TH/s), it would take approximately 5-10 years to mine 1 BTC at current difficulty levels. This is why miners typically join mining pools to receive smaller, more frequent payouts proportional to their contribution.",
  },
  {
    question: "Can you still mine Bitcoin profitably?",
    answer: "Yes, but profitability depends on several factors: electricity costs (ideally under $0.05/kWh), hardware efficiency, Bitcoin price, and network difficulty. Cloud mining services like SynteraX make it accessible by handling all the technical and infrastructure challenges.",
  },
  {
    question: "What happens when all 21 million Bitcoin are mined?",
    answer: "The last Bitcoin is expected to be mined around 2140. After that, miners will be compensated solely through transaction fees. By then, Bitcoin's value and transaction volume are expected to make this sustainable.",
  },
  {
    question: "Is Bitcoin mining bad for the environment?",
    answer: "Bitcoin mining does consume significant energy, but the narrative is evolving. Studies show 50-60% of Bitcoin mining now uses renewable energy. Many operations actively seek stranded energy sources (like flared gas) or excess renewable capacity. The industry is becoming increasingly sustainable.",
  },
  {
    question: "Why can't I just mine Bitcoin on my laptop?",
    answer: "In Bitcoin's early days (2009-2010), laptop mining was possible. Today, the network difficulty is so high that specialized ASIC hardware is required. A laptop would earn fractions of a penny while consuming more in electricity, making it completely unprofitable.",
  },
  {
    question: "What is a mining pool?",
    answer: "A mining pool is a group of miners who combine their computational power to increase their chances of finding a block. When the pool successfully mines a block, the reward is distributed among all participants based on their contributed hashrate. This provides more consistent, predictable income.",
  },
  {
    question: "How is cloud mining different from buying Bitcoin?",
    answer: "Buying Bitcoin is a one-time purchase. Cloud mining is an ongoing operation that generates Bitcoin over time. Mining can be profitable when BTC price rises, as you've already locked in your operational costs. It also provides steady accumulation rather than timing the market.",
  },
];

const BitcoinMining = () => {
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
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Understanding
              <span className="block text-primary">Bitcoin Mining</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              A complete guide to how Bitcoin mining works, from the basics of blockchain 
              technology to the economics of modern mining operations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
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

      {/* Introduction */}
      <Section className="bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What is Bitcoin Mining?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Bitcoin mining is the process by which new Bitcoin enters circulation and transactions are verified 
            on the blockchain. Think of miners as the backbone of the Bitcoin network - they secure transactions, 
            prevent fraud, and maintain the integrity of the entire system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "💰", title: "Creates New Bitcoin", desc: "Mining is the only way new BTC enters circulation" },
              { icon: "🔒", title: "Secures the Network", desc: "Miners validate and protect all transactions" },
              { icon: "📊", title: "Maintains Consensus", desc: "Ensures everyone agrees on the blockchain state" },
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
        </div>
      </Section>

      {/* How Mining Works */}
      <Section id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How Bitcoin Mining Works</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            The mining process involves collecting transactions, solving cryptographic puzzles, 
            and adding new blocks to the blockchain. Here's the step-by-step process:
          </p>
          <MiningProcessAnimation />
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-xl mb-4">1. Transactions Are Broadcast</h3>
              <p className="text-muted-foreground">
                When you send Bitcoin, your transaction is broadcast to the entire network. 
                It enters a waiting area called the "mempool" where it waits to be included in a block.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-xl mb-4">2. Miners Collect Transactions</h3>
              <p className="text-muted-foreground">
                Miners select transactions from the mempool (typically prioritizing higher-fee transactions) 
                and bundle them together into a candidate block.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-xl mb-4">3. The Mining Competition</h3>
              <p className="text-muted-foreground">
                Miners compete to find a valid hash by trying billions of different "nonce" values. 
                This is pure computational work - there's no shortcut, you just have to keep trying.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-xl mb-4">4. Block Added to Chain</h3>
              <p className="text-muted-foreground">
                When a miner finds a valid hash, they broadcast the block to the network. 
                Other nodes verify it, and if valid, it's added to the blockchain. The winner receives the block reward.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Hashing Visualization */}
      <Section className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Understanding Hashing</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            At the heart of mining is the SHA-256 hash function. Miners must find a hash that starts 
            with a certain number of zeros - and the only way to do that is to keep trying different inputs.
          </p>
          <HashingAnimation />
          <div className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            <p>
              Watch the animation above. The miner keeps changing the "nonce" number until they find 
              a hash starting with "0000". This simple concept, scaled to trillions of attempts per second, 
              is what secures the entire Bitcoin network.
            </p>
          </div>
        </div>
      </Section>

      {/* Key Concepts */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Key Mining Concepts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {keyConcepts.map((concept, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <concept.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2">{concept.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{concept.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{concept.stat}</span>
                      <span className="text-sm text-muted-foreground">{concept.statLabel}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Hardware Evolution */}
      <Section className="bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Mining Hardware Evolution</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Bitcoin mining hardware has evolved dramatically since 2009. From regular computers to 
            specialized machines that are millions of times more powerful.
          </p>
          <HardwareEvolution />
        </div>
      </Section>

      {/* Halving */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Bitcoin Halving Events</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Every 210,000 blocks (approximately 4 years), the block reward is cut in half. 
            This programmed scarcity is fundamental to Bitcoin's value proposition.
          </p>
          <HalvingTimeline />
        </div>
      </Section>

      {/* Mining Economics */}
      <Section className="bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Mining Economics</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Understanding the economics of mining is crucial. Profitability depends on multiple 
            factors that are constantly changing.
          </p>
          <MiningEconomics />
        </div>
      </Section>

      {/* Environmental Section */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Leaf className="w-8 h-8 text-green-500" />
            <h2 className="text-3xl md:text-4xl font-bold">Environmental Considerations</h2>
          </div>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Bitcoin mining's environmental impact is a topic of ongoing debate. Here's what you should know:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-xl mb-4 text-red-500">The Concerns</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  High energy consumption (comparable to some small countries)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  E-waste from obsolete mining hardware
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  Carbon emissions from coal-powered mining
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-xl mb-4 text-green-500">The Progress</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  50-60% of mining now uses renewable energy
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  Miners actively seek stranded/excess energy
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  Heat recycling for heating buildings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  Flared gas monetization reduces waste
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Cloud vs Traditional */}
      <Section className="bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Cloud Mining vs Traditional Mining</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Should you buy your own equipment or use a cloud mining service? Here's a detailed comparison 
            to help you decide.
          </p>
          <MiningComparison />
        </div>
      </Section>

      {/* Glossary */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Mining Glossary</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            New to mining? Here are the key terms you need to know.
          </p>
          <MiningGlossary />
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline text-left">
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
      <Section>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Mining?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Now that you understand how Bitcoin mining works, you can start earning Bitcoin with SynteraX. 
            No technical knowledge required - we handle everything for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full" onClick={() => navigate("/mining/buy")}>
              View Mining Packages
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
};

export default BitcoinMining;
