import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoolKeyAudits, usePoolKeyRotations } from "@/hooks/usePoolKeys";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CheckCircle, RefreshCw, Eye, AlertTriangle, XCircle, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PoolKeyAuditViewerProps {
  open: boolean;
  onClose: () => void;
  poolConfigId: string | null;
}

/**
 * Viewer for immutable audit logs - never displays plaintext secrets
 */
export function PoolKeyAuditViewer({ open, onClose, poolConfigId }: PoolKeyAuditViewerProps) {
  const { data: audits, isLoading: auditsLoading } = usePoolKeyAudits(poolConfigId || undefined);
  const { data: rotations, isLoading: rotationsLoading } = usePoolKeyRotations(poolConfigId || undefined);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CREATED':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'UPDATED':
        return <RefreshCw className="h-4 w-4 text-info" />;
      case 'ACCESSED':
        return <Eye className="h-4 w-4 text-warning" />;
      case 'ROTATED':
        return <RefreshCw className="h-4 w-4 text-primary" />;
      case 'DELETED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'CREATED':
        return 'bg-success/10 text-success';
      case 'UPDATED':
        return 'bg-info/10 text-info';
      case 'ACCESSED':
        return 'bg-warning/10 text-warning';
      case 'ROTATED':
        return 'bg-primary/10 text-primary';
      case 'DELETED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Audit Trail
          </DialogTitle>
          <DialogDescription>
            Immutable log of all operations on this pool's API keys. No secrets are displayed.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="audits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audits">Audit Events</TabsTrigger>
            <TabsTrigger value="rotations">Rotation History</TabsTrigger>
          </TabsList>

          <TabsContent value="audits" className="mt-4">
            <ScrollArea className="h-[500px] w-full rounded-md border">
              {auditsLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : audits && audits.length > 0 ? (
                <div className="p-4 space-y-3">
                  {audits.map((audit: any) => (
                    <div
                      key={audit.id}
                      className="border rounded-lg p-4 space-y-2 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getEventIcon(audit.event_type)}
                          <Badge className={getEventColor(audit.event_type)}>
                            {audit.event_type}
                          </Badge>
                          <span className="text-sm font-medium">{audit.metadata?.action || 'Unknown action'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(audit.created_at), 'PPpp')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">IP Address:</span> {audit.ip_address}
                        </div>
                        <div>
                          <span className="font-medium">User Agent:</span>{' '}
                          {audit.user_agent?.substring(0, 50)}...
                        </div>
                      </div>

                      {audit.metadata && Object.keys(audit.metadata).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Additional Details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(audit.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No audit events found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rotations" className="mt-4">
            <ScrollArea className="h-[500px] w-full rounded-md border">
              {rotationsLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : rotations && rotations.length > 0 ? (
                <div className="p-4 space-y-3">
                  {rotations.map((rotation: any) => (
                    <div
                      key={rotation.id}
                      className="border rounded-lg p-4 space-y-2 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-primary" />
                          <Badge className="bg-primary/10 text-primary">
                            {rotation.rotation_type}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(rotation.created_at), 'PPpp')}
                        </span>
                      </div>

                      {rotation.rotation_reason && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Reason:</span> {rotation.rotation_reason}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <p className="font-medium text-muted-foreground">Old Fingerprint:</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {rotation.old_key_fingerprint?.substring(0, 16)}...
                          </code>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-muted-foreground">New Fingerprint:</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {rotation.new_key_fingerprint?.substring(0, 16)}...
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No rotation history found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
