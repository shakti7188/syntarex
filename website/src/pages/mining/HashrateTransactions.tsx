import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Activity, ArrowDownUp, Coins, ShoppingBag } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { EmptyState } from "@/components/ui/empty-state";

export default function HashrateTransactions() {
  // Fetch tokenizations
  const { data: tokenizations } = useQuery({
    queryKey: ['hashrate-tokenizations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hashrate_tokenizations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch trades
  const { data: trades } = useQuery({
    queryKey: ['my-hashrate-trades'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hashrate_trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch listings
  const { data: listings } = useQuery({
    queryKey: ['my-hashrate-listings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hashrate_listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const tokenizationPagination = usePagination(tokenizations, { pageSize: 10 });
  const tradesPagination = usePagination(trades, { pageSize: 10 });
  const listingsPagination = usePagination(listings, { pageSize: 10 });

  const getStatusBadge = (status: string) => {
    const variants = {
      CONFIRMED: { variant: "default" as const, label: "Confirmed" },
      PENDING: { variant: "outline" as const, label: "Pending" },
      FAILED: { variant: "destructive" as const, label: "Failed" },
      COMPLETED: { variant: "default" as const, label: "Completed" },
      ACTIVE: { variant: "default" as const, label: "Active" },
      SOLD: { variant: "secondary" as const, label: "Sold" },
      EXPIRED: { variant: "outline" as const, label: "Expired" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
    };
    return variants[status as keyof typeof variants] || { variant: "outline" as const, label: status };
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Hashrate Transactions</h1>
            <p className="text-muted-foreground mt-2">
              View all your tokenization, trading, and listing history
            </p>
          </div>
        </div>

        <Tabs defaultValue="tokenizations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tokenizations" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Tokenizations
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              My Listings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tokenizations">
            <Card>
              <CardHeader>
                <CardTitle>Tokenization History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Hashrate</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Token Symbol</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokenizationPagination.paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <EmptyState
                              icon={Coins}
                              title="No Tokenizations"
                              description="You haven't tokenized any hashrate yet"
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        tokenizationPagination.paginatedData.map((item) => {
                          const statusConfig = getStatusBadge(item.status);
                          const isRedemption = item.tokens_minted < 0;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <span className={isRedemption ? 'text-green-500' : ''}>
                                  {isRedemption ? '+' : '-'}{Math.abs(Number(item.amount_ths)).toFixed(3)} TH/s
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={isRedemption ? 'text-destructive' : 'text-green-500'}>
                                  {isRedemption ? '' : '+'}{Number(item.tokens_minted).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.token_symbol}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {item.tx_hash ? (
                                  <a
                                    href={`https://etherscan.io/tx/${item.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {item.tx_hash.slice(0, 10)}...
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">Pending</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls {...tokenizationPagination} onPageChange={tokenizationPagination.goToPage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Price/TH/s</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tradesPagination.paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <EmptyState
                              icon={ArrowDownUp}
                              title="No Trades"
                              description="You haven't made any trades yet"
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        tradesPagination.paginatedData.map((trade) => {
                          const statusConfig = getStatusBadge(trade.status);
                          return (
                            <TableRow key={trade.id}>
                              <TableCell>
                                {format(new Date(trade.created_at), 'MMM dd, yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {trade.buyer_id === (supabase.auth.getUser() as any).id ? 'Buy' : 'Sell'}
                                </Badge>
                              </TableCell>
                              <TableCell>{Number(trade.amount_ths).toFixed(4)} TH/s</TableCell>
                              <TableCell>${Number(trade.price_per_ths).toFixed(2)}</TableCell>
                              <TableCell className="font-semibold">
                                ${Number(trade.total_price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls {...tradesPagination} onPageChange={tradesPagination.goToPage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>My Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Price/TH/s</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listingsPagination.paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <EmptyState
                              icon={ShoppingBag}
                              title="No Listings"
                              description="You haven't created any listings yet"
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        listingsPagination.paginatedData.map((listing) => {
                          const statusConfig = getStatusBadge(listing.status);
                          return (
                            <TableRow key={listing.id}>
                              <TableCell>
                                {format(new Date(listing.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>{Number(listing.amount_ths).toFixed(4)} TH/s</TableCell>
                              <TableCell>${Number(listing.price_per_ths).toFixed(2)}</TableCell>
                              <TableCell className="font-semibold">
                                ${Number(listing.total_price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {listing.expires_at
                                  ? format(new Date(listing.expires_at), 'MMM dd, yyyy')
                                  : 'Never'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls {...listingsPagination} onPageChange={listingsPagination.goToPage} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
  );
}
