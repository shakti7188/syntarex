import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, ChevronRight } from "lucide-react";
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

export const DirectReferralTree = () => {
  const { teamStructure, isLoading } = useRealtimeTeamStructure();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Card>
    );
  }

  const { directReferrals } = teamStructure;
  const totalDirectReferrals = directReferrals.level1.length + directReferrals.level2.length + directReferrals.level3.length;

  // Empty state
  if (totalDirectReferrals === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary border-border">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-3xl">👥</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No direct referrals yet</h3>
            <p className="text-muted-foreground max-w-md">
              Share your referral link to start earning. You'll earn 20% from L1, 10% from L2, and 5% from L3.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const renderMemberList = (members: TeamMember[], level: number) => {
    if (members.length === 0) {
      return (
        <div className="text-center text-muted-foreground text-sm py-4">
          No Level {level} referrals yet
        </div>
      );
    }

    return (
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 animate-fade-in hover-scale"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {getInitials(member.full_name, member.email)}
                  </AvatarFallback>
                </Avatar>
                {member.is_active !== undefined && (
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${
                    member.is_active ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {member.full_name || member.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {member.rank || "Member"}
                </Badge>
                {member.binary_position && (
                  <Badge variant="secondary" className="text-xs">
                    {member.binary_position === "left" ? "L" : "R"}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">3-Tier Direct Referral Tree</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary text-primary">
            <Users className="w-3 h-3 mr-1" />
            {teamStructure.totalMembers} Total Members
          </Badge>
        </div>
      </div>

      {/* Level Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-card border-accent/30 animate-scale-in hover-scale">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level 1</span>
            <Badge className="bg-accent text-accent-foreground">20%</Badge>
          </div>
          <p className="text-2xl font-bold text-accent transition-all duration-300">
            {directReferrals.level1.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Direct referrals</p>
        </Card>

        <Card className="p-4 bg-card border-primary/30 animate-scale-in hover-scale" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level 2</span>
            <Badge className="bg-primary text-primary-foreground">10%</Badge>
          </div>
          <p className="text-2xl font-bold text-primary transition-all duration-300">
            {directReferrals.level2.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">2nd generation</p>
        </Card>

        <Card className="p-4 bg-card border-warning/30 animate-scale-in hover-scale" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level 3</span>
            <Badge className="bg-warning text-warning-foreground">5%</Badge>
          </div>
          <p className="text-2xl font-bold text-warning transition-all duration-300">
            {directReferrals.level3.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">3rd generation</p>
        </Card>
      </div>

      {/* Visual Tree Representation */}
      <div className="space-y-6">
        {/* Level 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-xs font-bold text-accent">L1</span>
            </div>
            <h4 className="font-semibold">First Generation ({directReferrals.level1.length})</h4>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          {renderMemberList(directReferrals.level1, 1)}
        </div>

        {/* Level 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">L2</span>
            </div>
            <h4 className="font-semibold">Second Generation ({directReferrals.level2.length})</h4>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          {renderMemberList(directReferrals.level2, 2)}
        </div>

        {/* Level 3 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
              <span className="text-xs font-bold text-warning">L3</span>
            </div>
            <h4 className="font-semibold">Third Generation ({directReferrals.level3.length})</h4>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          {renderMemberList(directReferrals.level3, 3)}
        </div>
      </div>

      {/* Growth Indicator */}
      {teamStructure.totalMembers > 0 && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Network Growth</p>
              <p className="text-xs text-muted-foreground">
                Your team is {teamStructure.totalMembers} members strong across 3 generations
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
