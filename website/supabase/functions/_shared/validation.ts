import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Server-side validation schemas matching client-side
export const purchaseSchema = z.object({
  machineTypeId: z.string().uuid("Invalid machine type"),
  quantity: z.number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(100, "Maximum 100 machines per purchase"),
  paymentCurrency: z.enum(["USDT", "XFLOW"], {
    errorMap: () => ({ message: "Payment currency must be USDT or XFLOW" }),
  }),
});

export const marketplaceBuySchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  amountThs: z.number()
    .positive("Amount must be positive")
    .min(0.1, "Minimum purchase is 0.1 TH/s")
    .max(10000, "Maximum purchase is 10,000 TH/s"),
});

export const createListingSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation ID"),
  amountThs: z.number()
    .positive("Amount must be positive")
    .min(0.1, "Minimum listing is 0.1 TH/s")
    .max(10000, "Maximum listing is 10,000 TH/s"),
  pricePerThs: z.number()
    .positive("Price must be positive")
    .min(0.01, "Minimum price is $0.01 per TH/s")
    .max(1000000, "Maximum price is $1,000,000 per TH/s"),
  expiresInDays: z.number()
    .int("Expiry must be a whole number of days")
    .min(1, "Minimum expiry is 1 day")
    .max(90, "Maximum expiry is 90 days")
    .optional(),
});

export const tokenizeHashrateSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation ID"),
  amountThs: z.number()
    .positive("Amount must be positive")
    .min(0.1, "Minimum tokenization is 0.1 TH/s")
    .max(10000, "Maximum tokenization is 10,000 TH/s"),
});

export const redeemTokensSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation ID"),
  amountThs: z.number()
    .positive("Amount must be positive")
    .min(0.1, "Minimum redemption is 0.1 TH/s")
    .max(10000, "Maximum redemption is 10,000 TH/s"),
});

/**
 * Validate and sanitize input data
 * Returns validated data or throws ZodError
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
