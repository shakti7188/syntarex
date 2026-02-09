import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import {
  Search,
  DollarSign,
  Users,
  GitBranch,
  Layers,
  ArrowDownRight,
  Filter,
  Calendar,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface CommissionEntry {
  id: string;
  amount: number;
  commission_type: string;
  created_at: string;
  source_user_id: string | null;
  source_user_name?: string | null;
  source_user_email?: string;
  tier?: number;
  status?: string;
}

const commissionTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  direct: { label: "Direct Referral", icon: Users, color: "text-green-600 bg-green-500/10" },
  binary: { label: "Binary", icon: GitBranch, color: "text-blue-600 bg-blue-500/10" },
  override: { label: "Override", icon: Layers, color: "text-purple-600 bg-purple-500/10" },
  leadership: { label: "Leadership Pool", icon: DollarSign, color: "text-amber-600 bg-amber-500/10" },
  staking: { label: "Staking", icon: ArrowDownRight, color: "text-primary bg-primary/10" },
};

export const EarningsHistory = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDays, setFilterDays] = useState<string>("30");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["earnings-history", user?.id, filterType, filterDays, page],
    queryFn: async () => {
      if (!user?.id) return { entries: [], total: 0 };

      const daysAgo = parseInt(filterDays);
      const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();

      // Fetch direct commissions
      let directQuery = supabase
        .from("direct_commissions")
        .select("id, amount, tier, created_at, source_user_id, status")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });

      if (filterType !== "all" && filterType !== "direct") {
        directQuery = directQuery.limit(0);
      }

      const { data: directData } = await directQuery;

      // Fetch binary commissions
      let binaryQuery = supabase
        .from("binary_commissions")
        .select("id, scaled_amount, created_at, status")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });

      if (filterType !== "all" && filterType !== "binary") {
        binaryQuery = binaryQuery.limit(0);
      }

      const { data: binaryData } = await binaryQuery;

      // Fetch override commissions
      let overrideQuery = supabase
        .from("override_commissions")
        .select("id, scaled_amount, level, created_at, source_user_id, status")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });

      if (filterType !== "all" && filterType !== "override") {
        overrideQuery = overrideQuery.limit(0);
      }

      const { data: overrideData } = await overrideQuery;

      // Collect all source user IDs
      const sourceIds = [
        ...(directData || []).map((d) => d.source_user_id).filter(Boolean),
        ...(overrideData || []).map((d) => d.source_user_id).filter(Boolean),
      ] as string[];

      // Fetch source user profiles
      let sourceProfiles: Record<string, { name: string; email: string }> = {};
      if (sourceIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, username")
          .in("id", [...new Set(sourceIds)]);

        (profiles || []).forEach((p) => {
          sourceProfiles[p.id] = {
            name: p.full_name || p.username || p.email.split("@")[0],
            email: p.email,
          };
        });
      }

      // Combine and format entries
      const entries: CommissionEntry[] = [
        ...(directData || []).map((d) => ({
          id: d.id,
          amount: d.amount,
          commission_type: "direct",
          created_at: d.created_at || "",
          source_user_id: d.source_user_id,
          source_user_name: d.source_user_id ? sourceProfiles[d.source_user_id]?.name : null,
          source_user_email: d.source_user_id ? sourceProfiles[d.source_user_id]?.email : undefined,
          tier: d.tier,
          status: d.status,
        })),
        ...(binaryData || []).map((d) => ({
          id: d.id,
          amount: d.scaled_amount || 0,
          commission_type: "binary",
          created_at: d.created_at || "",
          source_user_id: null,
          status: d.status,
        })),
        ...(overrideData || []).map((d) => ({
          id: d.id,
          amount: d.scaled_amount || 0,
          commission_type: "override",
          created_at: d.created_at || "",
          source_user_id: d.source_user_id,
          source_user_name: d.source_user_id ? sourceProfiles[d.source_user_id]?.name : null,
          source_user_email: d.source_user_id ? sourceProfiles[d.source_user_id]?.email : undefined,
          tier: d.level,
          status: d.status,
        })),
      ];

      // Sort by date
      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { entries, total: entries.length };
    },
    enabled: !!user?.id,
  });

  const filteredEntries = (data?.entries || []).filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.source_user_name?.toLowerCase().includes(query) ||
      entry.commission_type.toLowerCase().includes(query)
    );
  });

  const paginatedEntries = filteredEntries.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredEntries.length / pageSize);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Earnings History</h3>
          <Badge variant="outline">
            {filteredEntries.length} transactions
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="binary">Binary</SelectItem>
              <SelectItem value="override">Override</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDays} onValueChange={setFilterDays}>
            <SelectTrigger className="w-full sm:w-36">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-2">
        {paginatedEntries.length > 0 ? (
          paginatedEntries.map((entry) => {
            const typeInfo = commissionTypeLabels[entry.commission_type] || commissionTypeLabels.direct;
            const Icon = typeInfo.icon;

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{typeInfo.label}</p>
                      {entry.tier && (
                        <Badge variant="outline" className="text-xs">
                          L{entry.tier}
                        </Badge>
                      )}
                    </div>
                    {entry.source_user_name ? (
                      <p className="text-xs text-muted-foreground">
                        From: {entry.source_user_name}
                      </p>
                    ) : entry.commission_type === "binary" ? (
                      <p className="text-xs text-muted-foreground">Weak leg matching</p>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">+${entry.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), "MMM dd, HH:mm")}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No earnings found</p>
            <p className="text-sm">Start building your team to earn commissions</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
