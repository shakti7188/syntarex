-- Function to automatically update sponsor's binary tree when new user joins
CREATE OR REPLACE FUNCTION public.update_sponsor_binary_tree()
RETURNS TRIGGER AS $$
DECLARE
  v_sponsor_id UUID;
  v_binary_position TEXT;
  v_sponsor_tree RECORD;
BEGIN
  -- Get sponsor_id and binary_position from the new profile
  v_sponsor_id := NEW.sponsor_id;
  v_binary_position := NEW.binary_position;
  
  -- Only proceed if we have both sponsor_id and binary_position
  IF v_sponsor_id IS NULL OR v_binary_position IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the sponsor's binary tree entry
  SELECT * INTO v_sponsor_tree FROM binary_tree WHERE user_id = v_sponsor_id;
  
  -- If sponsor doesn't have a binary tree entry, create one
  IF NOT FOUND THEN
    INSERT INTO binary_tree (user_id, left_leg_id, right_leg_id, left_volume, right_volume, total_left_members, total_right_members)
    VALUES (
      v_sponsor_id,
      CASE WHEN v_binary_position = 'left' THEN NEW.id ELSE NULL END,
      CASE WHEN v_binary_position = 'right' THEN NEW.id ELSE NULL END,
      0, 0, 
      CASE WHEN v_binary_position = 'left' THEN 1 ELSE 0 END,
      CASE WHEN v_binary_position = 'right' THEN 1 ELSE 0 END
    );
  ELSE
    -- Update the sponsor's binary tree with the new member
    IF v_binary_position = 'left' AND v_sponsor_tree.left_leg_id IS NULL THEN
      UPDATE binary_tree 
      SET left_leg_id = NEW.id,
          total_left_members = COALESCE(total_left_members, 0) + 1,
          updated_at = now()
      WHERE user_id = v_sponsor_id;
    ELSIF v_binary_position = 'right' AND v_sponsor_tree.right_leg_id IS NULL THEN
      UPDATE binary_tree 
      SET right_leg_id = NEW.id,
          total_right_members = COALESCE(total_right_members, 0) + 1,
          updated_at = now()
      WHERE user_id = v_sponsor_id;
    END IF;
  END IF;
  
  -- Also ensure the new user has their own binary tree entry
  INSERT INTO binary_tree (user_id, left_volume, right_volume, total_left_members, total_right_members)
  VALUES (NEW.id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that fires after profile insert/update with sponsor_id and binary_position
DROP TRIGGER IF EXISTS trigger_update_sponsor_binary_tree ON profiles;
CREATE TRIGGER trigger_update_sponsor_binary_tree
  AFTER INSERT OR UPDATE OF sponsor_id, binary_position ON profiles
  FOR EACH ROW
  WHEN (NEW.sponsor_id IS NOT NULL AND NEW.binary_position IS NOT NULL)
  EXECUTE FUNCTION update_sponsor_binary_tree();

-- Function to repair orphaned binary tree entries (admin tool)
CREATE OR REPLACE FUNCTION public.repair_binary_tree_entries()
RETURNS TABLE (
  repaired_count INTEGER,
  details JSONB
) AS $$
DECLARE
  v_repaired INTEGER := 0;
  v_details JSONB := '[]'::JSONB;
  v_user RECORD;
BEGIN
  -- Find users with sponsor but missing binary tree link
  FOR v_user IN 
    SELECT p.id, p.sponsor_id, p.binary_position, p.email
    FROM profiles p
    WHERE p.sponsor_id IS NOT NULL
      AND p.binary_position IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM binary_tree bt 
        WHERE bt.user_id = p.sponsor_id
          AND (
            (p.binary_position = 'left' AND bt.left_leg_id IS NULL) OR
            (p.binary_position = 'right' AND bt.right_leg_id IS NULL)
          )
      )
  LOOP
    -- Update sponsor's binary tree
    IF v_user.binary_position = 'left' THEN
      UPDATE binary_tree 
      SET left_leg_id = v_user.id, updated_at = now()
      WHERE user_id = v_user.sponsor_id AND left_leg_id IS NULL;
    ELSE
      UPDATE binary_tree 
      SET right_leg_id = v_user.id, updated_at = now()
      WHERE user_id = v_user.sponsor_id AND right_leg_id IS NULL;
    END IF;
    
    v_repaired := v_repaired + 1;
    v_details := v_details || jsonb_build_object('user_id', v_user.id, 'email', v_user.email, 'position', v_user.binary_position);
  END LOOP;
  
  -- Ensure all users have binary_tree entries
  INSERT INTO binary_tree (user_id, left_volume, right_volume, total_left_members, total_right_members)
  SELECT id, 0, 0, 0, 0 FROM profiles
  WHERE id NOT IN (SELECT user_id FROM binary_tree)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN QUERY SELECT v_repaired, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;