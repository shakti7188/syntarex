
-- Step 1: Create the upline propagation function
CREATE OR REPLACE FUNCTION public.update_upline_member_counts(
  p_new_member_id uuid,
  p_direct_sponsor_id uuid,
  p_position binary_position
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_id uuid;
  v_parent_id uuid;
  v_child_position binary_position;
BEGIN
  -- Start from direct sponsor
  v_current_id := p_direct_sponsor_id;
  v_child_position := p_position;
  
  -- Walk up the tree and increment counts
  WHILE v_current_id IS NOT NULL LOOP
    -- Increment the appropriate counter
    IF v_child_position = 'left' THEN
      UPDATE binary_tree
      SET total_left_members = COALESCE(total_left_members, 0) + 1,
          updated_at = now()
      WHERE user_id = v_current_id;
    ELSE
      UPDATE binary_tree
      SET total_right_members = COALESCE(total_right_members, 0) + 1,
          updated_at = now()
      WHERE user_id = v_current_id;
    END IF;
    
    -- Get parent and determine which leg current user is in
    SELECT binary_parent_id, binary_position 
    INTO v_parent_id, v_child_position
    FROM profiles
    WHERE id = v_current_id;
    
    v_current_id := v_parent_id;
  END LOOP;
END;
$$;

-- Step 2: Update the trigger function to use upline propagation
CREATE OR REPLACE FUNCTION public.create_binary_tree_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $$
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
    
    -- Update sponsor's binary tree with new member's direct leg pointer
    IF v_actual_position = 'left' THEN
      UPDATE binary_tree
      SET left_leg_id = NEW.id,
          updated_at = now()
      WHERE user_id = NEW.sponsor_id;
    ELSE
      UPDATE binary_tree
      SET right_leg_id = NEW.id,
          updated_at = now()
      WHERE user_id = NEW.sponsor_id;
    END IF;
    
    -- Propagate member counts up the entire tree
    PERFORM update_upline_member_counts(NEW.id, NEW.sponsor_id, v_actual_position);
    
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
$$;

-- Step 3: Fix existing data - Reset all counts first
UPDATE binary_tree SET total_left_members = 0, total_right_members = 0;

-- Step 4: Recalculate counts using recursive logic
-- For each user with members in their downline, count recursively
WITH RECURSIVE left_tree AS (
  -- Base case: direct left leg children
  SELECT bt.user_id as root_id, bt.left_leg_id as member_id, 1 as depth
  FROM binary_tree bt
  WHERE bt.left_leg_id IS NOT NULL
  
  UNION ALL
  
  -- Recursive case: traverse down both legs of each member
  SELECT lt.root_id, child.member_id, lt.depth + 1
  FROM left_tree lt
  JOIN (
    SELECT user_id, left_leg_id as member_id FROM binary_tree WHERE left_leg_id IS NOT NULL
    UNION ALL
    SELECT user_id, right_leg_id as member_id FROM binary_tree WHERE right_leg_id IS NOT NULL
  ) child ON child.user_id = lt.member_id
  WHERE lt.depth < 20
),
right_tree AS (
  -- Base case: direct right leg children
  SELECT bt.user_id as root_id, bt.right_leg_id as member_id, 1 as depth
  FROM binary_tree bt
  WHERE bt.right_leg_id IS NOT NULL
  
  UNION ALL
  
  -- Recursive case: traverse down both legs of each member
  SELECT rt.root_id, child.member_id, rt.depth + 1
  FROM right_tree rt
  JOIN (
    SELECT user_id, left_leg_id as member_id FROM binary_tree WHERE left_leg_id IS NOT NULL
    UNION ALL
    SELECT user_id, right_leg_id as member_id FROM binary_tree WHERE right_leg_id IS NOT NULL
  ) child ON child.user_id = rt.member_id
  WHERE rt.depth < 20
),
left_counts AS (
  SELECT root_id, COUNT(DISTINCT member_id) as cnt
  FROM left_tree
  GROUP BY root_id
),
right_counts AS (
  SELECT root_id, COUNT(DISTINCT member_id) as cnt
  FROM right_tree
  GROUP BY root_id
)
UPDATE binary_tree bt
SET 
  total_left_members = COALESCE(lc.cnt, 0),
  total_right_members = COALESCE(rc.cnt, 0)
FROM (SELECT user_id FROM binary_tree) all_users
LEFT JOIN left_counts lc ON lc.root_id = all_users.user_id
LEFT JOIN right_counts rc ON rc.root_id = all_users.user_id
WHERE bt.user_id = all_users.user_id;
