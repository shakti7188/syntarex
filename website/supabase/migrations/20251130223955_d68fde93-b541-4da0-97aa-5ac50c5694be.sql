-- ================================================
-- PHASE 1: Fix token_info RLS Policy (Critical - Breaking Landing Page)
-- ================================================

-- Drop existing policy that only allows authenticated users
DROP POLICY IF EXISTS "Anyone can view token info" ON public.token_info;
DROP POLICY IF EXISTS "Public can view token info" ON public.token_info;

-- Create new policy allowing both anonymous and authenticated users
CREATE POLICY "Public can view token info"
  ON public.token_info
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ================================================
-- PHASE 2: Tighten Security on Profiles Table
-- ================================================

-- Drop existing overly permissive or conflicting policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can view their own profile completely
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ================================================
-- PHASE 3: Tighten Security on Mining Pool Configs
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own pool configs" ON public.mining_pool_configs;
DROP POLICY IF EXISTS "Public can view pool configs" ON public.mining_pool_configs;
DROP POLICY IF EXISTS "Admins can view all pool configs" ON public.mining_pool_configs;
DROP POLICY IF EXISTS "Users can view their own pool configs" ON public.mining_pool_configs;

-- Create secure policy: users can only see their own, admins can see all
CREATE POLICY "Users can view own pool configs"
  ON public.mining_pool_configs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ================================================
-- PHASE 4: Add Documentation Comments
-- ================================================

COMMENT ON TABLE public.token_info IS 'Public token information - accessible to all users including anonymous visitors for landing page display';
COMMENT ON TABLE public.profiles IS 'User profiles - users can only view their own data, admins can view all';
COMMENT ON TABLE public.user_kyc IS 'KYC verification records - strictly restricted to user and admins only';
COMMENT ON TABLE public.mining_pool_configs IS 'Mining pool API credentials - users can only access their own configurations';
COMMENT ON TABLE public.token_balances IS 'User token balances - private to each user';
COMMENT ON TABLE public.payment_transactions IS 'Payment transaction history - private to each user';
COMMENT ON TABLE public.commissions IS 'Commission earnings - private to each user';
COMMENT ON TABLE public.weekly_settlements IS 'Weekly settlement records - private to each user';
COMMENT ON TABLE public.machine_inventory IS 'User machine inventory - private to each user';