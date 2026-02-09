import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, CheckCircle, AlertCircle, Shield, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { ManualWalletEntry } from "./ManualWalletEntry";
import { WalletVerification } from "./WalletVerification";
import { WalletNetwork } from "@/lib/validation-schemas";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const WalletConnect = () => {
  const { user } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<WalletNetwork | null>(null);
  const [walletVerified, setWalletVerified] = useState(false);
  const [walletVerifiedAt, setWalletVerifiedAt] = useState<Date | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<{ allowed: boolean; reason?: string; cooldownEndsAt?: Date } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchLinkedWallet();
      checkCooldown();
    }
  }, [user?.id]);

  const fetchLinkedWallet = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_network, wallet_verified, wallet_verified_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching wallet:', error);
      return;
    }

    setLinkedWallet(data?.wallet_address || null);
    setWalletNetwork((data?.wallet_network as WalletNetwork) || null);
    setWalletVerified(data?.wallet_verified || false);
    setWalletVerifiedAt(data?.wallet_verified_at ? new Date(data.wallet_verified_at) : null);
  };

  const checkCooldown = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase.rpc('can_change_wallet', { p_user_id: user.id });
    
    if (error) {
      console.error('Error checking cooldown:', error);
      return;
    }

    if (data && data.length > 0) {
      const result = data[0];
      setCooldownInfo({
        allowed: result.allowed,
        reason: result.reason,
        cooldownEndsAt: result.cooldown_ends_at ? new Date(result.cooldown_ends_at) : undefined
      });
    }
  };

  const handleWalletVerified = async (walletAddress: string, network: WalletNetwork) => {
    setLinkedWallet(walletAddress);
    setWalletNetwork(network);
    setWalletVerified(true);
    setWalletVerifiedAt(new Date());
    setShowVerification(false);
    checkCooldown();
  };

  const handleManualWalletSubmit = async (walletAddress: string, network: WalletNetwork) => {
    if (!user?.id) {
      toast.error("Please sign in first");
      return;
    }

    setIsLinking(true);

    try {
      // Check if wallet is already linked to another account
      const { data: existingWallet, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .neq('id', user.id)
        .maybeSingle();

      if (checkError) {
        throw new Error("Failed to verify wallet availability");
      }

      if (existingWallet) {
        toast.error("This wallet is already linked to another account");
        setIsLinking(false);
        return;
      }

      // Update profile with wallet address (NOT verified - manual entry)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          wallet_address: walletAddress,
          wallet_network: network,
          wallet_link_method: 'manual',
          wallet_verified: false,
          wallet_verified_at: null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setLinkedWallet(walletAddress);
      setWalletNetwork(network);
      setWalletVerified(false);
      setWalletVerifiedAt(null);
      
      toast.success("Wallet address saved!", {
        description: "Please verify ownership to enable payments.",
      });

      // Prompt to verify
      setShowVerification(true);
    } catch (error: any) {
      console.error('Error saving wallet:', error);
      toast.error("Failed to save wallet address: " + error.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkWallet = async () => {
    if (!user?.id) return;

    // Check if allowed
    if (cooldownInfo && !cooldownInfo.allowed) {
      toast.error("Cannot change wallet", { description: cooldownInfo.reason });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          wallet_address: null,
          wallet_network: null,
          wallet_link_method: null,
          wallet_verified: false,
          wallet_verified_at: null
        })
        .eq('id', user.id);

      if (error) throw error;

      setLinkedWallet(null);
      setWalletNetwork(null);
      setWalletVerified(false);
      setWalletVerifiedAt(null);
      setShowVerification(false);
      toast.success("Wallet unlinked successfully");
      checkCooldown();
    } catch (error: any) {
      console.error('Error unlinking wallet:', error);
      toast.error("Failed to unlink wallet");
    }
  };

  if (!user) {
    return (
      <Card className="p-6 border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <p>Please sign in to add your wallet</p>
        </div>
      </Card>
    );
  }

  // Show verification UI if requested
  if (showVerification) {
    return (
      <div className="space-y-4">
        <Card className="p-6 border-border">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Verify Wallet Ownership</h3>
            </div>

            <WalletVerification
              onVerified={handleWalletVerified}
              onCancel={() => setShowVerification(false)}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 border-border">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Payout Wallet</h3>
          </div>

          {linkedWallet ? (
            <>
              <div className={cn(
                "p-4 rounded-lg border",
                walletNetwork === 'SOLANA' 
                  ? "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                  : walletNetwork === 'TRON'
                  ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              )}>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-muted-foreground">Linked Wallet</p>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        walletNetwork === 'SOLANA'
                          ? "border-purple-300 text-purple-700 dark:text-purple-400"
                          : walletNetwork === 'TRON'
                          ? "border-red-300 text-red-700 dark:text-red-400"
                          : "border-blue-300 text-blue-700 dark:text-blue-400"
                      )}>
                        {walletNetwork || 'ETHEREUM'}
                      </Badge>
                      {walletVerified ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-sm">
                      {linkedWallet.slice(0, 8)}...{linkedWallet.slice(-6)}
                    </p>
                    {walletVerifiedAt && (
                      <p className="text-xs text-muted-foreground">
                        Verified {formatDistanceToNow(walletVerifiedAt, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  {walletVerified ? (
                    <CheckCircle className={cn(
                      "h-5 w-5",
                      "text-green-500"
                    )} />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Verification Warning */}
              {!walletVerified && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Wallet not verified
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        You must verify wallet ownership to make payments. This protects your funds.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cooldown Warning */}
              {cooldownInfo && !cooldownInfo.allowed && (
                <div className="p-3 bg-muted rounded-lg border">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{cooldownInfo.reason}</p>
                      {cooldownInfo.cooldownEndsAt && (
                        <p className="text-xs text-muted-foreground">
                          Cooldown ends {formatDistanceToNow(cooldownInfo.cooldownEndsAt, { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!walletVerified && (
                  <Button 
                    onClick={() => setShowVerification(true)}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Ownership
                  </Button>
                )}
                <Button 
                  onClick={handleUnlinkWallet} 
                  variant="outline"
                  className="flex-1"
                  disabled={cooldownInfo !== null && !cooldownInfo.allowed}
                >
                  Change Wallet
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Two options: Verify (recommended) or Manual */}
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowVerification(true)}
                  className="w-full"
                  size="lg"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Link & Verify Wallet (Recommended)
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or enter manually
                    </span>
                  </div>
                </div>

                <ManualWalletEntry
                  onSubmit={handleManualWalletSubmit}
                  isSubmitting={isLinking}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {linkedWallet && walletVerified && (
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">
            ✅ Your wallet is verified and linked. Weekly settlements will be sent to this address.
          </p>
        </Card>
      )}
    </div>
  );
};
