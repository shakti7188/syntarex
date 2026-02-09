import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGhostBV } from "@/hooks/useGhostBV";
import { Ghost, Clock, TrendingUp } from "lucide-react";

export const GhostBVWidget = () => {
  const {
    activeGhostBV,
    totalActiveGhostBV,
    totalExpiredGhostBV,
    isLoading,
  } = useGhostBV();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-20" />
      </Card>
    );
  }

  if (activeGhostBV.length === 0 && totalExpiredGhostBV === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
        <div className="flex items-center gap-2 mb-4">
          <Ghost className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Ghost BV Boost</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Purchase a package to receive Ghost BV (80% of package value)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Ghost BV is automatically placed in your pay leg for 10 days
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ghost className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Ghost BV Boost</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          80% BV
        </Badge>
      </div>

      {/* Active Ghost BV Total */}
      <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Active Ghost BV</span>
          <span className="text-xl font-bold text-accent">
            ${totalActiveGhostBV.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Added to your pay leg for bonus volume
        </p>
      </div>

      {/* Individual Ghost BV Records */}
      <div className="space-y-3">
        {activeGhostBV.slice(0, 3).map((ghost) => {
          const expiryProgress = ((10 - ghost.daysRemaining) / 10) * 100;
          
          return (
            <div key={ghost.id} className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">
                    ${ghost.ghost_bv_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {ghost.daysRemaining}d left
                  </span>
                </div>
              </div>
              <Progress value={expiryProgress} className="h-1.5" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  Pay Leg: {ghost.pay_leg?.toUpperCase() || "AUTO"}
                </span>
                <Badge 
                  variant={ghost.daysRemaining <= 2 ? "destructive" : "secondary"} 
                  className="text-xs"
                >
                  {ghost.daysRemaining <= 2 ? "Expiring Soon" : "Active"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {activeGhostBV.length > 3 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          +{activeGhostBV.length - 3} more active Ghost BV
        </p>
      )}

      {totalExpiredGhostBV > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Expired Ghost BV: ${totalExpiredGhostBV.toLocaleString()}
          </p>
        </div>
      )}
    </Card>
  );
};
