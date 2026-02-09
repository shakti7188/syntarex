import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Wallet, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PoolStatsCardProps {
  currentHashrate: number;
  avg24hHashrate: number;
  unpaidBalance: number;
  estimatedDaily?: number;
  coin: string;
}

export const PoolStatsCard = ({
  currentHashrate,
  avg24hHashrate,
  unpaidBalance,
  estimatedDaily,
  coin,
}: PoolStatsCardProps) => {
  const { t } = useTranslation();
  
  const formatHashrate = (hs: number) => {
    const ths = hs / 1e12;
    return `${ths.toFixed(2)} TH/s`;
  };

  const formatBalance = (amount: number) => {
    return `${amount.toFixed(8)} ${coin}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('poolStats.currentHashrate')}</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHashrate(currentHashrate)}</div>
          <p className="text-xs text-muted-foreground">Real-time mining power</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('poolStats.avg24hHashrate')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHashrate(avg24hHashrate)}</div>
          <p className="text-xs text-muted-foreground">Average over last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('poolStats.unpaidBalance')}</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBalance(unpaidBalance)}</div>
          <p className="text-xs text-muted-foreground">Pending payout</p>
        </CardContent>
      </Card>

      {estimatedDaily !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('poolStats.estimatedDaily')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBalance(estimatedDaily)}</div>
            <p className="text-xs text-muted-foreground">Expected daily earnings</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
