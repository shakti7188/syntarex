-- Machine Deployment Status Tracking
CREATE TYPE deployment_status AS ENUM ('ORDERED', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'INSTALLING', 'TESTING', 'ACTIVE', 'MAINTENANCE');

ALTER TABLE machine_inventory 
ADD COLUMN deployment_status deployment_status DEFAULT 'ORDERED',
ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN installed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN tracking_number TEXT,
ADD COLUMN installation_notes TEXT;

-- Deployment Timeline Events
CREATE TABLE deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_inventory_id UUID NOT NULL REFERENCES machine_inventory(id) ON DELETE CASCADE,
  event_type deployment_status NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE deployment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deployment events"
  ON deployment_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their machine deployment events"
  ON deployment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM machine_inventory mi
      WHERE mi.id = deployment_events.machine_inventory_id
      AND mi.user_id = auth.uid()
    )
  );

-- Hosting Fee Billing System
CREATE TABLE hosting_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_inventory_id UUID NOT NULL REFERENCES machine_inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  fee_amount NUMERIC(20, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(machine_inventory_id, billing_period_start)
);

ALTER TABLE hosting_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all hosting fees"
  ON hosting_fees FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own hosting fees"
  ON hosting_fees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own hosting fees"
  ON hosting_fees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_hosting_fees_updated_at
  BEFORE UPDATE ON hosting_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Secondary Market for Tokenized Hashrate
CREATE TABLE hashrate_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  allocation_id UUID NOT NULL REFERENCES hashrate_allocations(id) ON DELETE CASCADE,
  amount_ths NUMERIC(20, 4) NOT NULL CHECK (amount_ths > 0),
  price_per_ths NUMERIC(20, 2) NOT NULL CHECK (price_per_ths > 0),
  total_price NUMERIC(20, 2) GENERATED ALWAYS AS (amount_ths * price_per_ths) STORED,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE hashrate_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
  ON hashrate_listings FOR SELECT
  USING (status = 'ACTIVE' OR auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own listings"
  ON hashrate_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own listings"
  ON hashrate_listings FOR UPDATE
  USING (auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all listings"
  ON hashrate_listings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hashrate_listings_updated_at
  BEFORE UPDATE ON hashrate_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Marketplace Trades
CREATE TABLE hashrate_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES hashrate_listings(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  amount_ths NUMERIC(20, 4) NOT NULL,
  price_per_ths NUMERIC(20, 2) NOT NULL,
  total_price NUMERIC(20, 2) NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE hashrate_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all trades"
  ON hashrate_trades FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Participants can view their trades"
  ON hashrate_trades FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create trades"
  ON hashrate_trades FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE TRIGGER update_hashrate_trades_updated_at
  BEFORE UPDATE ON hashrate_trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ROI Calculation History
CREATE TABLE roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  machine_type_id UUID REFERENCES machine_types(id),
  hashrate_ths NUMERIC(20, 4) NOT NULL,
  initial_investment NUMERIC(20, 2) NOT NULL,
  electricity_cost_per_kwh NUMERIC(10, 4) NOT NULL,
  btc_price_usd NUMERIC(20, 2) NOT NULL,
  network_difficulty NUMERIC(30, 2),
  daily_revenue_btc NUMERIC(20, 8),
  daily_revenue_usd NUMERIC(20, 2),
  daily_electricity_cost NUMERIC(20, 2),
  daily_profit NUMERIC(20, 2),
  monthly_profit NUMERIC(20, 2),
  roi_months NUMERIC(10, 2),
  break_even_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ROI calculations"
  ON roi_calculations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ROI calculations"
  ON roi_calculations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE deployment_events;
ALTER PUBLICATION supabase_realtime ADD TABLE hosting_fees;
ALTER PUBLICATION supabase_realtime ADD TABLE hashrate_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE hashrate_trades;