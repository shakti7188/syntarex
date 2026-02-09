-- Create machine_types table
CREATE TABLE public.machine_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  hash_rate_ths NUMERIC NOT NULL,
  power_watts NUMERIC NOT NULL,
  efficiency_j_per_th NUMERIC NOT NULL,
  price_usdt NUMERIC NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PRE_ORDER')),
  available_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create machine_purchases table
CREATE TABLE public.machine_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  machine_type_id UUID NOT NULL REFERENCES public.machine_types(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_usdt NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  payment_currency TEXT NOT NULL CHECK (payment_currency IN ('USDT', 'MUSD')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'DEPLOYED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.machine_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for machine_types (public catalog)
CREATE POLICY "Anyone can view active machine types"
ON public.machine_types FOR SELECT
USING (status = 'ACTIVE' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage machine types"
ON public.machine_types FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for machine_purchases
CREATE POLICY "Users can view their own purchases"
ON public.machine_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases"
ON public.machine_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
ON public.machine_purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all purchases"
ON public.machine_purchases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_machine_types_updated_at
BEFORE UPDATE ON public.machine_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_machine_purchases_updated_at
BEFORE UPDATE ON public.machine_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert sample data
INSERT INTO public.machine_types (brand, model, hash_rate_ths, power_watts, efficiency_j_per_th, price_usdt, location, status, available_quantity, description) VALUES
('Bitmain', 'Antminer S19 Pro', 110, 3250, 29.5, 2500, 'Texas, USA', 'ACTIVE', 25, 'Industry-leading efficiency and performance for Bitcoin mining'),
('MicroBT', 'Whatsminer M30S++', 112, 3472, 31, 2800, 'Iceland', 'ACTIVE', 15, 'High performance mining with excellent cooling capabilities'),
('Bitmain', 'Antminer S19 XP', 140, 3010, 21.5, 4200, 'Texas, USA', 'ACTIVE', 10, 'Next-generation mining with superior efficiency'),
('Bitmain', 'Antminer S21', 200, 3500, 17.5, 6500, 'Texas, USA', 'PRE_ORDER', 50, 'Latest flagship model with breakthrough efficiency'),
('Canaan', 'AvalonMiner 1366', 130, 3250, 25, 3800, 'Canada', 'ACTIVE', 20, 'Reliable mining solution with stable performance');