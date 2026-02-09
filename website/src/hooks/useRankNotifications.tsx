import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface RankNotificationConfig {
  onRankUp?: (rankData: {
    oldRank: string;
    newRank: string;
    rankLevel: number;
    criteriaMet: any;
  }) => void;
}

export const useRankNotifications = (config?: RankNotificationConfig) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const showRankNotification = useCallback((oldRank: string, newRank: string, rankLevel: number) => {
    // Get celebration message based on rank level
    const getCelebrationEmoji = (level: number) => {
      if (level >= 9) return "🏆👑";
      if (level >= 7) return "⭐🎖️";
      if (level >= 5) return "🎯💪";
      if (level >= 3) return "🚀✨";
      return "🎉🌟";
    };

    const getTitle = (level: number) => {
      if (level >= 9) return "LEGENDARY PROMOTION!";
      if (level >= 7) return "Elite Rank Achieved!";
      if (level >= 5) return "Major Promotion!";
      if (level >= 3) return "Rank Up!";
      return "Congratulations!";
    };

    toast({
      title: `${getCelebrationEmoji(rankLevel)} ${getTitle(rankLevel)}`,
      description: `You've been promoted from ${oldRank} to ${newRank}! Keep up the great work!`,
      duration: 10000,
    });
  }, [toast]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to user_rank_history for the current user
    const channel = supabase
      .channel(`rank-promotions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_rank_history',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const { old_rank, new_rank, rank_level, criteria_met } = payload.new as any;
          
          // Only notify if this is a promotion (not a manual downgrade)
          if (criteria_met?.type !== 'manual_override' || rank_level > 0) {
            showRankNotification(old_rank, new_rank, rank_level);
            
            // Invalidate rank-related queries
            queryClient.invalidateQueries({ queryKey: ['user-rank'] });
            queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
            
            // Call custom callback if provided
            config?.onRankUp?.({
              oldRank: old_rank,
              newRank: new_rank,
              rankLevel: rank_level,
              criteriaMet: criteria_met
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, showRankNotification, queryClient, config]);

  return null;
};
