import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Search,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TeamMemberCard } from "./TeamMemberCard";
import { TreeNavigator } from "./TreeNavigator";

export interface BinaryMember {
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
  total_earnings?: number;
  sponsor_name?: string;
  username?: string;
}

interface BinaryTreeVisualizationProps {
  currentUser: BinaryMember | null;
  leftTeam: BinaryMember[];
  rightTeam: BinaryMember[];
  leftVolume: number;
  rightVolume: number;
  leftDirectChild?: BinaryMember | null;
  rightDirectChild?: BinaryMember | null;
  isLoading?: boolean;
  onNavigateToMember?: (memberId: string) => void;
  onNavigateBack?: () => void;
  onGoBottomLeft?: () => void;
  onGoBottomRight?: () => void;
  navigationPath?: BinaryMember[];
  referralLink?: string;
}

export const BinaryTreeVisualization = ({
  currentUser,
  leftTeam,
  rightTeam,
  leftVolume,
  rightVolume,
  leftDirectChild,
  rightDirectChild,
  isLoading = false,
  onNavigateToMember,
  onNavigateBack,
  onGoBottomLeft,
  onGoBottomRight,
  navigationPath = [],
  referralLink = "",
}: BinaryTreeVisualizationProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const weakLeg = leftVolume <= rightVolume ? "left" : "right";
  const strongLeg = leftVolume > rightVolume ? "left" : "right";

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "Referral link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const filteredLeftTeam = leftTeam.filter((m) =>
    (m.full_name || m.email).toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRightTeam = rightTeam.filter((m) =>
    (m.full_name || m.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="grid grid-cols-2 gap-8 w-full">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </Card>
    );
  }

  const hasTeamMembers = leftTeam.length > 0 || rightTeam.length > 0;

  return (
    <div className="space-y-4">
      {/* Navigation Breadcrumb */}
      {navigationPath.length > 0 && (
        <TreeNavigator
          navigationPath={navigationPath}
          onNavigateBack={onNavigateBack}
          onNavigateToMember={onNavigateToMember}
        />
      )}

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {referralLink && (
            <Button variant="outline" size="sm" onClick={copyReferralLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Link
            </Button>
          )}
          <Button variant="outline" size="sm" disabled>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Main Tree Card */}
      <Card className="p-6 bg-gradient-to-b from-card to-secondary/30 border-border overflow-hidden">
        {/* User Profile Card - Center */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg ring-4 ring-background">
              {currentUser?.avatar_url ? (
                <Avatar className="w-20 h-20">
                  <AvatarImage src={currentUser.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(currentUser.full_name, currentUser.email)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Users className="w-10 h-10 text-primary-foreground" />
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background" />
          </div>

          <div className="text-center mt-3">
            <h3 className="font-bold text-lg">
              {currentUser?.full_name || currentUser?.username || "You"}
            </h3>
            {currentUser?.username && (
              <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
            )}
            <Badge
              variant="outline"
              className="mt-1"
              style={{ borderColor: getRankColor(currentUser?.rank), color: getRankColor(currentUser?.rank) }}
            >
              {currentUser?.rank || "Member"}
            </Badge>
          </div>

          {/* Sponsor info */}
          {currentUser?.sponsor_name && (
            <p className="text-xs text-muted-foreground mt-2">
              Sponsored by: <span className="font-medium">{currentUser.sponsor_name}</span>
            </p>
          )}

          {/* Total Earnings */}
          {currentUser?.total_earnings !== undefined && (
            <p className="text-sm font-medium text-accent mt-2">
              Total Earnings: ${currentUser.total_earnings.toFixed(2)}
            </p>
          )}
        </div>

        {/* Connecting Lines SVG */}
        <div className="relative h-12 mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="xMidYMid meet">
            {/* Center to left line */}
            <path
              d="M 200 0 L 200 20 L 100 20 L 100 50"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.5"
            />
            {/* Center to right line */}
            <path
              d="M 200 0 L 200 20 L 300 20 L 300 50"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Left & Right Team Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Team Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ArrowLeft className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">Left Team</h4>
                    {weakLeg === "left" && (
                      <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-600">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Weak
                      </Badge>
                    )}
                    {strongLeg === "left" && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Strong
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    BV: ${leftVolume.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{leftTeam.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Direct Left Child Card */}
            {leftDirectChild && (
              <TeamMemberCard
                member={leftDirectChild}
                onClick={() => onNavigateToMember?.(leftDirectChild.id)}
                isDirectChild
              />
            )}

            {/* Left Team List */}
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-3">
                {filteredLeftTeam.length > 0 ? (
                  filteredLeftTeam.slice(0, 50).map((member, idx) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      onClick={() => onNavigateToMember?.(member.id)}
                      animationDelay={idx * 30}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No matching members" : "No left team members yet"}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Go Bottom Left Button */}
            {leftTeam.length > 0 && onGoBottomLeft && (
              <Button variant="ghost" size="sm" className="w-full" onClick={onGoBottomLeft}>
                <ChevronDown className="h-4 w-4 mr-2" />
                Go Bottom LEFT
              </Button>
            )}
          </div>

          {/* Right Team Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">Right Team</h4>
                    {weakLeg === "right" && (
                      <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-600">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Weak
                      </Badge>
                    )}
                    {strongLeg === "right" && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Strong
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    BV: ${rightVolume.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{rightTeam.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Direct Right Child Card */}
            {rightDirectChild && (
              <TeamMemberCard
                member={rightDirectChild}
                onClick={() => onNavigateToMember?.(rightDirectChild.id)}
                isDirectChild
              />
            )}

            {/* Right Team List */}
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-3">
                {filteredRightTeam.length > 0 ? (
                  filteredRightTeam.slice(0, 50).map((member, idx) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      onClick={() => onNavigateToMember?.(member.id)}
                      animationDelay={idx * 30}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No matching members" : "No right team members yet"}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Go Bottom Right Button */}
            {rightTeam.length > 0 && onGoBottomRight && (
              <Button variant="ghost" size="sm" className="w-full" onClick={onGoBottomRight}>
                <ChevronDown className="h-4 w-4 mr-2" />
                Go Bottom RIGHT
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{leftTeam.length + rightTeam.length}</p>
            <p className="text-xs text-muted-foreground">Total Downline</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">${((leftVolume + rightVolume) / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground">Total BV</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold capitalize">{weakLeg}</p>
            <p className="text-xs text-muted-foreground">Weak Leg</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/10">
            <p className="text-2xl font-bold text-accent">
              ${(Math.min(leftVolume, rightVolume) * 0.1).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Binary Comm. (10%)</p>
          </div>
        </div>
      </Card>
    </div>
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
