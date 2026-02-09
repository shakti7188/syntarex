-- Create machine_inventory table to track individual machines owned by users
CREATE TABLE IF NOT EXISTS public.machine_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_type_id UUID NOT NULL REFERENCES public.machine_types(id) ON DELETE RESTRICT,
  purchase_id UUID REFERENCES public.machine_purchases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'DEPLOYED', 'HOSTED')),
  tokenized_ths NUMERIC NOT NULL DEFAULT 0 CHECK (tokenized_ths >= 0),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.machine_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own inventory"
  ON public.machine_inventory
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory"
  ON public.machine_inventory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON public.machine_inventory
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all inventory"
  ON public.machine_inventory
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all inventory"
  ON public.machine_inventory
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_machine_inventory_updated_at
  BEFORE UPDATE ON public.machine_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_inventory;