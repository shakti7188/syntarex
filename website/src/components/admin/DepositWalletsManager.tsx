import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useDepositWallets, DepositWallet, validateWalletForChain } from "@/hooks/useDepositWallets";
import { useAuth } from "@/contexts/AuthContext";

export const DepositWalletsManager = () => {
  const { wallets, isLoading, updateWallet } = useDepositWallets();
  const { isSuperAdmin } = useAuth();
  const [editingWallet, setEditingWallet] = useState<DepositWallet | null>(null);
  const [editForm, setEditForm] = useState({
    wallet_address: "",
    chain: "",
    is_active: true,
    label: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleEdit = (wallet: DepositWallet) => {
    setEditingWallet(wallet);
    setEditForm({
      wallet_address: wallet.wallet_address,
      chain: wallet.chain,
      is_active: wallet.is_active,
      label: wallet.label || "",
    });
    setValidationError(null);
  };

  const handleSave = () => {
    if (!editingWallet) return;

    // Validate wallet address matches chain
    const validation = validateWalletForChain(editForm.wallet_address, editForm.chain);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid wallet address");
      return;
    }

    updateWallet.mutate({
      id: editingWallet.id,
      wallet_address: editForm.wallet_address,
      chain: editForm.chain,
      is_active: editForm.is_active,
      label: editForm.label || null,
    }, {
      onSuccess: () => {
        setEditingWallet(null);
        setValidationError(null);
      }
    });
  };

  const handleChainChange = (chain: string) => {
    setEditForm(prev => ({ ...prev, chain }));
    // Re-validate when chain changes
    const validation = validateWalletForChain(editForm.wallet_address, chain);
    setValidationError(validation.valid ? null : validation.error || null);
  };

  const handleAddressChange = (address: string) => {
    setEditForm(prev => ({ ...prev, wallet_address: address }));
    // Validate as user types
    if (address.length > 10) {
      const validation = validateWalletForChain(address, editForm.chain);
      setValidationError(validation.valid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Deposit Wallets</CardTitle>
          </div>
          <CardDescription>
            Manage deposit wallet addresses for payment processing.
            {!isSuperAdmin && " Only Super Admins can edit wallets."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chain</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Received</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets?.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell>
                    <Badge variant="outline">{wallet.chain}</Badge>
                  </TableCell>
                  <TableCell>{wallet.currency}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {wallet.wallet_address}
                  </TableCell>
                  <TableCell>{wallet.label || "-"}</TableCell>
                  <TableCell>
                    {wallet.is_active ? (
                      <Badge className="bg-accent text-accent-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>${wallet.total_received.toLocaleString()}</TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(wallet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {(!wallets || wallets.length === 0) && (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center text-muted-foreground">
                    No deposit wallets configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingWallet} onOpenChange={() => setEditingWallet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deposit Wallet</DialogTitle>
            <DialogDescription>
              Update the wallet address and settings. Ensure the address format matches the selected chain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chain">Chain</Label>
              <Select value={editForm.chain} onValueChange={handleChainChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLANA">Solana</SelectItem>
                  <SelectItem value="ETHEREUM">Ethereum</SelectItem>
                  <SelectItem value="TRON">Tron</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet_address">Wallet Address</Label>
              <Input
                id="wallet_address"
                value={editForm.wallet_address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder={
                  editForm.chain === "ETHEREUM" ? "0x..." : 
                  editForm.chain === "TRON" ? "T..." : 
                  "Base58 address..."
                }
                className={validationError ? "border-destructive" : ""}
              />
              {validationError && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {validationError}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {editForm.chain === "ETHEREUM" 
                  ? "Ethereum: Must start with 0x and be 42 characters"
                  : editForm.chain === "TRON"
                  ? "Tron: Must start with T and be 34 characters"
                  : "Solana: Must be 32-44 Base58 characters (no 0x prefix)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={editForm.label}
                onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Primary USDT Wallet"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWallet(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateWallet.isPending || !!validationError}
            >
              {updateWallet.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
