import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertTriangle, RefreshCw, Wrench } from "lucide-react";

interface OrphanedUser {
  id: string;
  email: string;
  full_name: string | null;
  sponsor_id: string;
  binary_position: string | null;
}

interface RepairResult {
  userId: string;
  email: string;
  status: 'repaired' | 'failed';
  referralsCreated?: number;
  error?: string;
}

export const ReferralSystemHealth = () => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([]);
  const [repairResults, setRepairResults] = useState<RepairResult[]>([]);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  const scanForIssues = async () => {
    setIsScanning(true);
    setRepairResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-admin-repair-referrals', {
        body: { dryRun: true }
      });

      if (error) throw error;

      setOrphanedUsers(data.orphanedUsers || []);
      setLastScanTime(new Date());
      
      toast({
        title: "Scan Complete",
        description: `Found ${data.orphanedCount || 0} users with missing referral records.`,
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const repairReferrals = async () => {
    setIsRepairing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-admin-repair-referrals', {
        body: { dryRun: false }
      });

      if (error) throw error;

      setRepairResults(data.results || []);
      setOrphanedUsers([]);
      
      toast({
        title: "Repair Complete",
        description: `${data.repairedCount} users repaired, ${data.failedCount} failed.`,
      });
    } catch (error: any) {
      toast({
        title: "Repair Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const isHealthy = orphanedUsers.length === 0 && lastScanTime !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Referral System Health
              {lastScanTime && (
                isHealthy ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Issues Found
                  </Badge>
                )
              )}
            </CardTitle>
            <CardDescription>
              Check and repair referral chain integrity
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={scanForIssues}
            disabled={isScanning || isRepairing}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Scan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastScanTime && (
          <p className="text-sm text-muted-foreground">
            Last scanned: {lastScanTime.toLocaleString()}
          </p>
        )}

        {orphanedUsers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {orphanedUsers.length} users with missing referral records:
              </p>
              <Button
                size="sm"
                onClick={repairReferrals}
                disabled={isRepairing}
              >
                {isRepairing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                Repair All
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {orphanedUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-2 rounded-lg bg-muted/50 text-sm"
                >
                  <div className="font-medium">{user.full_name || 'No Name'}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {repairResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Repair Results:</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {repairResults.map((result) => (
                <div
                  key={result.userId}
                  className={`p-2 rounded-lg text-sm ${
                    result.status === 'repaired' 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-destructive/10 border border-destructive/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.email}</span>
                    {result.status === 'repaired' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        ✓ {result.referralsCreated} records
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                  {result.error && (
                    <p className="text-xs text-destructive mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isHealthy && repairResults.length === 0 && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">
              Referral system is healthy
            </p>
            <p className="text-xs text-green-600 mt-1">
              All users with sponsors have proper referral records
            </p>
          </div>
        )}

        {!lastScanTime && (
          <div className="p-4 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground">
              Click "Scan" to check referral system integrity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
