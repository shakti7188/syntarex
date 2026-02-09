import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserRank } from "@/hooks/useUserRank";
import { useTranslation } from "react-i18next";
import { Users, TrendingUp, Cpu, DollarSign, ArrowLeftRight, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const RankProgress = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentRank, nextRank, progressToNextRank, userRankData, isLoading } = useUserRank();

  if (isLoading) {
    return null;
  }

  if (!nextRank) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
        <div className="text-center">
          <h3 className="text-xl font-bold text-accent mb-2">
            🎉 {t("rank.maxRankAchieved")}
          </h3>
          <p className="text-muted-foreground">
            {t("rank.congratulations")} {currentRank?.rank_name}!
          </p>
        </div>
      </Card>
    );
  }

  const requirements = [
    {
      label: t("rank.personalSales"),
      current: userRankData?.personal_sales || 0,
      required: nextRank.min_personal_sales,
      progress: progressToNextRank?.personalSales || 0,
      icon: DollarSign,
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      label: t("rank.teamSales"),
      current: userRankData?.team_sales || 0,
      required: nextRank.min_team_sales,
      progress: progressToNextRank?.teamSales || 0,
      icon: TrendingUp,
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      label: t("rank.leftLegVolume"),
      current: userRankData?.left_leg_volume || 0,
      required: nextRank.min_left_leg_volume,
      progress: progressToNextRank?.leftLeg || 0,
      icon: ArrowLeftRight,
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      label: t("rank.rightLegVolume"),
      current: userRankData?.right_leg_volume || 0,
      required: nextRank.min_right_leg_volume,
      progress: progressToNextRank?.rightLeg || 0,
      icon: ArrowRightLeft,
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      label: t("rank.totalHashrate"),
      current: userRankData?.total_hashrate || 0,
      required: nextRank.min_hashrate_ths,
      progress: progressToNextRank?.hashrate || 0,
      icon: Cpu,
      format: (val: number) => `${val.toFixed(1)} TH/s`,
    },
    {
      label: t("rank.directReferrals"),
      current: userRankData?.direct_referral_count || 0,
      required: nextRank.min_direct_referrals,
      progress: progressToNextRank?.referrals || 0,
      icon: Users,
      format: (val: number) => val.toString(),
    },
  ];

  const overallProgress =
    requirements.reduce((sum, req) => sum + req.progress, 0) / requirements.length;

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t("rank.progressToNextRank")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("rank.nextRank")}: <span style={{ color: nextRank.rank_color }} className="font-semibold">{nextRank.rank_name}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/earnings")}>
          {t("rank.viewDetails")}
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t("rank.overallProgress")}</span>
          <span className="text-sm font-bold">{overallProgress.toFixed(0)}%</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requirements.map((req) => {
          const Icon = req.icon;
          const isComplete = req.progress >= 100;

          return (
            <div
              key={req.label}
              className={`p-3 rounded-lg border ${
                isComplete ? "bg-accent/10 border-accent" : "bg-card border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${isComplete ? "text-accent" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium">{req.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-sm font-bold">{req.format(req.current)}</span>
                <span className="text-xs text-muted-foreground">/ {req.format(req.required)}</span>
              </div>
              <Progress value={req.progress} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};
