import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllocationSettings } from "@/hooks/useAllocationSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SETTING_LABELS: Record<string, { label: string; description: string; color: string; bgColor: string; icon: string }> = {
  affiliate_network: {
    label: "Affiliate Network",
    description: "Percentage allocated to the affiliate network",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "👥",
  },
  btc_mining_machines: {
    label: "BTC Generated from Mining Machines",
    description: "Percentage allocated from BTC mining operations",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "⛏️",
  },
  core_team: {
    label: "Core Team",
    description: "Percentage allocated to the core team",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/20 border-slate-200 dark:border-slate-800",
    icon: "👔",
  },
  investor_returns: {
    label: "Investor Returns",
    description: "Percentage allocated for investor returns",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800",
    icon: "💰",
  },
};

export const PayoutAllocationWidget = () => {
  const { settings, isLoading, getTotalAllocation } = useAllocationSettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout Allocation</CardTitle>
          <CardDescription>Current distribution percentages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalAllocation = getTotalAllocation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Allocation</CardTitle>
        <CardDescription>Current distribution percentages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Alert */}
        {totalAllocation > 100 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              🔴 Allocation exceeds total BTC available. Current total: {totalAllocation}%
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Total Allocation</span>
            <span className={`font-bold ${totalAllocation === 100 ? 'text-green-600' : totalAllocation > 100 ? 'text-destructive' : 'text-amber-600'}`}>
              {totalAllocation}%
            </span>
          </div>
          <Progress 
            value={totalAllocation} 
            className={`h-3 ${totalAllocation > 100 ? '[&>div]:bg-destructive' : totalAllocation === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`}
          />
          <p className="text-xs text-muted-foreground text-center">
            {totalAllocation === 100 ? '✅ Perfectly balanced' : totalAllocation > 100 ? '⚠️ Over-allocated' : '⚠️ Under-allocated'}
          </p>
        </div>

        {/* Allocation Cards */}
        <div className="grid gap-4">
          {settings.map((setting) => {
            const config = SETTING_LABELS[setting.name];
            if (!config) return null;

            return (
              <Card key={setting.id} className={`border-2 ${config.bgColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{config.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${config.color}`}>{config.label}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{config.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${config.color}`}>
                      {setting.value}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
