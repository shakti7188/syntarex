import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyEarnings } from "@/hooks/useWeeklyEarnings";
import { useUserRank } from "@/hooks/useUserRank";
import { Shield, TrendingUp, AlertTriangle } from "lucide-react";

export const WeeklyCapWidget = () => {
  const { 
    currentEarnings, 
    weeklyCap, 
    hardCap, 
    capUsagePercent,
    isLoading 
  } = useWeeklyEarnings();
  const { currentRank } = useUserRank();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-20" />
      </Card>
    );
  }

  const isNearCap = capUsagePercent >= 80;
  const isAtCap = capUsagePercent >= 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Weekly Cap Status</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {currentRank?.rank_name || "Private"}
        </Badge>
      </div>

      {/* Cap Usage Progress */}
      <div className="p-4 rounded-lg bg-card border border-border mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">This Week's Earnings</span>
          <span className={`text-xl font-bold ${isAtCap ? "text-destructive" : isNearCap ? "text-warning" : "text-accent"}`}>
            {capUsagePercent.toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={Math.min(capUsagePercent, 100)} 
          className={`h-3 ${isAtCap ? "[&>div]:bg-destructive" : isNearCap ? "[&>div]:bg-warning" : ""}`} 
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-accent">
            ${currentEarnings.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            / ${weeklyCap.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Warning if near cap */}
      {isNearCap && !isAtCap && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 mb-4">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <p className="text-xs text-warning">
            You're approaching your weekly cap! Consider upgrading your rank for higher limits.
          </p>
        </div>
      )}

      {isAtCap && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-xs text-destructive">
            Weekly cap reached. Earnings will resume next week or upgrade your rank.
          </p>
        </div>
      )}

      {/* Cap Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Rank Cap</span>
          </div>
          <p className="text-lg font-bold">${weeklyCap.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">per week</p>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Hard Cap</span>
          </div>
          <p className="text-lg font-bold">${hardCap.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">per position</p>
        </div>
      </div>

      {/* Rank Upgrade Hint */}
      {currentRank && currentRank.rank_level < 9 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Advance to the next rank to increase your weekly cap
          </p>
        </div>
      )}
    </Card>
  );
};
