import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  details?: { label: string; value: string | number }[];
  onConfirm?: () => void;
  confirmText?: string;
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  onConfirm,
  confirmText = "Continue",
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <DialogTitle className="text-left">{title}</DialogTitle>
              <DialogDescription className="text-left mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {details && details.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{detail.label}</span>
                <span className="font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {onConfirm && (
            <Button onClick={onConfirm}>
              {confirmText}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
