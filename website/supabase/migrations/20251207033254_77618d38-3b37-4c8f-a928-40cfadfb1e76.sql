
-- =====================================================
-- PHASE 1: SYNTERAX COMPENSATION SYSTEM DATABASE SCHEMA
-- =====================================================

-- 1. Clear existing rank definitions and add new army-style ranks
DELETE FROM public.rank_definitions;

INSERT INTO public.rank_definitions (rank_name, rank_level, rank_color, min_personal_sales, min_team_sales, min_left_leg_volume, min_right_leg_volume, min_hashrate_ths, min_direct_referrals, benefits) VALUES
('Private', 1, '#6B7280', 0, 0, 1000, 0, 0, 0, '[]'::jsonb),
('Corporal', 2, '#4B5563', 0, 0, 5000, 0, 0, 0, '[]'::jsonb),
('Sergeant', 3, '#374151', 0, 0, 25000, 0, 0, 0, '{"rank_bonus": 500}'::jsonb),
('Lieutenant', 4, '#1F2937', 0, 0, 75000, 0, 0, 0, '{"rank_bonus": 1000}'::jsonb),
('Captain', 5, '#0052FF', 0, 0, 200000, 0, 0, 0, '{"rank_bonus": 2500}'::jsonb),
('Major', 6, '#3B82F6', 0, 0, 500000, 0, 0, 0, '{"rank_bonus": 7000}'::jsonb),
('Colonel', 7, '#F59E0B', 0, 0, 2000000, 0, 0, 0, '{"rank_bonus": 25000}'::jsonb),
('General', 8, '#EF4444', 0, 0, 5000000, 0, 0, 0, '{"rank_bonus": 75000}'::jsonb),
('5-Star General', 9, '#8B5CF6', 0, 0, 12000000, 0, 0, 0, '{"rank_bonus": 150000}'::jsonb);

-- 2. Create ghost_bv table for first 10 days boost
CREATE TABLE public.ghost_bv (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_purchase_id UUID REFERENCES public.package_purchases(id),
  ghost_bv_amount NUMERIC NOT NULL DEFAULT 0,
  original_package_value NUMERIC NOT NULL DEFAULT 0,
  pay_leg TEXT CHECK (pay_leg IN ('left', 'right')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'flushed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create staking_positions table
CREATE TABLE public.staking_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_amount NUMERIC NOT NULL DEFAULT 0,
  token_symbol TEXT NOT NULL DEFAULT 'SYNTERAX',
  staked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unstaked_at TIMESTAMP WITH TIME ZONE,
  daily_btc_rate NUMERIC NOT NULL DEFAULT 0,
  total_btc_earned NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unstaked', 'locked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create staking_rewards table for daily BTC rewards
CREATE TABLE public.staking_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  staking_position_id UUID NOT NULL REFERENCES public.staking_positions(id) ON DELETE CASCADE,
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  btc_earned NUMERIC NOT NULL DEFAULT 0,
  override_paid_to_sponsor NUMERIC NOT NULL DEFAULT 0,
  sponsor_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'claimed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staking_position_id, reward_date)
);

-- 5. Create leadership_pool_distributions table
CREATE TABLE public.leadership_pool_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_weekly_volume NUMERIC NOT NULL DEFAULT 0,
  total_pool_amount NUMERIC NOT NULL DEFAULT 0,
  tier_1_5_percent NUMERIC NOT NULL DEFAULT 0,
  tier_1_0_percent NUMERIC NOT NULL DEFAULT 0,
  tier_0_5_percent NUMERIC NOT NULL DEFAULT 0,
  qualified_leaders JSONB DEFAULT '[]'::jsonb,
  distribution_status TEXT NOT NULL DEFAULT 'pending' CHECK (distribution_status IN ('pending', 'calculated', 'distributed')),
  distributed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

-- 6. Create rank_weekly_caps table
CREATE TABLE public.rank_weekly_caps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rank_name TEXT NOT NULL UNIQUE,
  weekly_cap_usd NUMERIC NOT NULL DEFAULT 0,
  hard_cap_usd NUMERIC NOT NULL DEFAULT 40000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert rank weekly caps
INSERT INTO public.rank_weekly_caps (rank_name, weekly_cap_usd, hard_cap_usd) VALUES
('Private', 250, 40000),
('Corporal', 250, 40000),
('Sergeant', 500, 40000),
('Lieutenant', 2000, 40000),
('Captain', 5000, 40000),
('Major', 7500, 40000),
('Colonel', 10000, 40000),
('General', 15000, 40000),
('5-Star General', 20000, 40000);

-- 7. Add package_unlock_level to packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS commission_unlock_level INTEGER DEFAULT 1;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS bv_percent NUMERIC DEFAULT 80;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS is_premium_bonus_eligible BOOLEAN DEFAULT false;

-- Update packages with commission unlock levels based on price
UPDATE public.packages SET commission_unlock_level = 
  CASE 
    WHEN price_usd >= 1000 THEN 3
    WHEN price_usd >= 500 THEN 2
    ELSE 1
  END;

-- 8. Update/Insert commission settings for Synterax model
INSERT INTO public.commission_settings (setting_name, setting_value, min_value, max_value, description) VALUES
('direct_tier_1_rate', 10, 0, 100, 'Direct referral Level 1 commission rate (%)'),
('direct_tier_2_rate', 5, 0, 100, 'Direct referral Level 2 commission rate (%)'),
('direct_tier_3_rate', 5, 0, 100, 'Direct referral Level 3 commission rate (%)'),
('staking_override_rate', 10, 0, 100, 'Override on direct referrals staking rewards (%)'),
('ghost_bv_percent', 80, 0, 100, 'Ghost BV percentage of package value'),
('ghost_bv_duration_days', 10, 1, 30, 'Ghost BV active duration in days'),
('leadership_pool_percent', 3, 0, 10, 'Leadership pool percentage of total volume'),
('leadership_tier_1_share', 1.5, 0, 5, 'Leadership pool tier 1 share (%)'),
('leadership_tier_2_share', 1.0, 0, 5, 'Leadership pool tier 2 share (%)'),
('leadership_tier_3_share', 0.5, 0, 5, 'Leadership pool tier 3 share (%)'),
('binary_weak_leg_rate', 10, 0, 20, 'Binary commission on weak leg volume (%)'),
('volume_flush_days', 180, 30, 365, 'Volume flush cycle in days'),
('global_payout_cap_percent', 40, 0, 100, 'Maximum payout as percentage of total volume'),
('premium_l1_bonus_rate', 100, 0, 200, 'Premium package Level 1 bonus rate (%)')
ON CONFLICT (setting_name) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  description = EXCLUDED.description,
  updated_at = now();

-- 9. Create user_weekly_earnings table to track caps
CREATE TABLE public.user_weekly_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  binary_earnings NUMERIC NOT NULL DEFAULT 0,
  direct_earnings NUMERIC NOT NULL DEFAULT 0,
  override_earnings NUMERIC NOT NULL DEFAULT 0,
  leadership_earnings NUMERIC NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  cap_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- 10. Enable RLS on all new tables
ALTER TABLE public.ghost_bv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_pool_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_weekly_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_earnings ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for ghost_bv
CREATE POLICY "Users can view their own ghost_bv" ON public.ghost_bv
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ghost_bv" ON public.ghost_bv
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. RLS Policies for staking_positions
CREATE POLICY "Users can view their own staking_positions" ON public.staking_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staking_positions" ON public.staking_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staking_positions" ON public.staking_positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all staking_positions" ON public.staking_positions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 13. RLS Policies for staking_rewards
CREATE POLICY "Users can view their own staking_rewards" ON public.staking_rewards
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = sponsor_id);

