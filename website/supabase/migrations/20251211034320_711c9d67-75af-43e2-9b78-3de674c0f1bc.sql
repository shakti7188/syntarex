
-- Step 1: Drop the conflicting function with wrong parameter order (referrer_id, referee_id)
DROP FUNCTION IF EXISTS public.create_referral_chain(uuid, uuid, binary_position);

-- Step 2: Update handle_new_profile_referral to NOT call create_referral_chain
-- This trigger runs BEFORE INSERT so the profile doesn't exist yet
CREATE OR REPLACE FUNCTION public.handle_new_profile_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $function$
BEGIN
  -- Generate username-based referral code and sequence number
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_username_referral_code(COALESCE(NEW.username, NEW.full_name, 'User'));
    NEW.referral_sequence_number := currval('referral_sequence_seq');
  END IF;
  
  -- NOTE: Do NOT call create_referral_chain here.
  -- This is a BEFORE INSERT trigger, so the profile row does not exist yet.
  -- Referral chain and binary tree creation are handled by the AFTER INSERT trigger.
  
  RETURN NEW;
END;
$function$;

-- Step 3: Create/update the AFTER INSERT trigger function to handle referral chain
CREATE OR REPLACE FUNCTION public.create_binary_tree_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $function$
DECLARE
  v_sponsor_default_leg binary_position;
  v_actual_position binary_position;
  v_l2_sponsor_id uuid;
  v_l3_sponsor_id uuid;
BEGIN
  -- Create binary tree entry for new user
  INSERT INTO public.binary_tree (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user activity entry
  INSERT INTO public.user_activity (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- If user has a sponsor, set up referral chain and binary placement
  IF NEW.sponsor_id IS NOT NULL THEN
    -- Determine binary position from sponsor's default
    IF NEW.binary_position IS NULL THEN
      SELECT default_placement_leg INTO v_sponsor_default_leg
      FROM profiles
      WHERE id = NEW.sponsor_id;
      
      v_actual_position := COALESCE(v_sponsor_default_leg, 'left');
      
      -- Update the new user's profile with binary position
      UPDATE profiles
      SET binary_position = v_actual_position,
          binary_parent_id = NEW.sponsor_id
      WHERE id = NEW.id;
    ELSE
      v_actual_position := NEW.binary_position;
    END IF;
    
    -- Create Level 1 referral (direct)
    INSERT INTO referrals (referrer_id, referee_id, referral_level, binary_position, level, is_active)
    VALUES (NEW.sponsor_id, NEW.id, 1, v_actual_position, 1, true)
    ON CONFLICT DO NOTHING;
    
    -- Ensure sponsor has binary tree entry
    INSERT INTO binary_tree (user_id, left_leg_id, right_leg_id, left_volume, right_volume)
    VALUES (NEW.sponsor_id, NULL, NULL, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update sponsor's binary tree with new member
    IF v_actual_position = 'left' THEN
      UPDATE binary_tree
      SET left_leg_id = NEW.id,
          total_left_members = COALESCE(total_left_members, 0) + 1,
          updated_at = now()
      WHERE user_id = NEW.sponsor_id;
    ELSE
      UPDATE binary_tree
      SET right_leg_id = NEW.id,
          total_right_members = COALESCE(total_right_members, 0) + 1,
          updated_at = now()
      WHERE user_id = NEW.sponsor_id;
    END IF;
    
    -- Get L2 sponsor (sponsor's sponsor)
    SELECT sponsor_id INTO v_l2_sponsor_id
    FROM profiles
    WHERE id = NEW.sponsor_id;
    
    -- Create Level 2 referral if L2 sponsor exists
    IF v_l2_sponsor_id IS NOT NULL THEN
      INSERT INTO referrals (referrer_id, referee_id, referral_level, level, is_active)
      VALUES (v_l2_sponsor_id, NEW.id, 2, 2, true)
      ON CONFLICT DO NOTHING;
      
      -- Get L3 sponsor
      SELECT sponsor_id INTO v_l3_sponsor_id
      FROM profiles
      WHERE id = v_l2_sponsor_id;
      
      -- Create Level 3 referral if L3 sponsor exists
      IF v_l3_sponsor_id IS NOT NULL THEN
        INSERT INTO referrals (referrer_id, referee_id, referral_level, level, is_active)
        VALUES (v_l3_sponsor_id, NEW.id, 3, 3, true)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure the AFTER INSERT trigger exists
DROP TRIGGER IF EXISTS create_binary_tree_entry_trigger ON public.profiles;
CREATE TRIGGER create_binary_tree_entry_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_binary_tree_entry();
