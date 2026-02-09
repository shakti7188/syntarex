import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePendingPayments } from "@/hooks/usePaymentOrder";
import { Clock, ExternalLink, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingPaymentsProps {
  onContinuePayment?: (orderId: string, packageId: string) => void;
}

export const PendingPayments = ({ onContinuePayment }: PendingPaymentsProps) => {
  const { data: pendingOrders, isLoading } = usePendingPayments();

  if (isLoading) {
    return null;
  }

  if (!pendingOrders || pendingOrders.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Awaiting Payment</Badge>;
      case 'AWAITING_CONFIRMATION':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Verifying</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-lg">Pending Payments</CardTitle>
        </div>
        <CardDescription>
          Complete your pending package purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingOrders.map((order) => {
            const isExpired = new Date(order.expires_at) < new Date();
            
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{order.packages?.name}</span>
                    {getStatusBadge(order.status, order.expires_at)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${order.amount_expected?.toLocaleString()} USDT • {order.packages?.hashrate_ths} TH/s
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {order.tx_hash && (
                    <a
                      href={
                        order.chain === 'SOLANA' 
                          ? `https://solscan.io/tx/${order.tx_hash}`
                          : order.chain === 'TRON'
                          ? `https://tronscan.org/#/transaction/${order.tx_hash}`
                          : `https://etherscan.io/tx/${order.tx_hash}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {!isExpired && order.status === 'PENDING' && onContinuePayment && (
                    <Button
                      size="sm"
                      onClick={() => onContinuePayment(order.id, order.package_id)}
                    >
                      Continue
                    </Button>
                  )}
                  {order.status === 'AWAITING_CONFIRMATION' && (
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <AlertCircle className="w-4 h-4" />
                      Verifying...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
