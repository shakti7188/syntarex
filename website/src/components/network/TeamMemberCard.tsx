import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  rank: string | null;
  binary_position?: "left" | "right" | null;
  is_active?: boolean;
  left_volume?: number;
  right_volume?: number;
  total_left_members?: number;
  total_right_members?: number;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onClick?: () => void;
  isDirectChild?: boolean;
  animationDelay?: number;
}

export const TeamMemberCard = ({
  member,
  onClick,
  isDirectChild = false,
  animationDelay = 0,
}: TeamMemberCardProps) => {
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const rankColor = getRankColor(member.rank);

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 animate-fade-in group",
        isDirectChild && "border-2 border-primary/40 bg-primary/5"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with status */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback
              className="text-sm font-medium"
              style={{ backgroundColor: `${rankColor}20`, color: rankColor }}
            >
              {getInitials(member.full_name, member.email)}
            </AvatarFallback>
          </Avatar>
          {member.is_active !== undefined && (
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                member.is_active ? "bg-green-500" : "bg-muted"
              )}
            />
          )}
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">
              {member.full_name || member.email.split("@")[0]}
            </p>
            {isDirectChild && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Direct
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 h-4"
              style={{ borderColor: rankColor, color: rankColor }}
            >
              {member.rank || "Member"}
            </Badge>
            {member.binary_position && (
              <span className="flex items-center gap-0.5">
                {member.binary_position === "left" ? (
                  <ArrowLeft className="h-3 w-3" />
                ) : (
                  <ArrowRight className="h-3 w-3" />
                )}
                {member.binary_position}
              </span>
            )}
          </div>
        </div>

        {/* BV Stats (if available) */}
        {(member.left_volume !== undefined || member.right_volume !== undefined) && (
          <div className="hidden sm:flex flex-col items-end text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ArrowLeft className="h-3 w-3 text-blue-500" />
              <span>${((member.left_volume || 0) / 1000).toFixed(1)}K</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ArrowRight className="h-3 w-3 text-primary" />
              <span>${((member.right_volume || 0) / 1000).toFixed(1)}K</span>
            </div>
          </div>
        )}

        {/* Navigation Arrow */}
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </Card>
  );
};

function getRankColor(rank: string | null): string {
  const colors: Record<string, string> = {
    "Private": "#6B7280",
    "Corporal": "#10B981",
    "Sergeant": "#3B82F6",
    "Lieutenant": "#8B5CF6",
    "Captain": "#F59E0B",
    "Major": "#EF4444",
    "Colonel": "#EC4899",
    "1-Star General": "#F97316",
    "2-Star General": "#14B8A6",
    "3-Star General": "#6366F1",
    "4-Star General": "#A855F7",
    "5-Star General": "#FFD700",
  };
  return colors[rank || ""] || "#6B7280";
}
