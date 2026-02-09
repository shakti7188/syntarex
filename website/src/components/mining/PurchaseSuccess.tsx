import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "@/hooks/usePackages";
import { CheckCircle, Zap, ArrowRight, Share2, Gift, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PurchaseSuccessProps {
  package: Package;
  onClose: () => void;
}

export const PurchaseSuccess = ({ package: pkg, onClose }: PurchaseSuccessProps) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const estimatedDailyBTC = pkg.hashrate_ths * 0.000004; // Approximate
  const estimatedMonthlyUSD = estimatedDailyBTC * 30 * 97000; // Approximate with BTC price

  return (
    <div className="text-center space-y-6">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative"
      >
        <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  x: 40, 
                  y: 40,
                  scale: 1 
                }}
                animate={{ 
                  opacity: 0, 
                  x: 40 + (Math.random() - 0.5) * 100, 
                  y: 40 + (Math.random() - 0.5) * 100,
                  scale: 0
                }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="absolute w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'][i % 4] 
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Success Message */}
      <div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          Purchase Successful!
        </h2>
        <p className="text-muted-foreground">
          Your mining package is now being activated
        </p>
      </div>

      {/* Package Summary */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">{pkg.name}</span>
            <Badge variant="secondary">{pkg.hashrate_ths} TH/s</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-left">
              <p className="text-muted-foreground">Hashrate</p>
              <p className="font-medium">{pkg.hashrate_ths} TH/s</p>
            </div>
            <div className="text-left">
              <p className="text-muted-foreground">XFLOW Tokens</p>
              <p className="font-medium">{pkg.xflow_tokens.toLocaleString()}</p>
            </div>
            <div className="text-left">
              <p className="text-muted-foreground">Est. Daily BTC</p>
              <p className="font-medium text-amber-600">~{estimatedDailyBTC.toFixed(6)} BTC</p>
            </div>
            <div className="text-left">
              <p className="text-muted-foreground">Est. Monthly</p>
              <p className="font-medium text-green-600">~${estimatedMonthlyUSD.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            What's Next?
          </h3>
          <div className="space-y-3 text-left text-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-xs font-bold">✓</div>
              <span>Payment confirmed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">2</div>
              <span>Hashrate allocation in progress (~1 hour)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">3</div>
              <span>First BTC earnings within 24 hours</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                <Award className="h-3 w-3" />
              </div>
              <span>NFT Certificate minted to your wallet</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Notice */}
      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm flex items-center gap-2">
        <Award className="h-4 w-4 text-accent flex-shrink-0" />
        <span>An NFT receipt will be minted as proof of your purchase</span>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          onClick={() => { onClose(); navigate('/dashboard'); }} 
          className="w-full"
          size="lg"
        >
          View My Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => { onClose(); navigate('/mining/my-machines'); }}
          >
            <Gift className="mr-2 h-4 w-4" />
            My Packages
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => { onClose(); navigate('/referrals'); }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Invite Friends
          </Button>
        </div>
      </div>
    </div>
  );
};
