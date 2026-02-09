-- Fix commission_settings RLS policy to restrict to admins only
-- This prevents regular users from viewing sensitive business commission rates

-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Users can view commission settings" ON public.commission_settings;

-- Replace with admin-only access
CREATE POLICY "Only admins can view commission settings"
  ON public.commission_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));