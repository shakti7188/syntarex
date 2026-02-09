import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, DollarSign, LayoutDashboard, Shield, ChevronDown, ShoppingCart, Boxes, Coins, History, Package, Server, Store, TrendingUp, Settings, FlaskConical, Award, Wallet, Receipt, Menu, User, GraduationCap, Bitcoin, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";
import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/syntarex-logo-tight.png";

export const AppNavigation = () => {
  const { isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  // Use a larger breakpoint for navbar to prevent cutting off
  const [showMobileNav, setShowMobileNav] = useState(false);
  
  useEffect(() => {
    const checkWidth = () => {
      setShowMobileNav(window.innerWidth < 1280); // xl breakpoint
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMiningActive = location.pathname.startsWith('/mining');
  const isAdminActive = location.pathname.startsWith('/admin');
  const isAccountActive = ['/earnings', '/transactions'].some(path => location.pathname.startsWith(path));
  const isLearnActive = ['/bitcoin-mining', '/tokenomics'].some(path => location.pathname.startsWith(path));

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    // { to: "/token-info", label: "XFLOW Token", icon: Wallet }, // Hidden for now
  ];

  const learnSubItems = [
    { to: "/bitcoin-mining", label: "Bitcoin Mining", icon: Bitcoin },
    { to: "/tokenomics", label: "Tokenomics", icon: PieChart },
  ];

  const accountSubItems = [
    { to: "/earnings", label: "My Earnings", icon: DollarSign },
    { to: "/transactions", label: t("transactions.title"), icon: Receipt },
  ];

  const miningSubItems = [
    { to: "/mining/buy", label: t("mining.buyMachines"), icon: ShoppingCart },
    { to: "/mining/my-machines", label: "My Purchased Packages", icon: Package },
    // { to: "/mining/hashrate-transactions", label: "Hashrate Transactions", icon: History },
    // { to: "/mining/hosting", label: t("mining.hosting"), icon: Server },
    // { to: "/mining/marketplace", label: t("mining.marketplace"), icon: Store },
    { to: "/mining/roi", label: t("mining.roi"), icon: TrendingUp },
  ];

  const adminSubItems = [
    { to: "/admin", label: t("nav.adminDashboard"), icon: Settings },
    { to: "/admin/test-tools", label: t("nav.testTools"), icon: FlaskConical },
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="SynteraX Logo" className="h-10 w-auto" />
          </div>

          {/* Desktop Navigation */}
          {!showMobileNav && (
            <>
              <div className="flex items-center gap-1 ml-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                      "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      "transition-colors"
                    )}
                    activeClassName="text-foreground bg-muted"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        "transition-colors",
                        isLearnActive && "text-foreground bg-muted"
                      )}
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>Learn</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 bg-background border shadow-lg z-50"
                    sideOffset={5}
                  >
                    {learnSubItems.map((item) => (
                      <DropdownMenuItem
                        key={item.to}
                        onSelect={() => navigate(item.to)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        "transition-colors",
                        isMiningActive && "text-foreground bg-muted"
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Start Mining</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 bg-background border shadow-lg z-50"
                    sideOffset={5}
                  >
                    {miningSubItems.map((item) => (
                      <DropdownMenuItem
                        key={item.to}
                        onSelect={() => navigate(item.to)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        "transition-colors",
                        isAccountActive && "text-foreground bg-muted"
                      )}
                    >
                      <User className="h-4 w-4" />
                      <span>Account</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 bg-background border shadow-lg z-50"
                    sideOffset={5}
                  >
                    {accountSubItems.map((item) => (
                      <DropdownMenuItem
                        key={item.to}
                        onSelect={() => navigate(item.to)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isAdmin && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                          "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          "transition-colors",
                          isAdminActive && "text-foreground bg-muted"
                        )}
                      >
                        <Shield className="h-4 w-4" />
                        <span>{t("nav.admin")}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      className="w-56 bg-background border shadow-lg z-50"
                      sideOffset={5}
                    >
                      {adminSubItems.map((item) => (
                        <DropdownMenuItem
                          key={item.to}
                          onSelect={() => navigate(item.to)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <LanguageSelector />
                
                <Button
                  onClick={() => navigate("/settings")}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      await signOut();
                      navigate("/");
                    } catch (error) {
                      console.error("Sign out failed:", error);
                    }
                  }}
                  variant="ghost"
                  className="text-foreground hover:text-primary"
                >
                  {t("nav.signOut")}
                </Button>
              </div>
            </>
          )}

          {/* Mobile Menu */}
          {showMobileNav && (
            <div className="flex items-center gap-2">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        navigate("/");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <img src={logo} alt="SynteraX Logo" className="h-10 w-auto" />
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-8 space-y-1">
                    {navItems.map((item) => (
                      <Button
                        key={item.to}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2",
                          location.pathname === item.to && "bg-muted"
                        )}
                        onClick={() => {
                          navigate(item.to);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                    
                    <div className="pt-4 pb-2">
                      <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Start Mining
                      </p>
                    </div>
                    
                    {miningSubItems.map((item) => (
                      <Button
                        key={item.to}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2 pl-6",
                          location.pathname === item.to && "bg-muted"
                        )}
                        onClick={() => {
                          navigate(item.to);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                    
                    <div className="pt-4 pb-2">
                      <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Learn
                      </p>
                    </div>
                    
                    {learnSubItems.map((item) => (
                      <Button
                        key={item.to}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2 pl-6",
                          location.pathname === item.to && "bg-muted"
                        )}
                        onClick={() => {
                          navigate(item.to);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}

                    <div className="pt-4 pb-2">
                      <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Account
                      </p>
                    </div>
                    
                    {accountSubItems.map((item) => (
                      <Button
                        key={item.to}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2 pl-6",
                          location.pathname === item.to && "bg-muted"
                        )}
                        onClick={() => {
                          navigate(item.to);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                    
                    {isAdmin && (
                      <>
                        <div className="pt-4 pb-2">
                          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("nav.admin")}
                          </p>
                        </div>
                        
                        {adminSubItems.map((item) => (
                          <Button
                            key={item.to}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-2 pl-6",
                              location.pathname === item.to && "bg-muted"
                            )}
                            onClick={() => {
                              navigate(item.to);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        ))}
                      </>
                    )}
                    
                    <div className="pt-6 border-t space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          navigate("/settings");
                          setMobileMenuOpen(false);
                        }}
                      >
                      <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={async () => {
                          try {
                            await signOut();
                            setMobileMenuOpen(false);
                            navigate("/");
                          } catch (error) {
                            console.error("Sign out failed:", error);
                          }
                        }}
                      >
                        {t("nav.signOut")}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
