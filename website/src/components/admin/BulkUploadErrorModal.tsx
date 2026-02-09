import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorItem {
  row: number;
  message: string;
}

interface BulkUploadErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ErrorItem[];
  fileName: string;
}

export const BulkUploadErrorModal = ({ 
  open, 
  onOpenChange, 
  errors, 
  fileName 
}: BulkUploadErrorModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Upload Errors - {fileName}</DialogTitle>
        </DialogHeader>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.length} error{errors.length !== 1 ? 's' : ''} occurred during this upload
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
          <div className="space-y-3">
            {errors.map((error, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-16 font-mono text-sm font-semibold text-destructive">
                    Row {error.row}
                  </div>
                  <div className="flex-1 text-sm">
                    {error.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground">
          {errors.length} total errors
        </div>
      </DialogContent>
    </Dialog>
  );
};
