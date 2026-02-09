import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useAllocationSettings } from "@/hooks/useAllocationSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const SETTING_LABELS: Record<string, { label: string; description: string; color: string; bgColor: string; icon: string }> = {
  affiliate_network: {
    label: "Affiliate Network",
    description: "Share allocated to affiliate reward pool (direct, binary, overrides)",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "👥",
  },
  btc_mining_machines: {
    label: "BTC Generated from Mining Machines",
    description: "BTC generated directly from mining sites before redistribution",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "⛏️",
  },
  core_team: {
    label: "Core Team",
    description: "Internal allocation for operations, development, and reserves",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/20 border-slate-200 dark:border-slate-800",
    icon: "👔",
  },
  investor_returns: {
    label: "Investor Returns",
    description: "BTC share redistributed to investors and machine purchasers",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800",
    icon: "💰",
  },
};

export const AllocationSettingsManager = () => {
  const { settings, isLoading, updateSetting, getTotalAllocation } = useAllocationSettings();
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (settings.length > 0) {
      const data: Record<string, number> = {};
      settings.forEach(setting => {
        data[setting.id] = parseFloat(setting.value.toString());
      });
      setFormData(data);
    }
  }, [settings]);

  const handleUpdate = async (id: string) => {
    setIsSaving(id);
    try {
      await updateSetting(id, formData[id]);
    } finally {
      setIsSaving(null);
    }
  };

  const handleChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [id]: numValue }));
  };

  const totalAllocation = getTotalAllocation();
  const latestUpdate = settings.length > 0 
    ? new Date(Math.max(...settings.map(s => new Date(s.updated_at).getTime())))
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>BTC Allocation Settings</CardTitle>
        <CardDescription>
          Configure individual BTC allocation percentages - Total must equal 100%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Warning Alert */}
          {totalAllocation > 100 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                🔴 Allocation exceeds total BTC available. Current total: {totalAllocation.toFixed(2)}%
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Allocation</span>
              <span className={`font-bold ${totalAllocation === 100 ? 'text-green-600' : totalAllocation > 100 ? 'text-destructive' : 'text-amber-600'}`}>
                {totalAllocation.toFixed(2)}%
              </span>
            </div>
            <Progress 
              value={Math.min(totalAllocation, 100)} 
              className={`h-3 ${totalAllocation > 100 ? '[&>div]:bg-destructive' : totalAllocation === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {totalAllocation === 100 ? '✅ Perfectly balanced' : totalAllocation > 100 ? '⚠️ Over-allocated' : '⚠️ Under-allocated'}
              </span>
              {latestUpdate && (
                <span>Last updated: {latestUpdate.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Allocation Cards */}
          <div className="grid gap-6">
            {settings.map((setting) => {
              const info = SETTING_LABELS[setting.name];
              const hasChanges = formData[setting.id] !== parseFloat(setting.value.toString());

              if (!info) return null;

              return (
                <Card key={setting.id} className={`border-2 ${info.bgColor}`}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{info.icon}</span>
                          <div>
                            <Label htmlFor={setting.id} className={`text-base font-semibold ${info.color}`}>
                              {info.label}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
                          </div>
                        </div>
                        <span className={`text-3xl font-bold ${info.color}`}>
                          {formData[setting.id]?.toFixed(2) ?? setting.value}%
                        </span>
                      </div>
                      
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Input
                            id={setting.id}
                            type="number"
                            min={setting.min_value ?? 0}
                            max={setting.max_value ?? 100}
                            step="0.01"
                            value={formData[setting.id] ?? setting.value}
                            onChange={(e) => handleChange(setting.id, e.target.value)}
                            className="text-lg font-semibold"
                          />
                          {setting.min_value !== null && setting.max_value !== null && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Range: {setting.min_value}% - {setting.max_value}%
                            </p>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleUpdate(setting.id)}
                          disabled={!hasChanges || isSaving === setting.id}
                          className="min-w-[100px]"
                        >
                          {isSaving === setting.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving
                            </>
                          ) : (
                            'Save'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
