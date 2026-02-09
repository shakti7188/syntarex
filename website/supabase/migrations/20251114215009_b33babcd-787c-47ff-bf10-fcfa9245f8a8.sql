-- Create or replace the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create allocation configuration table
CREATE TABLE public.allocation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_network_pct NUMERIC NOT NULL DEFAULT 35 CHECK (affiliate_network_pct >= 30 AND affiliate_network_pct <= 40),
  btc_mining_machines_pct NUMERIC NOT NULL DEFAULT 20 CHECK (btc_mining_machines_pct >= 15 AND btc_mining_machines_pct <= 25),
  core_team_pct NUMERIC NOT NULL DEFAULT 7 CHECK (core_team_pct >= 5 AND core_team_pct <= 10),
  investor_returns_pct NUMERIC NOT NULL DEFAULT 38 CHECK (investor_returns_pct >= 35 AND investor_returns_pct <= 40),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allocation_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view allocation config
CREATE POLICY "Admins can view allocation config"
ON public.allocation_config
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update allocation config
CREATE POLICY "Admins can update allocation config"
ON public.allocation_config
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert allocation config
CREATE POLICY "Admins can insert allocation config"
ON public.allocation_config
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default configuration
INSERT INTO public.allocation_config (
  affiliate_network_pct,
  btc_mining_machines_pct,
  core_team_pct,
  investor_returns_pct
) VALUES (35, 20, 7, 38);

-- Enable realtime for allocation config
ALTER PUBLICATION supabase_realtime ADD TABLE public.allocation_config;

-- Create updated_at trigger
CREATE TRIGGER update_allocation_config_updated_at
BEFORE UPDATE ON public.allocation_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();