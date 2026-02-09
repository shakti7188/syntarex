import { 
  DollarSign, 
  TrendingUp, 
  ArrowLeftRight, 
  ArrowRightLeft, 
  Cpu, 
  Users,
  CheckCircle2,
  Target
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { RankDefinition, UserRankData } from "@/hooks/useUserRank";
import { cn } from "@/lib/utils";

interface RankRequirementsGridProps {
  nextRank: RankDefinition;
  userRankData: UserRankData | null;
  progressToNextRank: {
    personalSales: number;
    teamSales: number;
    leftLeg: number;
    rightLeg: number;
    hashrate: number;
    referrals: number;
  } | null;
}

export const RankRequirementsGrid = ({
  nextRank,
  userRankData,
  progressToNextRank,
}: RankRequirementsGridProps) => {
  const requirements = [
    {
      label: "Personal Sales",
      current: userRankData?.personal_sales || 0,
      required: nextRank.min_personal_sales,
      progress: progressToNextRank?.personalSales || 0,
      icon: DollarSign,
      format: (val: number) => `$${val.toLocaleString()}`,
      color: "#10b981",
    },
    {
      label: "Team Sales",
      current: userRankData?.team_sales || 0,
      required: nextRank.min_team_sales,
      progress: progressToNextRank?.teamSales || 0,
      icon: TrendingUp,
      format: (val: number) => `$${val.toLocaleString()}`,
      color: "#3b82f6",
    },
    {
      label: "Left Leg Volume",
      current: userRankData?.left_leg_volume || 0,
      required: nextRank.min_left_leg_volume,
      progress: progressToNextRank?.leftLeg || 0,
      icon: ArrowLeftRight,
      format: (val: number) => `$${val.toLocaleString()}`,
      color: "#8b5cf6",
    },
    {
      label: "Right Leg Volume",
      current: userRankData?.right_leg_volume || 0,
      required: nextRank.min_right_leg_volume,
      progress: progressToNextRank?.rightLeg || 0,
      icon: ArrowRightLeft,
      format: (val: number) => `$${val.toLocaleString()}`,
      color: "#ec4899",
    },
    {
      label: "Total Hashrate",
      current: userRankData?.total_hashrate || 0,
      required: nextRank.min_hashrate_ths,
      progress: progressToNextRank?.hashrate || 0,
      icon: Cpu,
      format: (val: number) => `${val.toFixed(1)} TH/s`,
      color: "#f59e0b",
    },
    {
      label: "Direct Referrals",
      current: userRankData?.direct_referral_count || 0,
      required: nextRank.min_direct_referrals,
      progress: progressToNextRank?.referrals || 0,
      icon: Users,
      format: (val: number) => val.toString(),
      color: "#06b6d4",
    },
  ];

  const completedCount = requirements.filter(r => r.progress >= 100).length;
  const overallProgress = requirements.reduce((sum, r) => sum + r.progress, 0) / requirements.length;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold">Overall Progress to {nextRank.rank_name}</span>
          </div>
          <span className="text-sm font-bold">{completedCount}/{requirements.length} Complete</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {overallProgress.toFixed(0)}% towards next rank
        </p>
      </Card>

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requirements.map((req) => {
          const Icon = req.icon;
          const isComplete = req.progress >= 100;
          const remaining = Math.max(0, req.required - req.current);

          return (
            <Card
              key={req.label}
              className={cn(
                "p-4 transition-all",
                isComplete 
                  ? "bg-accent/10 border-accent shadow-sm" 
                  : "bg-card border-border hover:border-primary/50"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${req.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: req.color }} />
                  </div>
                  <span className="font-medium text-sm">{req.label}</span>
                </div>
                {isComplete && (
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                )}
              </div>

              {/* Values */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{req.format(req.current)}</span>
                  <span className="text-sm text-muted-foreground">
                    / {req.format(req.required)}
                  </span>
                </div>
                {!isComplete && remaining > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Need {req.format(remaining)} more
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <Progress 
                  value={req.progress} 
                  className="h-2"
                  style={{ 
                    // @ts-ignore - custom CSS variable
                    "--progress-color": req.color 
                  }}
                />
                <p className="text-xs text-right font-medium" style={{ color: req.color }}>
                  {req.progress.toFixed(0)}%
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
