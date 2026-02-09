-- Enable realtime for profiles table (users with restricted fields via RLS)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Note: The following tables already have realtime enabled:
-- - transactions
-- - direct_commissions
-- - binary_commissions
-- - override_commissions
-- - weekly_settlements (weekly_payouts)
-- - referrals
-- - binary_volume
-- 
-- All realtime subscriptions automatically respect existing RLS policies:
-- - Users see only their own data
-- - Admins see all data
-- - Field-level restrictions are enforced by RLS SELECT policies