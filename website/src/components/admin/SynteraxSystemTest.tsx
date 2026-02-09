import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Play, Database, Cpu, Gift, Layout, Shield } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface PhaseResult {
  phase: number;
  name: string;
  tests: TestResult[];
  passed: boolean;
}

interface TestResponse {
  success: boolean;
  summary: {
    totalPhases: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: string;
  };
  phases: PhaseResult[];
}

const phaseIcons: Record<number, React.ReactNode> = {
  1: <Database className="h-4 w-4" />,
  2: <Cpu className="h-4 w-4" />,
  3: <Gift className="h-4 w-4" />,
  4: <Layout className="h-4 w-4" />,
  5: <Shield className="h-4 w-4" />,
};

const phaseDescriptions: Record<number, string> = {
  1: "Database schema, tables, and configuration",
  2: "Commission engine, referral chains, Ghost BV",
  3: "Premium package 100% L1 bonus system",
  4: "Frontend component data accessibility",
  5: "40% cap, Ghost BV flush, weekly limits",
};

export function SynteraxSystemTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [results, setResults] = useState<TestResponse | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const runTests = async (phase?: number) => {
    setIsRunning(true);
    setSelectedPhase(phase ?? null);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('synterax-test-suite', {
        body: phase ? { phase } : {}
      });

      if (error) throw error;

      setResults(data);
      
      // Auto-expand all phases
      setExpandedPhases(new Set(data.phases.map((p: PhaseResult) => p.phase)));

      toast({
        title: data.success ? "All Tests Passed!" : "Some Tests Failed",
        description: `${data.summary.passedTests}/${data.summary.totalTests} tests passed (${data.summary.passRate})`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Failed to run tests",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const togglePhase = (phase: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Synterax System Test Suite
        </CardTitle>
        <CardDescription>
          Comprehensive testing for all 5 phases of the Synterax compensation system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => runTests()}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning && !selectedPhase ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run All Tests
          </Button>
          
          {[1, 2, 3, 4, 5].map(phase => (
            <Button
              key={phase}
              variant="outline"
              size="sm"
              onClick={() => runTests(phase)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning && selectedPhase === phase ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                phaseIcons[phase]
              )}
              Phase {phase}
            </Button>
          ))}
        </div>

        {/* Summary */}
        {results && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {results.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-semibold">
                  {results.success ? "All Tests Passed" : "Some Tests Failed"}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Phases: <strong>{results.summary.totalPhases}</strong>
                </span>
                <span className="text-green-600">
                  Passed: <strong>{results.summary.passedTests}</strong>
                </span>
                <span className="text-destructive">
                  Failed: <strong>{results.summary.failedTests}</strong>
                </span>
                <Badge variant={results.success ? "default" : "destructive"}>
                  {results.summary.passRate}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Phase Results */}
        {results?.phases.map(phase => (
          <Collapsible
            key={phase.phase}
            open={expandedPhases.has(phase.phase)}
            onOpenChange={() => togglePhase(phase.phase)}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  {phaseIcons[phase.phase]}
                  <div>
                    <span className="font-medium">Phase {phase.phase}: {phase.name}</span>
                    <p className="text-xs text-muted-foreground">{phaseDescriptions[phase.phase]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={phase.passed ? "default" : "destructive"}>
                    {phase.tests.filter(t => t.passed).length}/{phase.tests.length}
                  </Badge>
                  {expandedPhases.has(phase.phase) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 pl-4">
                {phase.tests.map((test, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded border bg-background"
                  >
                    {test.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">{test.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{test.message}</p>
                      {test.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-primary cursor-pointer">View Details</summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        {/* Instructions */}
        {!results && !isRunning && (
          <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
            <h4 className="font-medium mb-2">Test Coverage:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Phase 1:</strong> Database schema - ranks, caps, Ghost BV, staking tables</li>
              <li><strong>Phase 2:</strong> Commission engine - direct/binary/override calculations</li>
              <li><strong>Phase 3:</strong> Premium bonus - 100% L1 on $2500+ packages</li>
              <li><strong>Phase 4:</strong> Frontend data - widget data accessibility</li>
              <li><strong>Phase 5:</strong> Safety valves - caps, flushes, limits</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
