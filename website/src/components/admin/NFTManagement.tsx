import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Award, 
  RefreshCw, 
  Play, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Loader2,
  Wallet,
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface NFTRecord {
  id: string;
  purchase_id: string;
  user_id: string;
  certificate_number: number;
  token_id: string | null;
  chain: string;
  tx_hash: string | null;
  mint_status: string;
  mint_error: string | null;
  mint_attempts: number;
  minted_at: string | null;
  created_at: string;
  user?: {
    email: string;
    username: string;
  };
  purchase?: {
    package?: {
      name: string;
    };
  };
}

interface QueueStats {
  PENDING: number;
  QUEUED: number;
  MINTING: number;
  MINTED: number;
  FAILED: number;
  WALLET_REQUIRED: number;
  queue_pending: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-muted text-muted-foreground', icon: Clock },
  QUEUED: { label: 'Queued', color: 'bg-primary/20 text-primary', icon: Clock },
  MINTING: { label: 'Minting', color: 'bg-amber-500/20 text-amber-600', icon: Loader2 },
  MINTED: { label: 'Minted', color: 'bg-green-500/20 text-green-600', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'bg-destructive/20 text-destructive', icon: AlertCircle },
  WALLET_REQUIRED: { label: 'Wallet Required', color: 'bg-warning/20 text-warning', icon: Wallet },
};

export const NFTManagement = () => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all NFTs
  const { data: nfts, isLoading: nftsLoading } = useQuery({
    queryKey: ['admin-nfts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_nfts')
        .select(`
          *,
          user:profiles (email, username),
          purchase:package_purchases (
            package:packages (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as NFTRecord[];
    },
  });

  // Fetch queue stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-nft-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-nft-queue-process', {
        body: { action: 'stats' }
      });
      if (error) throw error;
      return data?.stats as QueueStats;
    },
  });

  // Process queue mutation
  const processMutation = useMutation({
    mutationFn: async (batchSize: number = 10) => {
      const { data, error } = await supabase.functions.invoke('api-nft-queue-process', {
        body: { action: 'process', batchSize }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Queue Processed",
        description: `Processed ${data?.results?.processed || 0} NFTs. Success: ${data?.results?.success || 0}, Failed: ${data?.results?.failed || 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-nfts'] });
      refetchStats();
    },
    onError: (error: Error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Retry failed NFT
  const retryMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const { data, error } = await supabase.functions.invoke('api-nft-queue-process', {
        body: { action: 'retry', nft_id: nftId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Retry Scheduled",
        description: "NFT has been re-queued for minting",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-nfts'] });
      refetchStats();
    },
    onError: (error: Error) => {
      toast({
        title: "Retry Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    await processMutation.mutateAsync(10);
    setIsProcessing(false);
  };

  if (nftsLoading || statsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats?.PENDING || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Queued</p>
            <p className="text-2xl font-bold text-primary">{stats?.QUEUED || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Minting</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.MINTING || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Minted</p>
            <p className="text-2xl font-bold text-green-600">{stats?.MINTED || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-destructive">{stats?.FAILED || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Need Wallet</p>
            <p className="text-2xl font-bold text-warning">{stats?.WALLET_REQUIRED || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              NFT Mint Queue
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['admin-nfts'] });
                  refetchStats();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                size="sm"
                onClick={handleProcessQueue}
                disabled={isProcessing || (stats?.queue_pending || 0) === 0}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Process Queue ({stats?.queue_pending || 0})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate #</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Token ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nfts?.map((nft) => {
                const status = statusConfig[nft.mint_status] || statusConfig.PENDING;
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={nft.id}>
                    <TableCell className="font-mono">#{nft.certificate_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{nft.user?.username || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{nft.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{nft.purchase?.package?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${nft.mint_status === 'MINTING' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </Badge>
                      {nft.mint_error && (
                        <p className="text-xs text-destructive mt-1">{nft.mint_error}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {nft.token_id ? (
                        <span className="font-mono text-sm">{nft.token_id}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(nft.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {nft.mint_status === 'FAILED' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => retryMutation.mutate(nft.id)}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {nft.tx_hash && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`https://polygonscan.com/tx/${nft.tx_hash}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!nfts || nfts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No NFT records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
