import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Award, RefreshCw, Users, TrendingUp, Search, Crown, Shield, Star } from "lucide-react";
import { format } from "date-fns";

interface RankStats {
  rankDistribution: Record<string, number>;
  totalUsers: number;
  recentPromotions: Array<{
    id: string;
    user_id: string;
    old_rank: string;
    new_rank: string;
    rank_level: number;
    achieved_at: string;
    criteria_met: any;
  }>;
}

export const RankManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchUserId, setSearchUserId] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  // Fetch rank definitions
  const { data: rankDefinitions } = useQuery({
    queryKey: ['rank-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_definitions')
        .select('*')
        .order('rank_level', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch rank statistics
  const { data: rankStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-rank-stats'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('evaluate-user-ranks', {
        body: { action: 'get_stats' },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`
        }
      });
      if (response.error) throw response.error;
      return response.data as RankStats;
    }
  });

  // Bulk evaluate mutation
  const bulkEvaluateMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('evaluate-user-ranks', {
        body: { action: 'evaluate_all' },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`
        }
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Evaluation Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-rank-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Evaluation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Single user evaluate mutation
  const evaluateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('evaluate-user-ranks', {
        body: { action: 'evaluate_single', userId },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`
        }
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "User Evaluated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-rank-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Evaluation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Set rank mutation
  const setRankMutation = useMutation({
    mutationFn: async ({ userId, newRank, reason }: { userId: string; newRank: string; reason: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('evaluate-user-ranks', {
        body: { action: 'set_rank', userId, newRank, reason },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`
        }
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Rank Updated",
        description: data.message,
      });
      setSearchUserId("");
      setSelectedRank("");
      setOverrideReason("");
      queryClient.invalidateQueries({ queryKey: ['admin-rank-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getRankIcon = (level: number) => {
    if (level >= 7) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (level >= 4) return <Shield className="h-4 w-4 text-primary" />;
    return <Star className="h-4 w-4 text-muted-foreground" />;
  };

  const getRankColor = (rankName: string) => {
    const rank = rankDefinitions?.find(r => r.rank_name === rankName);
    return rank?.rank_color || '#888888';
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Rank Management
              </CardTitle>
              <CardDescription>
                Evaluate user ranks, view promotions, and manage rank overrides
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchStats()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => bulkEvaluateMutation.mutate()}
                disabled={bulkEvaluateMutation.isPending}
              >
                {bulkEvaluateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Evaluate All Users
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Rank Distribution */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          rankDefinitions?.slice(0, 5).map((rank) => (
            <Card key={rank.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getRankIcon(rank.rank_level)}
                  <span 
                    className="font-semibold text-sm"
                    style={{ color: rank.rank_color }}
                  >
                    {rank.rank_name}
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {rankStats?.rankDistribution[rank.rank_name] || 0}
                </p>
                <p className="text-xs text-muted-foreground">users</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Manual Rank Override */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Manual Rank Override</CardTitle>
          <CardDescription>
            Set a user's rank manually (bypasses automatic evaluation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">User ID</label>
              <Input
                placeholder="Enter user UUID"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">New Rank</label>
              <Select value={selectedRank} onValueChange={setSelectedRank}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  {rankDefinitions?.map((rank) => (
                    <SelectItem key={rank.id} value={rank.rank_name}>
                      <span style={{ color: rank.rank_color }}>{rank.rank_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Input
                placeholder="Reason for override"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => evaluateUserMutation.mutate(searchUserId)}
                disabled={!searchUserId || evaluateUserMutation.isPending}
              >
                <Search className="h-4 w-4 mr-2" />
                Evaluate
              </Button>
              <Button
                onClick={() => setRankMutation.mutate({ 
                  userId: searchUserId, 
                  newRank: selectedRank, 
                  reason: overrideReason 
                })}
                disabled={!searchUserId || !selectedRank || setRankMutation.isPending}
              >
                Set Rank
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Promotions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Recent Promotions
          </CardTitle>
          <CardDescription>
            Latest rank advancements across the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : rankStats?.recentPromotions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent promotions. Run bulk evaluation to check for qualified users.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Previous Rank</TableHead>
                  <TableHead>New Rank</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Criteria Met</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankStats?.recentPromotions?.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono text-xs">
                      {promo.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        style={{ borderColor: getRankColor(promo.old_rank), color: getRankColor(promo.old_rank) }}
                      >
                        {promo.old_rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        style={{ backgroundColor: getRankColor(promo.new_rank), color: 'white' }}
                      >
                        {promo.new_rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(promo.achieved_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs">
                      {promo.criteria_met?.type === 'manual_override' ? (
                        <span className="text-warning">Manual Override</span>
                      ) : (
                        <span className="text-muted-foreground">
                          Sales: ${promo.criteria_met?.personal_sales?.toFixed(0) || 0} | 
                          Refs: {promo.criteria_met?.direct_referrals || 0}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
