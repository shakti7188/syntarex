import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Users, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be less than 128 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Password must contain uppercase, lowercase, and number" 
    }),
  fullName: z.string()
    .trim()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Full name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Full name contains invalid characters" }),
  username: z.string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be less than 20 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, underscore, hyphen" }),
});

const signInSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(1, { message: "Password is required" })
    .max(128, { message: "Password must be less than 128 characters" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [isLookingUpSponsor, setIsLookingUpSponsor] = useState(false);
  
  // Username validation state
  const [username, setUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  const debouncedUsername = useDebouncedValue(username, 500);

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    console.log('[Auth] Referral code from URL:', ref);
    
    if (ref) {
      setReferralCode(ref);
      setIsLookingUpSponsor(true);
      
      // Fetch referrer info using secure RPC function (bypasses RLS for unauthenticated users)
      supabase
        .rpc('lookup_sponsor_by_referral', { p_referral_code: ref })
        .then(({ data, error }) => {
          // RPC returns an array, get first result
          const sponsor = Array.isArray(data) ? data[0] : data;
          console.log('[Auth] Sponsor lookup result:', { sponsor, error });
          if (sponsor) {
            setReferrerName(sponsor.full_name || sponsor.email);
            setSponsorId(sponsor.id);
          } else {
            console.warn('[Auth] No sponsor found for referral code:', ref);
            toast({
              title: "Invalid referral code",
              description: "The referral code was not found. You can still sign up without a referral.",
              variant: "destructive",
            });
            setReferralCode(null);
          }
          setIsLookingUpSponsor(false);
        });
    }
  }, [searchParams]);

  // Check username availability when debounced value changes
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameAvailable(null);
        setUsernameError(null);
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
        // Call the database function to check availability
        const { data, error } = await supabase.rpc('is_username_available', {
          p_username: debouncedUsername,
          p_exclude_user_id: null
        });
        
        if (error) {
          console.error('[Auth] Username check error:', error);
          setUsernameAvailable(null);
          setUsernameError("Unable to verify username");
        } else {
          setUsernameAvailable(data === true);
          if (!data) {
            // Check if it's a blacklist issue or just taken
            const { data: bannedData } = await supabase
              .from('banned_usernames')
              .select('word')
              .limit(1);
            
            // Check against blacklist locally
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
        console.error('[Auth] Username check failed:', err);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signup-email") as string)?.trim();
    const password = formData.get("signup-password") as string;
    const fullName = (formData.get("full-name") as string)?.trim();

    try {
      // Validate input including username
      const validatedData = signUpSchema.parse({ email, password, fullName, username });
      
      // Double-check username availability
      if (!usernameAvailable) {
        toast({
          title: "Username unavailable",
          description: usernameError || "Please choose a different username",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('[Auth] Signing up with metadata:', {
        full_name: validatedData.fullName,
        username: validatedData.username,
        referral_code: referralCode,
        sponsor_id: sponsorId,
      });

      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validatedData.fullName,
            username: validatedData.username,
            referral_code: referralCode,
            sponsor_id: sponsorId,
          },
        },
      });

      if (error) throw error;

      toast({
        title: t("auth.accountCreated"),
        description: t("auth.welcomeMessage"),
      });

      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      const message = error instanceof z.ZodError 
        ? error.errors[0].message 
        : error.message;
      
      console.error('[Auth] Signup error:', error);
      
      toast({
        title: t("auth.signUpFailed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signin-email") as string)?.trim();
    const password = formData.get("signin-password") as string;

    try {
      const validatedData = signInSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) throw error;

      toast({
        title: t("auth.welcomeBack"),
        description: t("auth.redirecting"),
      });

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: any) {
      const message = error instanceof z.ZodError 
        ? error.errors[0].message 
        : error.message;
      
      toast({
        title: t("auth.signInFailed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: t("auth.resetEmailSent"),
        description: t("auth.checkInbox"),
      });
    } catch (error: any) {
      toast({
        title: t("auth.resetFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmitSignup = usernameAvailable === true && !isCheckingUsername && !isLookingUpSponsor;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <Card className="w-full border-none shadow-lg">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-center text-foreground">
            Start Mining Bitcoin
          </CardTitle>
          <CardDescription className="text-center text-base">
            Professional Bitcoin mining made simple
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t("auth.email")}</Label>
                  <Input
                    id="signin-email"
                    name="signin-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t("auth.password")}</Label>
                  <Input
                    id="signin-password"
                    name="signin-password"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.signIn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {referralCode && referrerName && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Users className="h-4 w-4" />
                      <span>Referred by: <strong>{referrerName}</strong></span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full-name">{t("auth.fullName")}</Label>
                  <Input
                    id="full-name"
                    name="full-name"
                    type="text"
                    placeholder={t("auth.fullNamePlaceholder")}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                {/* Username field - required for referral link */}
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Choose a unique username"
                      required
                      disabled={isLoading}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                      maxLength={20}
                      className={
                        usernameAvailable === true 
                          ? "border-green-500 pr-10" 
                          : usernameAvailable === false 
                            ? "border-destructive pr-10" 
                            : "pr-10"
                      }
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!isCheckingUsername && usernameAvailable === true && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {!isCheckingUsername && usernameAvailable === false && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be your referral link: synterax.io/auth?ref=<span className="font-mono font-medium">{username.toUpperCase() || 'USERNAME'}</span>
                  </p>
                  {usernameError && (
                    <p className="text-xs text-destructive">{usernameError}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("auth.email")}</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("auth.password")}</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !canSubmitSignup}
                >
                  {(isLoading || isLookingUpSponsor) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLookingUpSponsor ? "Verifying referral..." : t("auth.createAccount")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 border-t pt-4">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm text-muted-foreground">
                  {t("auth.forgotPassword")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="reset-email"
                    name="reset-email"
                    type="email"
                    placeholder={t("auth.resetEmailPlaceholder")}
                    disabled={isLoading}
                  />
                  <Button type="submit" variant="outline" disabled={isLoading}>
                    {t("auth.resetPassword")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;