-- Add wallet_link_method column to track how wallets are linked
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_link_method text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.wallet_link_method IS 'Method used to link wallet: signature (cryptographically verified) or manual (user-entered without verification)';