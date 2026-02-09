import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRotateKeys } from "@/hooks/useEncryptedSecrets";
import { RefreshCw, Key, Shield } from "lucide-react";
import { format } from "date-fns";

export function KeyRotationManager() {
  const [rotating, setRotating] = useState(false);
  const rotateKeys = useRotateKeys();

  const { data: activeKey, isLoading } = useQuery({
    queryKey: ['active-encryption-key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secret_encryption_keys')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: secretCount } = useQuery({
    queryKey: ['encrypted-secrets-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('encrypted_secrets')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  const handleRotation = async () => {
    setRotating(true);
    try {
      await rotateKeys.mutateAsync();
    } finally {
      setRotating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Encryption Key Management
        </CardTitle>
        <CardDescription>
          Rotate encryption keys to enhance security. All secrets will be re-encrypted with the new key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading key information...</div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">Active Key Version</span>
                  <Badge variant="outline">{activeKey?.version}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Created: {activeKey?.created_at ? format(new Date(activeKey.created_at), 'PPpp') : 'Unknown'}
                </p>
                {activeKey?.rotated_at && (
                  <p className="text-sm text-muted-foreground">
                    Last Rotated: {format(new Date(activeKey.rotated_at), 'PPpp')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{secretCount}</div>
                <p className="text-xs text-muted-foreground">Encrypted Secrets</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={rotating}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${rotating ? 'animate-spin' : ''}`} />
                  {rotating ? 'Rotating Keys...' : 'Rotate Encryption Keys'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rotate Encryption Keys?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will generate a new encryption key and re-encrypt all {secretCount} secrets. 
                    This process may take a few minutes depending on the number of secrets.
                    <br /><br />
                    <strong>Important:</strong> The old key will be deactivated after rotation. 
                    This operation cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRotation}>
                    Confirm Rotation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
