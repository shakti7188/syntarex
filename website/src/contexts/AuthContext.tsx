import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    console.log('[AuthContext] fetchUserRole called for userId:', userId);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      console.log('[AuthContext] Role query result:', { data, error });

      if (error) throw error;
      
      // If user has multiple roles, prioritize super_admin > admin > user
      if (data && data.length > 0) {
        const hasSuperAdmin = data.some(r => r.role === "super_admin");
        const hasAdmin = data.some(r => r.role === "admin");
        const role = hasSuperAdmin ? "super_admin" : hasAdmin ? "admin" : data[0].role;
        console.log('[AuthContext] Setting userRole to:', role);
        setUserRole(role);
      } else {
        console.log('[AuthContext] No roles found, defaulting to user');
        setUserRole("user"); // Default to user role
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching user role:", error);
      setUserRole("user"); // Default to user role
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Initializing auth state');

    let isMounted = true;

    const initAuth = async () => {
      console.log('[AuthContext] Running initial session check');
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthContext] Error getting initial session:', error);
        }

        const session = data?.session ?? null;
        if (!isMounted) return;

        console.log('[AuthContext] Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[AuthContext] Fetching role for existing session:', session.user.email);
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[AuthContext] Unexpected error during initial auth:', error);
        setUser(null);
        setUserRole(null);
      } finally {
        if (isMounted) {
          console.log('[AuthContext] Setting isLoading to false (initial)');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        console.log('[AuthContext] Auth state changed:', event, 'User:', session?.user?.email);

        // Only synchronous state updates in the callback
        setSession(session);
        setUser(session?.user ?? null);

        // Defer async operations with setTimeout to prevent deadlock
        if (session?.user) {
          console.log('[AuthContext] Scheduling role fetch for:', session.user.email);
          setTimeout(() => {
            if (isMounted) {
              fetchUserRole(session.user.id).finally(() => {
                if (isMounted) {
                  console.log('[AuthContext] Role fetch complete');
                }
              });
            }
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => {
      console.log('[AuthContext] Cleaning up subscription');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('[AuthContext] signOut called');
    try {
      // Clear local session first
      setUserRole(null);
      setUser(null);
      setSession(null);
      
      // Attempt server-side signout, but don't throw if it fails
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[AuthContext] Server signout warning (non-critical):', error.message);
      } else {
        console.log('[AuthContext] Successfully signed out');
      }
    } catch (error) {
      console.warn('[AuthContext] Sign out error (non-critical):', error);
    }
  };

  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  return (
    <AuthContext.Provider value={{ user, session, isLoading, userRole, isAdmin, isSuperAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
