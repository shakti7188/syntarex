import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePoolConfigs } from "@/hooks/usePoolConfigs";
import { usePoolStats } from "@/hooks/usePoolStats";
import { usePoolWorkers } from "@/hooks/usePoolWorkers";
import { usePoolPayouts } from "@/hooks/usePoolPayouts";
import { PoolStatsCard } from "@/components/mining/PoolStatsCard";
import { HashrateChart } from "@/components/mining/HashrateChart";
import { PoolWorkersTable } from "@/components/mining/PoolWorkersTable";
import { PoolPayoutsTable } from "@/components/mining/PoolPayoutsTable";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function MiningPoolDetail() {
  const { t } = useTranslation();
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const { configs, syncPool } = usePoolConfigs();
  const { latestStats, historicalStats } = usePoolStats(poolId);
  const { workers } = usePoolWorkers(poolId);
  const { payouts } = usePoolPayouts(poolId);

  const config = configs?.find((c) => c.id === poolId);

  if (!config) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">{t('pools.notFound')}</div>
      </div>
    );
  }

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      ANTPOOL: 'bg-orange-500/10 text-orange-500',
      F2POOL: 'bg-blue-500/10 text-blue-500',
    };

    return (
      <Badge variant="secondary" className={colors[provider] || ''}>
        {provider}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/mining/pools')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{config.pool_name}</h1>
              {getProviderBadge(config.pool_provider)}
            </div>
            <p className="text-muted-foreground">
              {config.subaccount || t('pools.mainAccount')} • {t('pools.lastSynced')}{' '}
              {config.last_sync_at
                ? format(new Date(config.last_sync_at), 'MMM dd, yyyy HH:mm')
                : t('pools.never')}
            </p>
          </div>
        </div>
        <Button
          onClick={() => syncPool({ id: config.id, provider: config.pool_provider })}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('pools.syncNow')}
        </Button>
      </div>

      {latestStats && (
        <PoolStatsCard
          currentHashrate={latestStats.current_hashrate_hs}
          avg24hHashrate={latestStats.avg_24h_hashrate_hs || 0}
          unpaidBalance={latestStats.unpaid_balance_btc}
          coin={latestStats.payout_coin}
        />
      )}

      {historicalStats && <HashrateChart data={historicalStats} />}

      <Tabs defaultValue="workers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workers">
            {t('pools.workers')} ({workers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="payouts">
            {t('pools.payoutHistory')} ({payouts?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pools.miningWorkers')}</CardTitle>
            </CardHeader>
            <CardContent>
              {workers && <PoolWorkersTable workers={workers} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pools.payoutHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts && <PoolPayoutsTable payouts={payouts} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
