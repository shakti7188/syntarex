
-- Drop existing check constraints
ALTER TABLE allocation_config 
DROP CONSTRAINT IF EXISTS allocation_config_btc_mining_machines_pct_check,
DROP CONSTRAINT IF EXISTS allocation_config_affiliate_network_pct_check,
DROP CONSTRAINT IF EXISTS allocation_config_core_team_pct_check,
DROP CONSTRAINT IF EXISTS allocation_config_investor_returns_pct_check,
DROP CONSTRAINT IF EXISTS allocation_config_total_check;

-- Add new check constraints that match PDF requirements
ALTER TABLE allocation_config 
ADD CONSTRAINT allocation_config_btc_mining_machines_pct_check 
  CHECK (btc_mining_machines_pct >= 0 AND btc_mining_machines_pct <= 100),
ADD CONSTRAINT allocation_config_affiliate_network_pct_check 
  CHECK (affiliate_network_pct >= 0 AND affiliate_network_pct <= 100),
ADD CONSTRAINT allocation_config_core_team_pct_check 
  CHECK (core_team_pct >= 0 AND core_team_pct <= 100),
ADD CONSTRAINT allocation_config_investor_returns_pct_check 
  CHECK (investor_returns_pct >= 0 AND investor_returns_pct <= 100),
ADD CONSTRAINT allocation_config_total_check 
  CHECK (btc_mining_machines_pct + affiliate_network_pct + core_team_pct + investor_returns_pct = 100);

-- Update values to match PDF (40% machines, 40% affiliate, 20% core team, 0% investor)
UPDATE allocation_config 
SET 
  btc_mining_machines_pct = 40,
  affiliate_network_pct = 40,
  core_team_pct = 20,
  investor_returns_pct = 0,
  updated_at = now()
WHERE id = (SELECT id FROM allocation_config LIMIT 1);
