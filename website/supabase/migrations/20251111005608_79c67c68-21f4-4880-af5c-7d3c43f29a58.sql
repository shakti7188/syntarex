-- Create weekly_settlements_meta table for storing weekly Merkle roots and metadata
CREATE TABLE public.weekly_settlements_meta (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date date NOT NULL UNIQUE,
  merkle_root text NOT NULL,
  total_users integer NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  contract_tx_hash text,
  contract_status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_settlements_meta ENABLE ROW LEVEL SECURITY;

-- Admins can manage meta
CREATE POLICY "Admins can manage settlements meta"
ON public.weekly_settlements_meta
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all meta
CREATE POLICY "Admins can view all settlements meta"
ON public.weekly_settlements_meta
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view meta (for their claiming UI)
CREATE POLICY "Users can view settlements meta"
ON public.weekly_settlements_meta
FOR SELECT
TO authenticated
USING (true);

-- Index for faster lookups
CREATE INDEX idx_settlements_meta_week ON public.weekly_settlements_meta(week_start_date);

-- Add trigger for updated_at
CREATE TRIGGER update_settlements_meta_updated_at
BEFORE UPDATE ON public.weekly_settlements_meta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();