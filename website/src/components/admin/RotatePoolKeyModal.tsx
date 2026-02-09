import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePoolKeys } from "@/hooks/usePoolKeys";
import { AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  rotationType: z.enum(["ON_DEMAND", "SCHEDULED", "FORCED_COMPROMISE"]),
  reason: z.string().trim().max(500, "Reason must be less than 500 characters").optional(),
  newApiKey: z.string().trim().min(16).max(512).optional().or(z.literal("")),
  newApiSecret: z.string().trim().min(32).max(1024).optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface RotatePoolKeyModalProps {
  open: boolean;
  onClose: () => void;
  poolConfigId: string | null;
}

/**
 * Modal for rotating pool API keys
 * Supports scheduled, on-demand, and forced compromise rotations
 */
export function RotatePoolKeyModal({ open, onClose, poolConfigId }: RotatePoolKeyModalProps) {
  const { rotatePoolKey } = usePoolKeys();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rotationType: "ON_DEMAND",
      reason: "",
      newApiKey: "",
      newApiSecret: "",
    },
  });

  const rotationType = form.watch("rotationType");

  const onSubmit = async (data: FormData) => {
    if (!poolConfigId) return;

    await rotatePoolKey.mutateAsync({
      id: poolConfigId,
      rotationType: data.rotationType,
      reason: data.reason,
      newApiKey: data.newApiKey || undefined,
      newApiSecret: data.newApiSecret || undefined,
    });

    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Rotate Pool API Keys
          </DialogTitle>
          <DialogDescription>
            Generate new encrypted keys for this pool connection. Old keys will be marked inactive.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Rotation Process:</strong> You can either provide new credentials from your pool provider,
            or leave the fields empty to re-encrypt existing credentials with a new encryption key.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rotationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rotation Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rotation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ON_DEMAND">On-Demand (Manual)</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled (Routine)</SelectItem>
                      <SelectItem value="FORCED_COMPROMISE">Forced (Security Incident)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {rotationType === "ON_DEMAND" && "Manual rotation initiated by administrator"}
                    {rotationType === "SCHEDULED" && "Routine rotation for security best practices"}
                    {rotationType === "FORCED_COMPROMISE" && "⚠️ Emergency rotation due to suspected compromise"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason {rotationType === "FORCED_COMPROMISE" && "*"}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional: Why are you rotating these keys?"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context for audit trail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium">New Credentials (Optional)</p>
              <p className="text-xs text-muted-foreground">
                Leave empty to re-encrypt existing credentials. Provide new values only if you've generated
                new API keys from your pool provider.
              </p>

              <FormField
                control={form.control}
                name="newApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New API Key (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          placeholder="Leave empty to rotate existing"
                          autoComplete="off"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newApiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New API Secret (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showApiSecret ? "text" : "password"}
                          placeholder="Leave empty to rotate existing"
                          autoComplete="off"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                        >
                          {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {rotationType === "FORCED_COMPROMISE" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Alert:</strong> You should also revoke the old keys directly in your
                  pool provider's dashboard to prevent unauthorized access.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rotatePoolKey.isPending}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {rotatePoolKey.isPending ? "Rotating..." : "Rotate Keys"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