CREATE POLICY "Admins can manage all staking_rewards" ON public.staking_rewards
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. RLS Policies for leadership_pool_distributions
CREATE POLICY "Anyone can view leadership_pool_distributions" ON public.leadership_pool_distributions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage leadership_pool_distributions" ON public.leadership_pool_distributions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 15. RLS Policies for rank_weekly_caps
CREATE POLICY "Anyone can view rank_weekly_caps" ON public.rank_weekly_caps
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rank_weekly_caps" ON public.rank_weekly_caps
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 16. RLS Policies for user_weekly_earnings
CREATE POLICY "Users can view their own weekly_earnings" ON public.user_weekly_earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all weekly_earnings" ON public.user_weekly_earnings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 17. Create indexes for performance
CREATE INDEX idx_ghost_bv_user_status ON public.ghost_bv(user_id, status);
CREATE INDEX idx_ghost_bv_expires ON public.ghost_bv(expires_at) WHERE status = 'active';
CREATE INDEX idx_staking_positions_user ON public.staking_positions(user_id, status);
CREATE INDEX idx_staking_rewards_user_date ON public.staking_rewards(user_id, reward_date);
CREATE INDEX idx_staking_rewards_sponsor ON public.staking_rewards(sponsor_id) WHERE sponsor_id IS NOT NULL;
CREATE INDEX idx_user_weekly_earnings_user_week ON public.user_weekly_earnings(user_id, week_start);

-- 18. Create trigger to auto-update updated_at
CREATE TRIGGER update_ghost_bv_updated_at
  BEFORE UPDATE ON public.ghost_bv
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staking_positions_updated_at
  BEFORE UPDATE ON public.staking_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leadership_pool_updated_at
  BEFORE UPDATE ON public.leadership_pool_distributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rank_weekly_caps_updated_at
  BEFORE UPDATE ON public.rank_weekly_caps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_weekly_earnings_updated_at
  BEFORE UPDATE ON public.user_weekly_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
