-- Phase 3: Repair orphaned user jk1174@gmail.com
-- Set binary_position and binary_parent_id based on sponsor's preference

-- First, get the sponsor info and fix the orphaned user
WITH sponsor_info AS (
  SELECT 
    p.id as orphaned_user_id,
    p.sponsor_id,
    sp.default_placement_leg,
    bt.left_leg_id,
    bt.right_leg_id
  FROM profiles p
  JOIN profiles sp ON p.sponsor_id = sp.id
  LEFT JOIN binary_tree bt ON bt.user_id = p.sponsor_id
  WHERE p.email = 'jk1174@gmail.com'
    AND p.binary_position IS NULL
)
UPDATE profiles
SET 
  binary_position = COALESCE(
    (SELECT default_placement_leg FROM sponsor_info),
    'left'
  )::binary_position,
  binary_parent_id = (SELECT sponsor_id FROM sponsor_info)
WHERE email = 'jk1174@gmail.com'
  AND binary_position IS NULL;

-- Update sponsor's binary_tree to include the orphaned user in correct leg
WITH orphaned_user AS (
  SELECT id, sponsor_id, binary_position
  FROM profiles
  WHERE email = 'jk1174@gmail.com'
)
UPDATE binary_tree
SET 
  left_leg_id = CASE 
    WHEN (SELECT binary_position FROM orphaned_user) = 'left' 
      AND left_leg_id IS NULL 
    THEN (SELECT id FROM orphaned_user)
    ELSE left_leg_id
  END,
  right_leg_id = CASE 
    WHEN (SELECT binary_position FROM orphaned_user) = 'right' 
      AND right_leg_id IS NULL 
    THEN (SELECT id FROM orphaned_user)
    ELSE right_leg_id
  END,
  updated_at = now()
WHERE user_id = (SELECT sponsor_id FROM orphaned_user);

-- Create missing L2/L3 referral records for all users
-- This repairs the referral chain completeness
INSERT INTO referrals (referrer_id, referee_id, referral_level, level, is_active)
SELECT 
  sp2.sponsor_id as referrer_id,
  p.id as referee_id,
  2 as referral_level,
  2 as level,
  true as is_active
FROM profiles p
JOIN profiles sp1 ON p.sponsor_id = sp1.id
JOIN profiles sp2 ON sp1.sponsor_id = sp2.id
WHERE sp2.sponsor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM referrals r 
    WHERE r.referee_id = p.id 
      AND r.referrer_id = sp2.sponsor_id
      AND r.referral_level = 2
  )
ON CONFLICT (referrer_id, referee_id) DO NOTHING;

-- Create L3 referral records
INSERT INTO referrals (referrer_id, referee_id, referral_level, level, is_active)
SELECT 
  sp3.sponsor_id as referrer_id,
  p.id as referee_id,
  3 as referral_level,
  3 as level,
  true as is_active
FROM profiles p
JOIN profiles sp1 ON p.sponsor_id = sp1.id
JOIN profiles sp2 ON sp1.sponsor_id = sp2.id
JOIN profiles sp3 ON sp2.sponsor_id = sp3.id
WHERE sp3.sponsor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM referrals r 
    WHERE r.referee_id = p.id 
      AND r.referrer_id = sp3.sponsor_id
      AND r.referral_level = 3
  )
ON CONFLICT (referrer_id, referee_id) DO NOTHING;

-- Recalculate member counts for the entire tree using recursive update
WITH RECURSIVE tree_path AS (
  -- Start with leaf nodes (users with no one under them)
  SELECT 
    bt.user_id,
    bt.left_leg_id,
    bt.right_leg_id,
    1 as depth
  FROM binary_tree bt
  WHERE NOT EXISTS (
    SELECT 1 FROM binary_tree sub 
    WHERE sub.left_leg_id = bt.user_id OR sub.right_leg_id = bt.user_id
  )
  
  UNION ALL
  
  -- Walk up the tree
  SELECT 
    parent.user_id,
    parent.left_leg_id,
    parent.right_leg_id,
    tp.depth + 1
  FROM tree_path tp
  JOIN binary_tree parent ON parent.left_leg_id = tp.user_id OR parent.right_leg_id = tp.user_id
  WHERE tp.depth < 20
),
member_counts AS (
  SELECT 
    bt.user_id,
    COALESCE((
      SELECT COUNT(*) 
      FROM profiles p 
      WHERE p.binary_parent_id = bt.user_id 
        AND p.binary_position = 'left'
    ), 0) + 
    COALESCE((
      SELECT SUM(COALESCE(sub.total_left_members, 0) + COALESCE(sub.total_right_members, 0) + 1)
      FROM binary_tree sub
      WHERE sub.user_id IN (
        SELECT id FROM profiles WHERE binary_parent_id = bt.user_id AND binary_position = 'left'
      )
    ), 0) as left_count,
    COALESCE((
      SELECT COUNT(*) 
      FROM profiles p 
      WHERE p.binary_parent_id = bt.user_id 
        AND p.binary_position = 'right'
    ), 0) +
    COALESCE((
      SELECT SUM(COALESCE(sub.total_left_members, 0) + COALESCE(sub.total_right_members, 0) + 1)
      FROM binary_tree sub
      WHERE sub.user_id IN (
        SELECT id FROM profiles WHERE binary_parent_id = bt.user_id AND binary_position = 'right'
      )
    ), 0) as right_count
  FROM binary_tree bt
)
UPDATE binary_tree bt
SET 
  total_left_members = mc.left_count,
  total_right_members = mc.right_count,
  updated_at = now()
FROM member_counts mc
WHERE bt.user_id = mc.user_id;