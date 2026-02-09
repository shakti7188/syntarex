-- Create enum for pool provider types
CREATE TYPE pool_provider AS ENUM ('ANTPOOL', 'FOUNDRY', 'VIABTC', 'OTHER');

-- Create enum for sync status
CREATE TYPE sync_status AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'ERROR');

-- Mining pool configurations table
CREATE TABLE public.mining_pool_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pool_provider pool_provider NOT NULL,
  pool_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  subaccount TEXT,
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status sync_status,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mining pool stats snapshots
CREATE TABLE public.mining_pool_stats_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_config_id UUID NOT NULL REFERENCES public.mining_pool_configs(id) ON DELETE CASCADE,
  snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_hashrate_hs NUMERIC(30, 2) NOT NULL,
  avg_24h_hashrate_hs NUMERIC(30, 2),
  unpaid_balance_btc NUMERIC(20, 8) NOT NULL DEFAULT 0,
  payout_coin TEXT NOT NULL DEFAULT 'BTC',
  worker_count INTEGER NOT NULL DEFAULT 0,
  active_worker_count INTEGER NOT NULL DEFAULT 0,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mining pool workers
CREATE TABLE public.mining_pool_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_config_id UUID NOT NULL REFERENCES public.mining_pool_configs(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  current_hashrate_hs NUMERIC(30, 2) NOT NULL DEFAULT 0,
  avg_hashrate_hs NUMERIC(30, 2),
  last_share_time TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pool_config_id, worker_name)
);

-- Mining pool payouts
CREATE TABLE public.mining_pool_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_config_id UUID NOT NULL REFERENCES public.mining_pool_configs(id) ON DELETE CASCADE,
  payout_time TIMESTAMP WITH TIME ZONE NOT NULL,
  amount_btc NUMERIC(20, 8) NOT NULL,
  coin TEXT NOT NULL DEFAULT 'BTC',
  transaction_id TEXT,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pool_config_id, payout_time, amount_btc)
);

-- Indexes
CREATE INDEX idx_pool_configs_user_id ON public.mining_pool_configs(user_id);
CREATE INDEX idx_pool_configs_provider ON public.mining_pool_configs(pool_provider);
CREATE INDEX idx_pool_stats_config_id ON public.mining_pool_stats_snapshots(pool_config_id);
CREATE INDEX idx_pool_stats_snapshot_time ON public.mining_pool_stats_snapshots(snapshot_time DESC);
CREATE INDEX idx_pool_workers_config_id ON public.mining_pool_workers(pool_config_id);
CREATE INDEX idx_pool_workers_status ON public.mining_pool_workers(pool_config_id, status);
CREATE INDEX idx_pool_payouts_config_id ON public.mining_pool_payouts(pool_config_id);
CREATE INDEX idx_pool_payouts_time ON public.mining_pool_payouts(pool_config_id, payout_time DESC);

-- RLS Policies
ALTER TABLE public.mining_pool_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_pool_stats_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_pool_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_pool_payouts ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own pool configs
CREATE POLICY "Users can view own pool configs" ON public.mining_pool_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pool configs" ON public.mining_pool_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pool configs" ON public.mining_pool_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pool configs" ON public.mining_pool_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all pool configs
CREATE POLICY "Admins can view all pool configs" ON public.mining_pool_configs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Users can view stats for their pools
CREATE POLICY "Users can view own pool stats" ON public.mining_pool_stats_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mining_pool_configs
      WHERE id = pool_config_id AND user_id = auth.uid()
    )
  );

-- Users can view workers for their pools
CREATE POLICY "Users can view own pool workers" ON public.mining_pool_workers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mining_pool_configs
      WHERE id = pool_config_id AND user_id = auth.uid()
    )
  );

-- Users can view payouts for their pools
CREATE POLICY "Users can view own pool payouts" ON public.mining_pool_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mining_pool_configs
      WHERE id = pool_config_id AND user_id = auth.uid()
    )
  );

-- Admins can view all stats, workers, and payouts
CREATE POLICY "Admins can view all pool stats" ON public.mining_pool_stats_snapshots
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all pool workers" ON public.mining_pool_workers
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all pool payouts" ON public.mining_pool_payouts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_mining_pool_configs_updated_at
  BEFORE UPDATE ON public.mining_pool_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_mining_pool_workers_updated_at
  BEFORE UPDATE ON public.mining_pool_workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mining_pool_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mining_pool_stats_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mining_pool_workers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mining_pool_payouts;