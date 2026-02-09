import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

const StatCard = ({ title, value, change, icon: Icon, color, loading }: StatCardProps) => {
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="w-10 h-10 rounded-lg mb-3" />
        <Skeleton className="w-20 h-4 mb-2" />
        <Skeleton className="w-16 h-6" />
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && change !== 0 && (
          <div className={cn(
            "flex items-center text-xs font-medium",
            change > 0 ? "text-green-500" : "text-red-500"
          )}>
            {change > 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </Card>
  );
};

export const QuickStats = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["quick-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [referralsResult, binaryTreeResult, commissionsResult] = await Promise.all([
        supabase
          .from("referrals")
          .select("id, is_active")
          .eq("referrer_id", user.id)
          .eq("referral_level", 1),
        supabase
          .from("binary_tree")
          .select("left_volume, right_volume, total_left_members, total_right_members")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("commissions")
          .select("amount")
          .eq("user_id", user.id),
      ]);

      const totalReferrals = referralsResult.data?.length || 0;
      const activeReferrals = referralsResult.data?.filter(r => r.is_active).length || 0;
      const leftVolume = Number(binaryTreeResult.data?.left_volume || 0);
      const rightVolume = Number(binaryTreeResult.data?.right_volume || 0);
      const totalVolume = leftVolume + rightVolume;
      const totalMembers = (binaryTreeResult.data?.total_left_members || 0) + 
                          (binaryTreeResult.data?.total_right_members || 0);
      const totalEarnings = commissionsResult.data?.reduce(
        (sum, c) => sum + Number(c.amount || 0), 0
      ) || 0;

      return {
        totalReferrals,
        activeReferrals,
        totalVolume,
        totalMembers,
        totalEarnings,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Direct Referrals"
        value={stats?.totalReferrals.toString() || "0"}
        icon={Users}
        color="#3b82f6"
        loading={isLoading}
      />
      <StatCard
        title="Team Size"
        value={stats?.totalMembers.toString() || "0"}
        icon={Zap}
        color="#8b5cf6"
        loading={isLoading}
      />
      <StatCard
        title="Total Volume"
        value={`$${(stats?.totalVolume || 0).toLocaleString()}`}
        icon={TrendingUp}
        color="#10b981"
        loading={isLoading}
      />
      <StatCard
        title="Total Earnings"
        value={`$${(stats?.totalEarnings || 0).toFixed(2)}`}
        icon={DollarSign}
        color="#f59e0b"
        loading={isLoading}
      />
    </div>
  );
};
