import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveAdminLayout } from "@/components/admin/ResponsiveAdminLayout";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Settings, Users, TrendingUp, Shield, Key, DollarSign, Network, Wallet, CreditCard, Award } from "lucide-react";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { HostingSitesManagement } from "@/components/admin/HostingSitesManagement";
import { BulkMachineUpload } from "@/components/admin/BulkMachineUpload";
import { KYCManagement } from "@/components/admin/KYCManagement";
import { KeyRotationManager } from "@/components/admin/KeyRotationManager";
import { SecretAuditLogs } from "@/components/admin/SecretAuditLogs";
import { PoolKeysManagement } from "@/components/admin/PoolKeysManagement";
import { SecurityMonitoring } from "@/components/admin/SecurityMonitoring";
import { SecurityAuditLogs } from "@/components/admin/SecurityAuditLogs";
import { WalletAuditLogs } from "@/components/admin/WalletAuditLogs";
import { CommissionRatesManager } from "@/components/admin/CommissionRatesManager";
import { CommissionSettingsAudit } from "@/components/admin/CommissionSettingsAudit";
import { PayoutSettingsManager } from "@/components/admin/PayoutSettingsManager";
import { PayoutFinalization } from "@/components/admin/PayoutFinalization";
import { ReferralSystemHealth } from "@/components/admin/ReferralSystemHealth";
import { RankManagement } from "@/components/admin/RankManagement";
import { DepositWalletsManager } from "@/components/admin/DepositWalletsManager";
import { PaymentOrdersManager } from "@/components/admin/PaymentOrdersManager";
import { NFTManagement } from "@/components/admin/NFTManagement";
import { useRealtimeAdminMetrics } from "@/hooks/useRealtimeAdminMetrics";
import { Skeleton } from "@/components/ui/skeleton";

