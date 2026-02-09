-- Add ghost_bv_amount column to packages table for fixed Ghost BV values
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS ghost_bv_amount numeric DEFAULT NULL;

-- Add $20,000 Ultimate Package (P7 tier)
INSERT INTO public.packages (
  name, 
  price_usd, 
  tier, 
  hashrate_ths, 
  xflow_tokens, 
  bv_percent, 
  commission_unlock_level, 
  is_premium_bonus_eligible,
  ghost_bv_amount,
  description,
  is_active
) VALUES (
  'Ultimate Package',
  20000,
  'P7',
  200,
  20000,
  80,
  3,
  true,
  80000,
  'Our most comprehensive mining package with maximum hashrate allocation and full commission unlocks.',
  true
) ON CONFLICT DO NOTHING;

-- Update existing packages with fixed Ghost BV values from compensation plan
-- $250 Starter/Bronze → 4,000 Ghost BV
UPDATE public.packages SET ghost_bv_amount = 4000 WHERE price_usd = 250;

-- $500 Silver → 5,000 Ghost BV  
UPDATE public.packages SET ghost_bv_amount = 5000 WHERE price_usd = 500;

-- $1,000 Gold → 10,000 Ghost BV
UPDATE public.packages SET ghost_bv_amount = 10000 WHERE price_usd = 1000;

-- $5,000 Platinum → 20,000 Ghost BV
UPDATE public.packages SET ghost_bv_amount = 20000 WHERE price_usd = 5000;

-- $10,000 Diamond → 40,000 Ghost BV (2x of $5K)
UPDATE public.packages SET ghost_bv_amount = 40000 WHERE price_usd = 10000;

-- $20,000 Ultimate → 80,000 Ghost BV (2x of $10K)
UPDATE public.packages SET ghost_bv_amount = 80000 WHERE price_usd = 20000;

-- $100 Starter (entry level) → 800 Ghost BV (proportional)
UPDATE public.packages SET ghost_bv_amount = 800 WHERE price_usd = 100;

-- Test package → minimal Ghost BV
UPDATE public.packages SET ghost_bv_amount = 1 WHERE price_usd = 0.01;