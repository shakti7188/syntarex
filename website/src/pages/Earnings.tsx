import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRank } from "@/hooks/useUserRank";
import { useRealtimeCommissions } from "@/hooks/useRealtimeCommissions";
import { useWeeklyEarnings } from "@/hooks/useWeeklyEarnings";
import { DirectReferralTree } from "@/components/dashboard/DirectReferralTree";
import { BinaryTreeVisualization } from "@/components/network/BinaryTreeVisualization";
import { DirectsView } from "@/components/network/DirectsView";
import { VolumeView } from "@/components/network/VolumeView";
import { GenerationsView } from "@/components/network/GenerationsView";
import { EarningsSummary } from "@/components/earnings/EarningsSummary";
import { EarningsHistory } from "@/components/earnings/EarningsHistory";
import { ActivityFeed } from "@/components/earnings/ActivityFeed";
import { Leaderboard } from "@/components/earnings/Leaderboard";
import { QuickStats } from "@/components/earnings/QuickStats";
import { useNavigableBinaryTree } from "@/hooks/useNavigableBinaryTree";
import { useReferralNotifications } from "@/hooks/useReferralNotifications";
// Commission widgets - re-enabled
import { ClaimableSettlements } from "@/components/dashboard/ClaimableSettlements";
import { StakingWidget } from "@/components/dashboard/StakingWidget";
import { GhostBVWidget } from "@/components/dashboard/GhostBVWidget";
import { WeeklyCapWidget } from "@/components/dashboard/WeeklyCapWidget";
import { LeadershipPoolWidget } from "@/components/dashboard/LeadershipPoolWidget";
import { CommissionBreakdown } from "@/components/dashboard/CommissionBreakdown";
import { WeeklySettlement } from "@/components/dashboard/WeeklySettlement";
import { ReferralDashboard } from "@/components/referral/ReferralDashboard";
import { RankProgress } from "@/components/dashboard/RankProgress";
import { MilitaryRankBadge } from "@/components/rank/MilitaryRankBadge";
import { RankLadder } from "@/components/rank/RankLadder";
import { RankBenefitsCard } from "@/components/rank/RankBenefitsCard";
import { RankRequirementsGrid } from "@/components/rank/RankRequirementsGrid";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Award,
  TrendingUp,
  Users,
  DollarSign,
  Cpu,
  ArrowLeftRight,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Copy,
  Share2,
  Check,
  ArrowLeft,
  ArrowRight,
  Link,
  Settings,
  GitBranch,
  UserPlus,
  Loader2,
  Info,
  LayoutGrid,
  Zap,
  Layers,
  BarChart3,
} from "lucide-react";

type BinaryPosition = 'left' | 'right';
import { RankDefinition } from "@/hooks/useUserRank";

