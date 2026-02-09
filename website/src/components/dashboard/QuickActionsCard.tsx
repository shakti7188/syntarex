import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  Calculator, 
  Coins, 
  TrendingUp,
  Settings
} from "lucide-react";

export const QuickActionsCard = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Buy Packages",
      icon: Package,
      path: "/mining/buy",
      variant: "default" as const,
    },
    {
      label: "ROI Calculator",
      icon: Calculator,
      path: "/mining/roi",
      variant: "outline" as const,
    },
    {
      label: "XFLOW Token",
      icon: Coins,
      path: "/token-info",
      variant: "outline" as const,
    },
    {
      label: "My Earnings",
      icon: TrendingUp,
      path: "/earnings",
      variant: "outline" as const,
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => navigate(action.path)}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
