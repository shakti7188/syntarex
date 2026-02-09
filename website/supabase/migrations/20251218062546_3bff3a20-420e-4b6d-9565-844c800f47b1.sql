-- =====================================================
-- PAYMENT SECURITY HARDENING MIGRATION
-- =====================================================

-- 1. Add wallet verification and cooldown columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS wallet_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS wallet_verification_method text,
ADD COLUMN IF NOT EXISTS wallet_changed_at timestamp with time zone DEFAULT now();

-- 2. Add sender wallet snapshot to payment_orders
ALTER TABLE public.payment_orders
ADD COLUMN IF NOT EXISTS sender_wallet_expected text;

-- 3. Create wallet audit logs table
CREATE TABLE IF NOT EXISTS public.wallet_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- WALLET_LINKED, WALLET_CHANGED, WALLET_UNLINKED, WALLET_VERIFIED, VERIFICATION_FAILED, SUSPICIOUS_ACTIVITY
  wallet_address text,
  wallet_network text,
  previous_wallet_address text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_user_id ON public.wallet_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_event_type ON public.wallet_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_wallet_address ON public.wallet_audit_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_created_at ON public.wallet_audit_logs(created_at DESC);

-- Enable RLS on wallet_audit_logs
ALTER TABLE public.wallet_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_audit_logs
CREATE POLICY "Users can view their own wallet audit logs"
ON public.wallet_audit_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet audit logs"
ON public.wallet_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert wallet audit logs"
ON public.wallet_audit_logs
FOR INSERT
WITH CHECK (true);

-- 4. Create function to check if user can change wallet
CREATE OR REPLACE FUNCTION public.can_change_wallet(p_user_id uuid)
RETURNS TABLE(allowed boolean, reason text, cooldown_ends_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_has_pending_orders boolean;
  v_wallet_changed_at timestamp with time zone;
  v_cooldown_hours integer := 24;
BEGIN
  -- Check for pending payment orders
  SELECT EXISTS(
    SELECT 1 FROM payment_orders
    WHERE user_id = p_user_id
    AND status IN ('PENDING', 'AWAITING_CONFIRMATION')
    AND expires_at > now()
  ) INTO v_has_pending_orders;

  IF v_has_pending_orders THEN
    RETURN QUERY SELECT false, 'Cannot change wallet while payment orders are pending. Complete or wait for them to expire.'::text, NULL::timestamp with time zone;
    RETURN;
  END IF;

  -- Check cooldown period (24 hours after last change)
  SELECT wallet_changed_at INTO v_wallet_changed_at
  FROM profiles WHERE id = p_user_id;

  IF v_wallet_changed_at IS NOT NULL AND v_wallet_changed_at + (v_cooldown_hours || ' hours')::interval > now() THEN
    RETURN QUERY SELECT false, 'Wallet change cooldown active. Please wait before changing your wallet again.'::text, v_wallet_changed_at + (v_cooldown_hours || ' hours')::interval;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::text, NULL::timestamp with time zone;
END;
$$;

-- 5. Create function to log wallet events
CREATE OR REPLACE FUNCTION public.log_wallet_event(
  p_user_id uuid,
  p_event_type text,
  p_wallet_address text DEFAULT NULL,
  p_wallet_network text DEFAULT NULL,
  p_previous_wallet text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO wallet_audit_logs (
    user_id, event_type, wallet_address, wallet_network, 
    previous_wallet_address, ip_address, user_agent, metadata
  ) VALUES (
    p_user_id, p_event_type, p_wallet_address, p_wallet_network,
    p_previous_wallet, p_ip_address, p_user_agent, p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 6. Create trigger to update wallet_changed_at when wallet changes
CREATE OR REPLACE FUNCTION public.track_wallet_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger if wallet_address actually changed
  IF OLD.wallet_address IS DISTINCT FROM NEW.wallet_address THEN
    NEW.wallet_changed_at := now();
    
    -- Reset verification status when wallet changes (unless we're setting it to verified)
    IF NEW.wallet_verified IS NOT TRUE THEN
      NEW.wallet_verified := false;
      NEW.wallet_verified_at := NULL;
      NEW.wallet_verification_method := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_track_wallet_changes ON public.profiles;
CREATE TRIGGER trigger_track_wallet_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.track_wallet_changes();

-- 7. Update existing profiles to have current timestamp for wallet_changed_at
UPDATE public.profiles
SET wallet_changed_at = now()
WHERE wallet_address IS NOT NULL AND wallet_changed_at IS NULL;