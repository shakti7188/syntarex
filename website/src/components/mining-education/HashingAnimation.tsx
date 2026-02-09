import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function HashingAnimation() {
  const [input, setInput] = useState("Hello Bitcoin!");
  const [hash, setHash] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [nonce, setNonce] = useState(0);

  const generateRandomHash = () => {
    const chars = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < 64; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsHashing(true);
      setNonce((prev) => prev + 1);
      
      // Simulate hash calculation
      let iterations = 0;
      const hashInterval = setInterval(() => {
        setHash(generateRandomHash());
        iterations++;
        if (iterations >= 10) {
          clearInterval(hashInterval);
          // Occasionally find a "valid" hash starting with zeros
          if (Math.random() > 0.7) {
            setHash("0000" + generateRandomHash().slice(4));
          }
          setIsHashing(false);
        }
      }, 50);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const isValidHash = hash.startsWith("0000");

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl bg-card border border-border">
      <div className="space-y-6">
        {/* Input */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Block Data + Nonce
          </label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm">
              {input}
            </div>
            <motion.div
              className="p-3 rounded-lg bg-primary/10 text-primary font-mono text-sm min-w-[80px] text-center"
              animate={{ scale: isHashing ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.2, repeat: isHashing ? Infinity : 0 }}
            >
              #{nonce}
            </motion.div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: isHashing ? [0, -5, 0] : 0 }}
            transition={{ duration: 0.3, repeat: isHashing ? Infinity : 0 }}
          >
            <div className="text-2xl">⬇️</div>
            <span className="text-xs text-muted-foreground">SHA-256</span>
          </motion.div>
        </div>

        {/* Hash Output */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Hash Result
          </label>
          <motion.div
            className={`p-4 rounded-lg font-mono text-xs break-all transition-colors ${
              isValidHash
                ? "bg-green-500/10 border-2 border-green-500 text-green-600"
                : "bg-muted text-muted-foreground"
            }`}
            animate={{
              opacity: isHashing ? [1, 0.5, 1] : 1,
            }}
            transition={{ duration: 0.1, repeat: isHashing ? Infinity : 0 }}
          >
            {hash || "Waiting for hash..."}
          </motion.div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-sm">
          {isHashing ? (
            <motion.span
              className="text-primary flex items-center gap-2"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <span className="animate-spin">⚙️</span> Mining... trying different nonces
            </motion.span>
          ) : isValidHash ? (
            <span className="text-green-600 font-semibold">
              ✅ Valid hash found! Block can be added to chain.
            </span>
          ) : (
            <span className="text-muted-foreground">
              ❌ Invalid hash. Must start with "0000"
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
