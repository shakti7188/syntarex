-- Create enum types for commission and settlement status
CREATE TYPE public.commission_type AS ENUM (
  'direct_l1',
  'direct_l2', 
  'direct_l3',
  'binary_weak_leg',
  'override_l1',
  'override_l2',
  'override_l3'
);

CREATE TYPE public.commission_status AS ENUM (
  'pending',
  'paid',
  'cancelled'
);

CREATE TYPE public.settlement_status AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed'
);

CREATE TYPE public.binary_position AS ENUM (
  'left',
  'right'
);

-- Referrals table: Track referral relationships
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  binary_position public.binary_position,
  referral_level INTEGER NOT NULL CHECK (referral_level BETWEEN 1 AND 3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referee_id),
  CHECK (referrer_id != referee_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX idx_referrals_active ON public.referrals(is_active) WHERE is_active = true;

-- Binary tree structure table
CREATE TABLE public.binary_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  left_leg_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  right_leg_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  left_volume DECIMAL(15, 2) DEFAULT 0,
  right_volume DECIMAL(15, 2) DEFAULT 0,
  total_left_members INTEGER DEFAULT 0,
  total_right_members INTEGER DEFAULT 0,
  weak_leg public.binary_position,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_binary_tree_user ON public.binary_tree(user_id);
CREATE INDEX idx_binary_tree_left_leg ON public.binary_tree(left_leg_id);
CREATE INDEX idx_binary_tree_right_leg ON public.binary_tree(right_leg_id);

-- Commissions table: Log all commission transactions
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  commission_type public.commission_type NOT NULL,
  source_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  settlement_id UUID,
  status public.commission_status DEFAULT 'pending',
  transaction_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_commissions_user ON public.commissions(user_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_settlement ON public.commissions(settlement_id);
CREATE INDEX idx_commissions_source_user ON public.commissions(source_user_id);
CREATE INDEX idx_commissions_created_at ON public.commissions(created_at);

-- Weekly settlements table
CREATE TABLE public.weekly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  direct_l1_commission DECIMAL(15, 2) DEFAULT 0,
  direct_l2_commission DECIMAL(15, 2) DEFAULT 0,
  direct_l3_commission DECIMAL(15, 2) DEFAULT 0,
  binary_commission DECIMAL(15, 2) DEFAULT 0,
  override_commission DECIMAL(15, 2) DEFAULT 0,
  total_commission DECIMAL(15, 2) DEFAULT 0,
  cap_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (cap_percentage >= 0 AND cap_percentage <= 100),
  carry_forward_amount DECIMAL(15, 2) DEFAULT 0,
  weak_leg_volume DECIMAL(15, 2) DEFAULT 0,
  strong_leg_volume DECIMAL(15, 2) DEFAULT 0,
  status public.settlement_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX idx_settlements_user ON public.weekly_settlements(user_id);
CREATE INDEX idx_settlements_status ON public.weekly_settlements(status);
CREATE INDEX idx_settlements_week_start ON public.weekly_settlements(week_start_date);
CREATE INDEX idx_settlements_created_at ON public.weekly_settlements(created_at);

-- User activity tracking for 8-week inactivity flush
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  inactive_weeks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_inactive ON public.user_activity(is_active) WHERE is_active = false;

-- Enable RLS on all tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals table
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can insert their own referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all referrals"
  ON public.referrals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for binary_tree table
CREATE POLICY "Users can view their own binary tree"
  ON public.binary_tree FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own binary tree"
  ON public.binary_tree FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own binary tree"
  ON public.binary_tree FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all binary trees"
  ON public.binary_tree FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all binary trees"
  ON public.binary_tree FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for commissions table
CREATE POLICY "Users can view their own commissions"
  ON public.commissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all commissions"
  ON public.commissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all commissions"
  ON public.commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for weekly_settlements table
CREATE POLICY "Users can view their own settlements"
  ON public.weekly_settlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all settlements"
  ON public.weekly_settlements FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all settlements"
  ON public.weekly_settlements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_activity table
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON public.user_activity FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all activity"
  ON public.user_activity FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add foreign key for settlements to commissions
ALTER TABLE public.commissions
  ADD CONSTRAINT fk_commissions_settlement
  FOREIGN KEY (settlement_id) 
  REFERENCES public.weekly_settlements(id)
  ON DELETE SET NULL;

-- Triggers for updated_at timestamps (using existing function)
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_binary_tree_updated_at
  BEFORE UPDATE ON public.binary_tree
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_settlements_updated_at
  BEFORE UPDATE ON public.weekly_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_activity_updated_at
  BEFORE UPDATE ON public.user_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger to create binary tree entry when user signs up
CREATE OR REPLACE FUNCTION public.create_binary_tree_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.binary_tree (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_activity (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_binary_tree
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_binary_tree_entry();