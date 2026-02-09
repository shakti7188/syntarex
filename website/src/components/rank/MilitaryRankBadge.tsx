import { Award, Star, Shield, Crown, Sword, Medal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface MilitaryRankBadgeProps {
  rankName: string;
  rankLevel: number;
  rankColor: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}

const getRankIcon = (level: number) => {
  if (level >= 10) return Crown;
  if (level >= 8) return Sword;
  if (level >= 6) return Shield;
  if (level >= 4) return Medal;
  if (level >= 2) return Star;
  return Award;
};

const getStarCount = (level: number) => {
  if (level >= 10) return 5;
  if (level >= 8) return 4;
  if (level >= 6) return 3;
  if (level >= 4) return 2;
  if (level >= 2) return 1;
  return 0;
};

export const MilitaryRankBadge = ({
  rankName,
  rankLevel,
  rankColor,
  size = "md",
  showLabel = true,
  className,
}: MilitaryRankBadgeProps) => {
  const Icon = getRankIcon(rankLevel);
  const starCount = getStarCount(rankLevel);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-36 h-36",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const starSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
    xl: "w-5 h-5",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Badge Container */}
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-background to-secondary",
          "border-4 shadow-lg",
          sizeClasses[size]
        )}
        style={{ 
          borderColor: rankColor,
          boxShadow: `0 0 20px ${rankColor}40, inset 0 0 20px ${rankColor}20`
        }}
      >
        {/* Inner glow ring */}
        <div 
          className="absolute inset-2 rounded-full opacity-20"
          style={{ backgroundColor: rankColor }}
        />
        
        {/* Icon */}
        <Icon 
          className={cn("relative z-10", iconSizes[size])}
          style={{ color: rankColor }}
        />

        {/* Stars */}
        {starCount > 0 && (
          <div className="absolute -bottom-1 flex gap-0.5">
            {Array.from({ length: starCount }).map((_, i) => (
              <Star
                key={i}
                className={cn(starSizes[size], "fill-current")}
                style={{ color: rankColor }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <p 
            className={cn(
              "font-bold uppercase tracking-wide",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base",
              size === "xl" && "text-lg"
            )}
            style={{ color: rankColor }}
          >
            {rankName}
          </p>
          <p className="text-xs text-muted-foreground">
            Level {rankLevel}
          </p>
        </div>
      )}
    </div>
  );
};
