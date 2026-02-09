-- Create a secure function to lookup sponsor by referral code
-- This bypasses RLS safely and only returns minimal necessary info
CREATE OR REPLACE FUNCTION public.lookup_sponsor_by_referral(p_referral_code text)
RETURNS TABLE(id uuid, full_name text, email text) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  WHERE LOWER(p.referral_code) = LOWER(p_referral_code)
  LIMIT 1;
END;
$$;