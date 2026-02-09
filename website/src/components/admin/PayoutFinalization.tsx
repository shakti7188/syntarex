import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Calculator, Check, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface CalculationResult {
  weekStart: string;
  status: string;
  totals: {
    sv: string;
    tDir: string;
    tBin: string;
    tOv: string;
    total: string;
    payoutRatio: number;
    globalScaleFactor: string;
  };
}

interface FinalizationResult {
  weekStart: string;
  merkleRoot: string;
  totalUsers: number;
  totalAmount: string;
  settlementsFinalized: number;
}

export const PayoutFinalization = () => {
  const [weekStart, setWeekStart] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), "yyyy-MM-dd")
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [finalizationResult, setFinalizationResult] = useState<FinalizationResult | null>(null);

  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      setCalculationResult(null);

      const { data, error } = await supabase.functions.invoke("api-admin-payouts-calculate", {
        body: { weekStart },
      });

      if (error) throw error;

      setCalculationResult(data);
      toast({
        title: "Calculation Complete",
        description: `Calculated $${data.totals.total} in commissions for week ${weekStart}`,
      });
    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        title: "Calculation Failed",
        description: error instanceof Error ? error.message : "Failed to calculate commissions",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setIsFinalizing(true);
      setFinalizationResult(null);

      const { data, error } = await supabase.functions.invoke("api-admin-payouts-finalize", {
        body: { weekStart },
      });

      if (error) throw error;

      setFinalizationResult(data);
      toast({
        title: "Finalization Complete! 🎉",
        description: `Finalized ${data.settlementsFinalized} settlements. Users can now claim their payouts.`,
      });
    } catch (error) {
      console.error("Finalization error:", error);
      toast({
        title: "Finalization Failed",
        description: error instanceof Error ? error.message : "Failed to finalize payouts",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Payout Management</CardTitle>
          <CardDescription>
            Calculate commissions and finalize weekly payouts for distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Week Selection */}
          <div className="space-y-2">
            <Label htmlFor="weekStart">Week Start Date</Label>
            <Input
              id="weekStart"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Select the Monday of the week to process
            </p>
          </div>

          {/* Step 1: Calculate */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="outline">Step 1</Badge>
              Calculate Commissions
            </h3>
            <p className="text-sm text-muted-foreground">
              Run commission calculations for all users based on the week's transactions
            </p>
            <Button
              onClick={handleCalculate}
              disabled={isCalculating || !weekStart}
              className="w-full sm:w-auto"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Commissions
                </>
              )}
            </Button>
          </div>

          {/* Calculation Results */}
          {calculationResult && (
            <Alert className="border-accent bg-accent/5">
              <Check className="h-4 w-4 text-accent" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Calculation Complete for {calculationResult.weekStart}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Direct Commissions:</div>
                    <div className="font-mono">${calculationResult.totals.tDir}</div>
                    <div>Binary Commissions:</div>
                    <div className="font-mono">${calculationResult.totals.tBin}</div>
                    <div>Override Commissions:</div>
                    <div className="font-mono">${calculationResult.totals.tOv}</div>
                    <div className="font-semibold">Total Payout:</div>
                    <div className="font-mono font-semibold text-accent">${calculationResult.totals.total}</div>
                    <div>Global Scale Factor:</div>
                    <div className="font-mono">{calculationResult.totals.globalScaleFactor}</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Step 2: Finalize */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="outline">Step 2</Badge>
              Finalize & Generate Merkle Tree
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate Merkle tree and mark settlements as ready for users to claim
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This action marks settlements as READY_TO_CLAIM.
                Ensure you've funded the smart contract before finalizing.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleFinalize}
              disabled={isFinalizing || !calculationResult || !weekStart}
              variant="default"
              className="w-full sm:w-auto bg-accent hover:bg-accent/90"
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Finalize Payouts
                </>
              )}
            </Button>
          </div>

          {/* Finalization Results */}
          {finalizationResult && (
            <Alert className="border-green-500 bg-green-500/5">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-500">Finalization Complete! 🎉</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Week:</div>
                    <div className="font-mono">{finalizationResult.weekStart}</div>
                    <div>Settlements Finalized:</div>
                    <div className="font-mono">{finalizationResult.settlementsFinalized}</div>
                    <div>Total Amount:</div>
                    <div className="font-mono text-accent">${finalizationResult.totalAmount}</div>
                    <div>Total Users:</div>
                    <div className="font-mono">{finalizationResult.totalUsers}</div>
                    <div>Merkle Root:</div>
                    <div className="font-mono text-xs break-all">
                      {finalizationResult.merkleRoot.slice(0, 20)}...
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Users can now claim their settlements on-chain using their wallet
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
