import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  Share2,
  Users,
  ArrowLeft,
  ArrowRight,
  Link,
  QrCode,
  Send,
  MessageCircle,
  Twitter,
  Mail,
  UserPlus,
  TrendingUp,
  Zap,
  Settings,
} from "lucide-react";

type BinaryPosition = 'left' | 'right';

interface ReferralStats {
  total: number;
  active: number;
  leftCount: number;
  rightCount: number;
  leftVolume: number;
  rightVolume: number;
}

export const ReferralDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [defaultLeg, setDefaultLeg] = useState<BinaryPosition>('left');

  // Fetch profile with referral code
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-referral', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, default_placement_leg, username')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data?.default_placement_leg) {
        setDefaultLeg(data.default_placement_leg as BinaryPosition);
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async (): Promise<ReferralStats | null> => {
      if (!user?.id) return null;
      
      const [{ data: referrals }, { data: binaryTree }] = await Promise.all([
        supabase
          .from('referrals')
          .select('id, is_active, binary_position')
          .eq('referrer_id', user.id)
          .eq('referral_level', 1),
        supabase
          .from('binary_tree')
          .select('left_volume, right_volume, total_left_members, total_right_members')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);
      
      return {
        total: referrals?.length || 0,
        active: referrals?.filter(r => r.is_active).length || 0,
        leftCount: binaryTree?.total_left_members || 0,
        rightCount: binaryTree?.total_right_members || 0,
        leftVolume: Number(binaryTree?.left_volume || 0),
        rightVolume: Number(binaryTree?.right_volume || 0),
      };
    },
    enabled: !!user?.id,
  });

  // Save placement preference
  const savePlacementMutation = useMutation({
    mutationFn: async (leg: BinaryPosition) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from('profiles')
        .update({ default_placement_leg: leg })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-referral'] });
      toast({
        title: "Settings saved",
        description: `New referrals will be placed on your ${defaultLeg} leg.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const shareNative = async () => {
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

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join me on SynteraX! Start mining Bitcoin today: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(`Join me on SynteraX! Start mining Bitcoin today:`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Start mining Bitcoin with me on @SynteraX! 💰⛏️`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Join me on SynteraX - Bitcoin Mining");
    const body = encodeURIComponent(`Hey!\n\nI'm using SynteraX to mine Bitcoin. Join my team and start earning:\n\n${referralLink}\n\nLet me know if you have questions!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSavePlacement = () => {
    savePlacementMutation.mutate(defaultLeg);
  };

  const isLoading = profileLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Link className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Your Referral Link</h2>
              <p className="text-sm text-muted-foreground">Share and earn 10% instant rewards</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Referral Code Display */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-2 block">Your unique code</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="font-mono text-sm bg-muted/50"
                />
                <Button onClick={copyToClipboard} size="icon" variant="outline">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowQR(!showQR)}
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                {showQR ? "Hide" : "Show"} QR
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {showQR && referralLink && (
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCodeSVG 
                value={referralLink} 
                size={180}
                level="H"
                includeMargin
              />
            </div>
          )}

          {/* Share Buttons */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Share via</Label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={shareNative} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" onClick={shareWhatsApp} className="gap-2 text-green-600 border-green-600/30 hover:bg-green-600/10">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={shareTelegram} className="gap-2 text-blue-500 border-blue-500/30 hover:bg-blue-500/10">
                <Send className="h-4 w-4" />
                Telegram
              </Button>
              <Button variant="outline" onClick={shareTwitter} className="gap-2 text-sky-500 border-sky-500/30 hover:bg-sky-500/10">
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button variant="outline" onClick={shareEmail} className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.active || 0}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.leftCount || 0}</p>
              <p className="text-xs text-muted-foreground">Left Leg</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.rightCount || 0}</p>
              <p className="text-xs text-muted-foreground">Right Leg</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Placement Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            Default Placement
          </CardTitle>
          <CardDescription>
            Choose which leg new referrals will be placed in by default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={defaultLeg}
            onValueChange={(val) => setDefaultLeg(val as BinaryPosition)}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Label
              htmlFor="left-leg"
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                defaultLeg === 'left' 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-border hover:border-blue-500/50'
              }`}
            >
              <RadioGroupItem value="left" id="left-leg" />
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Left Leg</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.leftCount || 0} members • ${(stats?.leftVolume || 0).toLocaleString()} BV
                  </p>
                </div>
              </div>
            </Label>

            <Label
              htmlFor="right-leg"
              className={`flex-1 flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                defaultLeg === 'right' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="right" id="right-leg" />
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Right Leg</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.rightCount || 0} members • ${(stats?.rightVolume || 0).toLocaleString()} BV
                  </p>
                </div>
              </div>
            </Label>
          </RadioGroup>

          <Button 
            onClick={handleSavePlacement} 
            className="mt-4"
            disabled={savePlacementMutation.isPending}
          >
            {savePlacementMutation.isPending ? "Saving..." : "Save Preference"}
          </Button>
        </CardContent>
      </Card>

      {/* Commission Info */}
      <Card className="bg-gradient-to-br from-accent/10 via-transparent to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Earn Up to 10% Commission</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>10%</strong> instant reward on direct referrals</li>
                <li>• <strong>10%</strong> team bonus (10/5/5% on L1/L2/L3)</li>
                <li>• <strong>10%</strong> binary commission on weak leg</li>
                <li>• <strong>10%</strong> daily staking override on direct referrals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
