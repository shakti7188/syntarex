import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStakingData } from "@/hooks/useStakingData";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, TrendingUp, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

const Staking = () => {
  const {
    rewards,
    overrideEarnings,
    activePositions,
    totalStaked,
    totalBtcEarned,
    totalOverrideEarned,
    todayBtcEarned,
    isLoading,
  } = useStakingData();

  const formatBtc = (value: number) => value.toFixed(8);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Staking</h1>
          <p className="text-muted-foreground">Manage your XFLOW staking positions</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staking</h1>
        <p className="text-muted-foreground">Manage your XFLOW staking positions and earn BTC rewards</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaked.toLocaleString()} XFLOW</div>
            <p className="text-xs text-muted-foreground">{activePositions.length} active positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBtc(todayBtcEarned)} BTC</div>
            <p className="text-xs text-muted-foreground">Daily staking rewards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total BTC Earned</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBtc(totalBtcEarned)} BTC</div>
            <p className="text-xs text-muted-foreground">Lifetime staking rewards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Override Earnings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBtc(totalOverrideEarned)} BTC</div>
            <p className="text-xs text-muted-foreground">10% from direct referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Staking Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {activePositions.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
              <p className="text-muted-foreground mb-4">
                Stake your XFLOW tokens to earn daily BTC rewards
              </p>
              <Button>Start Staking</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activePositions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{position.token_amount.toLocaleString()} XFLOW</p>
                    <p className="text-sm text-muted-foreground">
                      Staked {format(new Date(position.staked_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatBtc(position.total_btc_earned)} BTC
                    </p>
                    <p className="text-sm text-muted-foreground">Total earned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No rewards yet</p>
          ) : (
            <div className="space-y-2">
              {rewards.slice(0, 10).map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(reward.reward_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <span className="font-medium text-green-600">
                    +{formatBtc(reward.btc_earned)} BTC
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override Earnings */}
      {overrideEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Override Earnings (10% from Direct Referrals)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overrideEarnings.slice(0, 10).map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{earning.source_user_email || "Direct Referral"}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(earning.reward_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="font-medium text-green-600">
                    +{formatBtc(earning.btc_earned)} BTC
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Staking;
