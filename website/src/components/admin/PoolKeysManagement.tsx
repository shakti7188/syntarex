import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePoolKeys } from "@/hooks/usePoolKeys";
import { CreatePoolKeyModal } from "./CreatePoolKeyModal";
import { RotatePoolKeyModal } from "./RotatePoolKeyModal";
import { PoolKeyAuditViewer } from "./PoolKeyAuditViewer";
import { Key, MoreVertical, RefreshCw, Ban, History, Plus, Shield } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Admin dashboard for managing mining pool API keys
 * Shows only masked data - never displays plaintext credentials
 */
export function PoolKeysManagement() {
  const { poolKeys, isLoading, deactivatePoolKey } = usePoolKeys();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rotateModalOpen, setRotateModalOpen] = useState(false);
  const [auditViewerOpen, setAuditViewerOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [keyToDeactivate, setKeyToDeactivate] = useState<string | null>(null);

  const handleRotate = (keyId: string) => {
    setSelectedKey(keyId);
    setRotateModalOpen(true);
  };

  const handleViewAudits = (keyId: string) => {
    setSelectedKey(keyId);
    setAuditViewerOpen(true);
  };

  const handleDeactivateConfirm = () => {
    if (keyToDeactivate) {
      deactivatePoolKey.mutate(keyToDeactivate);
      setDeactivateDialogOpen(false);
      setKeyToDeactivate(null);
    }
  };

  const handleDeactivateClick = (keyId: string) => {
    setKeyToDeactivate(keyId);
    setDeactivateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Mining Pool API Keys</h2>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Key
          </Button>
        </div>

        <Alert className="mb-6">
          <Key className="h-4 w-4" />
          <AlertDescription>
            All API keys are encrypted at rest. Only masked values (last 4 characters) are displayed.
            Full credentials are never shown in the UI or logs.
          </AlertDescription>
        </Alert>

        {poolKeys && poolKeys.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pool</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Last 4</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poolKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        {key.poolName}
                      </div>
                    </TableCell>
                    <TableCell>{key.accountLabel || '-'}</TableCell>
                    <TableCell>{key.keyAlias || '-'}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        **** {key.last4}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {key.scopes.map((scope) => (
                          <Badge
                            key={scope}
                            variant={scope === 'read' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={key.isActive ? 'default' : 'destructive'}
                      >
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(key.updatedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRotate(key.id)}
                            disabled={!key.isActive}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rotate Keys
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewAudits(key.id)}>
                            <History className="h-4 w-4 mr-2" />
                            View Audits
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeactivateClick(key.id)}
                            disabled={!key.isActive}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No pool keys configured</p>
            <p className="text-sm mt-2">Create your first encrypted API key to get started</p>
          </div>
        )}
      </Card>

      <CreatePoolKeyModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <RotatePoolKeyModal
        open={rotateModalOpen}
        onClose={() => {
          setRotateModalOpen(false);
          setSelectedKey(null);
        }}
        poolConfigId={selectedKey}
      />

      <PoolKeyAuditViewer
        open={auditViewerOpen}
        onClose={() => {
          setAuditViewerOpen(false);
          setSelectedKey(null);
        }}
        poolConfigId={selectedKey}
      />

      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this pool API key? This action will prevent
              any further API calls using these credentials. You can rotate the keys instead
              if you want to maintain access with new credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
