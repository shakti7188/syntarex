import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Percent } from "lucide-react";
import { useGroupedPayoutSettings } from "@/hooks/usePayoutSettings";

export const PayoutStructureWidget = () => {
  const { grouped, isLoading } = useGroupedPayoutSettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout Structure</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!grouped) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Current Affiliate Payout Structure
        </CardTitle>
        <CardDescription>
          Transparent view of commission rates and caps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Direct Referrals */}
        <div>
          <h4 className="font-semibold mb-2">Direct Referrals</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Tier 1</div>
              <div className="font-medium">{grouped.direct.tier1}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Tier 2</div>
              <div className="font-medium">{grouped.direct.tier2}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Tier 3</div>
              <div className="font-medium">{grouped.direct.tier3}%</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Binary */}
        <div>
          <h4 className="font-semibold mb-2">Binary Commission</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Weak Leg Rate</div>
              <div className="font-medium">{grouped.binary.weakLeg}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Max Cap</div>
              <div className="font-medium">{grouped.binary.cap}%</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Overrides */}
        <div>
          <h4 className="font-semibold mb-2">Override Commissions</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Level 1</div>
              <div className="font-medium">{grouped.override.level1}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Level 2</div>
              <div className="font-medium">{grouped.override.level2}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Level 3</div>
              <div className="font-medium">{grouped.override.level3}%</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Global Cap */}
        <div>
          <h4 className="font-semibold mb-2">Global Limit</h4>
          <div className="text-sm">
            <div className="text-muted-foreground">Maximum Total Payout</div>
            <div className="font-medium text-lg">{grouped.global.payoutCap}% of Sales Volume</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
