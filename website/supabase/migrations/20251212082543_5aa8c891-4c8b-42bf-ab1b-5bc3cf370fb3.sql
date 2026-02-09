-- Step 1: Repair LEFT leg pointers
-- Set left_leg_id based on profiles where binary_parent_id matches and position is 'left'
UPDATE binary_tree bt
SET left_leg_id = p.id,
    updated_at = now()
FROM profiles p
WHERE p.binary_parent_id = bt.user_id
  AND p.binary_position = 'left'
  AND bt.left_leg_id IS NULL;

-- Step 2: Repair RIGHT leg pointers
-- Set right_leg_id based on profiles where binary_parent_id matches and position is 'right'
UPDATE binary_tree bt
SET right_leg_id = p.id,
    updated_at = now()
FROM profiles p
WHERE p.binary_parent_id = bt.user_id
  AND p.binary_position = 'right'
  AND bt.right_leg_id IS NULL;

-- Step 3: Reset all member counts to recalculate fresh
UPDATE binary_tree 
SET total_left_members = 0, 
    total_right_members = 0,
    updated_at = now();

-- Step 4: Recalculate all member counts using recursive traversal
-- For each user, count all descendants in their left and right subtrees
WITH RECURSIVE 
-- Get all descendant counts for left leg
left_descendants AS (
  -- Base: direct left leg children
  SELECT 
    bt.user_id as root_user_id,
    bt.left_leg_id as descendant_id,
    1 as depth
  FROM binary_tree bt
  WHERE bt.left_leg_id IS NOT NULL
  
  UNION ALL
  
  -- Recursive: all descendants of left leg (both left and right children of descendants)
  SELECT 
    ld.root_user_id,
    COALESCE(bt.left_leg_id, bt.right_leg_id) as descendant_id,
    ld.depth + 1
  FROM left_descendants ld
  JOIN binary_tree bt ON bt.user_id = ld.descendant_id
  WHERE (bt.left_leg_id IS NOT NULL OR bt.right_leg_id IS NOT NULL)
    AND ld.depth < 50
),
-- Expand to get ALL descendants in left subtree
left_all_descendants AS (
  SELECT root_user_id, descendant_id FROM left_descendants WHERE descendant_id IS NOT NULL
  UNION
  SELECT ld.root_user_id, bt.right_leg_id
  FROM left_descendants ld
  JOIN binary_tree bt ON bt.user_id = ld.descendant_id
  WHERE bt.right_leg_id IS NOT NULL
),
-- Count left descendants per user
left_counts AS (
  SELECT 
    root_user_id as user_id,
    COUNT(DISTINCT descendant_id) as left_count
  FROM (
    -- Direct left child
    SELECT user_id as root_user_id, left_leg_id as descendant_id 
    FROM binary_tree WHERE left_leg_id IS NOT NULL
    UNION ALL
    -- All descendants under left child
    SELECT 
      bt_parent.user_id as root_user_id,
      descendants.id as descendant_id
    FROM binary_tree bt_parent
    CROSS JOIN LATERAL (
      WITH RECURSIVE tree AS (
        SELECT id FROM profiles WHERE id = bt_parent.left_leg_id
        UNION ALL
        SELECT p.id FROM profiles p JOIN tree t ON p.binary_parent_id = t.id
      )
      SELECT id FROM tree
    ) descendants
    WHERE bt_parent.left_leg_id IS NOT NULL
  ) all_left
  GROUP BY root_user_id
),
-- Get all descendant counts for right leg
right_counts AS (
  SELECT 
    root_user_id as user_id,
    COUNT(DISTINCT descendant_id) as right_count
  FROM (
    -- Direct right child
    SELECT user_id as root_user_id, right_leg_id as descendant_id 
    FROM binary_tree WHERE right_leg_id IS NOT NULL
    UNION ALL
    -- All descendants under right child
    SELECT 
      bt_parent.user_id as root_user_id,
      descendants.id as descendant_id
    FROM binary_tree bt_parent
    CROSS JOIN LATERAL (
      WITH RECURSIVE tree AS (
        SELECT id FROM profiles WHERE id = bt_parent.right_leg_id
        UNION ALL
        SELECT p.id FROM profiles p JOIN tree t ON p.binary_parent_id = t.id
      )
      SELECT id FROM tree
    ) descendants
    WHERE bt_parent.right_leg_id IS NOT NULL
  ) all_right
  GROUP BY root_user_id
)
UPDATE binary_tree bt
SET 
  total_left_members = COALESCE(lc.left_count, 0),
  total_right_members = COALESCE(rc.right_count, 0),
  updated_at = now()
FROM binary_tree bt2
LEFT JOIN left_counts lc ON lc.user_id = bt2.user_id
LEFT JOIN right_counts rc ON rc.user_id = bt2.user_id
WHERE bt.user_id = bt2.user_id;