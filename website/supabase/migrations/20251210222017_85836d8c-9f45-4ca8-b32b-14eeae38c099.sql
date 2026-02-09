-- Add default_placement_leg column to profiles table
-- This allows sponsors to predetermine which leg new recruits join
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS default_placement_leg binary_position DEFAULT 'left';

-- Update the handle_new_user function to use sponsor's default_placement_leg instead of recruit's choice
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, pg_catalog, pg_temp
AS $$
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

  -- Get binary_position from SPONSOR's default_placement_leg (NOT from recruit's choice)
  IF v_sponsor_id IS NOT NULL THEN
    SELECT default_placement_leg::text
    INTO v_binary_position
    FROM public.profiles
    WHERE id = v_sponsor_id;
  END IF;

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
$$;