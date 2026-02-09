-- Enhance handle_new_user to resolve sponsor via referral code on the backend
-- This avoids relying on client-side profile lookups that are blocked by RLS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $function$
DECLARE
  v_sponsor_id uuid;
  v_referral_code text;
BEGIN
  -- Prefer an explicit sponsor_id from user metadata when present
  v_sponsor_id := NULLIF(new.raw_user_meta_data->>'sponsor_id', '')::uuid;

  -- If sponsor_id is not provided, try to resolve it from a referral code
  IF v_sponsor_id IS NULL THEN
    v_referral_code := NULLIF(new.raw_user_meta_data->>'referral_code', '');

    IF v_referral_code IS NOT NULL THEN
      SELECT id
      INTO v_sponsor_id
      FROM public.profiles
      WHERE referral_code = v_referral_code
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, sponsor_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    v_sponsor_id
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$function$;