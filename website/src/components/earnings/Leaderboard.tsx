import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users,
  Flame,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  value: number;
  change?: number;
  isCurrentUser?: boolean;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return Crown;
  if (rank === 2) return Medal;
  if (rank === 3) return Trophy;
  return null;
};

const getRankColor = (rank: number) => {
  if (rank === 1) return "#fbbf24";
  if (rank === 2) return "#9ca3af";
  if (rank === 3) return "#b45309";
  return undefined;
};

export const Leaderboard = () => {
  const { user } = useAuth();

  const { data: topRecruiters, isLoading: recruitersLoading } = useQuery({
    queryKey: ["leaderboard-recruiters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          referrer_id,
          profiles!referrals_referrer_id_fkey(id, full_name, avatar_url, email)
        `)
        .eq("referral_level", 1);

      if (error) throw error;

      // Count referrals per user
      const counts: Record<string, { count: number; profile: any }> = {};
      data?.forEach((ref: any) => {
        const id = ref.referrer_id;
        if (!counts[id]) {
          counts[id] = { count: 0, profile: ref.profiles };
        }
        counts[id].count++;
      });

      // Convert to array and sort
      return Object.entries(counts)
        .map(([id, { count, profile }]) => ({
          id,
          rank: 0,
          name: profile?.full_name || profile?.email?.split("@")[0] || "Anonymous",
          avatar: profile?.avatar_url,
          value: count,
          isCurrentUser: id === user?.id,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    },
    enabled: !!user,
  });

  const { data: topVolume, isLoading: volumeLoading } = useQuery({
    queryKey: ["leaderboard-volume"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("binary_tree")
        .select(`
          user_id,
          left_volume,
          right_volume,
          profiles!binary_tree_user_id_fkey(id, full_name, avatar_url, email)
        `)
        .order("left_volume", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || [])
        .map((entry: any) => ({
          id: entry.user_id,
          rank: 0,
          name: entry.profiles?.full_name || entry.profiles?.email?.split("@")[0] || "Anonymous",
          avatar: entry.profiles?.avatar_url,
          value: Number(entry.left_volume || 0) + Number(entry.right_volume || 0),
          isCurrentUser: entry.user_id === user?.id,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    },
    enabled: !!user,
  });

  const renderLeaderboardList = (entries: LeaderboardEntry[] | undefined, isLoading: boolean, valueLabel: string) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }

    if (!entries || entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No data available yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry) => {
          const RankIcon = getRankIcon(entry.rank);
          const rankColor = getRankColor(entry.rank);

          return (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                entry.isCurrentUser 
                  ? "bg-primary/10 border-2 border-primary" 
                  : "bg-muted/30 border border-border/50 hover:bg-muted/50",
                entry.rank <= 3 && "shadow-sm"
              )}
            >
              {/* Rank */}
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {RankIcon ? (
                  <RankIcon className="w-6 h-6" style={{ color: rankColor }} />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarImage src={entry.avatar} />
                <AvatarFallback className="text-xs">
                  {entry.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm truncate flex items-center gap-2",
                  entry.isCurrentUser && "text-primary"
                )}>
                  <span className="truncate">{entry.name}</span>
                  {entry.isCurrentUser && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">You</Badge>
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="text-right">
                <p className="font-bold text-sm">
                  {valueLabel === "$" 
                    ? `$${entry.value.toLocaleString()}`
                    : entry.value.toLocaleString()
                  }
                </p>
                <p className="text-xs text-muted-foreground">{valueLabel === "$" ? "volume" : "referrals"}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Top Performers</h3>
      </div>

      <Tabs defaultValue="recruiters" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="recruiters" className="flex-1 gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Top Recruiters</span>
            <span className="sm:hidden">Recruiters</span>
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex-1 gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Top Volume</span>
            <span className="sm:hidden">Volume</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recruiters">
          {renderLeaderboardList(topRecruiters, recruitersLoading, "count")}
        </TabsContent>

        <TabsContent value="volume">
          {renderLeaderboardList(topVolume, volumeLoading, "$")}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
