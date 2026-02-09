-- Extend profiles table with MLM-specific fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS binary_parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS binary_position public.binary_position,
  ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'Member';

CREATE INDEX IF NOT EXISTS idx_profiles_sponsor ON public.profiles(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_binary_parent ON public.profiles(binary_parent_id);

-- Create transactions table for sales/volume events
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(18, 6) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'USDT',
  is_eligible BOOLEAN DEFAULT true,
  week_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_week_start ON public.transactions(week_start);
CREATE INDEX idx_transactions_eligible ON public.transactions(is_eligible) WHERE is_eligible = true;
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

-- Create direct_commissions table (replaces generic commissions for direct)
CREATE TABLE public.direct_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 3),
  rate NUMERIC(5, 2) NOT NULL,
  amount NUMERIC(18, 6) NOT NULL CHECK (amount >= 0),
  week_start DATE NOT NULL,
  status public.commission_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_direct_commissions_user ON public.direct_commissions(user_id);
CREATE INDEX idx_direct_commissions_source ON public.direct_commissions(source_user_id);
CREATE INDEX idx_direct_commissions_week ON public.direct_commissions(week_start);
CREATE INDEX idx_direct_commissions_status ON public.direct_commissions(status);

-- Create binary_volume table for leg volume tracking
CREATE TABLE public.binary_volume (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  leg public.binary_position NOT NULL,
  volume NUMERIC(18, 6) DEFAULT 0,
  carry_in NUMERIC(18, 6) DEFAULT 0,
  carry_out NUMERIC(18, 6) DEFAULT 0,
  total_volume NUMERIC(18, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, week_start, leg)
);

CREATE INDEX idx_binary_volume_user ON public.binary_volume(user_id);
CREATE INDEX idx_binary_volume_week ON public.binary_volume(week_start);

-- Create binary_commissions table (separate from general commissions)
CREATE TABLE public.binary_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  weak_leg_volume NUMERIC(18, 6) DEFAULT 0,
  base_amount NUMERIC(18, 6) DEFAULT 0,
  scaled_amount NUMERIC(18, 6) DEFAULT 0,
  scale_factor NUMERIC(18, 6) DEFAULT 1.0,
  status public.commission_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_binary_commissions_user ON public.binary_commissions(user_id);
CREATE INDEX idx_binary_commissions_week ON public.binary_commissions(week_start);
CREATE INDEX idx_binary_commissions_status ON public.binary_commissions(status);

-- Create override_commissions table
CREATE TABLE public.override_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  base_amount NUMERIC(18, 6) DEFAULT 0,
  scaled_amount NUMERIC(18, 6) DEFAULT 0,
  week_start DATE NOT NULL,
  status public.commission_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_override_commissions_user ON public.override_commissions(user_id);
CREATE INDEX idx_override_commissions_source ON public.override_commissions(source_user_id);
CREATE INDEX idx_override_commissions_week ON public.override_commissions(week_start);
CREATE INDEX idx_override_commissions_status ON public.override_commissions(status);

-- Update weekly_settlements to match specification
ALTER TABLE public.weekly_settlements
  ADD COLUMN IF NOT EXISTS direct_total NUMERIC(18, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS binary_total NUMERIC(18, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS override_total NUMERIC(18, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC(18, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scale_factor_applied NUMERIC(18, 6) DEFAULT 1.0;

-- Update referrals table to include level
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS level INTEGER CHECK (level BETWEEN 1 AND 3);

-- Enable RLS on new tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_volume ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.override_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for direct_commissions
CREATE POLICY "Users can view their own direct commissions"
  ON public.direct_commissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all direct commissions"
  ON public.direct_commissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all direct commissions"
  ON public.direct_commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for binary_volume
CREATE POLICY "Users can view their own binary volume"
  ON public.binary_volume FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all binary volume"
  ON public.binary_volume FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all binary volume"
  ON public.binary_volume FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for binary_commissions
CREATE POLICY "Users can view their own binary commissions"
  ON public.binary_commissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all binary commissions"
  ON public.binary_commissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all binary commissions"
  ON public.binary_commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for override_commissions
CREATE POLICY "Users can view their own override commissions"
  ON public.override_commissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all override commissions"
  ON public.override_commissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all override commissions"
  ON public.override_commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_direct_commissions_updated_at
  BEFORE UPDATE ON public.direct_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_binary_volume_updated_at
  BEFORE UPDATE ON public.binary_volume
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_binary_commissions_updated_at
  BEFORE UPDATE ON public.binary_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_override_commissions_updated_at
  BEFORE UPDATE ON public.override_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();