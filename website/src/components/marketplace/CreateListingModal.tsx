import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { useHashrateAllocations } from "@/hooks/useHashrateAllocations";
import { useCreateListing } from "@/hooks/useCreateListing";
import { useTranslation } from "react-i18next";

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateListingModal = ({ open, onClose }: CreateListingModalProps) => {
  const { t } = useTranslation();
  const { data: allocations, isLoading } = useHashrateAllocations();
  const createListing = useCreateListing();

  const [selectedAllocationId, setSelectedAllocationId] = useState("");
  const [amountThs, setAmountThs] = useState("");
  const [pricePerThs, setPricePerThs] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");

  const selectedAllocation = useMemo(() => {
    if (!selectedAllocationId || !allocations) return null;
    return allocations.find(a => a.id === selectedAllocationId);
  }, [selectedAllocationId, allocations]);

  const totalEarnings = useMemo(() => {
    const amount = parseFloat(amountThs || "0");
    const price = parseFloat(pricePerThs || "0");
    return amount * price;
  }, [amountThs, pricePerThs]);

  const isValid = useMemo(() => {
    const amount = parseFloat(amountThs);
    const price = parseFloat(pricePerThs);
    return (
      !isNaN(amount) && 
      !isNaN(price) && 
      amount > 0 && 
      price > 0 &&
      selectedAllocationId &&
      selectedAllocation &&
      amount <= selectedAllocation.untokenizedThs
    );
  }, [amountThs, pricePerThs, selectedAllocationId, selectedAllocation]);

  const handleSubmit = async () => {
    if (!isValid) return;

    await createListing.mutateAsync({
      allocationId: selectedAllocationId,
      amountThs: parseFloat(amountThs),
      pricePerThs: parseFloat(pricePerThs),
      expiresInDays: parseInt(expiresInDays),
    });

    // Reset form and close modal
    setSelectedAllocationId("");
    setAmountThs("");
    setPricePerThs("");
    setExpiresInDays("7");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('marketplace.createListingTitle')}</DialogTitle>
          <DialogDescription>
            {t('marketplace.createListingDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              List your untokenized hashrate for sale on the marketplace. Other users can purchase it at your set price.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>{t('marketplace.selectAllocation')}</Label>
            <Select value={selectedAllocationId} onValueChange={setSelectedAllocationId}>
              <SelectTrigger>
                <SelectValue placeholder={t('marketplace.chooseAllocation')} />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                ) : !allocations || allocations.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">No allocations available</div>
                ) : (
                  allocations
                    .filter(a => a.untokenizedThs > 0)
                    .map((allocation) => (
                      <SelectItem key={allocation.id} value={allocation.id}>
                        {allocation.id.substring(0, 8)}... ({allocation.untokenizedThs.toFixed(3)} TH/s available)
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
            {selectedAllocation && (
              <p className="text-xs text-muted-foreground">
                {t('marketplace.availableToSell')}: {selectedAllocation.untokenizedThs.toFixed(3)} TH/s
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('marketplace.amountToSell')}</Label>
            <Input
              type="number"
              placeholder="0.000"
              value={amountThs}
              onChange={(e) => setAmountThs(e.target.value)}
              min="0"
              step="0.001"
              max={selectedAllocation?.untokenizedThs}
              disabled={!selectedAllocationId}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('marketplace.pricePerThsInput')}</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={pricePerThs}
              onChange={(e) => setPricePerThs(e.target.value)}
              min="0"
              step="0.01"
              disabled={!selectedAllocationId}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('marketplace.expiresIn')}</Label>
            <Select value={expiresInDays} onValueChange={setExpiresInDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('marketplace.days7')}</SelectItem>
                <SelectItem value="14">{t('marketplace.days14')}</SelectItem>
                <SelectItem value="30">{t('marketplace.days30')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t('marketplace.totalEarnings')}</span>
              <span className="text-xl font-bold text-primary">
                ${totalEarnings.toFixed(2)}
              </span>
            </div>
            {totalEarnings > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {amountThs} TH/s × ${pricePerThs}/TH
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createListing.isPending}
            >
              {t('marketplace.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!isValid || createListing.isPending}
            >
              {createListing.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('marketplace.processing')}
                </>
              ) : (
                t('marketplace.createListingBtn')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
