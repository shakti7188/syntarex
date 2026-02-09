import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
import { useRealtimeTeamStructure } from "@/hooks/useRealtimeTeamStructure";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  rank: string | null;
  level?: number;
  binary_position?: "left" | "right" | null;
  is_active?: boolean;
}

export const ReferralTree = () => {
  const { teamStructure, isLoading } = useRealtimeTeamStructure();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex flex-col items-center space-y-8">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="grid grid-cols-2 gap-8 w-full">
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const { binaryTeam } = teamStructure;
  const hasTeamMembers = binaryTeam.left.length > 0 || binaryTeam.right.length > 0;

  // Empty state
  if (!hasTeamMembers) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary border-border">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-3xl">🌳</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Build your binary network</h3>
            <p className="text-muted-foreground max-w-md">
              Place your referrals strategically in left or right legs to maximize your binary commissions.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  const weakLeg = binaryTeam.leftVolume < binaryTeam.rightVolume ? "left" : "right";
  const weakLegVolume = Math.min(binaryTeam.leftVolume, binaryTeam.rightVolume);
  const binaryCommission = weakLegVolume * 0.1;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const renderTeamMember = (member: TeamMember, index: number) => (
    <div
      key={member.id}
      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 animate-fade-in hover-scale"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {getInitials(member.full_name, member.email)}
          </AvatarFallback>
        </Avatar>
        {member.is_active !== undefined && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${
            member.is_active ? 'bg-green-500' : 'bg-muted'
          }`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">
          {member.full_name || member.email.split('@')[0]}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {member.rank || "Member"}
        </p>
      </div>
    </div>
  );

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-lg md:text-xl font-semibold">Binary Network Tree</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-accent text-accent text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Left: ${(binaryTeam.leftVolume / 1000).toFixed(1)}K ({binaryTeam.left.length})
          </Badge>
          <Badge variant="outline" className="border-primary text-primary text-xs">
            <ArrowRight className="w-3 h-3 mr-1" />
            Right: ${(binaryTeam.rightVolume / 1000).toFixed(1)}K ({binaryTeam.right.length})
          </Badge>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="flex flex-col items-center space-y-8">
        {/* Root Node */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="mt-2 font-semibold">You</p>
          <p className="text-xs text-muted-foreground">Bronze Partner</p>
        </div>

        {/* Binary Team Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Left Leg */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Left Team</p>
                  <p className="text-xs text-muted-foreground">
                    ${(binaryTeam.leftVolume / 1000).toFixed(1)}K Volume
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-accent text-accent">
                {binaryTeam.left.length} Members
              </Badge>
            </div>
            
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {binaryTeam.left.length > 0 ? (
                  binaryTeam.left.map((member, idx) => renderTeamMember(member, idx))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8 animate-fade-in">
                    No left team members yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Leg */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Right Team</p>
                  <p className="text-xs text-muted-foreground">
                    ${(binaryTeam.rightVolume / 1000).toFixed(1)}K Volume
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-primary text-primary">
                {binaryTeam.right.length} Members
              </Badge>
            </div>
            
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {binaryTeam.right.length > 0 ? (
                  binaryTeam.right.map((member, idx) => renderTeamMember(member, idx))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8 animate-fade-in">
                    No right team members yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-secondary/50 rounded-lg border border-border animate-fade-in">
        <p className="text-sm font-medium mb-2">Weak Leg Analysis</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Weak Leg:</span>
          <span className="font-semibold text-primary transition-all duration-300">
            {weakLeg === "left" ? "Left" : "Right"} (${(weakLegVolume / 1000).toFixed(1)}K)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Binary Commission (10%):</span>
          <span className="font-semibold text-accent transition-all duration-300">
            ${binaryCommission.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Total Team Members:</span>
          <span className="font-semibold transition-all duration-300">
            {binaryTeam.left.length + binaryTeam.right.length}
          </span>
        </div>
      </div>
    </Card>
  );
};