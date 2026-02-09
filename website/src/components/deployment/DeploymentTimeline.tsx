import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Truck, Wrench, Activity } from "lucide-react";
import { useDeploymentStatus, DeploymentEvent } from "@/hooks/useDeploymentStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface DeploymentTimelineProps {
  machineId: string;
}

const statusConfig = {
  ORDERED: { icon: Circle, label: "Ordered", color: "text-muted-foreground" },
  SHIPPED: { icon: Truck, label: "Shipped", color: "text-blue-500" },
  IN_TRANSIT: { icon: Truck, label: "In Transit", color: "text-blue-500" },
  ARRIVED: { icon: CheckCircle2, label: "Arrived", color: "text-green-500" },
  INSTALLING: { icon: Wrench, label: "Installing", color: "text-orange-500" },
  TESTING: { icon: Activity, label: "Testing", color: "text-purple-500" },
  ACTIVE: { icon: CheckCircle2, label: "Active", color: "text-green-600" },
  MAINTENANCE: { icon: Wrench, label: "Maintenance", color: "text-yellow-500" },
};

export const DeploymentTimeline = ({ machineId }: DeploymentTimelineProps) => {
  const { data: events, isLoading } = useDeploymentStatus(machineId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No deployment events yet.</p>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = events[events.length - 1]?.event_type || 'ORDERED';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Deployment Status</CardTitle>
          <Badge variant="outline" className={statusConfig[currentStatus as keyof typeof statusConfig]?.color}>
            {statusConfig[currentStatus as keyof typeof statusConfig]?.label || currentStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Events */}
          {events.map((event, index) => {
            const config = statusConfig[event.event_type as keyof typeof statusConfig];
            const Icon = config?.icon || Circle;
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="relative flex items-start gap-4">
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background ${isLast ? 'border-primary' : 'border-border'}`}>
                  <Icon className={`h-4 w-4 ${isLast ? 'text-primary' : config?.color || 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 space-y-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{config?.label || event.event_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.event_date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {event.notes && (
                    <p className="text-sm text-muted-foreground">{event.notes}</p>
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
