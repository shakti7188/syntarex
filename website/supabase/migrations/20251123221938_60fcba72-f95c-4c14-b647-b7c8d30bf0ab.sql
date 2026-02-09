-- Create rank definitions table
CREATE TABLE public.rank_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name TEXT NOT NULL UNIQUE,
  rank_level INTEGER NOT NULL UNIQUE,
  rank_color TEXT NOT NULL,
  min_personal_sales NUMERIC NOT NULL DEFAULT 0,
  min_team_sales NUMERIC NOT NULL DEFAULT 0,
  min_left_leg_volume NUMERIC NOT NULL DEFAULT 0,
  min_right_leg_volume NUMERIC NOT NULL DEFAULT 0,
  min_hashrate_ths NUMERIC NOT NULL DEFAULT 0,
  min_direct_referrals INTEGER NOT NULL DEFAULT 0,
  benefits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user rank history table
CREATE TABLE public.user_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_rank TEXT,
  new_rank TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  criteria_met JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.rank_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rank_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for rank_definitions
CREATE POLICY "Anyone can view rank definitions"
ON public.rank_definitions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage rank definitions"
ON public.rank_definitions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for user_rank_history
CREATE POLICY "Users can view their own rank history"
ON public.user_rank_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rank history"
ON public.user_rank_history FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only system/admins can insert rank history"
ON public.user_rank_history FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default rank definitions
INSERT INTO public.rank_definitions (rank_name, rank_level, rank_color, min_personal_sales, min_team_sales, min_left_leg_volume, min_right_leg_volume, min_hashrate_ths, min_direct_referrals, benefits) VALUES
('Member', 1, 'hsl(var(--muted))', 0, 0, 0, 0, 0, 0, '["Access to basic platform features", "Standard commission rates"]'),
('Bronze Partner', 2, 'hsl(28, 65%, 50%)', 5000, 10000, 5000, 5000, 100, 3, '["5% bonus on direct commissions", "Priority support", "Bronze badge"]'),
('Silver Partner', 3, 'hsl(0, 0%, 75%)', 15000, 50000, 20000, 20000, 300, 5, '["10% bonus on direct commissions", "Silver badge", "Monthly performance bonuses", "Access to advanced analytics"]'),
('Gold Partner', 4, 'hsl(45, 100%, 50%)', 30000, 150000, 50000, 50000, 600, 10, '["15% bonus on direct commissions", "Gold badge", "Exclusive training materials", "Priority withdrawal processing"]'),
('Platinum Partner', 5, 'hsl(200, 20%, 80%)', 75000, 500000, 150000, 150000, 1500, 20, '["20% bonus on direct commissions", "Platinum badge", "Annual leadership retreat", "Dedicated account manager"]'),
('Diamond Partner', 6, 'hsl(210, 100%, 70%)', 150000, 1500000, 500000, 500000, 3000, 40, '["25% bonus on direct commissions", "Diamond badge", "Profit sharing opportunities", "Lifetime residual income protection"]'),
('Executive', 7, 'hsl(280, 70%, 60%)', 300000, 5000000, 1500000, 1500000, 6000, 80, '["30% bonus on direct commissions", "Executive badge", "Board advisory role", "Company equity participation", "Global recognition awards"]');

-- Create function to calculate user rank qualification
CREATE OR REPLACE FUNCTION public.calculate_user_rank(p_user_id UUID)
RETURNS TABLE (
  qualified_rank_name TEXT,
  qualified_rank_level INTEGER,
  personal_sales NUMERIC,
  team_sales NUMERIC,
  left_leg_volume NUMERIC,
  right_leg_volume NUMERIC,
  total_hashrate NUMERIC,
  direct_referral_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_personal_sales NUMERIC;
  v_team_sales NUMERIC;
  v_left_volume NUMERIC;
  v_right_volume NUMERIC;
  v_hashrate NUMERIC;
  v_referral_count INTEGER;
  v_rank_name TEXT;
  v_rank_level INTEGER;
BEGIN
  -- Calculate personal sales (sum of user's transactions)
  SELECT COALESCE(SUM(amount), 0) INTO v_personal_sales
  FROM transactions
  WHERE user_id = p_user_id AND is_eligible = true;

  -- Calculate team sales (sum of downline transactions)
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

  -- Calculate total hashrate
  SELECT COALESCE(SUM(mt.hash_rate_ths), 0) INTO v_hashrate
  FROM machine_inventory mi
  JOIN machine_types mt ON mi.machine_type_id = mt.id
  WHERE mi.user_id = p_user_id AND mi.status = 'ACTIVE';

  -- Count direct referrals
  SELECT COUNT(*) INTO v_referral_count
  FROM referrals
  WHERE referrer_id = p_user_id AND referral_level = 1 AND is_active = true;

  -- Find highest qualifying rank
  SELECT rd.rank_name, rd.rank_level INTO v_rank_name, v_rank_level
  FROM rank_definitions rd
  WHERE v_personal_sales >= rd.min_personal_sales
    AND v_team_sales >= rd.min_team_sales
    AND v_left_volume >= rd.min_left_leg_volume
    AND v_right_volume >= rd.min_right_leg_volume
    AND v_hashrate >= rd.min_hashrate_ths
    AND v_referral_count >= rd.min_direct_referrals
  ORDER BY rd.rank_level DESC
  LIMIT 1;

  -- Return results
  RETURN QUERY SELECT 
    COALESCE(v_rank_name, 'Member'),
    COALESCE(v_rank_level, 1),
    v_personal_sales,
    v_team_sales,
    v_left_volume,
    v_right_volume,
    v_hashrate,
    v_referral_count;
END;
$$;