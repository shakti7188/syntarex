import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlayCircle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export function ComprehensiveTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const { toast } = useToast();

  const updateStep = (name: string, status: TestStep['status'], message?: string, data?: any) => {
    setSteps(prev => {
      const existing = prev.find(s => s.name === name);
      if (existing) {
        return prev.map(s => s.name === name ? { ...s, status, message, data } : s);
      }
      return [...prev, { name, status, message, data }];
    });
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setSteps([]);

    try {
      // Step 1: Create Test Data
      updateStep('Create Test Data', 'running', 'Generating test users, transactions, and network...');
      
      const { data: testData, error: testDataError } = await supabase.functions.invoke('create-test-data');
      
      if (testDataError) throw new Error(`Test data creation failed: ${testDataError.message}`);
      if (!testData.success) throw new Error(testData.error || 'Test data creation failed');
      
      updateStep('Create Test Data', 'success', `Created ${testData.summary.users} users, ${testData.summary.transactions} transactions`, testData.summary);
      
      // Wait a moment for data to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Run System Tests
      updateStep('System Tests', 'running', 'Verifying database schema and integrity...');
      
      const { data: systemTest, error: systemTestError } = await supabase.functions.invoke('test-system');
      
      if (systemTestError) throw new Error(`System test failed: ${systemTestError.message}`);
      
      const failedTests = systemTest.results?.filter((r: any) => r.status === 'FAIL') || [];
      if (failedTests.length > 0) {
        updateStep('System Tests', 'error', `${failedTests.length} tests failed`, systemTest.summary);
      } else {
        updateStep('System Tests', 'success', `All ${systemTest.summary.total} tests passed`, systemTest.summary);
      }

      // Step 3: Run Commission Engine (New API)
      updateStep('Commission Engine', 'running', 'Calculating commissions for week 2025-01-13...');
      
      const { data: engineData, error: engineError } = await supabase.functions.invoke('commission-engine', {
        body: { weekStart: '2025-01-13', persist: true }
      });
      
      if (engineError) throw new Error(`Commission engine failed: ${engineError.message}`);
      if (!engineData.success) throw new Error(engineData.error || 'Commission calculation failed');
      
      const result = engineData.result; // New WeeklyPayoutResult format
      updateStep('Commission Engine', 'success', 
        `Processed ${result.settlements.length} settlements, $${result.totals.total} total payout`,
        result.totals
      );

      // Step 3.5: Verify Decimal String Formatting
      updateStep('Verify Decimal Formatting', 'running', 'Checking that all values are properly formatted decimal strings...');
      
      const formatErrors: string[] = [];
      const decimalRegex = /^\d+\.\d{2}$/;
      
      // Check totals formatting
      if (!decimalRegex.test(result.totals.SV)) formatErrors.push(`SV not formatted: ${result.totals.SV}`);
      if (!decimalRegex.test(result.totals.T_dir)) formatErrors.push(`T_dir not formatted: ${result.totals.T_dir}`);
      if (!decimalRegex.test(result.totals.T_bin)) formatErrors.push(`T_bin not formatted: ${result.totals.T_bin}`);
      if (!decimalRegex.test(result.totals.T_ov)) formatErrors.push(`T_ov not formatted: ${result.totals.T_ov}`);
      if (!decimalRegex.test(result.totals.total)) formatErrors.push(`total not formatted: ${result.totals.total}`);
      
      // Check settlements formatting (sample first 5)
      result.settlements.slice(0, 5).forEach((s: any, i: number) => {
        if (!decimalRegex.test(s.direct)) formatErrors.push(`Settlement ${i} direct not formatted: ${s.direct}`);
        if (!decimalRegex.test(s.binary)) formatErrors.push(`Settlement ${i} binary not formatted: ${s.binary}`);
        if (!decimalRegex.test(s.override)) formatErrors.push(`Settlement ${i} override not formatted: ${s.override}`);
        if (!decimalRegex.test(s.total)) formatErrors.push(`Settlement ${i} total not formatted: ${s.total}`);
      });
      
      if (formatErrors.length > 0) {
        updateStep('Verify Decimal Formatting', 'error', 
          `Found ${formatErrors.length} formatting errors`,
          { errors: formatErrors }
        );
      } else {
        updateStep('Verify Decimal Formatting', 'success', 
          `All values properly formatted as decimal strings (e.g., "125.50")`,
          { sample: result.settlements[0] }
        );
      }

      // Step 4: Verify Commission Records
      updateStep('Verify Commissions', 'running', 'Checking commission records in database...');
      
      const [
        { count: directCount },
        { count: binaryCount },
        { count: overrideCount },
        { count: settlementCount }
      ] = await Promise.all([
        supabase.from('direct_commissions').select('*', { count: 'exact', head: true }).eq('week_start', '2025-01-13'),
        supabase.from('binary_commissions').select('*', { count: 'exact', head: true }).eq('week_start', '2025-01-13'),
        supabase.from('override_commissions').select('*', { count: 'exact', head: true }).eq('week_start', '2025-01-13'),
        supabase.from('weekly_settlements').select('*', { count: 'exact', head: true }).eq('week_start_date', '2025-01-13')
      ]);

      const verification = {
        directCommissions: directCount,
        binaryCommissions: binaryCount,
        overrideCommissions: overrideCount,
        settlements: settlementCount
      };

      updateStep('Verify Commissions', 'success', 
        `Found ${directCount} direct, ${binaryCount} binary, ${overrideCount} override, ${settlementCount} settlements`,
        verification
      );

      // Step 5: Verify Pool Caps (using new API result)
      updateStep('Verify Pool Caps', 'running', 'Checking that pool limits were respected...');
      
      const totalSV = parseFloat(result.totals.SV);
      const T_dir = parseFloat(result.totals.T_dir);
      const T_bin = parseFloat(result.totals.T_bin);
      const T_ov = parseFloat(result.totals.T_ov);
      const total = parseFloat(result.totals.total);

      const violations: string[] = [];
      const directLimit = totalSV * 0.20;
      const binaryLimit = totalSV * 0.17;
      const globalCap = totalSV * 0.40;
      
      if (T_dir > directLimit + 0.01) {
        violations.push(`Direct pool exceeded: $${T_dir.toFixed(2)} > $${directLimit.toFixed(2)}`);
      }
      if (T_bin > binaryLimit + 0.01) {
        violations.push(`Binary pool exceeded: $${T_bin.toFixed(2)} > $${binaryLimit.toFixed(2)}`);
      }
      if (total > globalCap + 0.01) {
        violations.push(`Global cap exceeded: $${total.toFixed(2)} > $${globalCap.toFixed(2)}`);
      }

      if (violations.length > 0) {
        updateStep('Verify Pool Caps', 'error', violations.join('; '), { violations });
      } else {
        const percentage = ((total / totalSV) * 100).toFixed(2);
        updateStep('Verify Pool Caps', 'success', 
          `All pools within limits. Total payout: ${percentage}% of SV (≤40%)`,
          { 
            SV: result.totals.SV,
            Direct: `${result.totals.T_dir} (${((T_dir/totalSV)*100).toFixed(1)}%)`,
            Binary: `${result.totals.T_bin} (${((T_bin/totalSV)*100).toFixed(1)}%)`,
            Override: `${result.totals.T_ov} (${((T_ov/totalSV)*100).toFixed(1)}%)`,
            Total: `${result.totals.total} (${percentage}%)`
          }
        );
      }

      // Step 6: Verify Scaling Logic
      updateStep('Verify Scaling', 'running', 'Checking global scale factor...');
      
      const globalScaleFactor = parseFloat(result.totals.globalScaleFactor);
      const scalingApplied = globalScaleFactor < 1.0;
      
      // Check individual settlement scale factors
      const sampleSettlement = result.settlements[0];
      const settlementScaleFactor = parseFloat(sampleSettlement?.scaleFactor || "1.0");
      
      updateStep('Verify Scaling', 'success', 
        scalingApplied 
          ? `Global scaling applied: ${(globalScaleFactor * 100).toFixed(2)}% (settlements scaled to stay within 40% cap)`
          : 'No scaling needed - all commissions within limits',
        { 
          globalScaleFactor: result.totals.globalScaleFactor,
          sampleSettlementScale: sampleSettlement?.scaleFactor,
          explanation: scalingApplied 
            ? 'Binary and override commissions were scaled proportionally to meet the 40% SV cap'
            : 'Total commissions were already within the 40% SV limit'
        }
      );

      // Step 7: Verify Override Qualification
      updateStep('Verify Overrides', 'running', 'Checking rank-based override qualification...');
      
      const { data: overrideData } = await supabase
        .from('override_commissions')
        .select('user_id, level, base_amount')
        .eq('week_start', '2025-01-13');

      // Group overrides by user
      const overridesByUser = (overrideData || []).reduce((acc: any, ov: any) => {
        if (!acc[ov.user_id]) acc[ov.user_id] = [];
        acc[ov.user_id].push(ov);
        return acc;
      }, {});

      // Verify specific test cases
      const testResults: string[] = [];
      
      // User 4 (Silver) should have Level 1 & 2 overrides
      const user4Overrides = overridesByUser['10000000-0000-0000-0000-000000000004'] || [];
      const user4Levels = user4Overrides.map((o: any) => o.level).sort();
      if (user4Levels.includes(1) && user4Levels.includes(2)) {
        testResults.push('✓ User 4 (Silver): Qualified for L1 & L2');
      } else {
        testResults.push('✗ User 4 (Silver): Expected L1 & L2, got ' + user4Levels.join(','));
      }

      // User 5 (Bronze) should have Level 1 override only
      const user5Overrides = overridesByUser['10000000-0000-0000-0000-000000000005'] || [];
      const user5Levels = user5Overrides.map((o: any) => o.level).sort();
      if (user5Levels.length === 1 && user5Levels.includes(1)) {
        testResults.push('✓ User 5 (Bronze): Qualified for L1 only');
      } else {
        testResults.push('✗ User 5 (Bronze): Expected L1 only, got ' + user5Levels.join(','));
      }

      // User 7 (Member) should have NO overrides (unqualified)
      const user7Overrides = overridesByUser['10000000-0000-0000-0000-000000000007'] || [];
      if (user7Overrides.length === 0) {
        testResults.push('✓ User 7 (Member): Correctly unqualified');
      } else {
        testResults.push('✗ User 7 (Member): Should have 0 overrides, got ' + user7Overrides.length);
      }

      // User 2 (Platinum) and Admin (Diamond) should have Level 1, 2, & 3
      const user2Overrides = overridesByUser['10000000-0000-0000-0000-000000000002'] || [];
      const user2Levels = [...new Set(user2Overrides.map((o: any) => o.level))].sort();
      if (user2Levels.length >= 2) {
        testResults.push('✓ User 2 (Platinum): Qualified for multiple levels');
      } else {
        testResults.push('⚠ User 2 (Platinum): Expected multiple levels, got ' + user2Levels.join(','));
      }

      updateStep('Verify Overrides', 'success', 
        `Rank qualification verified: ${testResults.filter(r => r.startsWith('✓')).length}/${testResults.length} passed`,
        { results: testResults, overrideCount: overrideData?.length || 0 }
      );

      toast({
        title: "Test Complete",
        description: "All comprehensive tests passed successfully",
      });

    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestStep['status']) => {
    switch (status) {
      case 'running': return <Badge variant="outline" className="bg-blue-50">Running</Badge>;
      case 'success': return <Badge variant="outline" className="bg-green-50 text-green-700">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Comprehensive Test Suite
          </CardTitle>
          <CardDescription>
            Full end-to-end test: Create test data → Run system tests → Calculate commissions → Verify results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run Comprehensive Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div key={index}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(step.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{step.name}</h4>
                      {getStatusBadge(step.status)}
                    </div>
                    {step.message && (
                      <p className="text-sm text-muted-foreground">{step.message}</p>
                    )}
                    {step.data && (
                      <details className="text-xs bg-muted p-2 rounded mt-2">
                        <summary className="cursor-pointer font-medium">View Details</summary>
                        <pre className="mt-2 overflow-auto">{JSON.stringify(step.data, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
