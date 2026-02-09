import { Award, Star, Shield, Sword, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRank } from "@/hooks/useUserRank";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Military rank icons and styling
const rankIcons: Record<string, { icon: React.ElementType; stars: number; color: string }> = {
  "private": { icon: Shield, stars: 0, color: "hsl(var(--muted-foreground))" },
  "corporal": { icon: Shield, stars: 1, color: "hsl(210, 10%, 50%)" },
  "sergeant": { icon: Sword, stars: 2, color: "hsl(35, 80%, 45%)" },
  "lieutenant": { icon: Sword, stars: 3, color: "hsl(45, 85%, 50%)" },
  "captain": { icon: Award, stars: 0, color: "hsl(210, 80%, 50%)" },
  "major": { icon: Award, stars: 1, color: "hsl(280, 60%, 50%)" },
  "colonel": { icon: Crown, stars: 0, color: "hsl(340, 70%, 50%)" },
  "general": { icon: Crown, stars: 1, color: "hsl(45, 100%, 50%)" },
  "5-star general": { icon: Crown, stars: 5, color: "hsl(45, 100%, 60%)" },
};

// Rank bonuses
const rankBonuses: Record<string, number> = {
  "sergeant": 500,
  "lieutenant": 1000,
  "captain": 2500,
  "major": 7000,
  "colonel": 25000,
  "general": 75000,
  "5-star general": 150000,
};

export const MilitaryRankBadge = () => {
  const { currentRank, isLoading } = useUserRank();

  if (isLoading) {
    return <Skeleton className="h-10 w-40" />;
  }

  const rankName = currentRank?.rank_name?.toLowerCase() || "private";
  const rankConfig = rankIcons[rankName] || rankIcons["private"];
  const Icon = rankConfig.icon;
  const bonus = rankBonuses[rankName] || 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="flex items-center gap-2 px-4 py-2 border-2 cursor-pointer hover:bg-secondary transition-colors"
            style={{ 
              borderColor: rankConfig.color,
              backgroundColor: `${rankConfig.color}10`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: rankConfig.color }} />
            <span className="font-semibold capitalize" style={{ color: rankConfig.color }}>
              {currentRank?.rank_name || "Private"}
            </span>
            {rankConfig.stars > 0 && rankConfig.stars < 5 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: rankConfig.stars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" style={{ color: rankConfig.color }} />
                ))}
              </div>
            )}
            {rankConfig.stars === 5 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current text-accent" />
                ))}
              </div>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="space-y-1">
            <p className="font-semibold capitalize">{currentRank?.rank_name || "Private"}</p>
            {bonus > 0 && (
              <p className="text-sm text-accent">
                Rank Bonus: ${bonus.toLocaleString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Level {currentRank?.rank_level || 1}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
