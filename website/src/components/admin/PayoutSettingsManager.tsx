import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Percent, TrendingUp, Users, DollarSign } from "lucide-react";
import { usePayoutSettings } from "@/hooks/usePayoutSettings";

export const PayoutSettingsManager = () => {
  const { settings, isLoading, updateSetting } = usePayoutSettings();
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  const handleUpdate = async (key: string, value: number) => {
    setSavingKeys(prev => new Set(prev).add(key));
    try {
      await updateSetting(key, value);
    } finally {
      setSavingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const directSettings = settings.filter(s => s.key.startsWith('direct_'));
  const binarySettings = settings.filter(s => s.key.startsWith('binary_'));
  const overrideSettings = settings.filter(s => s.key.startsWith('override_'));
  const globalSettings = settings.filter(s => s.key.startsWith('global_'));

  const renderSettingCard = (setting: typeof settings[0], icon: React.ReactNode) => {
    const [localValue, setLocalValue] = useState(setting.value);
    const isSaving = savingKeys.has(setting.key);
    const hasChanged = localValue !== setting.value;

    return (
      <Card key={setting.key}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-medium">{setting.description}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localValue}
                onChange={(e) => setLocalValue(parseFloat(e.target.value))}
                min={setting.min_value ?? undefined}
                max={setting.max_value ?? undefined}
                step="0.1"
                className="flex-1"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Range: {setting.min_value}% - {setting.max_value}%</span>
              {hasChanged && (
                <Button
                  size="sm"
                  onClick={() => handleUpdate(setting.key, localValue)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
              )}
            </div>
            {setting.updated_at && (
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(setting.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payout Configuration</CardTitle>
          <CardDescription>
            Configure affiliate network payout percentages and caps
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <AlertDescription>
          Changes to payout settings will affect all future commission calculations. Make sure to review carefully before saving.
        </AlertDescription>
      </Alert>

      {/* Direct Referrals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Direct Referrals
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {directSettings.map(s => renderSettingCard(s, <Percent className="h-4 w-4 text-muted-foreground" />))}
        </div>
      </div>

      {/* Binary Payout */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Binary Payout
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {binarySettings.map(s => renderSettingCard(s, <Percent className="h-4 w-4 text-muted-foreground" />))}
        </div>
      </div>

      {/* Overrides */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Override Commissions
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {overrideSettings.map(s => renderSettingCard(s, <Percent className="h-4 w-4 text-muted-foreground" />))}
        </div>
      </div>

      {/* Global Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Global Limits
        </h3>
        <div className="grid gap-4 md:grid-cols-1">
          {globalSettings.map(s => renderSettingCard(s, <Percent className="h-4 w-4 text-muted-foreground" />))}
        </div>
      </div>
    </div>
  );
};
