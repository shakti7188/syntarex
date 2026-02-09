import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Shield,
  Activity,
  RefreshCw,
  TrendingUp,
  Eye,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

/**
 * Security monitoring dashboard
 * Shows anomaly detection results and recent security alerts
 */
export function SecurityMonitoring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeWindow, setTimeWindow] = useState(60); // minutes

  // Fetch security monitoring data
  const { data: monitoringData, isLoading } = useQuery({
    queryKey: ['security-monitoring', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-security-monitor', {
        body: { timeWindowMinutes: timeWindow },
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Run security tests
  const runTests = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-security-test-suite');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Security tests completed',
        description: `${data.summary.passed}/${data.summary.total} tests passed`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Tests failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const refreshMonitoring = () => {
    queryClient.invalidateQueries({ queryKey: ['security-monitoring'] });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Security Monitoring</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runTests.mutate()}
              disabled={runTests.isPending}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              {runTests.isPending ? 'Running Tests...' : 'Run Test Suite'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshMonitoring}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {monitoringData?.summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Monitoring Window</span>
              </div>
              <p className="text-2xl font-bold">{monitoringData.summary.monitoringWindow}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Total Alerts</span>
              </div>
              <p className="text-2xl font-bold">{monitoringData.summary.alertsGenerated}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Critical</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {monitoringData.summary.criticalAlerts}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Warnings</span>
              </div>
              <p className="text-2xl font-bold text-warning">
                {monitoringData.summary.warningAlerts}
              </p>
            </Card>
          </div>
        )}

        {/* Alerts List */}
        {monitoringData?.alerts && monitoringData.alerts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-3">Recent Alerts</h3>
            {monitoringData.alerts.map((alert: any, index: number) => (
              <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <AlertDescription>{alert.message}</AlertDescription>
                    {alert.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(alert.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        ) : (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              No security alerts detected in the monitoring window. System is operating normally.
            </AlertDescription>
          </Alert>
        )}

        {/* Events Summary */}
        {monitoringData?.summary?.eventsSummary && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Security Events Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              {monitoringData.summary.eventsSummary.map((event: any) => (
                <Card key={event.event_type} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{event.event_type}</p>
                      <p className="text-2xl font-bold">{event.event_count}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.unique_users} users, {event.unique_secrets} secrets
                      </p>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
