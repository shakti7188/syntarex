import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign } from "lucide-react";
import { useHostingFees, HostingFee } from "@/hooks/useHostingFees";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const getStatusBadge = (status: string) => {
  const variants = {
    PENDING: { variant: "outline" as const, label: "Pending" },
    PAID: { variant: "default" as const, label: "Paid" },
    OVERDUE: { variant: "destructive" as const, label: "Overdue" },
    CANCELLED: { variant: "secondary" as const, label: "Cancelled" },
  };
  return variants[status as keyof typeof variants] || variants.PENDING;
};

export const HostingFeesTable = () => {
  const { data: fees, isLoading } = useHostingFees();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hosting Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPending = fees?.filter(f => f.payment_status === 'PENDING').reduce((sum, f) => sum + Number(f.fee_amount), 0) || 0;
  const totalPaid = fees?.filter(f => f.payment_status === 'PAID').reduce((sum, f) => sum + Number(f.fee_amount), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hosting Fees</CardTitle>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold text-orange-600">${totalPending.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Paid YTD</p>
              <p className="text-lg font-semibold text-green-600">${totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!fees || fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hosting fees found.
                  </TableCell>
                </TableRow>
              ) : (
                fees.map((fee) => {
                  const statusConfig = getStatusBadge(fee.payment_status);
                  return (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div className="font-medium">
                          {fee.machine_inventory?.machine_types?.brand} {fee.machine_inventory?.machine_types?.model}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(fee.billing_period_start), 'MMM dd')} - {format(new Date(fee.billing_period_end), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-semibold">{Number(fee.fee_amount).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(fee.due_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {fee.payment_status === 'PENDING' && (
                          <Button size="sm" variant="default">
                            <CreditCard className="mr-1 h-3 w-3" />
                            Pay Now
                          </Button>
                        )}
                        {fee.payment_status === 'PAID' && fee.transaction_hash && (
                          <Button size="sm" variant="ghost">
                            View Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
