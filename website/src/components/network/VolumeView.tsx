import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";

export const VolumeView = () => {
  const { user } = useAuth();

  const { data: volumeData, isLoading } = useQuery({
    queryKey: ["volume-data", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: binaryTree, error } = await supabase
        .from("binary_tree")
        .select("left_volume, right_volume, total_left_members, total_right_members, weak_leg")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      return {
        leftVolume: Number(binaryTree?.left_volume || 0),
        rightVolume: Number(binaryTree?.right_volume || 0),
        leftMembers: binaryTree?.total_left_members || 0,
        rightMembers: binaryTree?.total_right_members || 0,
        weakLeg: binaryTree?.weak_leg || null,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const leftVolume = volumeData?.leftVolume || 0;
  const rightVolume = volumeData?.rightVolume || 0;
  const totalVolume = leftVolume + rightVolume;
  const matchingVolume = Math.min(leftVolume, rightVolume);
  const binaryCommission = matchingVolume * 0.1;
  const weakLeg = leftVolume <= rightVolume ? "left" : "right";
  const strongLeg = weakLeg === "left" ? "right" : "left";
  const leftPercent = totalVolume > 0 ? (leftVolume / totalVolume) * 100 : 50;
  const rightPercent = totalVolume > 0 ? (rightVolume / totalVolume) * 100 : 50;

  return (
    <div className="space-y-6">
      {/* Volume Overview */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Total Business Volume</h3>
            <p className="text-muted-foreground text-sm">
              Combined volume from both legs
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">${totalVolume.toLocaleString()}</p>
            <Badge variant="secondary" className="mt-1">
              <Zap className="h-3 w-3 mr-1" />
              This Period
            </Badge>
          </div>
        </div>

        {/* Volume Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-blue-500" />
              Left: ${leftVolume.toLocaleString()}
            </span>
            <span className="flex items-center gap-2">
              Right: ${rightVolume.toLocaleString()}
              <ArrowRight className="h-4 w-4 text-primary" />
            </span>
          </div>
          <div className="h-4 rounded-full overflow-hidden bg-muted flex">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${leftPercent}%` }}
            />
            <div
              className="bg-primary transition-all duration-500"
              style={{ width: `${rightPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{leftPercent.toFixed(1)}%</span>
            <span>{rightPercent.toFixed(1)}%</span>
          </div>
        </div>
      </Card>

      {/* Matching & Commission */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Matching Volume</h4>
              </div>
              <p className="text-2xl font-bold">${matchingVolume.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {weakLeg} (weak) leg
              </p>
            </div>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
              {weakLeg === "left" ? <ArrowLeft className="h-3 w-3 mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
              Weak Leg
            </Badge>
          </div>
        </Card>

        <Card className="p-6 bg-accent/5 border-accent/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-accent" />
                <h4 className="font-semibold">Binary Commission</h4>
              </div>
              <p className="text-2xl font-bold text-accent">${binaryCommission.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                10% of matching volume
              </p>
            </div>
            <Badge className="bg-accent text-accent-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              10%
            </Badge>
          </div>
        </Card>
      </div>

      {/* Left vs Right Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left Leg */}
        <Card className="p-6 border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ArrowLeft className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold">Left Leg</h4>
                {weakLeg === "left" && (
                  <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Weak
                  </Badge>
                )}
                {strongLeg === "left" && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Strong
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {volumeData?.leftMembers || 0} members
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-medium">${leftVolume.toLocaleString()}</span>
              </div>
              <Progress value={leftPercent} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{volumeData?.leftMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">
                  ${((volumeData?.leftMembers || 0) > 0 ? leftVolume / (volumeData?.leftMembers || 1) : 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Avg/Member</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Leg */}
        <Card className="p-6 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold">Right Leg</h4>
                {weakLeg === "right" && (
                  <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Weak
                  </Badge>
                )}
                {strongLeg === "right" && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Strong
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {volumeData?.rightMembers || 0} members
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-medium">${rightVolume.toLocaleString()}</span>
              </div>
              <Progress value={rightPercent} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{volumeData?.rightMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">
                  ${((volumeData?.rightMembers || 0) > 0 ? rightVolume / (volumeData?.rightMembers || 1) : 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Avg/Member</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tips */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Build Your Weak Leg</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Binary commissions are calculated based on your weak leg volume. Focus on growing your {weakLeg} leg to maximize earnings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
