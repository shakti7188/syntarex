import { Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRank } from "@/hooks/useUserRank";
import { useTranslation } from "react-i18next";
export const RankBadge = () => {
  const {
    t
  } = useTranslation();
  const {
    currentRank,
    isLoading
  } = useUserRank();
  if (isLoading) {
    return <Skeleton className="h-10 w-40" />;
  }
  if (!currentRank) {
    return <Badge variant="default" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border border-primary/60 shadow-sm">
        <Award className="w-5 h-5" />
        <span className="font-semibold">{t("rank.member")}</span>
      </Badge>;
  }
  return;
};