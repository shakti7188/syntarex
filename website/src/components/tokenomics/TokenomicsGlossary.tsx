import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const terms = [
  {
    term: "TWAP (Time-Weighted Average Price)",
    definition: "A trading strategy that breaks up large orders over time to minimize market impact. SynteraX uses weekly TWAP buybacks, spreading purchases across the week rather than all at once, ensuring consistent buying pressure without causing price spikes.",
  },
  {
    term: "Circulating Supply",
    definition: "The number of tokens currently available in the market and tradeable. Unlike total supply, circulating supply excludes locked tokens (staked, vesting, treasury). Lower circulating supply typically means higher scarcity.",
  },
  {
    term: "Total Supply",
    definition: "The complete number of tokens that exist. For SynteraX, this is fixed at 1 billion tokens. No new tokens can ever be created (minted), making it a deflationary-by-design model.",
  },
  {
    term: "Buyback & Burn",
    definition: "A mechanism where tokens are purchased from the market (buyback) and permanently removed from circulation (burn). SynteraX uses buybacks funded by 25% of mining revenue to reduce supply and support price.",
  },
  {
    term: "Real Yield",
    definition: "Returns generated from actual economic activity rather than token inflation. SynteraX's real yield comes from Bitcoin mining profits—genuine revenue from validating blockchain transactions, not created from thin air.",
  },
  {
    term: "Treasury",
    definition: "A reserve fund held by the project for strategic purposes. SynteraX allocates 15% of mining revenue to treasury as a fail-safe insurance pool for market downturns and ecosystem stability.",
  },
  {
    term: "MW (Megawatts)",
    definition: "A unit of power measuring mining operation capacity. More MW means more mining machines running, which means more hashrate and more Bitcoin generated. SynteraX reinvests 10% of revenue into expanding MW capacity.",
  },
  {
    term: "NFT Mining Certificate",
    definition: "A non-fungible token that represents proof of ownership for mining package hashrate. These NFTs are tradeable and serve as verifiable proof of your stake in the mining operation.",
  },
  {
    term: "Staking",
    definition: "Locking up tokens for a period of time to earn rewards and/or unlock features. Staking reduces circulating supply and aligns token holder incentives with long-term ecosystem growth.",
  },
  {
    term: "Deflationary",
    definition: "An economic model where the supply of tokens decreases over time. Through buybacks and locked staking, SynteraX reduces available tokens, creating scarcity that can increase value per token.",
  },
  {
    term: "Flywheel Effect",
    definition: "A self-reinforcing cycle where each positive action feeds into the next. In SynteraX: more users → more mining revenue → more buybacks → higher price → more users. The flywheel accelerates over time.",
  },
];

export const TokenomicsGlossary = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <Accordion type="single" collapsible className="w-full">
        {terms.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.05 }}
          >
            <AccordionItem value={`term-${i}`} className="border-border">
              <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                <span className="font-semibold">{item.term}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.definition}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </motion.div>
  );
};
