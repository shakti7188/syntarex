import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Copy, Share2, Check, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ReferralLink = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fetch user's referral code
  const { data: profile, error: profileError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching referral code:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch referral stats
  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id, is_active')
        .eq('referrer_id', user.id);
      
      return {
        total: referrals?.length || 0,
        active: referrals?.filter(r => r.is_active).length || 0,
      };
    },
    enabled: !!user?.id,
  });

  const referralLink = profile?.referral_code 
    ? `https://synterax.io/auth?ref=${profile.referral_code}`
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Referral link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join SynteraX",
          text: "Start mining Bitcoin with me on SynteraX!",
          url: referralLink,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard();
    }
  };

  if (!user) return null;
  
  if (!profile?.referral_code) {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {profileError ? 'Error loading referral link.' : 'Generating your referral link...'}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Invite & Earn</h3>
            <p className="text-xs text-muted-foreground">
              {referralStats?.total || 0} referrals • {referralStats?.active || 0} active
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-1">
          <Input 
            value={referralLink} 
            readOnly 
            className="flex-1 bg-background text-sm"
          />
          <Button 
            onClick={copyToClipboard} 
            variant="outline"
            size="icon"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button onClick={shareLink} size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
