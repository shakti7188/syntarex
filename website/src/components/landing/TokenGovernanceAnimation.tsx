import { motion } from "framer-motion";
import { Vote, Crown, Users, CheckCircle } from "lucide-react";
import CountUp from "react-countup";

export const TokenGovernanceAnimation = () => {
  const proposals = [
    { name: "New Package Tier", votes: 85, status: "active" },
    { name: "Staking Rewards", votes: 92, status: "passed" },
    { name: "Pool Expansion", votes: 73, status: "active" },
  ];

  return (
    <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] flex items-center justify-center overflow-hidden px-4">
      {/* Background pattern */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent"
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Central governance interface */}
      <motion.div
        className="relative z-10 bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl border border-border w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6 pb-3 sm:pb-4 border-b border-border">
          <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Vote className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-foreground">Active Proposals</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Cast your vote</div>
          </div>
        </div>

        {/* Proposal list */}
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          {proposals.map((proposal, i) => (
            <motion.div
              key={proposal.name}
              className="bg-muted/30 rounded-lg p-2 sm:p-2.5 md:p-3 border border-border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.2 }}
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  {proposal.name}
                </span>
                {proposal.status === "passed" && (
                  <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-accent" />
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex-1 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${proposal.votes}%` }}
                    transition={{ delay: 0.5 + i * 0.2, duration: 1 }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-primary whitespace-nowrap">
                  {proposal.votes}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Priority access badge - positioned better on mobile */}
      <motion.div
        className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-8 md:right-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 shadow-xl"
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          rotate: 0,
        }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 15px rgba(247, 147, 26, 0.3)",
              "0 0 30px rgba(247, 147, 26, 0.5)",
              "0 0 15px rgba(247, 147, 26, 0.3)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="rounded-lg sm:rounded-xl"
        >
          <Crown className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-background" />
        </motion.div>
        <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-background mt-1 sm:mt-1.5 md:mt-2 whitespace-nowrap">
          Priority Member
        </div>
      </motion.div>

      {/* Community stats */}
      <motion.div
        className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 md:bottom-8 md:left-8 bg-card/80 backdrop-blur-sm rounded-lg p-2 sm:p-2.5 md:p-3 border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-muted-foreground mb-0.5 sm:mb-1">
          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          <span className="text-[10px] sm:text-xs">Token Holders</span>
        </div>
        <div className="text-sm sm:text-lg md:text-xl font-bold text-foreground">
          <CountUp end={12847} duration={2} separator="," />
        </div>
      </motion.div>

      {/* Floating vote particles - fewer on mobile */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 rounded-full bg-primary/20 border border-primary items-center justify-center ${i > 3 ? 'hidden sm:flex' : 'flex'}`}
          style={{
            left: `${20 + i * 15}%`,
            top: "70%",
          }}
          animate={{
            y: [0, -50, -100],
            opacity: [0, 1, 0],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        >
          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
        </motion.div>
      ))}
    </div>
  );
};
