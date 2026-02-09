-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL UNIQUE,
  price_usd NUMERIC NOT NULL,
  hashrate_ths NUMERIC NOT NULL,
  xflow_tokens NUMERIC NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create package_purchases table
CREATE TABLE IF NOT EXISTS public.package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id),
  payment_currency TEXT NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for package_purchases
CREATE POLICY "Users can view own package purchases"
  ON public.package_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own package purchases"
  ON public.package_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all package purchases"
  ON public.package_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all package purchases"
  ON public.package_purchases FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert package tiers from PDF
INSERT INTO public.packages (tier, name, price_usd, hashrate_ths, xflow_tokens, description, features) VALUES
  ('P1', 'Starter Package', 100, 1, 100, 'Perfect for getting started with mining', '["Basic hashrate allocation", "Access to mining pools", "XFLOW token rewards"]'::jsonb),
  ('P2', 'Bronze Package', 250, 2.5, 250, 'Ideal for small-scale miners', '["Enhanced hashrate allocation", "Priority pool access", "Increased XFLOW rewards", "Lower energy rates"]'::jsonb),
  ('P3', 'Silver Package', 500, 5, 500, 'Great for serious miners', '["Substantial hashrate allocation", "Premium pool access", "Higher XFLOW rewards", "Competitive energy rates"]'::jsonb),
  ('P4', 'Gold Package', 1000, 10, 1000, 'For professional miners', '["Large hashrate allocation", "VIP pool access", "Maximum XFLOW rewards", "Reduced energy rates"]'::jsonb),
  ('P5', 'Platinum Package', 5000, 50, 5000, 'Enterprise-grade mining power', '["Massive hashrate allocation", "Exclusive pool access", "Premium XFLOW rewards", "Tier 5 energy rates"]'::jsonb),
  ('P6', 'Diamond Package', 10000, 100, 10000, 'Ultimate mining experience', '["Maximum hashrate allocation", "Elite pool access", "Elite XFLOW rewards", "Best energy rates"]'::jsonb);

-- Create index for faster queries
CREATE INDEX idx_package_purchases_user_id ON public.package_purchases(user_id);
CREATE INDEX idx_package_purchases_status ON public.package_purchases(status);
CREATE INDEX idx_packages_tier ON public.packages(tier);