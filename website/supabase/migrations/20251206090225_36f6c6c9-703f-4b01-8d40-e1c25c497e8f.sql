-- Update the handle_new_user function to capture binary_position from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $function$
DECLARE
  v_sponsor_id uuid;
  v_referral_code text;
  v_binary_position text;
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

  -- Get binary_position from user metadata
  v_binary_position := NULLIF(new.raw_user_meta_data->>'binary_position', '');

  INSERT INTO public.profiles (id, email, full_name, sponsor_id, binary_position)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    v_sponsor_id,
    CASE WHEN v_binary_position IN ('left', 'right') THEN v_binary_position::binary_position ELSE NULL END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$function$;