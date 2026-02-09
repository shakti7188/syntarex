-- CRITICAL FIX: Restrict weekly_settlements_meta to admins only (currently accessible to all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view settlements meta" ON weekly_settlements_meta;

CREATE POLICY "Only admins can view settlements meta"
ON weekly_settlements_meta
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment explaining the security consideration
COMMENT ON POLICY "Only admins can view settlements meta" ON weekly_settlements_meta IS 
'Restricts access to company-wide financial metrics (total payouts, user counts) to prevent competitive intelligence gathering';