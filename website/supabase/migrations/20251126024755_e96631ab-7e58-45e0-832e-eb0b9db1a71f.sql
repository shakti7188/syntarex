-- Fix signup failure caused by BEFORE INSERT trigger inserting into user_activity
-- user_activity.user_id has a foreign key to profiles(id), so inserting before the profile exists
-- violates the FK constraint during signup.

CREATE OR REPLACE FUNCTION public.handle_new_profile_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog', 'pg_temp'
AS $function$
BEGIN
  -- Generate username-based referral code and sequence number
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_username_referral_code(COALESCE(NEW.username, NEW.full_name, 'User'));
    NEW.referral_sequence_number := currval('referral_sequence_seq');
  END IF;
  
  -- NOTE: Do NOT insert into user_activity here.
  -- This function runs as a BEFORE INSERT trigger on public.profiles,
  -- so the profile row does not yet exist. Inserting into user_activity,
  -- which has a FK to profiles(id), causes a FK violation and breaks signup.
  -- user_activity rows are instead created by the AFTER INSERT trigger
  -- public.create_binary_tree_entry, which safely runs after the profile exists.
  
  -- Create referral chain when a sponsor is present
  IF NEW.sponsor_id IS NOT NULL THEN
    PERFORM create_referral_chain(NEW.id, NEW.sponsor_id, NEW.binary_position);
  END IF;
  
  RETURN NEW;
END;
$function$;