import { Zap, Bitcoin, Coins, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Hashrate",
    description: "Your mining power is allocated immediately upon payment"
  },
  {
    icon: Bitcoin,
    title: "Daily BTC Earnings",
    description: "Earn Bitcoin daily based on your hashrate allocation"
  },
  {
    icon: Coins,
    title: "XFLOW Tokens",
    description: "Receive XFLOW tokens for staking and platform rewards"
  },
  {
    icon: Clock,
    title: "24/7 Operations",
    description: "Professional mining operations running around the clock"
  }
];

export const WhatsIncluded = () => {
  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">What's Included</h2>
        <p className="text-muted-foreground">Every package comes with these benefits</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{feature.title}</h3>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
