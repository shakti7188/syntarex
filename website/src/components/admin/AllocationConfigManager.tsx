import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Info } from "lucide-react";
import { useAllocationConfig } from "@/hooks/useAllocationConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AllocationConfigManager = () => {
  const { config, isLoading, updateConfig } = useAllocationConfig();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    affiliate_network_pct: 35,
    btc_mining_machines_pct: 20,
    core_team_pct: 7,
    investor_returns_pct: 38,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        affiliate_network_pct: config.affiliate_network_pct,
        btc_mining_machines_pct: config.btc_mining_machines_pct,
        core_team_pct: config.core_team_pct,
        investor_returns_pct: config.investor_returns_pct,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateConfig(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const totalAllocation = Object.values(formData).reduce((sum, val) => sum + val, 0);

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
        <CardTitle>BTC Allocation Configuration</CardTitle>
        <CardDescription>
          Configure real-time BTC allocation percentages for the hybrid mining and tokenization model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Total allocation: <strong>{totalAllocation.toFixed(1)}%</strong>
              {config && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Last updated: {new Date(config.updated_at).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Affiliate Network Allocation */}
            <div className="space-y-2">
              <Label htmlFor="affiliate">
                Affiliate Network Allocation
                <span className="ml-2 text-xs text-muted-foreground">(30-40%)</span>
              </Label>
              <Input
                id="affiliate"
                type="number"
                step="0.1"
                min="30"
                max="40"
                value={formData.affiliate_network_pct}
                onChange={(e) => handleChange('affiliate_network_pct', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Share allocated to affiliate reward pool (direct, binary, overrides)
              </p>
            </div>

            {/* BTC Mining Machines */}
            <div className="space-y-2">
              <Label htmlFor="mining">
                BTC Generated from Mining Machines
                <span className="ml-2 text-xs text-muted-foreground">(15-25%)</span>
              </Label>
              <Input
                id="mining"
                type="number"
                step="0.1"
                min="15"
                max="25"
                value={formData.btc_mining_machines_pct}
                onChange={(e) => handleChange('btc_mining_machines_pct', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                BTC generated directly from mining sites before redistribution
              </p>
            </div>

            {/* Core Team Allocation */}
            <div className="space-y-2">
              <Label htmlFor="team">
                Core Team Allocation
                <span className="ml-2 text-xs text-muted-foreground">(5-10%)</span>
              </Label>
              <Input
                id="team"
                type="number"
                step="0.1"
                min="5"
                max="10"
                value={formData.core_team_pct}
                onChange={(e) => handleChange('core_team_pct', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Internal allocation for operations, development, and reserves
              </p>
            </div>

            {/* Investor Returns */}
            <div className="space-y-2">
              <Label htmlFor="investor">
                Investor Returns
                <span className="ml-2 text-xs text-muted-foreground">(35-40%)</span>
              </Label>
              <Input
                id="investor"
                type="number"
                step="0.1"
                min="35"
                max="40"
                value={formData.investor_returns_pct}
                onChange={(e) => handleChange('investor_returns_pct', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                BTC share redistributed to investors and machine purchasers
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
