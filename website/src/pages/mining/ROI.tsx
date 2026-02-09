import { ROICalculator } from "@/components/roi/ROICalculator";
import { Calculator, TrendingUp, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROI = () => {
  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 w-fit">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              ROI & Profitability Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              Calculate your potential Bitcoin mining returns with real-time network data
            </p>
          </div>
        </div>
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            Live Network Stats
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Calculator className="h-3 w-3" />
            Difficulty Projections
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Multiple Scenarios
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Conservative Estimates
          </Badge>
        </div>
      </div>

      {/* Calculator Component */}
      <ROICalculator />
    </main>
  );
};

export default ROI;
