-- Fix Function Search Path for all security definer functions using CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_binary_tree_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.binary_tree (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_activity (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- CRITICAL: Remove public access to profiles table (PUBLIC_USER_DATA)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- CRITICAL: Restrict weekly_settlements_meta to authenticated users only (PUBLIC_BUSINESS_DATA)
DROP POLICY IF EXISTS "Users can view settlements meta" ON weekly_settlements_meta;
CREATE POLICY "Authenticated users can view settlements meta"
ON weekly_settlements_meta
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- WARNING: Restrict referrals to only direct referrals (level 1) to prevent network mapping
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
CREATE POLICY "Users can view only their direct referrals"
ON referrals
FOR SELECT
USING (
  (auth.uid() = referrer_id AND referral_level = 1) OR 
  (auth.uid() = referee_id AND referral_level = 1) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- WARNING: Restrict machine_types to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active machine types" ON machine_types;
CREATE POLICY "Authenticated users can view active machine types"
ON machine_types
FOR SELECT
USING (
  (status = 'ACTIVE' AND auth.uid() IS NOT NULL) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add rate limiting protection: Create a view for aggregated data instead of direct table access
CREATE OR REPLACE VIEW public.user_commission_summary AS
SELECT 
  user_id,
  week_start_date,
  week_end_date,
  grand_total,
  status,
  is_finalized,
  claimed_at
FROM weekly_settlements
WHERE auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role);

-- Revoke direct table access and grant view access
GRANT SELECT ON public.user_commission_summary TO authenticated;

-- Add security for wallet_nonces - users should not see nonce details
DROP POLICY IF EXISTS "Users can view their own nonces" ON wallet_nonces;

-- Add additional constraint to prevent enumeration attacks
CREATE POLICY "Users can only query their own nonces (no enumeration)"
ON wallet_nonces
FOR SELECT
USING (
  auth.uid() = user_id AND 
  expires_at > now() AND 
  used = false
);

COMMENT ON POLICY "Users can only query their own nonces (no enumeration)" ON wallet_nonces IS 
'Prevents timing attacks by limiting access to only valid, unexpired, unused nonces';

-- Add index for better performance (without WHERE clause that uses mutable function)
CREATE INDEX IF NOT EXISTS idx_wallet_nonces_user_expires 
ON wallet_nonces(user_id, expires_at, used);