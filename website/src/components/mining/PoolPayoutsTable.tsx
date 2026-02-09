import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Payout {
  id: string;
  payout_time: string;
  amount_btc: number;
  coin: string;
  transaction_id: string | null;
}

interface PoolPayoutsTableProps {
  payouts: Payout[];
}

export const PoolPayoutsTable = ({ payouts }: PoolPayoutsTableProps) => {
  const { t } = useTranslation();
  
  const formatAmount = (amount: number, coin: string) => {
    return `${amount.toFixed(8)} ${coin}`;
  };

  if (payouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('payouts.noPayouts')}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('payouts.payoutTime')}</TableHead>
          <TableHead>{t('payouts.coin')}</TableHead>
          <TableHead className="text-right">{t('payouts.amount')}</TableHead>
          <TableHead>{t('payouts.transactionId')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payouts.map((payout) => (
          <TableRow key={payout.id}>
            <TableCell>
              {format(new Date(payout.payout_time), 'MMM dd, yyyy HH:mm')}
            </TableCell>
            <TableCell className="font-medium">{payout.coin}</TableCell>
            <TableCell className="text-right">
              {formatAmount(payout.amount_btc, payout.coin)}
            </TableCell>
            <TableCell>
              {payout.transaction_id ? (
                <a
                  href={`https://blockchain.com/btc/tx/${payout.transaction_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  {payout.transaction_id.substring(0, 8)}...
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">{t('payouts.internal')}</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
