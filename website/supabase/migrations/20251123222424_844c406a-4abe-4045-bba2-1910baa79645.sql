-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('BTC', 'USDC', 'USDT', 'XFLOW', 'CARD')),
  wallet_address TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create token balances table
CREATE TABLE public.token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('BTC', 'USDC', 'USDT', 'XFLOW')),
  balance NUMERIC NOT NULL DEFAULT 0,
  locked_balance NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token_type)
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('PURCHASE', 'DEPOSIT', 'WITHDRAWAL', 'SWAP')),
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  fee_amount NUMERIC DEFAULT 0,
  lottery_pool_contribution NUMERIC DEFAULT 0,
  liquidity_pool_contribution NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  tx_hash TEXT,
  purchase_id UUID REFERENCES public.machine_purchases(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create swap transactions table  
CREATE TABLE public.swap_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  from_amount NUMERIC NOT NULL,
  to_amount NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  fee_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create lottery pool table
CREATE TABLE public.lottery_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance NUMERIC NOT NULL DEFAULT 0,
  total_contributed NUMERIC NOT NULL DEFAULT 0,
  total_paid_out NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create liquidity pool table
CREATE TABLE public.liquidity_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance NUMERIC NOT NULL DEFAULT 0,
  total_contributed NUMERIC NOT NULL DEFAULT 0,
  total_utilized NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create XFLOW token info table
CREATE TABLE public.token_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol TEXT NOT NULL UNIQUE,
  token_name TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  current_price_usd NUMERIC,
  payment_discount_percent NUMERIC DEFAULT 0,
  description TEXT,
  website_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users can view own payment methods"
ON public.payment_methods FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods"
ON public.payment_methods FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment methods"
ON public.payment_methods FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for token_balances
CREATE POLICY "Users can view own balances"
ON public.token_balances FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all balances"
ON public.token_balances FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage balances"
ON public.token_balances FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view own transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
ON public.payment_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all transactions"
ON public.payment_transactions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for swap_transactions
CREATE POLICY "Users can view own swaps"
ON public.swap_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own swaps"
ON public.swap_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all swaps"
ON public.swap_transactions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for lottery_pool
CREATE POLICY "Anyone can view lottery pool"
ON public.lottery_pool FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage lottery pool"
ON public.lottery_pool FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for liquidity_pool
CREATE POLICY "Anyone can view liquidity pool"
ON public.liquidity_pool FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage liquidity pool"
ON public.liquidity_pool FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for token_info
CREATE POLICY "Anyone can view token info"
ON public.token_info FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage token info"
ON public.token_info FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert initial XFLOW token info
INSERT INTO public.token_info (token_symbol, token_name, blockchain, contract_address, decimals, payment_discount_percent, description) VALUES
('XFLOW', 'XFLOW Token', 'BNB Chain (BEP-20)', '0x0000000000000000000000000000000000000000', 18, 10, 'XFLOW is the native utility token of the Xmine AI platform. Use XFLOW for payments to receive exclusive discounts and benefits.');

-- Initialize lottery and liquidity pools
INSERT INTO public.lottery_pool (current_balance, total_contributed, total_paid_out) VALUES (0, 0, 0);
INSERT INTO public.liquidity_pool (current_balance, total_contributed, total_utilized) VALUES (0, 0, 0);

-- Create function to calculate payment with discount
CREATE OR REPLACE FUNCTION public.calculate_payment_with_discount(
  p_base_amount NUMERIC,
  p_currency TEXT
)
RETURNS TABLE (
  final_amount NUMERIC,
  discount_amount NUMERIC,
  discount_percent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount_percent NUMERIC := 0;
  v_discount_amount NUMERIC := 0;
  v_final_amount NUMERIC;
BEGIN
  -- Get discount for XFLOW payments
  IF p_currency = 'XFLOW' THEN
    SELECT payment_discount_percent INTO v_discount_percent
    FROM token_info
    WHERE token_symbol = 'XFLOW';
    
    v_discount_amount := p_base_amount * (v_discount_percent / 100);
    v_final_amount := p_base_amount - v_discount_amount;
  ELSE
    v_final_amount := p_base_amount;
  END IF;

  RETURN QUERY SELECT v_final_amount, v_discount_amount, v_discount_percent;
END;
$$;

-- Create trigger to update payment_methods updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();