import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package } from "@/hooks/usePackages";
import { Sparkles, Target, TrendingUp, Rocket } from "lucide-react";

interface PackageRecommenderProps {
  packages: Package[];
  onRecommendation: (packageId: string | null, budget: number) => void;
}

type Goal = "learn" | "income" | "maximum";

export const PackageRecommender = ({ packages, onRecommendation }: PackageRecommenderProps) => {
  const [budget, setBudget] = useState<number>(1000);
  const [goal, setGoal] = useState<Goal>("income");

  const minPrice = Math.min(...packages.map(p => p.price_usd));
  const maxPrice = Math.max(...packages.map(p => p.price_usd));

  // Find recommended package based on budget and goal
  const getRecommendedPackage = (): Package | null => {
    const affordablePackages = packages.filter(p => p.price_usd <= budget);
    if (affordablePackages.length === 0) return null;

    switch (goal) {
      case "learn":
        // Recommend the cheapest affordable package
        return affordablePackages.reduce((min, p) => 
          p.price_usd < min.price_usd ? p : min
        );
      case "income":
        // Recommend the best value (middle ground)
        return affordablePackages.reduce((best, p) => 
          p.price_usd > best.price_usd ? p : best
        );
      case "maximum":
        // Recommend the highest affordable package
        return affordablePackages.reduce((max, p) => 
          p.price_usd > max.price_usd ? p : max
        );
      default:
        return affordablePackages[0];
    }
  };

  const recommendedPackage = getRecommendedPackage();

  useEffect(() => {
    onRecommendation(recommendedPackage?.id || null, budget);
  }, [recommendedPackage?.id, budget]);

  const goals = [
    { id: "learn" as Goal, label: "Start small & learn", icon: Target, description: "Low risk, understand the process" },
    { id: "income" as Goal, label: "Serious monthly income", icon: TrendingUp, description: "Balanced investment for returns" },
    { id: "maximum" as Goal, label: "Maximum returns", icon: Rocket, description: "Highest earnings potential" },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Find Your Perfect Package</h3>
        </div>

        {/* Budget Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">What's your investment budget?</Label>
            <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
              ${budget.toLocaleString()}
            </Badge>
          </div>
          <Slider
            value={[budget]}
            onValueChange={(value) => setBudget(value[0])}
            min={minPrice}
            max={maxPrice}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${minPrice.toLocaleString()}</span>
            <span>${maxPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Goal Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">What's your goal?</Label>
          <RadioGroup value={goal} onValueChange={(v) => setGoal(v as Goal)} className="grid gap-3">
            {goals.map((g) => (
              <div key={g.id} className="relative">
                <RadioGroupItem value={g.id} id={g.id} className="peer sr-only" />
                <Label
                  htmlFor={g.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                >
                  <g.icon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <span className="font-medium">{g.label}</span>
                    <p className="text-xs text-muted-foreground">{g.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Recommendation */}
        {recommendedPackage && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>We recommend for you:</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xl text-primary">{recommendedPackage.name}</span>
                <p className="text-sm text-muted-foreground">
                  {recommendedPackage.hashrate_ths} TH/s • ${recommendedPackage.price_usd.toLocaleString()}
                </p>
              </div>
              <Badge className="bg-primary text-primary-foreground">Best Match</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
