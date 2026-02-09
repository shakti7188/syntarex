import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "./useDebounce";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  rank: string | null;
  level?: number;
  binary_position?: "left" | "right" | null;
  is_active?: boolean;
}

interface BinaryTeam {
  left: TeamMember[];
  right: TeamMember[];
  leftVolume: number;
  rightVolume: number;
}

interface TeamStructure {
  directReferrals: {
    level1: TeamMember[];
    level2: TeamMember[];
    level3: TeamMember[];
  };
  binaryTeam: BinaryTeam;
  totalMembers: number;
  timestamp?: string;
}

export const useRealtimeTeamStructure = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamStructure, setTeamStructure] = useState<TeamStructure>({
    directReferrals: { level1: [], level2: [], level3: [] },
    binaryTeam: { left: [], right: [], leftVolume: 0, rightVolume: 0 },
    totalMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTreeSnapshot = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Fetching tree snapshot from backend...");
      
      const { data, error } = await supabase.functions.invoke('get-network-tree', {
        method: 'GET',
      });

      if (error) {
        console.error('Error fetching tree snapshot:', error);
        throw error;
      }

      if (data) {
        console.log("Tree snapshot received:", data.totalMembers, "members");
        setTeamStructure(data);
      }
    } catch (error) {
      console.error("Error in fetchTreeSnapshot:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Debounced refetch - groups rapid updates within 3 seconds
  const debouncedFetch = useDebounce(fetchTreeSnapshot, 3000);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchTreeSnapshot();

    // Subscribe to referrals where referrer_id = auth.uid() (channel-level filtering)
    // This catches new referrals in your direct downline
    const referralsChannel = supabase
      .channel("team-referrals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "referrals",
          filter: `referrer_id=eq.${user.id}`, // Channel-level filtering - RLS enforced
        },
        (payload) => {
          console.log("Referral change detected:", payload.eventType);
          
          if (payload.eventType === "INSERT") {
            toast({
              title: "New referral joined your network! 🎉",
              description: "Your team is growing",
              duration: 5000,
            });
          }
          
          // Debounced re-fetch to prevent excessive backend calls
          debouncedFetch();
        }
      )
      .subscribe();

    // Subscribe to binary tree changes for this user (channel-level filtering)
    const binaryChannel = supabase
      .channel("team-binary")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "binary_tree",
          filter: `user_id=eq.${user.id}`, // Channel-level filtering - RLS enforced
        },
        (payload) => {
          console.log("Binary tree change detected:", payload.eventType);
          debouncedFetch();
        }
      )
      .subscribe();

    // Subscribe to binary_volume changes
    // Note: This listens to all volume changes, but backend endpoint filters by user
    const volumeChannel = supabase
      .channel("team-volumes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "binary_volume",
        },
        (payload) => {
          console.log("Binary volume change detected");
          debouncedFetch();
        }
      )
      .subscribe();

    // Subscribe to user_activity changes (for active/inactive status)
    // Note: Listens to all activity changes, but backend filters by user's downline
    const activityChannel = supabase
      .channel("team-activity")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_activity",
        },
        (payload) => {
          console.log("User activity status changed");
          debouncedFetch();
        }
      )
      .subscribe();

    // Subscribe to profile updates (for rank changes, name updates, etc.)
    // Note: Listens to all profile updates, but backend filters by user's downline
    const profilesChannel = supabase
      .channel("team-profiles")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("Team member profile updated");
          debouncedFetch();
        }
      )
      .subscribe();

    // Cleanup: Unsubscribe on unmount, logout, or route change
    return () => {
      console.log("Cleaning up team structure subscriptions");
      supabase.removeChannel(referralsChannel);
      supabase.removeChannel(binaryChannel);
      supabase.removeChannel(volumeChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user, toast, fetchTreeSnapshot, debouncedFetch]);

  return { teamStructure, isLoading, refetch: fetchTreeSnapshot };
};
