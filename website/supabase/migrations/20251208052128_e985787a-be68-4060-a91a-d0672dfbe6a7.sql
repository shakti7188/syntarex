-- Create deposit_wallets table for company deposit addresses
CREATE TABLE public.deposit_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'SOLANA',
  currency TEXT NOT NULL DEFAULT 'USDT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_received NUMERIC NOT NULL DEFAULT 0,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_orders table for pending payment tracking
CREATE TABLE public.payment_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  package_id UUID NOT NULL REFERENCES public.packages(id),
  amount_expected NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  chain TEXT NOT NULL DEFAULT 'SOLANA',
  deposit_wallet_id UUID NOT NULL REFERENCES public.deposit_wallets(id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED')),
  tx_hash TEXT,
  amount_received NUMERIC,
  confirmations INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  allocation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_earnings table for monthly BTC returns tracking
CREATE TABLE public.user_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  allocation_id UUID REFERENCES public.hashrate_allocations(id),
  period TEXT NOT NULL, -- Format: YYYY-MM
  hashrate_ths NUMERIC NOT NULL DEFAULT 0,
  btc_earned NUMERIC NOT NULL DEFAULT 0,
  usd_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CALCULATED', 'PAID', 'FAILED')),
  payout_tx_hash TEXT,
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, allocation_id, period)
);

-- Add payment_order_id to package_purchases
ALTER TABLE public.package_purchases 
ADD COLUMN payment_order_id UUID REFERENCES public.payment_orders(id);

-- Enable RLS on all new tables
ALTER TABLE public.deposit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;

-- Deposit wallets policies (read-only for authenticated users, admin full access)
CREATE POLICY "Users can view active deposit wallets"
ON public.deposit_wallets FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage deposit wallets"
ON public.deposit_wallets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Payment orders policies
CREATE POLICY "Users can view their own payment orders"
ON public.payment_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment orders"
ON public.payment_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending payment orders"
ON public.payment_orders FOR UPDATE
USING (auth.uid() = user_id AND status = 'PENDING');

CREATE POLICY "Admins can manage all payment orders"
ON public.payment_orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- User earnings policies
CREATE POLICY "Users can view their own earnings"
ON public.user_earnings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all earnings"
ON public.user_earnings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX idx_payment_orders_tx_hash ON public.payment_orders(tx_hash);
CREATE INDEX idx_user_earnings_user_id ON public.user_earnings(user_id);
CREATE INDEX idx_user_earnings_period ON public.user_earnings(period);

-- Add updated_at triggers
CREATE TRIGGER update_deposit_wallets_updated_at
BEFORE UPDATE ON public.deposit_wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
BEFORE UPDATE ON public.payment_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_earnings_updated_at
BEFORE UPDATE ON public.user_earnings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();