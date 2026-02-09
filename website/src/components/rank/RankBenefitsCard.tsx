import { CheckCircle2, Gift, Sparkles, Trophy, Zap, DollarSign, Percent, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RankDefinition } from "@/hooks/useUserRank";
import { MilitaryRankBadge } from "./MilitaryRankBadge";
import { cn } from "@/lib/utils";

interface RankBenefitsCardProps {
  rank: RankDefinition;
  isAchieved?: boolean;
  isCurrent?: boolean;
}

const getBenefitIcon = (benefit: string) => {
  const lower = benefit.toLowerCase();
  if (lower.includes("bonus") || lower.includes("$")) return DollarSign;
  if (lower.includes("%") || lower.includes("percent")) return Percent;
  if (lower.includes("team") || lower.includes("referral")) return Users;
  if (lower.includes("priority") || lower.includes("vip")) return Sparkles;
  if (lower.includes("cap") || lower.includes("limit")) return Zap;
  return Gift;
};

// Transform benefits from object or array format to displayable strings
const transformBenefits = (benefits: any): string[] => {
  if (!benefits) return [];
  
  // Already an array of strings
  if (Array.isArray(benefits)) {
    return benefits.map(b => {
      if (typeof b === 'string') return b;
      if (typeof b === 'object') return formatBenefitObject(b);
      return String(b);
    });
  }
  
  // Single object - transform to array
  if (typeof benefits === 'object') {
    return [formatBenefitObject(benefits)];
  }
  
  return [];
};

const formatBenefitObject = (obj: Record<string, any>): string => {
  const parts: string[] = [];
  
  if (obj.rank_bonus) {
    parts.push(`$${Number(obj.rank_bonus).toLocaleString()} Rank Bonus`);
  }
  if (obj.weekly_cap) {
    parts.push(`$${Number(obj.weekly_cap).toLocaleString()}/week Binary Cap`);
  }
  if (obj.leadership_pool) {
    parts.push(`${obj.leadership_pool}% Leadership Pool`);
  }
  if (obj.direct_bonus) {
    parts.push(`${obj.direct_bonus}% Direct Bonus`);
  }
  if (obj.override_bonus) {
    parts.push(`${obj.override_bonus}% Override Bonus`);
  }
  
  // Handle any other keys
  Object.entries(obj).forEach(([key, value]) => {
    if (!['rank_bonus', 'weekly_cap', 'leadership_pool', 'direct_bonus', 'override_bonus'].includes(key)) {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      parts.push(`${formattedKey}: ${value}`);
    }
  });
  
  return parts.join(', ') || 'Rank benefits included';
};

export const RankBenefitsCard = ({
  rank,
  isAchieved = false,
  isCurrent = false,
}: RankBenefitsCardProps) => {
  return (
    <Card 
      className={cn(
        "p-6 transition-all",
        isCurrent && "ring-2 ring-primary shadow-lg",
        isAchieved && !isCurrent && "bg-accent/5",
        !isAchieved && "opacity-75"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <MilitaryRankBadge
          rankName={rank.rank_name}
          rankLevel={rank.rank_level}
          rankColor={isAchieved ? rank.rank_color : "#6b7280"}
          size="lg"
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isCurrent && (
              <Badge className="bg-primary text-primary-foreground">
                Your Rank
              </Badge>
            )}
            {isAchieved && !isCurrent && (
              <Badge variant="secondary" className="bg-accent/20 text-accent">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Achieved
              </Badge>
            )}
            {!isAchieved && (
              <Badge variant="outline" className="text-muted-foreground">
                Locked
              </Badge>
            )}
          </div>
          
          {/* Requirements summary */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {rank.min_personal_sales > 0 && (
              <span>Personal: ${rank.min_personal_sales.toLocaleString()}</span>
            )}
            {rank.min_team_sales > 0 && (
              <span>Team: ${rank.min_team_sales.toLocaleString()}</span>
            )}
            {rank.min_direct_referrals > 0 && (
              <span>Referrals: {rank.min_direct_referrals}</span>
            )}
            {rank.min_hashrate_ths > 0 && (
              <span>Hashrate: {rank.min_hashrate_ths} TH/s</span>
            )}
          </div>
        </div>
      </div>

      {/* Benefits */}
      {(() => {
        const displayBenefits = transformBenefits(rank.benefits);
        return displayBenefits.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: rank.rank_color }} />
              Benefits Unlocked
            </h4>
            <div className="grid gap-2">
              {displayBenefits.map((benefit, index) => {
                const Icon = getBenefitIcon(benefit);
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      isAchieved ? "bg-accent/10" : "bg-muted/50"
                    )}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: isAchieved ? `${rank.rank_color}20` : undefined 
                      }}
                    >
                      <Icon 
                        className="w-4 h-4"
                        style={{ color: isAchieved ? rank.rank_color : "#6b7280" }}
                      />
                    </div>
                    <span className={cn(
                      "text-sm",
                      isAchieved ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {benefit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No special benefits at this rank
          </div>
        );
      })()}
    </Card>
  );
};
