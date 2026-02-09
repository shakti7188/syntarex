-- Drop existing INSERT policies for regular users on hashrate_allocations
DROP POLICY IF EXISTS "Users can insert their own allocations" ON public.hashrate_allocations;

-- Drop existing INSERT policies for regular users on hashrate_tokenizations
DROP POLICY IF EXISTS "Users can insert their own tokenizations" ON public.hashrate_tokenizations;

-- Verify that users can still SELECT and UPDATE their own records
-- (These policies should already exist, but we're being explicit)

-- hashrate_allocations: Ensure SELECT and UPDATE policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hashrate_allocations' 
    AND policyname = 'Users can view their own allocations'
  ) THEN
    CREATE POLICY "Users can view their own allocations"
      ON public.hashrate_allocations
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hashrate_allocations' 
    AND policyname = 'Users can update their own allocations'
  ) THEN
    CREATE POLICY "Users can update their own allocations"
      ON public.hashrate_allocations
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- hashrate_tokenizations: Ensure SELECT policy exists (no UPDATE needed for tokenizations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hashrate_tokenizations' 
    AND policyname = 'Users can view their own tokenizations'
  ) THEN
    CREATE POLICY "Users can view their own tokenizations"
      ON public.hashrate_tokenizations
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admin policies should already exist with has_role() checks
-- These allow admins to perform all operations including INSERT