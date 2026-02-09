-- Create allocation settings table with individual name/value rows
CREATE TABLE public.allocation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  value NUMERIC(5,2) NOT NULL,
  min_value NUMERIC(5,2),
  max_value NUMERIC(5,2),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allocation_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view allocation settings
CREATE POLICY "Admins can view allocation settings"
ON public.allocation_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update allocation settings
CREATE POLICY "Admins can update allocation settings"
ON public.allocation_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert allocation settings
CREATE POLICY "Admins can insert allocation settings"
ON public.allocation_settings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default allocation settings
INSERT INTO public.allocation_settings (name, value, min_value, max_value) VALUES
  ('affiliate_network', 35.00, 30.00, 40.00),
  ('btc_mining_machines', 20.00, 15.00, 25.00),
  ('core_team', 7.00, 5.00, 10.00),
  ('investor_returns', 38.00, 35.00, 40.00);

-- Enable realtime for allocation settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.allocation_settings;

-- Create trigger for updated_at
CREATE TRIGGER update_allocation_settings_updated_at
BEFORE UPDATE ON public.allocation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();