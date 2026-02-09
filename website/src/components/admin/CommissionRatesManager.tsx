import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, TrendingUp, Users, Award, DollarSign } from "lucide-react";
import { useCommissionSettings } from "@/hooks/useCommissionSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CommissionRatesManager = () => {
  const { settings, isLoading, updateSetting } = useCommissionSettings();
  const [savingSettings, setSavingSettings] = useState<Set<string>>(new Set());

  const handleUpdate = async (settingName: string, value: string) => {
    setSavingSettings(prev => new Set(prev).add(settingName));
    try {
      await updateSetting(settingName, parseFloat(value));
    } finally {
      setSavingSettings(prev => {
        const next = new Set(prev);
        next.delete(settingName);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const directSettings = settings.filter(s => s.setting_name.startsWith('direct_'));
  const binarySettings = settings.filter(s => s.setting_name.includes('binary'));
  const overrideSettings = settings.filter(s => s.setting_name.startsWith('override_'));
  const poolSettings = settings.filter(s => s.setting_name.includes('pool') || s.setting_name.includes('cap'));

  const renderSettingCard = (setting: typeof settings[0], icon: React.ReactNode) => (
    <Card key={setting.id} className="bg-gradient-to-br from-card to-secondary border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">
            {setting.description || setting.setting_name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              step="0.1"
              min={setting.min_value}
              max={setting.max_value}
              defaultValue={setting.setting_value}
              id={setting.setting_name}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => {
                const input = document.getElementById(setting.setting_name) as HTMLInputElement;
                handleUpdate(setting.setting_name, input.value);
              }}
              disabled={savingSettings.has(setting.setting_name)}
            >
              {savingSettings.has(setting.setting_name) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Range: {setting.min_value}% - {setting.max_value}%
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Rate Configuration</CardTitle>
        <CardDescription>
          Configure dynamic commission rates for the affiliate system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertDescription>
            ⚠️ Changes to commission rates will affect the next commission calculation cycle.
            Current active commissions will use the rates from when they were calculated.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="direct" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="direct">Direct Tiers</TabsTrigger>
            <TabsTrigger value="binary">Binary</TabsTrigger>
            <TabsTrigger value="override">Overrides</TabsTrigger>
            <TabsTrigger value="pools">Pool Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {directSettings.map(setting => 
                renderSettingCard(setting, <Users className="h-4 w-4 text-blue-500" />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="binary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {binarySettings.map(setting => 
                renderSettingCard(setting, <TrendingUp className="h-4 w-4 text-green-500" />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="override" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {overrideSettings.map(setting => 
                renderSettingCard(setting, <Award className="h-4 w-4 text-amber-500" />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="pools" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {poolSettings.map(setting => 
                renderSettingCard(setting, <DollarSign className="h-4 w-4 text-purple-500" />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
