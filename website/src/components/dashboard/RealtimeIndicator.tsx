import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const RealtimeIndicator = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(true);

  useEffect(() => {
    // Listen to connection state changes
    const channel = supabase.channel("connection-indicator");
    
    channel
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setIsSubscribing(false);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
          setIsSubscribing(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isSubscribing) {
    return (
      <Badge variant="outline" className="border-muted text-muted-foreground animate-pulse">
        <Activity className="w-3 h-3 mr-1" />
        Connecting...
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`border-green-500/50 text-green-500 ${isConnected ? 'animate-fade-in' : ''}`}
    >
      <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
      Real-time
    </Badge>
  );
};
