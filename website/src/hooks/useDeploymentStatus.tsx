import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface DeploymentEvent {
  id: string;
  machine_inventory_id: string;
  event_type: string;
  event_date: string;
  notes: string | null;
  created_at: string;
}

export const useDeploymentStatus = (machineId: string) => {
  const query = useQuery({
    queryKey: ['deployment-status', machineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployment_events')
        .select('*')
        .eq('machine_inventory_id', machineId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data as DeploymentEvent[];
    },
    enabled: !!machineId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!machineId) return;

    const channel = supabase
      .channel(`deployment-events-${machineId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployment_events',
          filter: `machine_inventory_id=eq.${machineId}`
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [machineId, query]);

  return query;
};
