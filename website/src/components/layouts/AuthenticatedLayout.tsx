import { ReactNode } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { Link } from "react-router-dom";
import logo from "@/assets/syntarex-logo-cropped.png";
import { useReferralNotifications } from "@/hooks/useReferralNotifications";
import { useRankNotifications } from "@/hooks/useRankNotifications";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  // Enable real-time notifications for referrals and rank promotions
  useReferralNotifications();
  useRankNotifications();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavigation />
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="SynteraX Logo" className="w-6 h-6" />
              <span>© 2024 SynteraX. All rights reserved.</span>
            </div>
            
            <div className="flex gap-6">
              <Link to="/settings" className="hover:text-foreground transition-colors">
                Settings
              </Link>
              <Link to="/referrals" className="hover:text-foreground transition-colors">
                Referrals
              </Link>
              <Link to="/token-info" className="hover:text-foreground transition-colors">
                Token Info
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
