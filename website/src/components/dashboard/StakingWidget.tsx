import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStakingData } from "@/hooks/useStakingData";
import { Coins, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StakingWidget = () => {
  const navigate = useNavigate();
  const {
    activePositions,
    totalStaked,
    totalBtcEarned,
    totalOverrideEarned,
    todayBtcEarned,
    isLoading,
  } = useStakingData();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Card>
    );
  }

  const formatBtc = (value: number) => value.toFixed(8);

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Staking Rewards</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/staking")}>
          Manage <ArrowUpRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Staked */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Staked</span>
          </div>
          <p className="text-xl font-bold">{totalStaked.toLocaleString()} XFLOW</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activePositions.length} active position{activePositions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Today's BTC Earnings */}
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-xs text-accent">Today's Earnings</span>
          </div>
          <p className="text-xl font-bold text-accent">{formatBtc(todayBtcEarned)} BTC</p>
          <Badge variant="secondary" className="mt-1 text-xs">
            Daily
          </Badge>
        </div>

        {/* Total BTC Earned */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total BTC Earned</span>
          </div>
          <p className="text-lg font-bold">{formatBtc(totalBtcEarned)} BTC</p>
        </div>

        {/* Override Earnings (10% from direct referrals) */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary">10% Override</span>
          </div>
          <p className="text-lg font-bold text-primary">{formatBtc(totalOverrideEarned)} BTC</p>
          <p className="text-xs text-muted-foreground mt-1">From direct referrals</p>
        </div>
      </div>

      {activePositions.length === 0 && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Stake XFLOW tokens to earn daily BTC rewards
          </p>
          <Button variant="default" size="sm" className="mt-2" onClick={() => navigate("/staking")}>
            Start Staking
          </Button>
        </div>
      )}
    </Card>
  );
};
