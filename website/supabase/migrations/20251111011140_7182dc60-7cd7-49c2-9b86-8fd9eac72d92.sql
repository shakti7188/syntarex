-- Create wallet_nonces table for secure wallet binding
CREATE TABLE public.wallet_nonces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nonce text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_nonces ENABLE ROW LEVEL SECURITY;

-- Users can view their own nonces
CREATE POLICY "Users can view their own nonces"
ON public.wallet_nonces
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own nonces (through edge function)
CREATE POLICY "Users can insert their own nonces"
ON public.wallet_nonces
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_wallet_nonces_user_nonce ON public.wallet_nonces(user_id, nonce, used);

-- Add finalized status to weekly_settlements
ALTER TABLE public.weekly_settlements
ADD COLUMN IF NOT EXISTS is_finalized boolean NOT NULL DEFAULT false;

-- Index for finalization checks
CREATE INDEX idx_settlements_finalized ON public.weekly_settlements(week_start_date, is_finalized);