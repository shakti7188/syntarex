import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

interface SubscriptionConfig {
  channel: string;
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  onEvent?: (payload: { eventType: string; [key: string]: any }) => void;
}

export const useRealtimeSubscription = (
  configs: SubscriptionConfig[],
  fetchCallback: () => void,
  deps: any[],
  debounceMs: number = 2000
) => {
  const debouncedFetch = useDebounce(fetchCallback, debounceMs);

  useEffect(() => {
    const channels = configs.map(({ channel, table, filter, event, onEvent }) => {
      const channelInstance = supabase.channel(channel);

      const config: any = {
        event: event || '*',
        schema: 'public',
        table,
      };

      if (filter) {
        config.filter = filter;
      }

      channelInstance.on('postgres_changes', config, (payload: any) => {
        console.log(`${table} updated:`, payload.eventType);
        if (onEvent) {
          onEvent(payload);
        } else {
          debouncedFetch();
        }
      });

      return channelInstance.subscribe();
    });

    return () => {
      console.log('Cleaning up subscriptions');
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, deps);

  return { debouncedFetch };
};
