import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Search, Clock, Wallet, XCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WalletAuditLog {
  id: string;
  user_id: string;
  event_type: string;
  wallet_address: string | null;
  wallet_network: string | null;
  previous_wallet_address: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  WALLET_LINKED: { label: 'Wallet Linked', icon: Wallet, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  WALLET_CHANGED: { label: 'Wallet Changed', icon: RefreshCw, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  WALLET_UNLINKED: { label: 'Wallet Unlinked', icon: XCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  WALLET_VERIFIED: { label: 'Wallet Verified', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  VERIFICATION_FAILED: { label: 'Verification Failed', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  WALLET_CHANGE_BLOCKED: { label: 'Change Blocked', icon: AlertTriangle, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  SUSPICIOUS_ACTIVITY: { label: 'Suspicious Activity', icon: AlertTriangle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export const WalletAuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['wallet-audit-logs', eventTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('wallet_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WalletAuditLog[];
    },
  });

  // Filter by search term
  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.wallet_address?.toLowerCase().includes(term) ||
      log.previous_wallet_address?.toLowerCase().includes(term) ||
      log.user_id.toLowerCase().includes(term) ||
      log.ip_address?.toLowerCase().includes(term)
    );
  });

  // Stats
  const stats = {
    total: logs?.length || 0,
    verified: logs?.filter(l => l.event_type === 'WALLET_VERIFIED').length || 0,
    failed: logs?.filter(l => l.event_type === 'VERIFICATION_FAILED').length || 0,
    suspicious: logs?.filter(l => l.event_type === 'SUSPICIOUS_ACTIVITY').length || 0,
  };

  const getEventBadge = (eventType: string) => {
    const config = EVENT_TYPE_CONFIG[eventType] || {
      label: eventType,
      icon: Clock,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn("gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const truncateAddress = (address: string | null) => {
    if (!address) return '-';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.suspicious}</p>
                <p className="text-xs text-muted-foreground">Suspicious</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Wallet Security Audit Logs
              </CardTitle>
              <CardDescription>
                Track all wallet linking, verification, and security events
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by wallet, user ID, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getEventBadge(log.event_type)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncateAddress(log.wallet_address)}
                      </TableCell>
                      <TableCell>
                        {log.wallet_network && (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            log.wallet_network === 'SOLANA' ? "border-purple-300 text-purple-700" :
                            log.wallet_network === 'TRON' ? "border-red-300 text-red-700" :
                            "border-blue-300 text-blue-700"
                          )}>
                            {log.wallet_network}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncateAddress(log.previous_wallet_address)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <span title={format(new Date(log.created_at), 'PPpp')}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No wallet audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
