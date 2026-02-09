-- Fix RLS policy violation on hashrate_allocations table
-- The api-packages-purchase edge function fails because users cannot insert their own allocations

-- Enable RLS on hashrate_allocations if not already enabled
ALTER TABLE public.hashrate_allocations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own allocations" ON public.hashrate_allocations;
DROP POLICY IF EXISTS "Users can insert their own allocations" ON public.hashrate_allocations;
DROP POLICY IF EXISTS "Users can update their own allocations" ON public.hashrate_allocations;
DROP POLICY IF EXISTS "Users can delete their own allocations" ON public.hashrate_allocations;

-- Create RLS policies for hashrate_allocations
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

CREATE POLICY "Users can delete their own allocations"
  ON public.hashrate_allocations
  FOR DELETE
  USING (auth.uid() = user_id);