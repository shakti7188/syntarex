-- Fix security definer view by removing it and relying on existing RLS policies instead
-- The view was causing a security issue, so we'll just use the table directly with RLS

DROP VIEW IF EXISTS public.user_commission_summary;

-- Update the update_updated_at function to have proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;