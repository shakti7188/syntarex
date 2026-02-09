-- Enable realtime for commission-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.binary_commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.override_commissions;

-- Enable realtime for network structure tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.binary_tree;
ALTER PUBLICATION supabase_realtime ADD TABLE public.binary_volume;

-- Enable realtime for settlement and transaction tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;

-- Enable realtime for metadata table (for admin metrics)
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_settlements_meta;