import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRealtimeCommissions } from "@/hooks/useRealtimeCommissions";
import { useWeeklyEarnings } from "@/hooks/useWeeklyEarnings";
import { useStakingData } from "@/hooks/useStakingData";
import { useTranslation } from "react-i18next";
import { Coins, Users, TrendingUp, Crown, Zap } from "lucide-react";

export const CommissionBreakdown = () => {
  const { t } = useTranslation();
  const { commissions: liveCommissions, isLoading } = useRealtimeCommissions();
  const { weeklyCap, currentEarnings, capUsagePercent } = useWeeklyEarnings();
  const { totalOverrideEarned } = useStakingData();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const totalEarnings = liveCommissions.total;

  // Empty state
  if (totalEarnings === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary border-border">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-3xl">💰</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{t('commissions.noCommissions')}</h3>
            <p className="text-muted-foreground max-w-md">
              {t('commissions.shareReferral')}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Synterax Commission Structure
  const commissions = [
    { 
      type: "Direct L1 (Instant)", 
      rate: "10%", 
      amount: liveCommissions.direct_l1, 
      icon: Zap,
      color: "accent",
      description: "Paid instantly on direct referral purchases"
    },
    { 
      type: "Direct L2", 
      rate: "5%", 
      amount: liveCommissions.direct_l2, 
      icon: Users,
      color: "accent",
      description: "Unlocked with $500+ package"
    },
    { 
      type: "Direct L3", 
      rate: "5%", 
      amount: liveCommissions.direct_l3, 
      icon: Users,
      color: "accent",
      description: "Unlocked with $1,000+ package"
    },
    { 
      type: "Binary Weak Leg", 
      rate: "10%", 
      amount: liveCommissions.binary, 
      icon: TrendingUp,
      color: "primary",
      description: "10% of weak leg volume with rank caps"
    },
    { 
      type: "Override Bonus", 
      rate: "2-5%", 
      amount: liveCommissions.override, 
      icon: Crown,
      color: "warning",
      description: "Override from team's binary commissions"
    },
    { 
      type: "Staking Override", 
      rate: "10%", 
      amount: totalOverrideEarned * 100000, // Convert BTC to USD estimate
      icon: Coins,
      color: "primary",
      description: "10% of direct referrals' staking rewards"
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Synterax Commission Breakdown</h3>
          <Badge variant="secondary">3 Income Streams</Badge>
        </div>
        
        <div className="space-y-4">
          {commissions.map((commission, i) => {
            const Icon = commission.icon;
            return (
              <div 
                key={i} 
                className="space-y-2 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 text-${commission.color}`} />
                    <span className="text-sm font-medium">{commission.type}</span>
                    <span className="text-xs text-muted-foreground">({commission.rate})</span>
                  </div>
                  <span className="font-semibold text-accent transition-all duration-300">
                    ${commission.amount.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={totalEarnings > 0 ? (commission.amount / totalEarnings) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">{commission.description}</p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Weekly Cap Usage</span>
            <span className="text-xl font-bold text-warning">{capUsagePercent.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(capUsagePercent, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            ${currentEarnings.toLocaleString()} / ${weeklyCap.toLocaleString()} (Rank-based cap)
          </p>
        </div>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 bg-card border-accent/30 animate-scale-in hover-scale">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-accent" />
            <p className="text-sm text-muted-foreground">Direct Commissions</p>
          </div>
          <p className="text-2xl font-bold text-accent mt-1 transition-all duration-300">
            ${(liveCommissions.direct_l1 + liveCommissions.direct_l2 + liveCommissions.direct_l3).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">10%/5%/5% (3 Levels)</p>
        </Card>

        <Card className="p-4 bg-card border-primary/30 animate-scale-in hover-scale" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">Binary Commissions</p>
          </div>
          <p className="text-2xl font-bold text-primary mt-1 transition-all duration-300">
            ${liveCommissions.binary.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">10% Weak Leg + Caps</p>
        </Card>

        <Card className="p-4 bg-card border-warning/30 animate-scale-in hover-scale" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-warning" />
            <p className="text-sm text-muted-foreground">Override & Leadership</p>
          </div>
          <p className="text-2xl font-bold text-warning mt-1 transition-all duration-300">
            ${liveCommissions.override.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Override + 3% Pool</p>
        </Card>
      </div>

      {/* Premium Package Bonus Info */}
      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-accent" />
          <h4 className="font-semibold">Premium Package Bonus</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          When your direct referrals purchase premium packages ($2,500+), you earn 
          <span className="font-bold text-accent"> 100% matching bonus</span> on Level 1 
          instead of the standard 10%!
        </p>
      </Card>
    </div>
  );
};
