import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save } from "lucide-react";
import { SystemTest } from "./SystemTest";
import { CommissionCalculator } from "./CommissionCalculator";
import { ComprehensiveTest } from "./ComprehensiveTest";
import { AllocationConfigManager } from "./AllocationConfigManager";
import { AllocationSettingsManager } from "./AllocationSettingsManager";

export const AdminSettings = () => {
  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="allocation">BTC Allocation</TabsTrigger>
        <TabsTrigger value="settings">Allocation Settings</TabsTrigger>
        <TabsTrigger value="comprehensive">Comprehensive Test</TabsTrigger>
        <TabsTrigger value="calculator">Calculator</TabsTrigger>
        <TabsTrigger value="test">System Tests</TabsTrigger>
      </TabsList>

      <TabsContent value="config">
        <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Commission Configuration</h3>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Direct L1 Rate (%)</Label>
              <Input type="number" defaultValue="10" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Direct L2 Rate (%)</Label>
              <Input type="number" defaultValue="5" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Direct L3 Rate (%)</Label>
              <Input type="number" defaultValue="3" className="bg-secondary border-border" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Binary Weak Leg Rate (%)</Label>
              <Input type="number" defaultValue="10" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Binary Cap (% of total)</Label>
              <Input type="number" defaultValue="17" className="bg-secondary border-border" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Override L1 Rate (%)</Label>
              <Input type="number" defaultValue="1.5" step="0.1" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Override L2 Rate (%)</Label>
              <Input type="number" defaultValue="1.0" step="0.1" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Override L3 Rate (%)</Label>
              <Input type="number" defaultValue="0.5" step="0.1" className="bg-secondary border-border" />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Total Payout Cap (%)</Label>
                  <p className="text-sm text-muted-foreground">Maximum percentage of revenue paid as commissions</p>
                </div>
                <Input type="number" defaultValue="40" className="w-24 bg-secondary border-border" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Carry-Forward Multiplier</Label>
                  <p className="text-sm text-muted-foreground">Multiple of average weak leg for carry-forward cap</p>
                </div>
                <Input type="number" defaultValue="5" className="w-24 bg-secondary border-border" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Inactivity Flush (weeks)</Label>
                  <p className="text-sm text-muted-foreground">Weeks before carry-forward is flushed</p>
                </div>
                <Input type="number" defaultValue="8" className="w-24 bg-secondary border-border" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold mb-6">Rank Configuration</h3>
        
        <div className="space-y-4">
          {["Bronze", "Silver", "Gold", "Platinum", "Diamond"].map((rank, i) => (
            <div key={i} className="p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Rank Name</Label>
                    <Input defaultValue={rank} className="bg-background border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min Volume ($)</Label>
                    <Input type="number" defaultValue={(i + 1) * 10000} className="bg-background border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min Direct Refs</Label>
                    <Input type="number" defaultValue={(i + 1) * 5} className="bg-background border-border" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold mb-6">Payout Options</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
            <div>
              <Label>Enable USDT Payouts</Label>
              <p className="text-sm text-muted-foreground">Allow users to receive commissions in USDT</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
            <div>
              <Label>Enable MUSD Payouts</Label>
              <p className="text-sm text-muted-foreground">Allow users to receive commissions in MUSD</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
            <div>
              <Label>Auto-Scaling Safety Valve</Label>
              <p className="text-sm text-muted-foreground">Automatically reduce commissions if cap is exceeded</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>
        </div>
      </TabsContent>

      <TabsContent value="allocation">
        <AllocationConfigManager />
      </TabsContent>

      <TabsContent value="settings">
        <AllocationSettingsManager />
      </TabsContent>

      <TabsContent value="comprehensive">
        <ComprehensiveTest />
      </TabsContent>

      <TabsContent value="calculator">
        <CommissionCalculator />
      </TabsContent>

      <TabsContent value="test">
        <SystemTest />
      </TabsContent>
    </Tabs>
  );
};