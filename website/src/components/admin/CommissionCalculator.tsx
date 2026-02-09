import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CalculationSummary {
  weekStart: string;
  salesVolume: number;
  poolLimits: {
    globalCap: number;
    binaryPool: number;
    directPool: number;
    overridePool: number;
  };
  unscaledTotals: {
    direct: number;
    binary: number;
    override: number;
    total: number;
  };
  scaleFactors: {
    direct: number;
    binary: number;
    override: number;
    global: number;
  };
  finalTotals: {
    direct: number;
    binary: number;
    override: number;
    total: number;
  };
  usersProcessed: number;
}

export function CommissionCalculator() {
  const [weekStart, setWeekStart] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [summary, setSummary] = useState<CalculationSummary | null>(null);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!weekStart) {
      toast({
        title: "Week Required",
        description: "Please select a week start date",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('commission-engine', {
        body: { weekStart, persist: true }
      });

      if (error) throw error;

      if (data.success) {
        setSummary(data.output.summary);
        toast({
          title: "Calculation Complete",
          description: `Processed ${data.output.settlements.length} settlements successfully`,
        });
      } else {
        throw new Error(data.error || 'Calculation failed');
      }
    } catch (error: any) {
      console.error('Calculation error:', error);
      toast({
        title: "Calculation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Commission Calculator
          </CardTitle>
          <CardDescription>
            Calculate weekly commissions with deterministic scaling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekStart">Week Start Date</Label>
            <Input
              id="weekStart"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              disabled={isCalculating}
            />
          </div>

          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating || !weekStart}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Commissions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Calculation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Week Start</p>
                  <p className="text-lg font-semibold">{summary.weekStart}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sales Volume</p>
                  <p className="text-lg font-semibold">{formatCurrency(summary.salesVolume)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Settlements Generated</p>
                  <p className="text-lg font-semibold">{summary.usersProcessed || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Global Cap</p>
                  <p className="text-lg font-semibold">{formatCurrency(summary.poolLimits.globalCap)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pool Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Direct Pool (20%)</p>
                  <p className="font-semibold">{formatCurrency(summary.poolLimits.directPool)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Binary Pool (17%)</p>
                  <p className="font-semibold">{formatCurrency(summary.poolLimits.binaryPool)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Override Pool (3%)</p>
                  <p className="font-semibold">{formatCurrency(summary.poolLimits.overridePool)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unscaled Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Direct Commissions</span>
                  <span className="font-semibold">{formatCurrency(summary.unscaledTotals.direct)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Binary Commissions</span>
                  <span className="font-semibold">{formatCurrency(summary.unscaledTotals.binary)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Override Commissions</span>
                  <span className="font-semibold">{formatCurrency(summary.unscaledTotals.override)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-semibold">Total Unscaled</span>
                  <span className="font-bold text-lg">{formatCurrency(summary.unscaledTotals.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {summary.scaleFactors.global < 1 ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                Scale Factors Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Direct Pool Factor</span>
                  <span className={`font-semibold ${summary.scaleFactors.direct < 1 ? 'text-orange-500' : 'text-green-500'}`}>
                    {formatPercent(summary.scaleFactors.direct)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Binary Pool Factor</span>
                  <span className={`font-semibold ${summary.scaleFactors.binary < 1 ? 'text-orange-500' : 'text-green-500'}`}>
                    {formatPercent(summary.scaleFactors.binary)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Override Pool Factor</span>
                  <span className={`font-semibold ${summary.scaleFactors.override < 1 ? 'text-orange-500' : 'text-green-500'}`}>
                    {formatPercent(summary.scaleFactors.override)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-semibold">Global Cap Factor</span>
                  <span className={`font-bold ${summary.scaleFactors.global < 1 ? 'text-orange-500' : 'text-green-500'}`}>
                    {formatPercent(summary.scaleFactors.global)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Final Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Direct Commissions</span>
                  <span className="font-semibold">{formatCurrency(summary.finalTotals.direct)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Binary Commissions</span>
                  <span className="font-semibold">{formatCurrency(summary.finalTotals.binary)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Override Commissions</span>
                  <span className="font-semibold">{formatCurrency(summary.finalTotals.override)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-bold">Total Payout</span>
                  <span className="font-bold text-xl text-primary">{formatCurrency(summary.finalTotals.total)}</span>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {formatPercent(summary.finalTotals.total / summary.salesVolume)} of Sales Volume
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
