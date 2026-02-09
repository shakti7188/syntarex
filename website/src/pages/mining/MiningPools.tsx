import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddPoolConnectionModal } from "@/components/mining/AddPoolConnectionModal";
import { usePoolConfigs } from "@/hooks/usePoolConfigs";
import { format } from "date-fns";
import { RefreshCw, AlertCircle, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function MiningPools() {
  const { t } = useTranslation();
  const { configs, isLoading, toggleActive, deleteConfig, syncPool } = usePoolConfigs();
  const navigate = useNavigate();

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      ANTPOOL: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
      F2POOL: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    };

    return (
      <Badge variant="secondary" className={colors[provider] || ''}>
        {provider}
      </Badge>
    );
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">{t('pools.notSynced')}</Badge>;

    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      SUCCESS: "default",
      ERROR: "destructive",
      PENDING: "secondary",
      IN_PROGRESS: "secondary",
    };

    return <Badge variant={variants[status] || "secondary"}>{t(`pools.${status.toLowerCase()}`)}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">{t('pools.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('pools.title')}</h1>
          <p className="text-muted-foreground">
            {t('pools.subtitle')}
          </p>
        </div>
        <AddPoolConnectionModal />
      </div>

      {configs && configs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                {t('pools.noConnections')}
              </div>
              <AddPoolConnectionModal />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('pools.connectedPools')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pools.poolName')}</TableHead>
                  <TableHead>{t('pools.provider')}</TableHead>
                  <TableHead>{t('pools.account')}</TableHead>
                  <TableHead>{t('pools.lastSync')}</TableHead>
                  <TableHead>{t('pools.status')}</TableHead>
                  <TableHead>{t('pools.active')}</TableHead>
                  <TableHead className="text-right">{t('pools.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs?.map((config) => (
                  <>
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.pool_name}</TableCell>
                      <TableCell>{getProviderBadge(config.pool_provider)}</TableCell>
                      <TableCell>{config.subaccount || t('pools.mainAccount')}</TableCell>
                      <TableCell>
                        {config.last_sync_at
                          ? format(new Date(config.last_sync_at), 'MMM dd, HH:mm')
                          : t('pools.never')}
                      </TableCell>
                      <TableCell>{getStatusBadge(config.last_sync_status)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={(checked) =>
                            toggleActive({ id: config.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/mining/pools/${config.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              syncPool({ id: config.id, provider: config.pool_provider })
                            }
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteConfig(config.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {config.last_sync_status === 'ERROR' && config.last_sync_error && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                              <span>{config.last_sync_error}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  syncPool({ id: config.id, provider: config.pool_provider })
                                }
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {t('pools.retryNow')}
                              </Button>
                            </AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