export default function Earnings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [defaultLeg, setDefaultLeg] = useState<BinaryPosition>('left');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRank, setSelectedRank] = useState<RankDefinition | null>(null);

  // Rank data
  const {
    rankDefinitions,
    currentRank,
    nextRank,
    userRankData,
    rankHistory,
    progressToNextRank,
    isLoading: rankLoading,
  } = useUserRank();

  // Commission data
  const { commissions, isLoading: commissionsLoading } = useRealtimeCommissions();
  const { currentEarnings, weeklyCap } = useWeeklyEarnings();

  // Navigable binary tree
  const {
    currentUser: treeCurrentUser,
    leftTeam,
    rightTeam,
    leftVolume,
    rightVolume,
    leftDirectChild,
    rightDirectChild,
    isLoading: treeLoading,
    navigationPath,
    navigateToMember,
    navigateBack,
    goBottomLeft,
    goBottomRight,
  } = useNavigableBinaryTree();

  // Enable real-time notifications for referral events
  useReferralNotifications();
  // Referral data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-referral', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, default_placement_leg')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data?.default_placement_leg) {
        setDefaultLeg(data.default_placement_leg as BinaryPosition);
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [{ data: referrals }, { data: binaryTree }] = await Promise.all([
        supabase
          .from('referrals')
          .select('id, is_active, binary_position')
          .eq('referrer_id', user.id)
          .eq('referral_level', 1),
        supabase
          .from('binary_tree')
          .select('left_volume, right_volume, total_left_members, total_right_members')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);
      
      return {
        total: referrals?.length || 0,
        active: referrals?.filter(r => r.is_active).length || 0,
        leftCount: binaryTree?.total_left_members || 0,
        rightCount: binaryTree?.total_right_members || 0,
        leftVolume: Number(binaryTree?.left_volume || 0),
        rightVolume: Number(binaryTree?.right_volume || 0),
      };
    },
    enabled: !!user?.id,
  });

  const referralLink = profile?.referral_code 
    ? `https://synterax.io/auth?ref=${profile.referral_code}`
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Referral link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join SynteraX",
          text: "Start mining Bitcoin with me on SynteraX!",
          url: referralLink,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard();
    }
  };

  const handleSavePlacement = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_placement_leg: defaultLeg })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: `New referrals will be placed on your ${defaultLeg} leg.`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const requirements = nextRank
    ? [
        {
          label: t("rank.personalSales"),
          current: userRankData?.personal_sales || 0,
          required: nextRank.min_personal_sales,
          progress: progressToNextRank?.personalSales || 0,
          icon: DollarSign,
          format: (val: number) => `$${val.toLocaleString()}`,
        },
        {
          label: t("rank.teamSales"),
          current: userRankData?.team_sales || 0,
          required: nextRank.min_team_sales,
          progress: progressToNextRank?.teamSales || 0,
          icon: TrendingUp,
          format: (val: number) => `$${val.toLocaleString()}`,
        },
        {
          label: t("rank.leftLegVolume"),
          current: userRankData?.left_leg_volume || 0,
          required: nextRank.min_left_leg_volume,
          progress: progressToNextRank?.leftLeg || 0,
          icon: ArrowLeftRight,
          format: (val: number) => `$${val.toLocaleString()}`,
        },
        {
          label: t("rank.rightLegVolume"),
          current: userRankData?.right_leg_volume || 0,
          required: nextRank.min_right_leg_volume,
          progress: progressToNextRank?.rightLeg || 0,
          icon: ArrowRightLeft,
          format: (val: number) => `$${val.toLocaleString()}`,
        },
        {
          label: t("rank.totalHashrate"),
          current: userRankData?.total_hashrate || 0,
          required: nextRank.min_hashrate_ths,
          progress: progressToNextRank?.hashrate || 0,
          icon: Cpu,
          format: (val: number) => `${val.toFixed(1)} TH/s`,
        },
        {
          label: t("rank.directReferrals"),
          current: userRankData?.direct_referral_count || 0,
          required: nextRank.min_direct_referrals,
          progress: progressToNextRank?.referrals || 0,
          icon: Users,
          format: (val: number) => val.toString(),
        },
      ]
    : [];

  const isLoading = rankLoading || commissionsLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">My Network & Earnings</h1>
        <p className="text-muted-foreground">
          Track your rank, commissions, and team growth in one place
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="rank" className="flex-1 gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Rank</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex-1 gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Commissions</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex-1 gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Referrals</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Grid */}
          <QuickStats />

          {/* Earnings Summary Cards */}
          <EarningsSummary />

          {/* Activity Feed & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed />
            <Leaderboard />
          </div>

          {/* Rank Progress */}
          <RankProgress />

          {/* Earnings History */}
          <EarningsHistory />

          {/* Quick Referral Link */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Link className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Your Referral Link</h3>
                  <p className="text-sm text-muted-foreground">Share and earn 10% instant rewards</p>
                </div>
              </div>
              {profile?.referral_code && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy
                  </Button>
                  <Button onClick={shareLink} size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Rank Tab */}
        <TabsContent value="rank" className="space-y-6">
          {/* Current Rank Hero */}
          <Card className="p-8 bg-gradient-to-br from-card via-secondary/50 to-card border-2" style={{ borderColor: currentRank?.rank_color }}>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Military Badge */}
              <MilitaryRankBadge
                rankName={currentRank?.rank_name || "Member"}
                rankLevel={currentRank?.rank_level || 1}
                rankColor={currentRank?.rank_color || "#6b7280"}
                size="xl"
              />

              {/* Rank Info */}
              <div className="flex-1 text-center lg:text-left">
                <p className="text-sm text-muted-foreground mb-1">{t("rank.currentRank")}</p>
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-2" 
                  style={{ color: currentRank?.rank_color }}
                >
                  {currentRank?.rank_name || "Member"}
                </h2>
                <p className="text-muted-foreground">
                  {t("rank.level")} {currentRank?.rank_level || 1} of {rankDefinitions?.length || 10}
                </p>

                {/* Benefits Preview */}
                {currentRank && currentRank.benefits.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
                    {currentRank.benefits.slice(0, 3).map((benefit, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: `${currentRank.rank_color}20`, color: currentRank.rank_color }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {benefit.length > 30 ? benefit.substring(0, 30) + "..." : benefit}
                      </Badge>
                    ))}
                    {currentRank.benefits.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{currentRank.benefits.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Next Rank Preview */}
              {nextRank && (
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-dashed border-primary/30">
                  <p className="text-xs text-muted-foreground mb-2">{t("rank.nextRank")}</p>
                  <MilitaryRankBadge
                    rankName={nextRank.rank_name}
                    rankLevel={nextRank.rank_level}
                    rankColor={nextRank.rank_color}
                    size="md"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Progress to Next Rank */}
          {nextRank && progressToNextRank && (
            <RankRequirementsGrid
              nextRank={nextRank}
              userRankData={userRankData}
              progressToNextRank={progressToNextRank}
            />
          )}

          {/* Rank Ladder & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rank Ladder */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                {t("rank.allRanks")}
              </h3>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {rankDefinitions && (
                  <RankLadder
                    ranks={rankDefinitions}
                    currentRankLevel={currentRank?.rank_level || 0}
                    onSelectRank={setSelectedRank}
                    selectedRankId={selectedRank?.id}
                  />
                )}
              </div>
            </Card>

            {/* Selected Rank Benefits */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Rank Details
              </h3>
              {selectedRank ? (
                <RankBenefitsCard
                  rank={selectedRank}
                  isAchieved={(selectedRank.rank_level || 0) <= (currentRank?.rank_level || 0)}
                  isCurrent={selectedRank.rank_name === currentRank?.rank_name}
                />
              ) : currentRank ? (
                <RankBenefitsCard
                  rank={currentRank}
                  isAchieved={true}
                  isCurrent={true}
                />
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a rank from the ladder to view details</p>
                </Card>
              )}
            </div>
          </div>

          {/* Rank History */}
          {rankHistory && rankHistory.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t("rank.history")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rankHistory.map((history) => (
                  <div
                    key={history.id}
                    className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-accent/10 to-transparent border border-accent/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {history.old_rank ? `${history.old_rank} → ` : ""}
                        {history.new_rank}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(history.achieved_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {history.old_rank ? t("rank.promoted") : t("rank.achieved")}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <ClaimableSettlements />
          <div className="grid gap-6 md:grid-cols-2">
            <StakingWidget />
            <GhostBVWidget />
            <WeeklyCapWidget />
            <LeadershipPoolWidget />
          </div>
          <Tabs defaultValue="breakdown" className="space-y-6">
            <TabsList>
              <TabsTrigger value="breakdown">{t('commissions.breakdownTab')}</TabsTrigger>
              <TabsTrigger value="settlements">{t('commissions.settlementsTab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="breakdown">
              <Card className="p-6">
                <CommissionBreakdown />
              </Card>
            </TabsContent>
            <TabsContent value="settlements">
              <Card className="p-6">
                <WeeklySettlement />
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          {/* New Unified Referral Dashboard */}
          <ReferralDashboard />

          {/* Network Visualization Tabs */}
          <Tabs defaultValue="structure" className="space-y-4">
            <TabsList className="w-full flex overflow-x-auto">
              <TabsTrigger value="structure" className="flex-1 gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">Structure</span>
              </TabsTrigger>
              <TabsTrigger value="directs" className="flex-1 gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Directs</span>
              </TabsTrigger>
              <TabsTrigger value="volume" className="flex-1 gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Volume</span>
              </TabsTrigger>
              <TabsTrigger value="generations" className="flex-1 gap-2">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Generations</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="structure">
              <BinaryTreeVisualization
                currentUser={treeCurrentUser}
                leftTeam={leftTeam}
                rightTeam={rightTeam}
                leftVolume={leftVolume}
                rightVolume={rightVolume}
                leftDirectChild={leftDirectChild}
                rightDirectChild={rightDirectChild}
                isLoading={treeLoading}
                onNavigateToMember={navigateToMember}
                onNavigateBack={navigateBack}
                onGoBottomLeft={goBottomLeft}
                onGoBottomRight={goBottomRight}
                navigationPath={navigationPath}
                referralLink={referralLink}
              />
            </TabsContent>

            <TabsContent value="directs">
              <DirectsView />
            </TabsContent>

            <TabsContent value="volume">
              <VolumeView />
            </TabsContent>

            <TabsContent value="generations">
              <GenerationsView />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}