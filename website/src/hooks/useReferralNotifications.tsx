import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ReferralNotificationConfig {
  onNewReferral?: (referral: any) => void;
  onNewCommission?: (commission: any) => void;
  onRankUp?: (rankData: any) => void;
  onSettlement?: (settlement: any) => void;
}

export const useReferralNotifications = (config?: ReferralNotificationConfig) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelsRef = useRef<any[]>([]);

  const showNotification = useCallback((title: string, description: string, variant?: "default" | "destructive") => {
    toast({
      title,
      description,
      duration: 5000,
      variant,
    });
  }, [toast]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new referrals
    const referralsChannel = supabase
      .channel(`referrals-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch the new referral's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, username')
            .eq('id', payload.new.referee_id)
            .maybeSingle();

          const name = profile?.full_name || profile?.username || profile?.email?.split('@')[0] || 'Someone';
          const position = payload.new.binary_position || 'your team';

          showNotification(
            "🎉 New Team Member!",
            `${name} just joined your ${position} leg!`
          );

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
          queryClient.invalidateQueries({ queryKey: ['binary-tree'] });
          
          config?.onNewReferral?.(payload.new);
        }
      )
      .subscribe();

    // Subscribe to new commissions
    const commissionsChannel = supabase
      .channel(`commissions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_commissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const amount = Number(payload.new.amount || 0);
          const tier = payload.new.tier || 1;

          showNotification(
            "💰 Commission Earned!",
            `You earned $${amount.toFixed(2)} from L${tier} referral!`
          );

          queryClient.invalidateQueries({ queryKey: ['commissions'] });
          config?.onNewCommission?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'binary_commissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const amount = Number(payload.new.scaled_amount || payload.new.base_amount || 0);

          showNotification(
            "💎 Binary Commission!",
            `You earned $${amount.toFixed(2)} from weak leg volume!`
          );

          queryClient.invalidateQueries({ queryKey: ['commissions'] });
          config?.onNewCommission?.(payload.new);
        }
      )
      .subscribe();

    // Subscribe to rank changes
    const rankChannel = supabase
      .channel(`rank-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_rank_history',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch the rank name
          const { data: rank } = await supabase
            .from('rank_definitions')
            .select('rank_name, rank_color')
            .eq('rank_level', payload.new.rank_level)
            .maybeSingle();

          if (rank) {
            showNotification(
              "🎖️ Rank Achievement!",
              `Congratulations! You've been promoted to ${rank.rank_name}!`
            );

            queryClient.invalidateQueries({ queryKey: ['user-rank'] });
            config?.onRankUp?.({ ...payload.new, rank });
          }
        }
      )
      .subscribe();

    // Subscribe to settlements
    const settlementsChannel = supabase
      .channel(`settlements-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'weekly_settlements',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.status === 'claimable' && payload.old?.status !== 'claimable') {
            const amount = Number(payload.new.final_payout || 0);

            showNotification(
              "🏆 Settlement Ready!",
              `$${amount.toFixed(2)} is ready to claim!`
            );

            queryClient.invalidateQueries({ queryKey: ['settlements'] });
            config?.onSettlement?.(payload.new);
          }
        }
      )
      .subscribe();

    // Subscribe to binary tree updates
    const binaryTreeChannel = supabase
      .channel(`binary-tree-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'binary_tree',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Silently refresh tree data
          queryClient.invalidateQueries({ queryKey: ['binary-tree'] });
          queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
        }
      )
      .subscribe();

    channelsRef.current = [
      referralsChannel,
      commissionsChannel,
      rankChannel,
      settlementsChannel,
      binaryTreeChannel,
    ];

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [user?.id, showNotification, queryClient, config]);

  return null;
};
