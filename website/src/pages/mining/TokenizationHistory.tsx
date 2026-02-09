import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokenizationHistory } from "@/hooks/useTokenizationHistory";
import { RealtimeIndicator } from "@/components/dashboard/RealtimeIndicator";
import { History, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function TokenizationHistory() {
  const { t } = useTranslation();
  const { data: history, isLoading } = useTokenizationHistory();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTxHash = (hash: string | null) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <History className="h-8 w-8" />
              {t('tokenizeHistory.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('tokenizeHistory.subtitle')}
            </p>
          </div>
          <RealtimeIndicator />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('tokenizeHistory.recordsTitle')}</CardTitle>
            <CardDescription>
              {t('tokenizeHistory.recordsCount', { count: history?.length || 0 })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('tokenizeHistory.date')}</TableHead>
                      <TableHead>{t('tokenizeHistory.amount')}</TableHead>
                      <TableHead>{t('tokenizeHistory.tokenSymbol')}</TableHead>
                      <TableHead>{t('tokenizeHistory.tokensMinted')}</TableHead>
                      <TableHead>{t('tokenizeHistory.status')}</TableHead>
                      <TableHead>{t('tokenizeHistory.txHash')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{record.amountThs.toFixed(3)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.tokenSymbol}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {record.tokensMinted.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.status)}>
                            {t(`tokenizeHistory.${record.status.toLowerCase()}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.txHash ? (
                            <a
                              href={`https://etherscan.io/tx/${record.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              {formatTxHash(record.txHash)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">{t('tokenizeHistory.pending')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">{t('tokenizeHistory.noHistory')}</p>
                <p>
                  {t('tokenizeHistory.noHistoryDesc')}{" "}
                  <a href="/mining/tokenize" className="text-primary hover:underline">
                    {t('tokenizeHistory.noHistoryLink')}
                  </a>{" "}
                  {t('tokenizeHistory.noHistoryEnd')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
