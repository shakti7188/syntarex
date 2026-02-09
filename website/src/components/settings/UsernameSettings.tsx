import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function UsernameSettings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentReferralCode, setCurrentReferralCode] = useState<string | null>(null);
  
  // Validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  const debouncedUsername = useDebouncedValue(username, 500);

  // Fetch current username and referral code
  const fetchUserData = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username, referral_code")
      .eq("id", user.id)
      .single();
    
    if (data && !error) {
      setCurrentUsername(data.username);
      setCurrentReferralCode(data.referral_code);
      setUsername(data.username || "");
    }
  };

  // Load username on mount
  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Check username availability when debounced value changes
  useEffect(() => {
    const checkUsername = async () => {
      // Skip if username hasn't changed
      if (debouncedUsername === currentUsername) {
        setUsernameAvailable(null);
        setUsernameError(null);
        return;
      }
      
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameAvailable(null);
        setUsernameError(debouncedUsername ? "Username must be at least 3 characters" : null);
        return;
      }
      
      // Basic format validation
      if (!/^[a-zA-Z0-9_-]+$/.test(debouncedUsername)) {
        setUsernameAvailable(false);
        setUsernameError("Only letters, numbers, underscore, and hyphen allowed");
        return;
      }
      
      if (debouncedUsername.length > 20) {
        setUsernameAvailable(false);
        setUsernameError("Username must be 20 characters or less");
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError(null);
      
      try {
        // Call the database function to check availability (excluding current user)
        const { data, error } = await supabase.rpc('is_username_available', {
          p_username: debouncedUsername,
          p_exclude_user_id: user?.id || null
        });
        
        if (error) {
          console.error('[UsernameSettings] Username check error:', error);
          setUsernameAvailable(null);
          setUsernameError("Unable to verify username");
        } else {
          setUsernameAvailable(data === true);
          if (!data) {
            // Check if it's a blacklist issue
            const { data: blacklistData } = await supabase
              .from('banned_usernames')
              .select('word');
            
            const isBlacklisted = blacklistData?.some(
              b => debouncedUsername.toLowerCase().includes(b.word.toLowerCase())
            );
            
            if (isBlacklisted) {
              setUsernameError("This username contains restricted words");
            } else {
              setUsernameError("Username already taken");
            }
          }
        }
      } catch (err) {
        console.error('[UsernameSettings] Username check failed:', err);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername, currentUsername, user?.id]);

  const handleUpdateUsername = async () => {
    if (!user) return;
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      toast.error("Username must be 3-20 characters (letters, numbers, underscore, hyphen only)");
      return;
    }
    
    // Check availability
    if (usernameAvailable !== true && username !== currentUsername) {
      toast.error(usernameError || "Please choose a different username");
      return;
    }

    setIsLoading(true);

    try {
      // The database trigger will automatically sync referral_code
      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Username already taken. Please choose another one.");
        } else {
          throw error;
        }
      } else {
        toast.success("Username updated! Your referral link is now: synterax.io/auth?ref=" + username.toUpperCase());
        setCurrentUsername(username);
        setCurrentReferralCode(username.toUpperCase());
        setUsernameAvailable(null);
      }
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    } finally {
      setIsLoading(false);
    }
  };

  const hasUsernameChanged = username !== currentUsername && username.length >= 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile")}</CardTitle>
        <CardDescription>
          Your username is also your referral code. Changing it will update your referral link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasUsernameChanged && (
          <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Changing your username will change your referral link. Anyone using your old link won't be connected to you.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="username">{t("settings.username")}</Label>
          <div className="relative">
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              maxLength={20}
              className={
                hasUsernameChanged && usernameAvailable === true 
                  ? "border-green-500 pr-10" 
                  : hasUsernameChanged && usernameAvailable === false 
                    ? "border-destructive pr-10" 
                    : "pr-10"
              }
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCheckingUsername && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!isCheckingUsername && hasUsernameChanged && usernameAvailable === true && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {!isCheckingUsername && hasUsernameChanged && usernameAvailable === false && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            3-20 characters. Letters, numbers, underscore (_), and hyphen (-) only.
          </p>
          {usernameError && hasUsernameChanged && (
            <p className="text-sm text-destructive">{usernameError}</p>
          )}
        </div>
        
        <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <p className="text-sm font-medium">Your referral link:</p>
          <p className="text-sm font-mono text-primary break-all">
            synterax.io/auth?ref={hasUsernameChanged ? username.toUpperCase() : (currentReferralCode || 'USERNAME')}
          </p>
        </div>
        
        <Button 
          onClick={handleUpdateUsername} 
          disabled={
            isLoading || 
            !username || 
            username === currentUsername || 
            isCheckingUsername ||
            (hasUsernameChanged && usernameAvailable !== true)
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            t("common.save")
          )}
        </Button>
      </CardContent>
    </Card>
  );
}