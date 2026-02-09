import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Loader2,
  Filter
} from "lucide-react";
import { format } from "date-fns";

type OrderStatus = 'PENDING' | 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'FAILED' | 'EXPIRED' | 'all';

interface PaymentOrder {
  id: string;
  user_id: string;
  package_id: string;
  amount_expected: number;
  chain: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
  packages: { name: string } | null;
  profiles: { email: string; username: string | null } | null;
}

const chainExplorerUrls: Record<string, string> = {
  SOLANA: 'https://solscan.io/tx/',
  ETHEREUM: 'https://etherscan.io/tx/',
  TRON: 'https://tronscan.org/#/transaction/',
};

const statusConfig: Record<string, { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  PENDING: { icon: <Clock className="w-3 h-3" />, variant: "secondary", label: "Pending" },
  AWAITING_CONFIRMATION: { icon: <Loader2 className="w-3 h-3 animate-spin" />, variant: "outline", label: "Awaiting" },
  CONFIRMED: { icon: <CheckCircle2 className="w-3 h-3" />, variant: "default", label: "Confirmed" },
  FAILED: { icon: <XCircle className="w-3 h-3" />, variant: "destructive", label: "Failed" },
  EXPIRED: { icon: <AlertCircle className="w-3 h-3" />, variant: "destructive", label: "Expired" },
};

export function PaymentOrdersManager() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-payment-orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('payment_orders')
        .select(`
          *,
          packages:package_id (name),
          profiles:user_id (email, username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentOrder[];
    },
  });

  const retryVerification = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('api-payment-verify', {
        body: { orderId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast({ title: "Payment verified successfully" });
      } else {
        toast({ title: "Verification failed", description: data.error, variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-payment-orders'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const expireOrders = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('expire_payment_orders');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Expired orders cleaned up" });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-orders'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('payment_orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Order status updated" });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-orders'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredOrders = orders?.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(search) ||
      order.tx_hash?.toLowerCase().includes(search) ||
      order.profiles?.email?.toLowerCase().includes(search) ||
      order.profiles?.username?.toLowerCase().includes(search)
    );
  });

  const stats = orders ? {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    awaiting: orders.filter(o => o.status === 'AWAITING_CONFIRMATION').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    failed: orders.filter(o => o.status === 'FAILED').length,
    expired: orders.filter(o => o.status === 'EXPIRED').length,
  } : { total: 0, pending: 0, awaiting: 0, confirmed: 0, failed: 0, expired: 0 };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Payment Orders
              <Badge variant="outline">{stats.total} total</Badge>
            </CardTitle>
            <CardDescription>Manage and monitor payment orders across all chains</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => expireOrders.mutate()}
            disabled={expireOrders.isPending}
          >
            {expireOrders.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Cleanup Expired
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.awaiting}</p>
            <p className="text-xs text-muted-foreground">Awaiting</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, TX hash, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="AWAITING_CONFIRMATION">Awaiting</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOrders?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => {
                  const config = statusConfig[order.status] || statusConfig.PENDING;
                  const expired = isExpired(order.expires_at) && order.status === 'PENDING';
                  
                  return (
                    <TableRow key={order.id} className={expired ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.profiles?.username || order.profiles?.email?.split('@')[0] || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.profiles?.email}
                        </div>
                      </TableCell>
                      <TableCell>{order.packages?.name || 'N/A'}</TableCell>
                      <TableCell>${order.amount_expected.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.chain}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                          {config.icon}
                          {config.label}
                        </Badge>
                        {expired && order.status === 'PENDING' && (
                          <div className="text-xs text-red-500 mt-1">Expired!</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(order.created_at), 'MMM d, HH:mm')}</div>
                        <div className="text-xs text-muted-foreground">
                          Exp: {format(new Date(order.expires_at), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {order.tx_hash && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a
                                href={`${chainExplorerUrls[order.chain]}${order.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          {order.status === 'AWAITING_CONFIRMATION' && order.tx_hash && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryVerification.mutate(order.id)}
                              disabled={retryVerification.isPending}
                            >
                              {retryVerification.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                          {(order.status === 'PENDING' || order.status === 'AWAITING_CONFIRMATION') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'EXPIRED' })}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
