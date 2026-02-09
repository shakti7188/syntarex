-- Add premium package direct affiliate bonus rates to commission_settings
INSERT INTO public.commission_settings (setting_name, setting_value, min_value, max_value, description)
VALUES 
  ('premium_tier_1_rate', 100, 0, 100, 'Premium package Level 1 direct bonus rate (100% = matching bonus)')
ON CONFLICT (setting_name) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO public.commission_settings (setting_name, setting_value, min_value, max_value, description)
VALUES 
  ('premium_tier_2_rate', 5, 0, 50, 'Premium package Level 2 direct bonus rate')
ON CONFLICT (setting_name) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO public.commission_settings (setting_name, setting_value, min_value, max_value, description)
VALUES 
  ('premium_tier_3_rate', 5, 0, 50, 'Premium package Level 3 direct bonus rate')
ON CONFLICT (setting_name) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

-- Mark some packages as premium bonus eligible (example: packages $2500+)
UPDATE public.packages
SET is_premium_bonus_eligible = true
WHERE price_usd >= 2500;