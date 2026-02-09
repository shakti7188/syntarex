import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface Worker {
  id: string;
  worker_name: string;
  status: string;
  current_hashrate_hs: number;
  avg_hashrate_hs: number | null;
  last_share_time: string | null;
}

interface PoolWorkersTableProps {
  workers: Worker[];
}

export const PoolWorkersTable = ({ workers }: PoolWorkersTableProps) => {
  const { t } = useTranslation();
  
  const formatHashrate = (hs: number) => {
    const ths = hs / 1e12;
    return `${ths.toFixed(2)} TH/s`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      online: "default",
      active: "default",
      offline: "destructive",
      inactive: "secondary",
      expired: "secondary",
      unknown: "secondary",
    };

    const statusKey = status === 'active' || status === 'online' ? 'active' : 'inactive';

    return (
      <Badge variant={variants[status] || "secondary"}>
        {t(`workers.${statusKey}`)}
      </Badge>
    );
  };

  if (workers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('workers.noWorkers')}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('workers.workerName')}</TableHead>
          <TableHead>{t('workers.status')}</TableHead>
          <TableHead className="text-right">{t('workers.currentHashrate')}</TableHead>
          <TableHead className="text-right">{t('workers.avgHashrate')}</TableHead>
          <TableHead>{t('workers.lastShare')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workers.map((worker) => (
          <TableRow key={worker.id}>
            <TableCell className="font-medium">{worker.worker_name}</TableCell>
            <TableCell>{getStatusBadge(worker.status)}</TableCell>
            <TableCell className="text-right">
              {formatHashrate(worker.current_hashrate_hs)}
            </TableCell>
            <TableCell className="text-right">
              {worker.avg_hashrate_hs ? formatHashrate(worker.avg_hashrate_hs) : 'N/A'}
            </TableCell>
            <TableCell>
              {worker.last_share_time
                ? format(new Date(worker.last_share_time), 'MMM dd, HH:mm')
                : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
