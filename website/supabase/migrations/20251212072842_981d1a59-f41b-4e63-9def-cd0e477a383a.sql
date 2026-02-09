-- Drop the conflicting restrictive policy on referrals
DROP POLICY IF EXISTS "Users can view only their direct referrals" ON public.referrals;

-- Add policy to allow users to view profiles of their referrals
CREATE POLICY "Users can view referral profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT referee_id FROM public.referrals 
    WHERE referrer_id = auth.uid()
  )
);