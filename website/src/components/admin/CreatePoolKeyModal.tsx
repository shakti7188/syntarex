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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePoolKeys } from "@/hooks/usePoolKeys";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";

const formSchema = z.object({
  poolName: z.string()
    .trim()
    .min(1, "Pool name is required")
    .max(100, "Pool name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Use only letters, numbers, spaces, hyphens, underscores"),
  poolProvider: z.enum(["antpool", "f2pool"], {
    required_error: "Please select a pool provider",
  }),
  apiKey: z.string()
    .trim()
    .min(16, "API key must be at least 16 characters")
    .max(512, "API key exceeds maximum length"),
  apiSecret: z.string()
    .trim()
    .min(32, "API secret must be at least 32 characters")
    .max(1024, "API secret exceeds maximum length"),
  accountLabel: z.string()
    .trim()
    .max(50, "Account label must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]*$/, "Use only letters, numbers, spaces, hyphens, underscores")
    .optional(),
  keyAlias: z.string()
    .trim()
    .max(50, "Key alias must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\-_]*$/, "Use only letters, numbers, hyphens, underscores")
    .optional(),
  subaccount: z.string().trim().optional(),
  readOnly: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface CreatePoolKeyModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal for creating new pool API keys
 * Never stores plaintext in client state - submits directly to server
 */
export function CreatePoolKeyModal({ open, onClose }: CreatePoolKeyModalProps) {
  const { createPoolKey } = usePoolKeys();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      poolName: "",
      poolProvider: undefined,
      apiKey: "",
      apiSecret: "",
      accountLabel: "",
      keyAlias: "",
      subaccount: "",
      readOnly: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    const scopes = data.readOnly ? ["read"] : ["read", "write"];

    await createPoolKey.mutateAsync({
      poolName: data.poolName,
      poolProvider: data.poolProvider,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      accountLabel: data.accountLabel,
      keyAlias: data.keyAlias,
      scopes,
      subaccount: data.subaccount,
    });

    // Clear form and close
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Create Encrypted Pool API Key
          </DialogTitle>
          <DialogDescription>
            Add a new mining pool API key. Credentials will be encrypted at rest and never stored in plaintext.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Security Notice:</strong> Credentials are submitted directly to the server and encrypted.
            They will never appear in browser storage, logs, or network responses.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="poolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pool Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="My AntPool" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="poolProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="antpool">AntPool</SelectItem>
                        <SelectItem value="f2pool">F2Pool</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Label</FormLabel>
                    <FormControl>
                      <Input placeholder="main" {...field} />
                    </FormControl>
                    <FormDescription>Optional identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyAlias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Alias</FormLabel>
                    <FormControl>
                      <Input placeholder="primary" {...field} />
                    </FormControl>
                    <FormDescription>Optional alias for this key</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter API key from pool provider"
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
                  <FormDescription>
                    Minimum 16 characters. Will be encrypted before storage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiSecret ? "text" : "password"}
                        placeholder="Enter API secret from pool provider"
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
                  <FormDescription>
                    Minimum 32 characters. Will be encrypted before storage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subaccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subaccount (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Subaccount name if applicable" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="readOnly"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Read-only access (Recommended)
                    </FormLabel>
                    <FormDescription>
                      Limit this key to read-only operations. Uncheck only if write access is required.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPoolKey.isPending}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                {createPoolKey.isPending ? "Encrypting..." : "Create & Encrypt"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
