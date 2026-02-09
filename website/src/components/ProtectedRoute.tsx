import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[ProtectedRoute] State:', { isLoading, user: !!user, isAdmin, requireAdmin });
    
    if (!isLoading) {
      if (!user) {
        console.log('[ProtectedRoute] No user, redirecting to /auth');
        navigate("/auth");
      } else if (requireAdmin && !isAdmin) {
        console.log('[ProtectedRoute] Admin required but user is not admin, redirecting to /');
        // Admin role check - admins have priority over user role
        toast({
          title: "Access Denied",
          description: "Admin access only.",
          variant: "destructive",
        });
        navigate("/");
      } else {
        console.log('[ProtectedRoute] Access granted');
      }
    }
  }, [user, isLoading, isAdmin, requireAdmin, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin)) {
    // Block access if not authenticated or if admin required but user is not admin
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
