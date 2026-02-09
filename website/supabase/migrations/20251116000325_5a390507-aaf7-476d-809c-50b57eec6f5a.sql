-- Create payout_settings table
CREATE TABLE IF NOT EXISTS public.payout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value NUMERIC(10,4) NOT NULL,
  min_value NUMERIC(10,4),
  max_value NUMERIC(10,4),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.payout_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can view payout settings"
ON public.payout_settings
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage payout settings"
ON public.payout_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_payout_settings_updated_at
BEFORE UPDATE ON public.payout_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed default payout settings
INSERT INTO public.payout_settings (key, value, min_value, max_value, description) VALUES
  ('direct_tier1_percent', 10.0, 5.0, 15.0, 'Tier 1 direct referral %'),
  ('direct_tier2_percent', 5.0, 2.0, 10.0, 'Tier 2 direct referral %'),
  ('direct_tier3_percent', 3.0, 1.0, 8.0, 'Tier 3 direct referral %'),
  ('binary_weak_leg_percent', 10.0, 5.0, 15.0, 'Binary weak leg payout %'),
  ('binary_total_cap_percent', 17.0, 10.0, 20.0, 'Max total binary payout % of SV'),
  ('override_level1_percent', 1.5, 0.5, 2.0, 'Override L1 %'),
  ('override_level2_percent', 1.0, 0.25, 1.5, 'Override L2 %'),
  ('override_level3_percent', 0.5, 0.1, 1.0, 'Override L3 %'),
  ('global_payout_cap_percent', 40.0, 30.0, 45.0, 'Total payout cap %')
ON CONFLICT (key) DO NOTHING;