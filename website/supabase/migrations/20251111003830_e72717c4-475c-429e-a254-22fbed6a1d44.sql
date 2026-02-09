-- Add wallet_address column to profiles table for Web3 integration
ALTER TABLE public.profiles
ADD COLUMN wallet_address text UNIQUE;

-- Add index for faster wallet address lookups
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;