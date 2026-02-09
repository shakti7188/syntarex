import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MachineType } from "@/hooks/useMachineTypes";
import { usePurchaseMachine } from "@/hooks/usePurchaseMachine";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface PurchaseModalProps {
  machine: MachineType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PurchaseModal = ({ machine, open, onOpenChange }: PurchaseModalProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [paymentCurrency, setPaymentCurrency] = useState<'USDT' | 'MUSD'>('USDT');
  const navigate = useNavigate();
  const purchaseMutation = usePurchaseMachine();

  if (!machine) return null;

  const totalPrice = machine.price_usdt * quantity;
  const maxQuantity = machine.available_quantity;

  const handlePurchase = async () => {
    try {
      await purchaseMutation.mutateAsync({
        machineId: machine.id,
        quantity,
        paymentCurrency,
      });
      onOpenChange(false);
      navigate('/mining/my-machines');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('mining.purchase', { brand: machine.brand, model: machine.model })}</DialogTitle>
          <DialogDescription>
            {t('mining.configurePurchase')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('mining.quantity')}</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
            />
            <p className="text-sm text-muted-foreground">
              {t('mining.available')}: {maxQuantity} {t('mining.units')}
            </p>
          </div>

          <div className="space-y-3">
            <Label>{t('mining.paymentCurrency')}</Label>
            <RadioGroup value={paymentCurrency} onValueChange={(value) => setPaymentCurrency(value as 'USDT' | 'MUSD')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USDT" id="usdt" />
                <Label htmlFor="usdt" className="font-normal cursor-pointer">
                  USDT (Tether)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MUSD" id="musd" />
                <Label htmlFor="musd" className="font-normal cursor-pointer">
                  MUSD (Mining USD)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('mining.unitPrice')}</span>
              <span className="font-medium">${machine.price_usdt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('mining.quantity')}:</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('mining.paymentCurrency')}:</span>
              <span className="font-medium">{paymentCurrency}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">{t('mining.totalPrice')}</span>
              <span className="font-bold text-lg">${totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={purchaseMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handlePurchase}
              className="flex-1"
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('mining.processing')}
                </>
              ) : (
                t('mining.confirmPurchase')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
