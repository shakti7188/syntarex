-- Create status enum for tokenization
CREATE TYPE public.tokenization_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- Create hashrate_tokenizations table
CREATE TABLE public.hashrate_tokenizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  allocation_id UUID, -- nullable, can reference hashrate_allocations when that table is created
  amount_ths NUMERIC(18,6) NOT NULL,
  token_symbol TEXT NOT NULL,
  tokens_minted NUMERIC(36,18) NOT NULL,
  tx_hash TEXT,
  status public.tokenization_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT positive_amount CHECK (amount_ths > 0),
  CONSTRAINT positive_tokens CHECK (tokens_minted > 0)
);

-- Enable RLS
ALTER TABLE public.hashrate_tokenizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tokenizations"
  ON public.hashrate_tokenizations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokenizations"
  ON public.hashrate_tokenizations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tokenizations"
  ON public.hashrate_tokenizations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all tokenizations"
  ON public.hashrate_tokenizations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_hashrate_tokenizations_updated_at
  BEFORE UPDATE ON public.hashrate_tokenizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create index for user queries
CREATE INDEX idx_hashrate_tokenizations_user_id ON public.hashrate_tokenizations(user_id);
CREATE INDEX idx_hashrate_tokenizations_status ON public.hashrate_tokenizations(status);
CREATE INDEX idx_hashrate_tokenizations_created_at ON public.hashrate_tokenizations(created_at DESC);