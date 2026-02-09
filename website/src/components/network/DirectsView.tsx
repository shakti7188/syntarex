import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, CheckCircle, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

interface DirectReferral {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  rank: string | null;
  created_at: string;
  binary_position: "left" | "right" | null;
  is_active: boolean;
  total_purchases?: number;
}

export const DirectsView = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRank, setFilterRank] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLeg, setFilterLeg] = useState<string>("all");

  const { data: directs, isLoading } = useQuery({
    queryKey: ["direct-referrals-full", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get referrals with level 1 (direct)
      const { data: referralData, error: refError } = await supabase
        .from("referrals")
        .select(`
          id,
          is_active,
          binary_position,
          created_at,
          referee_id
        `)
        .eq("referrer_id", user.id)
        .eq("referral_level", 1);

      if (refError) throw refError;
      if (!referralData?.length) return [];

      // Get profile details for each referral
      const refereeIds = referralData.map((r) => r.referee_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, rank, created_at")
        .in("id", refereeIds);

      if (profileError) throw profileError;

      // Combine data
      return referralData.map((ref) => {
        const profile = profiles?.find((p) => p.id === ref.referee_id);
        return {
          id: ref.referee_id,
          email: profile?.email || "",
          full_name: profile?.full_name,
          username: profile?.username,
          avatar_url: profile?.avatar_url,
          rank: profile?.rank,
          created_at: ref.created_at,
          binary_position: ref.binary_position as "left" | "right" | null,
          is_active: ref.is_active || false,
        };
      });
    },
    enabled: !!user?.id,
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const filteredDirects = (directs || []).filter((d) => {
    const matchesSearch =
      (d.full_name || d.email).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.username || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRank = filterRank === "all" || d.rank === filterRank;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && d.is_active) ||
      (filterStatus === "inactive" && !d.is_active);
    const matchesLeg =
      filterLeg === "all" ||
      (filterLeg === "left" && d.binary_position === "left") ||
      (filterLeg === "right" && d.binary_position === "right");
    return matchesSearch && matchesRank && matchesStatus && matchesLeg;
  });

  const leftCount = (directs || []).filter((d) => d.binary_position === "left").length;
  const rightCount = (directs || []).filter((d) => d.binary_position === "right").length;
  const activeCount = (directs || []).filter((d) => d.is_active).length;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{directs?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Total Directs</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold text-green-500">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <ArrowLeft className="h-5 w-5 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold text-blue-500">{leftCount}</p>
          <p className="text-xs text-muted-foreground">Left Leg</p>
        </Card>
        <Card className="p-4 text-center">
          <ArrowRight className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-primary">{rightCount}</p>
          <p className="text-xs text-muted-foreground">Right Leg</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLeg} onValueChange={setFilterLeg}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Leg" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Both Legs</SelectItem>
              <SelectItem value="left">Left Leg</SelectItem>
              <SelectItem value="right">Right Leg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Directs List */}
      <Card className="p-4">
        <div className="space-y-3">
          {filteredDirects.length > 0 ? (
            filteredDirects.map((direct) => (
              <div
                key={direct.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={direct.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(direct.full_name, direct.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {direct.full_name || direct.username || direct.email.split("@")[0]}
                      </p>
                      {direct.is_active ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    {direct.username && (
                      <p className="text-xs text-muted-foreground">@{direct.username}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{direct.rank || "Member"}</Badge>
                  <Badge
                    variant="secondary"
                    className={
                      direct.binary_position === "left"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-primary/10 text-primary"
                    }
                  >
                    {direct.binary_position === "left" ? (
                      <ArrowLeft className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowRight className="h-3 w-3 mr-1" />
                    )}
                    {direct.binary_position || "Unplaced"}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No direct referrals found</p>
              <p className="text-sm">Share your referral link to start building your team</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
