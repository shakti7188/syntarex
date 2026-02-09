import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WalletButton } from "@/components/WalletButton";
import { MilitaryRankBadge } from "@/components/dashboard/MilitaryRankBadge";
import { RealtimeIndicator } from "@/components/dashboard/RealtimeIndicator";
import { ReferralLink } from "@/components/dashboard/ReferralLink";
import { MiningStatsGrid } from "@/components/dashboard/MiningStatsGrid";
import { MyPackagesWidget } from "@/components/dashboard/MyPackagesWidget";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { MyNFTsWidget } from "@/components/nft/MyNFTsWidget";

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState<string | null>(null);

  // Fetch username
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      
      if (data?.username) {
        setUsername(data.username);
      }
    };

    fetchUsername();
  }, [user]);

  const displayName = username || user?.email?.split("@")[0] || "User";

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <RealtimeIndicator />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("nav.dashboard")}</h1>
            <p className="text-sm md:text-base text-muted-foreground">{t("dashboard.welcome", { username: displayName })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <WalletButton />
          <MilitaryRankBadge />
        </div>
      </div>

      {/* Mining Stats Grid */}
      <MiningStatsGrid />

      {/* Referral Link Widget - Compact */}
      <ReferralLink />

      {/* My Packages Widget - Main Focus */}
      <MyPackagesWidget />

      {/* NFT Certificates Widget */}
      <MyNFTsWidget />

      {/* Quick Actions */}
      <QuickActionsCard />
    </div>
  );
};

export default Dashboard;
