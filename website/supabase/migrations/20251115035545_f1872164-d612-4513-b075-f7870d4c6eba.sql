-- Create commission_settings table for dynamic rate configuration
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL UNIQUE,
  setting_value numeric NOT NULL,
  min_value numeric NOT NULL,
  max_value numeric NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage commission settings"
  ON public.commission_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view commission settings"
  ON public.commission_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default commission rate settings
INSERT INTO public.commission_settings (setting_name, setting_value, min_value, max_value, description) VALUES
  ('direct_tier_1_rate', 10.0, 5.0, 20.0, 'Direct referral tier 1 commission rate (%)'),
  ('direct_tier_2_rate', 5.0, 2.0, 10.0, 'Direct referral tier 2 commission rate (%)'),
  ('direct_tier_3_rate', 3.0, 1.0, 5.0, 'Direct referral tier 3 commission rate (%)'),
  ('binary_weak_leg_rate', 10.0, 5.0, 15.0, 'Binary weak leg commission rate (%)'),
  ('override_level_1_rate', 1.5, 0.5, 3.0, 'Override level 1 commission rate (%)'),
  ('override_level_2_rate', 1.0, 0.25, 2.0, 'Override level 2 commission rate (%)'),
  ('override_level_3_rate', 0.5, 0.1, 1.0, 'Override level 3 commission rate (%)'),
  ('global_cap_percent', 40.0, 30.0, 50.0, 'Global commission cap as % of sales volume'),
  ('binary_pool_percent', 17.0, 10.0, 25.0, 'Binary pool limit as % of sales volume'),
  ('direct_pool_percent', 20.0, 15.0, 30.0, 'Direct pool limit as % of sales volume'),
  ('override_pool_percent', 3.0, 1.0, 5.0, 'Override pool limit as % of sales volume')
ON CONFLICT (setting_name) DO NOTHING;

-- Create commission_settings_audit table for change tracking
CREATE TABLE IF NOT EXISTS public.commission_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL,
  old_value numeric,
  new_value numeric,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

-- Enable RLS on audit table
ALTER TABLE public.commission_settings_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy for audit logs
CREATE POLICY "Admins can view commission settings audit"
  ON public.commission_settings_audit
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_commission_settings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.commission_settings_audit (
    setting_name,
    old_value,
    new_value,
    changed_by
  ) VALUES (
    NEW.setting_name,
    OLD.setting_value,
    NEW.setting_value,
    NEW.updated_by
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auditing
CREATE TRIGGER audit_commission_settings
  AFTER UPDATE ON public.commission_settings
  FOR EACH ROW
  WHEN (OLD.setting_value IS DISTINCT FROM NEW.setting_value)
  EXECUTE FUNCTION public.audit_commission_settings_change();