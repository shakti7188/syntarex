import { useQuery } from "@tanstack/react-query";

interface BitcoinMarketData {
  price: number;
  priceChange24h: number;
  networkHashrate: number; // in EH/s (for display)
  difficulty: number; // Current network difficulty
  blockReward: number; // BTC per block
  dailyEarningsPerThs: number; // USD per TH/s per day
}

export const useBitcoinMarketData = () => {
  return useQuery({
    queryKey: ["bitcoin-market-data"],
    queryFn: async (): Promise<BitcoinMarketData> => {
      try {
        // Fetch BTC price from CoinGecko
        const priceResponse = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
        );
        const priceData = await priceResponse.json();
        
        // Fetch blockchain stats from Blockchain.info
        const statsResponse = await fetch("https://blockchain.info/stats?format=json");
        const statsData = await statsResponse.json();
        
        const btcPrice = priceData.bitcoin?.usd || 90000;
        const priceChange = priceData.bitcoin?.usd_24h_change || 0;
        
        // Extract network data - blockchain.info returns hash_rate in TH/s (not H/s)
        // According to their API docs, it's already in TH/s format
        const rawHashrate = statsData.hash_rate || 0;
        const difficulty = statsData.difficulty || 110000000000000;
        const blockReward = 3.125; // Current block reward after April 2024 halving
        
        // Convert TH/s to EH/s for display (1 EH/s = 1,000,000 TH/s)
        // If the value seems too small (< 100), it might already be in EH/s
        let networkHashrateEhs: number;
        if (rawHashrate > 1e15) {
          // Value is in H/s, convert to EH/s
          networkHashrateEhs = rawHashrate / 1e18;
        } else if (rawHashrate > 1e9) {
          // Value is in TH/s, convert to EH/s
          networkHashrateEhs = rawHashrate / 1e6;
        } else if (rawHashrate > 100) {
          // Value is likely in PH/s, convert to EH/s
          networkHashrateEhs = rawHashrate / 1000;
        } else {
          // Value is already in EH/s or use fallback
          networkHashrateEhs = rawHashrate > 0 ? rawHashrate : 750;
        }
        
        // Calculate daily earnings per TH/s using the official Bitcoin mining formula
        // Formula: (Hashrate in H/s × Block Reward × 86400) / (Difficulty × 2^32)
        const hashrateInHs = 1e12; // 1 TH/s = 1 trillion hashes per second
        const secondsPerDay = 86400;
        const pow232 = Math.pow(2, 32); // 2^32 = 4,294,967,296
        
        const dailyBtcPerThs = (hashrateInHs * blockReward * secondsPerDay) / (difficulty * pow232);
        let dailyEarningsPerThs = dailyBtcPerThs * btcPrice;
        
        // Sanity check: realistic range is $0.05-$0.20 per TH/s per day
        // If calculation is outside this range, use conservative estimate
        if (dailyEarningsPerThs > 0.25 || dailyEarningsPerThs < 0.01 || isNaN(dailyEarningsPerThs)) {
          dailyEarningsPerThs = 0.08; // Conservative realistic estimate
        }
        
        return {
          price: btcPrice,
          priceChange24h: priceChange,
          networkHashrate: networkHashrateEhs,
          difficulty,
          blockReward,
          dailyEarningsPerThs
        };
      } catch (error) {
        console.error("Error fetching Bitcoin market data:", error);
        // Return fallback data
        return {
          price: 90000,
          priceChange24h: 0,
          networkHashrate: 750, // EH/s
          difficulty: 110000000000000, // Current approximate difficulty
          blockReward: 3.125,
          dailyEarningsPerThs: 0.08
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
