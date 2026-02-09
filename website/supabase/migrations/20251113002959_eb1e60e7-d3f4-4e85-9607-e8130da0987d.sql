-- Create hashrate_allocations table
CREATE TABLE public.hashrate_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  machine_inventory_id UUID NOT NULL,
  total_ths NUMERIC(18,6) NOT NULL,
  tokenized_ths NUMERIC(18,6) NOT NULL DEFAULT 0,
  untokenized_ths NUMERIC(18,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT positive_total CHECK (total_ths > 0),
  CONSTRAINT positive_tokenized CHECK (tokenized_ths >= 0),
  CONSTRAINT positive_untokenized CHECK (untokenized_ths >= 0),
  CONSTRAINT valid_tokenization CHECK (tokenized_ths <= total_ths),
  CONSTRAINT valid_untokenized CHECK (untokenized_ths = total_ths - tokenized_ths)
);

-- Enable RLS
ALTER TABLE public.hashrate_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own allocations"
  ON public.hashrate_allocations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocations"
  ON public.hashrate_allocations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocations"
  ON public.hashrate_allocations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all allocations"
  ON public.hashrate_allocations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all allocations"
  ON public.hashrate_allocations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_hashrate_allocations_updated_at
  BEFORE UPDATE ON public.hashrate_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes
CREATE INDEX idx_hashrate_allocations_user_id ON public.hashrate_allocations(user_id);
CREATE INDEX idx_hashrate_allocations_machine_inventory_id ON public.hashrate_allocations(machine_inventory_id);
CREATE INDEX idx_hashrate_allocations_status ON public.hashrate_allocations(status);

-- Update hashrate_tokenizations to add foreign key to allocations
ALTER TABLE public.hashrate_tokenizations
  ADD CONSTRAINT fk_allocation_id 
  FOREIGN KEY (allocation_id) 
  REFERENCES public.hashrate_allocations(id) 
  ON DELETE SET NULL;