import { z } from "zod";

// Machine Purchase Validation
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

export type PurchaseFormData = z.infer<typeof purchaseSchema>;

// Marketplace Buy Validation
export const marketplaceBuySchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  amountThs: z.number()
    .positive("Amount must be positive")
    .min(0.1, "Minimum purchase is 0.1 TH/s")
    .max(10000, "Maximum purchase is 10,000 TH/s"),
});

export type MarketplaceBuyFormData = z.infer<typeof marketplaceBuySchema>;

// Marketplace Listing Creation Validation
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
    .max(90, "Maximum expiry is 90 days"),
});

export type CreateListingFormData = z.infer<typeof createListingSchema>;

// Tokenization Validation
export const tokenizeHashrateSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation ID"),
  amountThs: z.number()
    .positive("Amount must be positive")
    .min(0.1, "Minimum tokenization is 0.1 TH/s")
    .max(10000, "Maximum tokenization is 10,000 TH/s"),
});

export type TokenizeHashrateFormData = z.infer<typeof tokenizeHashrateSchema>;

// Mining Pool Connection Validation
export const poolConnectionSchema = z.object({
  poolName: z.string()
    .trim()
    .min(1, "Pool name is required")
    .max(100, "Pool name must be less than 100 characters"),
  poolProvider: z.enum(["ANTPOOL", "F2POOL"], {
    errorMap: () => ({ message: "Invalid pool provider" }),
  }),
  apiKey: z.string()
    .trim()
    .min(10, "API key must be at least 10 characters")
    .max(500, "API key must be less than 500 characters"),
  apiSecret: z.string()
    .trim()
    .min(10, "API secret must be at least 10 characters")
    .max(500, "API secret must be less than 500 characters"),
  subaccount: z.string()
    .trim()
    .max(100, "Subaccount must be less than 100 characters")
    .optional(),
  baseUrl: z.string()
    .trim()
    .url("Base URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type PoolConnectionFormData = z.infer<typeof poolConnectionSchema>;

// Hashrate Allocation Creation Validation
export const createAllocationSchema = z.object({
  machineInventoryId: z.string().uuid("Invalid machine ID"),
  totalThs: z.number()
    .positive("Total TH/s must be positive")
    .min(0.1, "Minimum allocation is 0.1 TH/s"),
});

export type CreateAllocationFormData = z.infer<typeof createAllocationSchema>;

// Username Update Validation
export const usernameSchema = z.object({
  username: z.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
});

export type UsernameFormData = z.infer<typeof usernameSchema>;

// Wallet Address Validation with checksum verification
import { isAddress, getAddress } from 'viem';

export type WalletNetwork = 'ETHEREUM' | 'SOLANA' | 'TRON';

// Base58 characters (Solana and Tron addresses use this)
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const validateSolanaAddress = (address: string): { 
  valid: boolean; 
  error?: string; 
  formatted?: string;
} => {
  if (!address || address.trim() === '') {
    return { valid: false, error: "Wallet address is required" };
  }

  const trimmed = address.trim();

  // Solana addresses should NOT start with 0x
  if (trimmed.startsWith('0x')) {
    return { valid: false, error: "Solana addresses don't start with 0x. Did you mean to select Ethereum?" };
  }

  // Length check: Solana addresses are 32-44 characters
  if (trimmed.length < 32 || trimmed.length > 44) {
    return { valid: false, error: `Solana address must be 32-44 characters (currently ${trimmed.length})` };
  }

  // Base58 character validation (no 0, O, I, l)
  for (const char of trimmed) {
    if (!BASE58_CHARS.includes(char)) {
      return { valid: false, error: `Invalid character '${char}'. Solana addresses use Base58 (no 0, O, I, l)` };
    }
  }

  return { valid: true, formatted: trimmed };
};

export const validateEthereumAddress = (address: string): { 
  valid: boolean; 
  error?: string; 
  checksummed?: string;
} => {
  if (!address || address.trim() === '') {
    return { valid: false, error: "Wallet address is required" };
  }

  const trimmed = address.trim();

  if (!trimmed.startsWith('0x')) {
    return { valid: false, error: "Ethereum address must start with 0x" };
  }

  if (trimmed.length !== 42) {
    return { valid: false, error: `Address must be 42 characters (currently ${trimmed.length})` };
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return { valid: false, error: "Address contains invalid characters. Only 0-9 and a-f allowed" };
  }

  if (!isAddress(trimmed)) {
    return { valid: false, error: "Invalid Ethereum address format" };
  }

  try {
    const checksummed = getAddress(trimmed);
    return { valid: true, checksummed };
  } catch {
    return { valid: false, error: "Failed to validate address checksum" };
  }
};

export const validateTronAddress = (address: string): { 
  valid: boolean; 
  error?: string; 
  formatted?: string;
} => {
  if (!address || address.trim() === '') {
    return { valid: false, error: "Wallet address is required" };
  }

  const trimmed = address.trim();

  // Tron addresses should NOT start with 0x
  if (trimmed.startsWith('0x')) {
    return { valid: false, error: "Tron addresses don't start with 0x. Did you mean to select Ethereum?" };
  }

  // Tron addresses must start with 'T'
  if (!trimmed.startsWith('T')) {
    return { valid: false, error: "Tron addresses must start with 'T'" };
  }

  // Length check: Tron addresses are exactly 34 characters
  if (trimmed.length !== 34) {
    return { valid: false, error: `Tron address must be 34 characters (currently ${trimmed.length})` };
  }

  // Base58 character validation
  for (const char of trimmed) {
    if (!BASE58_CHARS.includes(char)) {
      return { valid: false, error: `Invalid character '${char}'. Tron addresses use Base58 (no 0, O, I, l)` };
    }
  }

  return { valid: true, formatted: trimmed };
};

export const validateWalletAddress = (address: string, network: WalletNetwork = 'ETHEREUM'): { 
  valid: boolean; 
  error?: string; 
  formatted?: string;
} => {
  if (network === 'SOLANA') {
    const result = validateSolanaAddress(address);
    return { valid: result.valid, error: result.error, formatted: result.formatted };
  }
  
  if (network === 'TRON') {
    const result = validateTronAddress(address);
    return { valid: result.valid, error: result.error, formatted: result.formatted };
  }
  
  const result = validateEthereumAddress(address);
  return { valid: result.valid, error: result.error, formatted: result.checksummed };
};

export const walletAddressSchema = z.object({
  walletAddress: z.string()
    .trim()
    .refine((val) => validateWalletAddress(val).valid, {
      message: "Invalid wallet address"
    }),
  network: z.enum(['ETHEREUM', 'SOLANA', 'TRON']).default('ETHEREUM'),
});

export type WalletAddressFormData = z.infer<typeof walletAddressSchema>;
