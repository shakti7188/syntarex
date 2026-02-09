import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const glossaryTerms = [
  {
    term: "ASIC",
    definition: "Application-Specific Integrated Circuit. A computer chip designed specifically for Bitcoin mining. ASICs are thousands of times more efficient than regular computers for mining.",
    category: "Hardware",
  },
  {
    term: "Block",
    definition: "A collection of Bitcoin transactions that are bundled together and added to the blockchain. Each block contains about 2,000-3,000 transactions and is created approximately every 10 minutes.",
    category: "Blockchain",
  },
  {
    term: "Block Reward",
    definition: "The amount of new Bitcoin awarded to miners for successfully mining a block. Currently 3.125 BTC per block, this reward halves approximately every 4 years.",
    category: "Rewards",
  },
  {
    term: "Blockchain",
    definition: "A decentralized, distributed ledger that records all Bitcoin transactions. Each block is cryptographically linked to the previous one, creating an immutable chain of records.",
    category: "Blockchain",
  },
  {
    term: "Difficulty",
    definition: "A measure of how hard it is to mine a Bitcoin block. The network automatically adjusts difficulty every 2,016 blocks (~2 weeks) to maintain a 10-minute block time.",
    category: "Mining",
  },
  {
    term: "Halving",
    definition: "An event that occurs every 210,000 blocks (~4 years) where the block reward is cut in half. This mechanism ensures Bitcoin's scarcity and deflationary nature.",
    category: "Economics",
  },
  {
    term: "Hash",
    definition: "The output of a cryptographic hash function (SHA-256). Mining involves finding a hash that meets certain criteria (starts with a specific number of zeros).",
    category: "Technical",
  },
  {
    term: "Hashrate",
    definition: "The total computational power being used to mine Bitcoin, measured in hashes per second (H/s). Higher hashrate means more mining power. Current network: ~600 EH/s.",
    category: "Mining",
  },
  {
    term: "Mempool",
    definition: "The 'waiting room' for unconfirmed Bitcoin transactions. Miners select transactions from the mempool to include in blocks, typically prioritizing higher-fee transactions.",
    category: "Blockchain",
  },
  {
    term: "Mining Pool",
    definition: "A group of miners who combine their computational resources to increase their chances of mining a block. Rewards are shared proportionally based on contributed hashrate.",
    category: "Mining",
  },
  {
    term: "Nonce",
    definition: "A random number that miners change repeatedly while trying to find a valid hash. Each nonce produces a different hash output until a valid one is found.",
    category: "Technical",
  },
  {
    term: "Proof of Work",
    definition: "The consensus mechanism Bitcoin uses to validate transactions. Miners must prove they've done computational work (found a valid hash) to add blocks to the chain.",
    category: "Blockchain",
  },
  {
    term: "SHA-256",
    definition: "Secure Hash Algorithm 256-bit. The cryptographic hash function used in Bitcoin mining. It produces a unique 64-character hexadecimal output for any input.",
    category: "Technical",
  },
  {
    term: "Transaction Fees",
    definition: "Fees paid by users to have their transactions included in a block. Miners receive these fees in addition to the block reward, incentivizing transaction processing.",
    category: "Economics",
  },
  {
    term: "TH/s (Terahash)",
    definition: "Terahashes per second - a unit of mining power equal to 1 trillion hashes per second. Modern ASICs produce 100-200+ TH/s.",
    category: "Mining",
  },
];

const categories = ["All", "Mining", "Blockchain", "Technical", "Hardware", "Economics", "Rewards"];

export function MiningGlossary() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredTerms = activeCategory === "All" 
    ? glossaryTerms 
    : glossaryTerms.filter(t => t.category === activeCategory);

  return (
    <div ref={ref} className="w-full max-w-3xl mx-auto">
      {/* Category filters */}
      <motion.div
        className="flex flex-wrap gap-2 mb-6 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Terms accordion */}
      <Accordion type="single" collapsible className="space-y-2">
        {filteredTerms.map((item, index) => (
          <motion.div
            key={item.term}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.05 }}
          >
            <AccordionItem value={item.term} className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-bold">{item.term}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.category}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.definition}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </div>
  );
}

import { useState } from "react";
