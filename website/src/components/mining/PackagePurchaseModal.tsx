import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Package } from "@/hooks/usePackages";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PaymentFlow } from "@/components/payment/PaymentFlow";

interface PackagePurchaseModalProps {
  package: Package | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PackagePurchaseModal = ({ package: pkg, open, onOpenChange }: PackagePurchaseModalProps) => {
  const navigate = useNavigate();

  if (!pkg) return null;

  const handleSuccess = () => {
    onOpenChange(false);
    navigate('/mining/my-machines');
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase {pkg.name}</DialogTitle>
          <DialogDescription>
            Complete your payment to activate your mining package
          </DialogDescription>
        </DialogHeader>

        <PaymentFlow
          packageId={pkg.id}
          packageName={pkg.name}
          priceUsd={pkg.price_usd}
          hashrateThs={pkg.hashrate_ths}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
