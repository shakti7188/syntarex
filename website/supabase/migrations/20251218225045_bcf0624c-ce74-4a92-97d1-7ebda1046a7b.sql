
-- Create function to evaluate and promote user rank
CREATE OR REPLACE FUNCTION public.evaluate_and_promote_user_rank(p_user_id uuid)
RETURNS TABLE(
  promoted boolean,
  old_rank_name text,
  new_rank_name text,
  old_rank_level integer,
  new_rank_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_personal_sales NUMERIC;
  v_team_sales NUMERIC;
  v_left_volume NUMERIC;
  v_right_volume NUMERIC;
  v_hashrate NUMERIC;
  v_referral_count INTEGER;
  v_current_rank TEXT;
  v_current_rank_level INTEGER;
  v_new_rank_name TEXT;
  v_new_rank_level INTEGER;
  v_rank_record RECORD;
BEGIN
  -- Get current rank from profiles
  SELECT COALESCE(p.rank, 'Member'), COALESCE(rd.rank_level, 1)
  INTO v_current_rank, v_current_rank_level
  FROM profiles p
  LEFT JOIN rank_definitions rd ON rd.rank_name = p.rank
  WHERE p.id = p_user_id;

  -- Calculate personal sales (sum of user's transactions)
  SELECT COALESCE(SUM(amount), 0) INTO v_personal_sales
  FROM transactions
  WHERE user_id = p_user_id AND is_eligible = true;

  -- Calculate team sales (sum of downline L1-L3 transactions)
  SELECT COALESCE(SUM(t.amount), 0) INTO v_team_sales
  FROM transactions t
  WHERE t.user_id IN (
    SELECT referee_id FROM referrals WHERE referrer_id = p_user_id
  ) AND t.is_eligible = true;

  -- Get binary volumes
  SELECT 
    COALESCE(left_volume, 0),
    COALESCE(right_volume, 0)
  INTO v_left_volume, v_right_volume
  FROM binary_tree
  WHERE user_id = p_user_id;

  -- If no binary tree entry, set volumes to 0
  IF NOT FOUND THEN
    v_left_volume := 0;
    v_right_volume := 0;
  END IF;

  -- Calculate total hashrate from active machines
  SELECT COALESCE(SUM(mt.hash_rate_ths), 0) INTO v_hashrate
  FROM machine_inventory mi
  JOIN machine_types mt ON mi.machine_type_id = mt.id
  WHERE mi.user_id = p_user_id AND mi.status = 'ACTIVE';

  -- Count direct referrals (L1 only)
  SELECT COUNT(*) INTO v_referral_count
  FROM referrals
  WHERE referrer_id = p_user_id AND referral_level = 1 AND is_active = true;

  -- Find highest qualifying rank
  SELECT rd.rank_name, rd.rank_level 
  INTO v_new_rank_name, v_new_rank_level
  FROM rank_definitions rd
  WHERE v_personal_sales >= rd.min_personal_sales
    AND v_team_sales >= rd.min_team_sales
    AND v_left_volume >= rd.min_left_leg_volume
    AND v_right_volume >= rd.min_right_leg_volume
    AND v_hashrate >= rd.min_hashrate_ths
    AND v_referral_count >= rd.min_direct_referrals
  ORDER BY rd.rank_level DESC
  LIMIT 1;

  -- Default to Member if no rank qualifies
  IF v_new_rank_name IS NULL THEN
    v_new_rank_name := 'Member';
    v_new_rank_level := 1;
  END IF;

  -- Check if user qualifies for higher rank
  IF v_new_rank_level > v_current_rank_level THEN
    -- Update profile with new rank
    UPDATE profiles SET rank = v_new_rank_name, updated_at = now()
    WHERE id = p_user_id;

    -- Record rank history
    INSERT INTO user_rank_history (
      user_id, 
      old_rank, 
      new_rank, 
      rank_level,
      achieved_at, 
      criteria_met
    ) VALUES (
      p_user_id,
      v_current_rank,
      v_new_rank_name,
      v_new_rank_level,
      now(),
      jsonb_build_object(
        'personal_sales', v_personal_sales,
        'team_sales', v_team_sales,
        'left_volume', v_left_volume,
        'right_volume', v_right_volume,
        'hashrate', v_hashrate,
        'direct_referrals', v_referral_count
      )
    );

    RETURN QUERY SELECT true, v_current_rank, v_new_rank_name, v_current_rank_level, v_new_rank_level;
  ELSE
    RETURN QUERY SELECT false, v_current_rank, v_current_rank, v_current_rank_level, v_current_rank_level;
  END IF;
END;
$$;

-- Create trigger function to evaluate rank on binary tree updates
CREATE OR REPLACE FUNCTION public.trigger_evaluate_rank_on_volume_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only evaluate if volumes actually changed
  IF OLD.left_volume IS DISTINCT FROM NEW.left_volume 
     OR OLD.right_volume IS DISTINCT FROM NEW.right_volume THEN
    PERFORM evaluate_and_promote_user_rank(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger function to evaluate rank on new transaction
CREATE OR REPLACE FUNCTION public.trigger_evaluate_rank_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Evaluate the user who made the transaction
  PERFORM evaluate_and_promote_user_rank(NEW.user_id);
  
  -- Also evaluate all upline referrers (they might qualify for higher ranks due to team sales)
  FOR v_referrer_id IN 
    SELECT DISTINCT referrer_id FROM referrals WHERE referee_id = NEW.user_id
  LOOP
    PERFORM evaluate_and_promote_user_rank(v_referrer_id);
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger function to evaluate rank on new referral
CREATE OR REPLACE FUNCTION public.trigger_evaluate_rank_on_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Evaluate the referrer who gained a new team member
  PERFORM evaluate_and_promote_user_rank(NEW.referrer_id);
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS evaluate_rank_on_volume_update ON binary_tree;
CREATE TRIGGER evaluate_rank_on_volume_update
  AFTER UPDATE ON binary_tree
  FOR EACH ROW
  EXECUTE FUNCTION trigger_evaluate_rank_on_volume_update();

DROP TRIGGER IF EXISTS evaluate_rank_on_transaction ON transactions;
CREATE TRIGGER evaluate_rank_on_transaction
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_evaluate_rank_on_transaction();

DROP TRIGGER IF EXISTS evaluate_rank_on_referral ON referrals;
CREATE TRIGGER evaluate_rank_on_referral
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_evaluate_rank_on_referral();

-- Function to bulk evaluate all users (for admin use)
CREATE OR REPLACE FUNCTION public.bulk_evaluate_all_ranks()
RETURNS TABLE(
  total_evaluated integer,
  total_promoted integer,
  promotions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_result RECORD;
  v_evaluated INTEGER := 0;
  v_promoted INTEGER := 0;
  v_promotions JSONB := '[]'::JSONB;
BEGIN
  FOR v_user_id IN SELECT id FROM profiles
  LOOP
    SELECT * INTO v_result FROM evaluate_and_promote_user_rank(v_user_id);
    v_evaluated := v_evaluated + 1;
    
    IF v_result.promoted THEN
      v_promoted := v_promoted + 1;
      v_promotions := v_promotions || jsonb_build_object(
        'user_id', v_user_id,
        'old_rank', v_result.old_rank_name,
        'new_rank', v_result.new_rank_name
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_evaluated, v_promoted, v_promotions;
END;
$$;

-- Admin function to manually set rank (for overrides)
CREATE OR REPLACE FUNCTION public.admin_set_user_rank(
  p_user_id uuid,
  p_new_rank text,
  p_reason text DEFAULT 'Manual admin override'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_rank TEXT;
  v_new_rank_level INTEGER;
BEGIN
  -- Get current rank
  SELECT rank INTO v_current_rank FROM profiles WHERE id = p_user_id;
  
  -- Validate new rank exists
  SELECT rank_level INTO v_new_rank_level FROM rank_definitions WHERE rank_name = p_new_rank;
  IF v_new_rank_level IS NULL THEN
    RAISE EXCEPTION 'Invalid rank name: %', p_new_rank;
  END IF;
  
  -- Update profile
  UPDATE profiles SET rank = p_new_rank, updated_at = now() WHERE id = p_user_id;
  
  -- Record in history
  INSERT INTO user_rank_history (
    user_id, old_rank, new_rank, rank_level, achieved_at, criteria_met
  ) VALUES (
    p_user_id, v_current_rank, p_new_rank, v_new_rank_level, now(),
    jsonb_build_object('reason', p_reason, 'type', 'manual_override')
  );
  
  RETURN true;
END;
$$;

-- Enable realtime for user_rank_history so we can listen for promotions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_rank_history;
