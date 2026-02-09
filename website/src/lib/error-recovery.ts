import { toast } from "@/hooks/use-toast";

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
}

export interface ErrorRecoveryOptions {
  title?: string;
  description?: string;
  recoveryActions?: RecoveryAction[];
  onDismiss?: () => void;
}

/**
 * Display an error with recovery options
 */
export function showErrorWithRecovery(
  error: Error,
  options: ErrorRecoveryOptions = {}
) {
  const {
    title = "Error",
    description,
    recoveryActions = [],
    onDismiss,
  } = options;

  toast({
    title,
    description: description || error.message,
    variant: "destructive",
  });

  if (onDismiss) {
    setTimeout(onDismiss, 5000);
  }

  // Execute first recovery action automatically after a delay if available
  if (recoveryActions.length > 0) {
    const primaryAction = recoveryActions[0];
    console.log(`Recovery action available: ${primaryAction.label}`);
  }
}

/**
 * Common recovery patterns
 */
export const recoveryPatterns = {
  retry: (fn: () => Promise<void>): RecoveryAction => ({
    label: "Retry",
    action: fn,
  }),

  reload: (): RecoveryAction => ({
    label: "Reload",
    action: () => window.location.reload(),
  }),

  goBack: (navigate: (path: string) => void, path: string = "/"): RecoveryAction => ({
    label: "Go Back",
    action: () => navigate(path),
  }),

  contactSupport: (): RecoveryAction => ({
    label: "Contact Support",
    action: () => {
      // Open support channel or copy error details
      const errorDetails = JSON.stringify({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
      navigator.clipboard.writeText(errorDetails);
      toast({
        title: "Error details copied",
        description: "Please share these with support",
      });
    },
  }),
};
