import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  UserPlus, 
  Package, 
  DollarSign, 
  TrendingUp,
  Award,
  Zap,
  Clock,
  ChevronDown,
  Bell
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "new_referral" | "purchase" | "commission" | "rank_up" | "milestone";
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    amount?: number;
    userName?: string;
    rankName?: string;
    packageName?: string;
  };
}

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "new_referral":
      return UserPlus;
    case "purchase":
      return Package;
    case "commission":
      return DollarSign;
    case "rank_up":
      return Award;
    case "milestone":
      return Zap;
    default:
      return Activity;
  }
};

const getActivityColor = (type: ActivityItem["type"]) => {
  switch (type) {
    case "new_referral":
      return "#3b82f6";
    case "purchase":
      return "#10b981";
    case "commission":
      return "#f59e0b";
    case "rank_up":
      return "#8b5cf6";
    case "milestone":
      return "#ec4899";
    default:
      return "#6b7280";
  }
};

export const ActivityFeed = () => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activity-feed", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch recent referrals
      const { data: referrals } = await supabase
        .from("referrals")
        .select(`
          id,
          created_at,
          referee_id,
          profiles!referrals_referee_id_fkey(full_name, email)
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent commissions
      const { data: commissions } = await supabase
        .from("commissions")
        .select("id, amount, commission_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Combine and format activities
      const activityItems: ActivityItem[] = [];

      referrals?.forEach((ref: any) => {
        const name = ref.profiles?.full_name || ref.profiles?.email?.split("@")[0] || "New member";
        activityItems.push({
          id: `ref-${ref.id}`,
          type: "new_referral",
          title: "New Team Member",
          description: `${name} joined your team`,
          timestamp: ref.created_at,
          metadata: { userName: name },
        });
      });

      commissions?.forEach((comm) => {
        activityItems.push({
          id: `comm-${comm.id}`,
          type: "commission",
          title: "Commission Earned",
          description: `$${Number(comm.amount).toFixed(2)} from ${comm.commission_type.replace("_", " ")}`,
          timestamp: comm.created_at || new Date().toISOString(),
          metadata: { amount: Number(comm.amount) },
        });
      });

      // Sort by timestamp
      return activityItems.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    enabled: !!user?.id,
  });

  const displayedActivities = showAll ? activities : activities?.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-32 h-6" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No recent activity</p>
          <p className="text-sm">Your team activity will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recent Activity</h3>
          <Badge variant="secondary" className="text-xs">
            {activities.length}
          </Badge>
        </div>
        <Clock className="w-4 h-4 text-muted-foreground" />
      </div>

      <ScrollArea className={cn(showAll ? "h-[400px]" : "h-auto")}>
        <div className="space-y-3">
          {displayedActivities?.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50",
                  "animate-fade-in transition-all hover:bg-muted/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{activity.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {activities && activities.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show Less" : `Show All (${activities.length})`}
          <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showAll && "rotate-180")} />
        </Button>
      )}
    </Card>
  );
};
