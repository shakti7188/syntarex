import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, ChevronDown, GraduationCap, Coins } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { AppNavigation } from "@/components/AppNavigation";
import logo from "@/assets/syntarex-logo-tight.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LandingNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show dashboard navigation when logged in
  if (user) {
    return <AppNavigation />;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-border/40 bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="SynteraX Logo" style={{ height: "48px", width: "auto" }} />
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full">
                    Learn <ChevronDown className="ml-1 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/bitcoin-mining")} className="cursor-pointer">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Bitcoin Mining
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/tokenomics")} className="cursor-pointer">
                    <Coins className="mr-2 h-4 w-4" />
                    Tokenomics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="rounded-full"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/40 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-6 space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/bitcoin-mining");
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-full"
              >
                Bitcoin Mining
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/tokenomics");
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-full"
              >
                Tokenomics
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/auth");
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-full"
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  navigate("/auth");
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-full"
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
