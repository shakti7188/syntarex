-- Create enum for rotation types
CREATE TYPE public.rotation_type AS ENUM ('SCHEDULED', 'ON_DEMAND', 'FORCED_COMPROMISE');

-- Create mining_pool_key_rotations table for tracking rotation history
CREATE TABLE public.mining_pool_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_config_id UUID NOT NULL REFERENCES public.mining_pool_configs(id) ON DELETE CASCADE,
  old_secret_id UUID REFERENCES public.encrypted_secrets(id),
  new_secret_id UUID REFERENCES public.encrypted_secrets(id),
  old_key_fingerprint TEXT,
  new_key_fingerprint TEXT,
  rotation_type public.rotation_type NOT NULL DEFAULT 'ON_DEMAND',
  rotated_by UUID NOT NULL,
  rotation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rotations table
ALTER TABLE public.mining_pool_key_rotations ENABLE ROW LEVEL SECURITY;

-- Admins can view all rotation history
CREATE POLICY "Admins can view all rotations"
ON public.mining_pool_key_rotations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert rotation records
CREATE POLICY "Only admins can insert rotations"
ON public.mining_pool_key_rotations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create index for efficient queries
CREATE INDEX idx_pool_key_rotations_pool_config ON public.mining_pool_key_rotations(pool_config_id);
CREATE INDEX idx_pool_key_rotations_created_at ON public.mining_pool_key_rotations(created_at DESC);

-- Add version tracking to encrypted_secrets metadata
COMMENT ON COLUMN public.encrypted_secrets.metadata IS 'JSON metadata including version number, scopes, and other key attributes';