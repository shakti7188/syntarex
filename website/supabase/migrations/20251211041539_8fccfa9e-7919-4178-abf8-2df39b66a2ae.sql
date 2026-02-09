-- Add wallet_network column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_network TEXT DEFAULT 'ETHEREUM' CHECK (wallet_network IN ('ETHEREUM', 'SOLANA'));