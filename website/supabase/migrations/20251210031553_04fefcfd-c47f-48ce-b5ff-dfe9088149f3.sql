-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view active deposit wallets" ON public.deposit_wallets;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view active deposit wallets" 
ON public.deposit_wallets
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);