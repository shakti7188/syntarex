import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Shield, Eye, Key, Trash2, Plus } from "lucide-react";

export function SecretAuditLogs() {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['secret-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secret_audit_logs')
        .select(`
          *,
          secret:encrypted_secrets(secret_type, masked_value)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CREATED': return <Plus className="h-4 w-4" />;
      case 'UPDATED': return <Key className="h-4 w-4" />;
      case 'ROTATED': return <Shield className="h-4 w-4" />;
      case 'ACCESSED': return <Eye className="h-4 w-4" />;
      case 'DELETED': return <Trash2 className="h-4 w-4" />;
      default: return null;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'CREATED': return 'bg-green-500/10 text-green-500';
      case 'UPDATED': return 'bg-blue-500/10 text-blue-500';
      case 'ROTATED': return 'bg-purple-500/10 text-purple-500';
      case 'ACCESSED': return 'bg-yellow-500/10 text-yellow-500';
      case 'DELETED': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Secret Audit Trail
          <Badge variant="outline" className="ml-auto">
            Immutable Logs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
        ) : !auditLogs || auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No audit events recorded</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Secret Type</TableHead>
                  <TableHead>Masked Value</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={getEventColor(log.event_type)}>
                        <span className="flex items-center gap-1">
                          {getEventIcon(log.event_type)}
                          {log.event_type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.secret?.secret_type || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.secret?.masked_value || '****'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ip_address}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'PPpp')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