const Admin = () => {
  const { metrics, isLoading } = useRealtimeAdminMetrics();

  return (
    <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Control Panel</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage users, configure system, and monitor analytics</p>
        </div>

        {/* Quick Stats */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Payout Cap Warning */}
            {metrics.isApproachingCap && (
              <Card className={`p-4 ${
                metrics.isCriticalCap 
                  ? 'bg-destructive/20 border-destructive' 
                  : 'bg-warning/20 border-warning'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${
                    metrics.isCriticalCap ? 'bg-destructive' : 'bg-warning'
                  } flex items-center justify-center`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      metrics.isCriticalCap ? 'text-destructive' : 'text-warning'
                    }`}>
                      {metrics.isCriticalCap ? '🚨 Critical: ' : '⚠️ Warning: '}
                      Payout Ratio at {metrics.payoutRatio.toFixed(1)}% of SV
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Limit is 40%. Current: ${metrics.estimatedTotalPayout.toLocaleString()} / ${metrics.currentWeekSV.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <Card className={`p-6 bg-gradient-to-br from-card to-secondary border-border ${
                metrics.isApproachingCap ? 'ring-2 ring-warning' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Week SV</p>
                    <p className="text-3xl font-bold mt-1">${(metrics.currentWeekSV / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Est. Payout: ${(metrics.estimatedTotalPayout / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className={`p-6 bg-gradient-to-br from-card to-secondary border-border ${
                metrics.isCriticalCap ? 'ring-2 ring-destructive' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Payout Ratio</p>
                    <p className={`text-3xl font-bold mt-1 ${
                      metrics.isCriticalCap ? 'text-destructive' : 
                      metrics.isApproachingCap ? 'text-warning' : 'text-accent'
                    }`}>
                      {metrics.payoutRatio.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cap: 40% ({metrics.capUsagePercent.toFixed(0)}% used)
                    </p>
                  </div>
                  <Shield className={`w-8 h-8 ${
                    metrics.isCriticalCap ? 'text-destructive' : 
                    metrics.isApproachingCap ? 'text-warning' : 'text-accent'
                  }`} />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold mt-1">{metrics.activeUsers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.activeRate.toFixed(0)}% of {metrics.totalUsers} total
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Settlements</p>
                    <p className="text-3xl font-bold text-warning mt-1">{metrics.pendingSettlements}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{metrics.newUsersThisWeek} new users this week
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-warning" />
                </div>
              </Card>
            </div>

            {/* Detailed Payout Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4 bg-card border-accent/30">
                <p className="text-sm font-medium mb-2">Direct Commissions</p>
                <p className="text-2xl font-bold text-accent">
                  ${(metrics.estimatedDirectPayout / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.currentWeekSV > 0 ? ((metrics.estimatedDirectPayout / metrics.currentWeekSV) * 100).toFixed(1) : 0}% of SV
                </p>
              </Card>

              <Card className="p-4 bg-card border-primary/30">
                <p className="text-sm font-medium mb-2">Binary Commissions</p>
                <p className="text-2xl font-bold text-primary">
                  ${(metrics.estimatedBinaryPayout / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.currentWeekSV > 0 ? ((metrics.estimatedBinaryPayout / metrics.currentWeekSV) * 100).toFixed(1) : 0}% of SV
                </p>
              </Card>

              <Card className="p-4 bg-card border-warning/30">
                <p className="text-sm font-medium mb-2">Override Commissions</p>
                <p className="text-2xl font-bold text-warning">
                  ${(metrics.estimatedOverridePayout / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.currentWeekSV > 0 ? ((metrics.estimatedOverridePayout / metrics.currentWeekSV) * 100).toFixed(1) : 0}% of SV
                </p>
              </Card>
            </div>
          </>
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="bg-card border border-border inline-flex w-max min-w-full">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="payout-finalization">
                <DollarSign className="mr-1 h-4 w-4 hidden sm:inline" />
                Payouts
              </TabsTrigger>
              <TabsTrigger value="commission-rates">Commissions</TabsTrigger>
              <TabsTrigger value="payout-settings">Settings</TabsTrigger>
              <TabsTrigger value="pool-keys">
                <Key className="mr-1 h-4 w-4 hidden sm:inline" />
                Keys
              </TabsTrigger>
              <TabsTrigger value="security">
                <Key className="mr-1 h-4 w-4 hidden sm:inline" />
                Security
              </TabsTrigger>
              <TabsTrigger value="referrals">
                <Network className="mr-1 h-4 w-4 hidden sm:inline" />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="ranks">
                <Award className="mr-1 h-4 w-4 hidden sm:inline" />
                Ranks
              </TabsTrigger>
              <TabsTrigger value="hosting">Hosting</TabsTrigger>
              <TabsTrigger value="bulk-upload">Upload</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="wallets">
                <Wallet className="mr-1 h-4 w-4 hidden sm:inline" />
                Wallets
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="mr-1 h-4 w-4 hidden sm:inline" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="nfts">
                <Award className="mr-1 h-4 w-4 hidden sm:inline" />
                NFTs
              </TabsTrigger>
              <TabsTrigger value="settings">System</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="payout-finalization">
            <PayoutFinalization />
          </TabsContent>

          <TabsContent value="commission-rates" className="space-y-6">
            <CommissionRatesManager />
            <CommissionSettingsAudit />
          </TabsContent>

          <TabsContent value="payout-settings" className="space-y-6">
            <PayoutSettingsManager />
          </TabsContent>

          <TabsContent value="pool-keys">
            <PoolKeysManagement />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityMonitoring />
            <WalletAuditLogs />
            <SecurityAuditLogs />
            <KeyRotationManager />
            <SecretAuditLogs />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystemHealth />
          </TabsContent>

          <TabsContent value="ranks">
            <RankManagement />
          </TabsContent>

          <TabsContent value="hosting">
            <HostingSitesManagement />
          </TabsContent>

          <TabsContent value="bulk-upload">
            <BulkMachineUpload />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCManagement />
          </TabsContent>

          <TabsContent value="wallets">
            <DepositWalletsManager />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentOrdersManager />
          </TabsContent>

          <TabsContent value="nfts">
            <NFTManagement />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Admin;