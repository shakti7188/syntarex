import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Receipt, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentOrder {
  id: string;
  amount_expected: number;
  amount_received: number | null;
  currency: string;
  chain: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  confirmed_at: string | null;
  package_id: string;
  packages: {
    name: string;
  } | null;
}

// Helper to get explorer URL based on chain
const getExplorerUrl = (txHash: string, chain?: string): string => {
  const chainLower = (chain || '').toLowerCase();
  if (chainLower === 'solana') {
    return `https://solscan.io/tx/${txHash}`;
  }
  if (chainLower === 'tron') {
    return `https://tronscan.org/#/transaction/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
};

// Helper to get chain badge styling
const getChainBadge = (chain?: string) => {
  const chainLower = (chain || '').toLowerCase();
  if (chainLower === 'solana') {
    return { label: 'Solana', className: 'bg-purple-500/10 text-purple-500' };
  }
  if (chainLower === 'tron') {
    return { label: 'Tron', className: 'bg-red-500/10 text-red-500' };
  }
  return { label: 'Ethereum', className: 'bg-blue-500/10 text-blue-500' };
};

export default function TransactionHistory() {
  const { t } = useTranslation();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['payment-orders-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('payment_orders')
        .select('*, packages(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentOrder[];
    },
  });

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    const variants: Record<string, { variant: "default" | "outline" | "destructive" | "secondary"; label: string }> = {
      CONFIRMED: { variant: "default", label: t('transactions.completed') },
      PENDING: { variant: "outline", label: t('transactions.pending') },
      AWAITING_CONFIRMATION: { variant: "secondary", label: "Awaiting Confirmation" },
      FAILED: { variant: "destructive", label: t('transactions.failed') },
      EXPIRED: { variant: "destructive", label: "Expired" },
    };
    return variants[statusUpper] || { variant: "outline" as const, label: status };
  };

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('transactions.title')}</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {t('transactions.subtitle')}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('transactions.allTransactions')}</CardTitle>
            <CardDescription>
              {transactions?.length || 0} {t('transactions.transactionsFound')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('transactions.noTransactions')}
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                  {transactions.map((tx) => {
                    const statusConfig = getStatusBadge(tx.status);
                    return (
                      <div key={tx.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                            Package Purchase
                          </Badge>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </div>
                        {tx.packages?.name && (
                          <div className="text-sm font-medium">{tx.packages.name}</div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">${Number(tx.amount_expected).toLocaleString()}</span>
                          <Badge variant="outline">{tx.currency}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{format(new Date(tx.created_at), 'MMM dd, yyyy')}</span>
                          <Badge variant="secondary" className={getChainBadge(tx.chain).className}>
                            {getChainBadge(tx.chain).label}
                          </Badge>
                        </div>
                        {tx.tx_hash && (
                          <div className="pt-2">
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <a href={getExplorerUrl(tx.tx_hash, tx.chain)} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" /> View on {getChainBadge(tx.chain).label === 'Solana' ? 'Solscan' : getChainBadge(tx.chain).label === 'Tron' ? 'Tronscan' : 'Etherscan'}
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Desktop table view */}
                <div className="hidden md:block rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('transactions.date')}</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>{t('transactions.amount')}</TableHead>
                        <TableHead>{t('transactions.currency')}</TableHead>
                        <TableHead>Chain</TableHead>
                        <TableHead>{t('transactions.status')}</TableHead>
                        <TableHead className="text-right">{t('transactions.action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => {
                        const statusConfig = getStatusBadge(tx.status);
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {tx.packages?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ${Number(tx.amount_expected).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tx.currency}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={getChainBadge(tx.chain).className}>
                                {getChainBadge(tx.chain).label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {tx.tx_hash && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={getExplorerUrl(tx.tx_hash, tx.chain)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
  );
}
