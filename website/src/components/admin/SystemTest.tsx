import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, PlayCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

interface TestResponse {
  success: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: string;
  };
  results: TestResult[];
  timestamp: string;
}

export const SystemTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResponse | null>(null);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-system');

      if (error) throw error;

      setTestResults(data);
      
      toast({
        title: data.success ? "Tests Passed!" : "Some Tests Failed",
        description: `${data.summary.passed}/${data.summary.total} tests passed (${data.summary.successRate})`,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Test execution error:', error);
      toast({
        title: "Test Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Test Suite</CardTitle>
        <CardDescription>
          Comprehensive testing of database schema, RLS policies, and system integrity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Run Comprehensive Test
              </>
            )}
          </Button>

          {testResults && (
            <div className="flex gap-2">
              <Badge variant={testResults.success ? "default" : "destructive"}>
                {testResults.summary.successRate} Success Rate
              </Badge>
              <Badge variant="outline">
                {testResults.summary.passed} / {testResults.summary.total} Passed
              </Badge>
            </div>
          )}
        </div>

        {testResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{testResults.summary.total}</div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </CardContent>
              </Card>
              <Card className="bg-accent/10">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-accent">{testResults.summary.passed}</div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/10">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-destructive">{testResults.summary.failed}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-2">
                {testResults.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    {result.status === 'PASS' ? (
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm">{result.test}</h4>
                        <Badge 
                          variant={result.status === 'PASS' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                      {result.data && (
                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-xs text-muted-foreground">
              Last run: {new Date(testResults.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
