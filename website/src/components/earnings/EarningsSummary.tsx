import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeCommissions } from "@/hooks/useRealtimeCommissions";
import { useWeeklyEarnings } from "@/hooks/useWeeklyEarnings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

export const EarningsSummary = () => {
  const { user } = useAuth();
  const { commissions, isLoading: commissionsLoading } = useRealtimeCommissions();
  const { currentEarnings, weeklyCap } = useWeeklyEarnings();

  // Get today's earnings
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["today-earnings", user?.id],
    queryFn: async () => {
      if (!user?.id) return { today: 0, pending: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's direct commissions
      const { data: directToday } = await supabase
        .from("direct_commissions")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      // Get pending commissions
      const { data: pending } = await supabase
        .from("commissions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "pending");

      const todayTotal = (directToday || []).reduce((sum, c) => sum + (c.amount || 0), 0);
      const pendingTotal = (pending || []).reduce((sum, c) => sum + (c.amount || 0), 0);

      return { today: todayTotal, pending: pendingTotal };
    },
    enabled: !!user?.id,
  });

  // Calculate monthly earnings (simplified - sum all commissions from this month)
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly-earnings", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("direct_commissions")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      return (data || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    },
    enabled: !!user?.id,
  });

  const isLoading = commissionsLoading || todayLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Earnings",
      value: commissions.total,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      badge: todayData?.today ? `+$${todayData.today.toFixed(2)} today` : null,
      badgeColor: "bg-green-500/10 text-green-600",
    },
    {
      label: "This Week",
      value: currentEarnings,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      subtext: weeklyCap > 0 ? `Cap: $${weeklyCap.toLocaleString()}` : undefined,
    },
    {
      label: "This Month",
      value: monthlyData || 0,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    {
      label: "Pending",
      value: todayData?.pending || 0,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      subtext: "Awaiting settlement",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={`p-4 ${stat.bgColor} ${stat.borderColor} border`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.badge && (
                <Badge variant="secondary" className={`text-xs ${stat.badgeColor}`}>
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {stat.badge}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">${stat.value.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.subtext && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
