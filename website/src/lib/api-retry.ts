import { toast } from "@/hooks/use-toast";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < opts.maxRetries) {
        const delay = opts.retryDelay * Math.pow(opts.backoffMultiplier, attempt);
        opts.onRetry(attempt + 1, lastError);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export async function withRetryAndToast<T>(
  fn: () => Promise<T>,
  options: RetryOptions & {
    errorTitle?: string;
    errorDescription?: string;
  } = {}
): Promise<T> {
  const { errorTitle = "Operation Failed", errorDescription, ...retryOptions } = options;

  try {
    return await withRetry(fn, retryOptions);
  } catch (error) {
    toast({
      title: errorTitle,
      description: errorDescription || (error as Error).message,
      variant: "destructive",
    });
    throw error;
  }
}
