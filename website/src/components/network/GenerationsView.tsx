import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, ChevronRight, Layers } from "lucide-react";

interface GenerationMember {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  rank: string | null;
  level: number;
  referrer_name?: string;
}

export const GenerationsView = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const { data: generations, isLoading } = useQuery({
    queryKey: ["generations-data", user?.id],
    queryFn: async () => {
      if (!user?.id) return { level1: [], level2: [], level3: [] };

      // Get all referrals up to level 3
      const { data: referralData, error: refError } = await supabase
        .from("referrals")
        .select(`
          referee_id,
          referral_level,
          referrer_id
        `)
        .eq("referrer_id", user.id)
        .lte("referral_level", 3);

      if (refError) throw refError;
      if (!referralData?.length) return { level1: [], level2: [], level3: [] };

      // Get level 2 and 3 by traversing
      const level1Ids = referralData.filter((r) => r.referral_level === 1).map((r) => r.referee_id);
      
      let level2Ids: string[] = [];
      let level3Ids: string[] = [];

      if (level1Ids.length > 0) {
        // Get level 2 (referrals of level 1)
        const { data: l2Data } = await supabase
          .from("referrals")
          .select("referee_id, referrer_id")
          .in("referrer_id", level1Ids)
          .eq("referral_level", 1);
        
        level2Ids = (l2Data || []).map((r) => r.referee_id);

        if (level2Ids.length > 0) {
          // Get level 3 (referrals of level 2)
          const { data: l3Data } = await supabase
            .from("referrals")
            .select("referee_id")
            .in("referrer_id", level2Ids)
            .eq("referral_level", 1);
          
          level3Ids = (l3Data || []).map((r) => r.referee_id);
        }
      }

      // Get all unique profile IDs
      const allIds = [...new Set([...level1Ids, ...level2Ids, ...level3Ids])];
      if (allIds.length === 0) return { level1: [], level2: [], level3: [] };

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, rank")
        .in("id", allIds);

      if (profileError) throw profileError;

      const mapProfiles = (ids: string[], level: number): GenerationMember[] => {
        return ids.map((id) => {
          const profile = profiles?.find((p) => p.id === id);
          return {
            id,
            email: profile?.email || "",
            full_name: profile?.full_name,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            rank: profile?.rank,
            level,
          };
        });
      };

      return {
        level1: mapProfiles(level1Ids, 1),
        level2: mapProfiles(level2Ids, 2),
        level3: mapProfiles(level3Ids, 3),
      };
    },
    enabled: !!user?.id,
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const filterMembers = (members: GenerationMember[]) => {
    return members.filter((m) =>
      (m.full_name || m.email).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.username || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const allMembers = [
    ...(generations?.level1 || []),
    ...(generations?.level2 || []),
    ...(generations?.level3 || []),
  ];

  const displayMembers =
    selectedLevel === "all"
      ? filterMembers(allMembers)
      : selectedLevel === "1"
      ? filterMembers(generations?.level1 || [])
      : selectedLevel === "2"
      ? filterMembers(generations?.level2 || [])
      : filterMembers(generations?.level3 || []);

  const levelColors = {
    1: "bg-green-500/10 text-green-600 border-green-500/20",
    2: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    3: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };

  const levelRates = {
    1: "10%",
    2: "5%",
    3: "3%",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className={levelColors[1]}>L1</Badge>
            <span className="text-xs text-muted-foreground">{levelRates[1]}</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{generations?.level1.length || 0}</p>
          <p className="text-xs text-muted-foreground">Level 1</p>
        </Card>
        <Card className="p-4 text-center border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className={levelColors[2]}>L2</Badge>
            <span className="text-xs text-muted-foreground">{levelRates[2]}</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{generations?.level2.length || 0}</p>
          <p className="text-xs text-muted-foreground">Level 2</p>
        </Card>
        <Card className="p-4 text-center border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className={levelColors[3]}>L3</Badge>
            <span className="text-xs text-muted-foreground">{levelRates[3]}</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{generations?.level3.length || 0}</p>
          <p className="text-xs text-muted-foreground">Level 3</p>
        </Card>
      </div>

      {/* Search & Level Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="1">L1</TabsTrigger>
            <TabsTrigger value="2">L2</TabsTrigger>
            <TabsTrigger value="3">L3</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Members List */}
      <Card className="p-4">
        <div className="space-y-2">
          {displayMembers.length > 0 ? (
            displayMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(member.full_name, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {member.full_name || member.username || member.email.split("@")[0]}
                    </p>
                    {member.username && (
                      <p className="text-xs text-muted-foreground">@{member.username}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {member.rank || "Member"}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${levelColors[member.level as 1 | 2 | 3]}`}>
                    L{member.level} • {levelRates[member.level as 1 | 2 | 3]}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No members at this level</p>
              <p className="text-sm">Grow your team to unlock deeper generations</p>
            </div>
          )}
        </div>
      </Card>

      {/* Commission Info */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ChevronRight className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Unilevel Commissions</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Earn 10% from Level 1, 5% from Level 2, and 3% from Level 3 referral purchases. 
              Unlock all 3 levels with a $1,000+ package.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
