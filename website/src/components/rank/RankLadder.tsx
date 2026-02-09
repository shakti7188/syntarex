import { CheckCircle2, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankDefinition } from "@/hooks/useUserRank";
import { MilitaryRankBadge } from "./MilitaryRankBadge";

// Count benefits from object or array format
const countBenefits = (benefits: any): number => {
  if (!benefits) return 0;
  if (Array.isArray(benefits)) return benefits.length;
  if (typeof benefits === 'object') return Object.keys(benefits).length;
  return 0;
};

interface RankLadderProps {
  ranks: RankDefinition[];
  currentRankLevel: number;
  onSelectRank?: (rank: RankDefinition) => void;
  selectedRankId?: string;
}

export const RankLadder = ({
  ranks,
  currentRankLevel,
  onSelectRank,
  selectedRankId,
}: RankLadderProps) => {
  return (
    <div className="space-y-2">
      {ranks.map((rank, index) => {
        const isAchieved = rank.rank_level <= currentRankLevel;
        const isCurrent = rank.rank_level === currentRankLevel;
        const isNext = rank.rank_level === currentRankLevel + 1;
        const isSelected = rank.id === selectedRankId;

        return (
          <div
            key={rank.id}
            onClick={() => onSelectRank?.(rank)}
            className={cn(
              "relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer",
              isSelected && "ring-2 ring-primary ring-offset-2",
              isCurrent && "bg-gradient-to-r from-primary/10 to-transparent border-primary",
              isAchieved && !isCurrent && "bg-accent/5 border-accent/50",
              !isAchieved && "bg-muted/30 border-border opacity-60",
              isNext && "border-dashed border-primary/50"
            )}
          >
            {/* Connector line */}
            {index < ranks.length - 1 && (
              <div 
                className={cn(
                  "absolute left-7 top-full w-0.5 h-2 z-10",
                  isAchieved ? "bg-accent" : "bg-border"
                )}
              />
            )}

            {/* Rank Badge */}
            <MilitaryRankBadge
              rankName={rank.rank_name}
              rankLevel={rank.rank_level}
              rankColor={isAchieved ? rank.rank_color : "#6b7280"}
              size="sm"
              showLabel={false}
            />

            {/* Rank Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 
                  className={cn(
                    "font-bold truncate",
                    isAchieved ? "text-foreground" : "text-muted-foreground"
                  )}
                  style={{ color: isAchieved ? rank.rank_color : undefined }}
                >
                  {rank.rank_name}
                </h4>
                {isCurrent && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Current
                  </span>
                )}
                {isNext && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    Next
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Level {rank.rank_level} • {countBenefits(rank.benefits)} benefits
              </p>
            </div>

            {/* Status Icon */}
            <div className="flex-shrink-0">
              {isAchieved ? (
                <CheckCircle2 className="w-5 h-5 text-accent" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Chevron */}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        );
      })}
    </div>
  );
};
