import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadershipPool } from "@/hooks/useLeadershipPool";
import { Crown, Users, TrendingUp, Lock } from "lucide-react";

export const LeadershipPoolWidget = () => {
  const {
    latestDistribution,
    userTier,
    userPoolShare,
    isQualified,
    isLoading,
  } = useLeadershipPool();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-20" />
      </Card>
    );
  }

  const tierLabels: Record<number, { name: string; percent: string; color: string }> = {
    1: { name: "5-Star General", percent: "1.5%", color: "text-accent" },
    2: { name: "General", percent: "1.0%", color: "text-primary" },
    3: { name: "Colonel", percent: "0.5%", color: "text-warning" },
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Leadership Pool</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          3% Global
        </Badge>
      </div>

      {/* Pool Status */}
      {latestDistribution && (
        <div className="p-4 rounded-lg bg-card border border-border mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">This Week's Pool</span>
            <span className="text-xl font-bold text-accent">
              ${latestDistribution.total_pool_amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>
              From ${latestDistribution.total_weekly_volume.toLocaleString()} volume
            </span>
          </div>
        </div>
      )}

      {/* User's Status */}
      {isQualified && userTier ? (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`w-4 h-4 ${tierLabels[userTier].color}`} />
            <span className="text-sm font-medium">Your Tier</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-lg font-bold ${tierLabels[userTier].color}`}>
                {tierLabels[userTier].name}
              </p>
              <p className="text-xs text-muted-foreground">
                {tierLabels[userTier].percent} of pool
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Est. Share</p>
              <p className="text-lg font-bold text-accent">
                ${userPoolShare.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Not Qualified</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Reach Colonel rank or higher to participate in the Leadership Pool
          </p>
        </div>
      )}

      {/* Tier Breakdown */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">Pool Distribution</p>
        <div className="space-y-2">
          {Object.entries(tierLabels).map(([tier, info]) => (
            <div key={tier} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${info.color === "text-accent" ? "bg-accent" : info.color === "text-primary" ? "bg-primary" : "bg-warning"}`} />
                <span className={userTier === parseInt(tier) ? "font-medium" : "text-muted-foreground"}>
                  {info.name}
                </span>
              </div>
              <span className={userTier === parseInt(tier) ? "font-medium" : "text-muted-foreground"}>
                {info.percent}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
