import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, DollarSign, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TestDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-admin-test-generate-accounts');

      if (error) throw error;

      toast({
        title: "✅ Test Data Generated",
        description: `Created ${data.summary.usersCreated} users with $${data.summary.totalDeposits.toLocaleString()} in deposits`,
        duration: 5000,
      });

      // Navigate to results page
      setTimeout(() => {
        navigate('/admin/test-results');
      }, 1500);

    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "❌ Generation Failed",
        description: error.message || "Failed to generate test data",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Test Data Generator
        </CardTitle>
        <CardDescription>
          Generate a complete test affiliate network with 10 users, deposits, and commissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Test Users</p>
              <p className="text-2xl font-bold">10</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Deposits</p>
              <p className="text-2xl font-bold">$75K</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
            <Network className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Binary Levels</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">What This Generates:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>10 test users with proper binary tree placement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>5 users with $5,000 deposits + 5 users with $10,000 deposits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Direct commissions (Tiers 1-3) calculated automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Binary tree volumes with weak-leg payouts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Override commissions (3 levels up)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Weekly settlement summaries for all users</span>
            </li>
          </ul>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Test Data...
            </>
          ) : (
            <>
              <Network className="w-4 h-4 mr-2" />
              Generate Test Affiliate Network
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This will auto-seed payout settings if not configured and create a fully functional test network
        </p>
      </CardContent>
    </Card>
  );
};
