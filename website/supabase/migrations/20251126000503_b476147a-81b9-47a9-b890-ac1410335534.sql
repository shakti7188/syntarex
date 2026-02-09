-- Add sequential number for referral codes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_sequence_number INTEGER;

-- Create a sequence for referral numbers
CREATE SEQUENCE IF NOT EXISTS referral_sequence_seq START WITH 1 INCREMENT BY 1;

-- Function to generate username-based referral code
CREATE OR REPLACE FUNCTION public.generate_username_referral_code(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_name TEXT;
  v_sequence_num INTEGER;
  v_referral_code TEXT;
  v_code_exists BOOLEAN;
BEGIN
  -- Clean username: remove spaces, special chars, limit to 20 chars, capitalize
  v_base_name := UPPER(REGEXP_REPLACE(COALESCE(p_username, 'User'), '[^a-zA-Z0-9]', '', 'g'));
  v_base_name := LEFT(v_base_name, 20);
  
  -- If no valid characters remain, use 'User'
  IF LENGTH(v_base_name) = 0 THEN
    v_base_name := 'USER';
  END IF;
  
  -- Get next sequence number
  v_sequence_num := nextval('referral_sequence_seq');
  
  -- Create referral code
  v_referral_code := v_base_name || v_sequence_num::TEXT;
  
  -- Check if it exists (extremely rare but handle it)
  SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = v_referral_code) INTO v_code_exists;
  
  -- If exists, try with timestamp suffix
  IF v_code_exists THEN
    v_referral_code := v_base_name || v_sequence_num::TEXT || EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT;
  END IF;
  
  RETURN v_referral_code;
END;
$$;

-- Update existing profiles with sequential referral codes based on username
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, username, full_name, referral_code
    FROM public.profiles
    WHERE referral_code IS NOT NULL
    ORDER BY created_at
  LOOP
    -- Update with new sequential code
    UPDATE public.profiles
    SET 
      referral_code = generate_username_referral_code(COALESCE(profile_record.username, profile_record.full_name, 'User')),
      referral_sequence_number = currval('referral_sequence_seq')
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Update the profile creation trigger to use username-based codes
CREATE OR REPLACE FUNCTION public.handle_new_profile_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate username-based referral code
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_username_referral_code(COALESCE(NEW.username, NEW.full_name, 'User'));
    NEW.referral_sequence_number := currval('referral_sequence_seq');
  END IF;
  
  INSERT INTO public.user_activity (user_id)
  VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  
  IF NEW.sponsor_id IS NOT NULL THEN
    PERFORM create_referral_chain(NEW.id, NEW.sponsor_id, NEW.binary_position);
  END IF;
  
  RETURN NEW;
END;
$function$;