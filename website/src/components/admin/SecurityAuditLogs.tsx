import { useAuditLogs } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const SecurityAuditLogs = () => {
  const { data: logs, isLoading } = useAuditLogs(undefined, 50);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'BLOCKED':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch (status) {
      case 'SUCCESS':
        return 'default';
      case 'FAILED':
      case 'BLOCKED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading audit logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Security Audit Logs</CardTitle>
        </div>
        <CardDescription>
          Recent security-critical operations and access attempts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {logs?.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="mt-1">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.operation}</span>
                    <Badge variant={getStatusVariant(log.status)} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Resource: {log.resource_type}
                    {log.resource_id && ` (${log.resource_id.slice(0, 8)}...)`}
                  </div>
                  {log.error_message && (
                    <div className="text-sm text-destructive">
                      {log.error_message}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                    {log.ip_address && <span>IP: {log.ip_address}</span>}
                  </div>
                </div>
              </div>
            ))}
            {logs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
