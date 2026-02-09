-- Create the create_referral_chain function that handles referral signup
CREATE OR REPLACE FUNCTION public.create_referral_chain(
  p_referrer_id uuid,
  p_referee_id uuid,
  p_binary_position binary_position DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sponsor_default_leg binary_position;
  v_actual_position binary_position;
  v_l2_sponsor_id uuid;
  v_l3_sponsor_id uuid;
BEGIN
  -- Get sponsor's default placement leg if no position specified
  IF p_binary_position IS NULL THEN
    SELECT default_placement_leg INTO v_sponsor_default_leg
    FROM profiles
    WHERE id = p_referrer_id;
    
    v_actual_position := COALESCE(v_sponsor_default_leg, 'left');
  ELSE
    v_actual_position := p_binary_position;
  END IF;

  -- Create Level 1 referral (direct)
  INSERT INTO referrals (referrer_id, referee_id, referral_level, binary_position, level, is_active)
  VALUES (p_referrer_id, p_referee_id, 1, v_actual_position, 1, true)
  ON CONFLICT DO NOTHING;

  -- Update referee's profile with binary position
  UPDATE profiles
  SET binary_position = v_actual_position,
      binary_parent_id = p_referrer_id
  WHERE id = p_referee_id;

  -- Create or update binary tree entry for referee
  INSERT INTO binary_tree (user_id, left_leg_id, right_leg_id, left_volume, right_volume)
  VALUES (p_referee_id, NULL, NULL, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update sponsor's binary tree
  IF v_actual_position = 'left' THEN
    UPDATE binary_tree
    SET left_leg_id = p_referee_id,
        total_left_members = COALESCE(total_left_members, 0) + 1,
        updated_at = now()
    WHERE user_id = p_referrer_id;
  ELSE
    UPDATE binary_tree
    SET right_leg_id = p_referee_id,
        total_right_members = COALESCE(total_right_members, 0) + 1,
        updated_at = now()
    WHERE user_id = p_referrer_id;
  END IF;

  -- Create binary tree entry for sponsor if doesn't exist
  INSERT INTO binary_tree (user_id, left_leg_id, right_leg_id, left_volume, right_volume)
  VALUES (p_referrer_id, 
          CASE WHEN v_actual_position = 'left' THEN p_referee_id ELSE NULL END,
          CASE WHEN v_actual_position = 'right' THEN p_referee_id ELSE NULL END,
          0, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    left_leg_id = CASE WHEN v_actual_position = 'left' THEN p_referee_id ELSE binary_tree.left_leg_id END,
    right_leg_id = CASE WHEN v_actual_position = 'right' THEN p_referee_id ELSE binary_tree.right_leg_id END,
    total_left_members = CASE WHEN v_actual_position = 'left' THEN COALESCE(binary_tree.total_left_members, 0) + 1 ELSE binary_tree.total_left_members END,
    total_right_members = CASE WHEN v_actual_position = 'right' THEN COALESCE(binary_tree.total_right_members, 0) + 1 ELSE binary_tree.total_right_members END,
    updated_at = now();

  -- Get L2 sponsor (sponsor's sponsor)
  SELECT sponsor_id INTO v_l2_sponsor_id
  FROM profiles
  WHERE id = p_referrer_id;

  -- Create Level 2 referral if L2 sponsor exists
  IF v_l2_sponsor_id IS NOT NULL THEN
    INSERT INTO referrals (referrer_id, referee_id, referral_level, level, is_active)
    VALUES (v_l2_sponsor_id, p_referee_id, 2, 2, true)
    ON CONFLICT DO NOTHING;

    -- Get L3 sponsor (sponsor's sponsor's sponsor)
    SELECT sponsor_id INTO v_l3_sponsor_id
    FROM profiles
    WHERE id = v_l2_sponsor_id;

    -- Create Level 3 referral if L3 sponsor exists
    IF v_l3_sponsor_id IS NOT NULL THEN
      INSERT INTO referrals (referrer_id, referee_id, referral_level, level, is_active)
      VALUES (v_l3_sponsor_id, p_referee_id, 3, 3, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END;
$$;