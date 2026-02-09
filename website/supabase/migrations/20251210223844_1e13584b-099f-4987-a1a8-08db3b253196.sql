-- Update handle_new_user trigger to use case-insensitive referral code matching
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code text;
  v_sponsor_id uuid;
  v_binary_position text;
  v_referral_sequence int;
BEGIN
  -- Extract referral code from metadata (case-insensitive lookup)
  v_referral_code := new.raw_user_meta_data ->> 'referral_code';
  
  -- Look up sponsor by referral code (CASE-INSENSITIVE)
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT id, default_placement_leg::text 
    INTO v_sponsor_id, v_binary_position
    FROM public.profiles 
    WHERE LOWER(referral_code) = LOWER(v_referral_code);
    
    -- Default to 'left' if sponsor has no preference set
    IF v_binary_position IS NULL THEN
      v_binary_position := 'left';
    END IF;
  END IF;
  
  -- Fallback to sponsor_id from metadata if referral lookup failed
  IF v_sponsor_id IS NULL THEN
    v_sponsor_id := (new.raw_user_meta_data ->> 'sponsor_id')::uuid;
    -- If we have sponsor_id but no binary_position, look up sponsor's preference
    IF v_sponsor_id IS NOT NULL THEN
      SELECT default_placement_leg::text INTO v_binary_position
      FROM public.profiles WHERE id = v_sponsor_id;
      IF v_binary_position IS NULL THEN
        v_binary_position := 'left';
      END IF;
    END IF;
  END IF;
  
  -- Get next referral sequence number
  SELECT COALESCE(MAX(referral_sequence_number), 0) + 1 
  INTO v_referral_sequence 
  FROM public.profiles;

  -- Insert profile with sponsor relationship and binary position
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    sponsor_id,
    binary_position,
    binary_parent_id,
    referral_code,
    referral_sequence_number
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    v_sponsor_id,
    v_binary_position::binary_position,
    v_sponsor_id,
    UPPER(SUBSTRING(MD5(new.id::text) FROM 1 FOR 8)),
    v_referral_sequence
  );
  
  RETURN new;
END;
$$;