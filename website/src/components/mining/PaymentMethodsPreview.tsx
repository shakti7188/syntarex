import { Badge } from "@/components/ui/badge";
import { Coins, Percent } from "lucide-react";

export const PaymentMethodsPreview = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
        <img 
          src="https://cryptologos.cc/logos/tether-usdt-logo.png" 
          alt="USDT" 
          className="h-5 w-5"
        />
        <span className="text-sm font-medium">USDT</span>
        <span className="text-xs text-muted-foreground">(Solana)</span>
      </div>
      
      <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 ring-2 ring-primary/20">
        <Coins className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">XFLOW</span>
        <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-xs">
          <Percent className="h-3 w-3 mr-1" />
          10% OFF
        </Badge>
      </div>
    </div>
  );
};
