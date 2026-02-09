-- Update RLS policy for deposit_wallets to allow super_admin to update
CREATE POLICY "Super admins can update deposit wallets"
ON public.deposit_wallets
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Assign super_admin role to parth@wattbyte.com (user_id: 05b57ff9-5082-4a1f-8a33-4277a0879883)
INSERT INTO public.user_roles (user_id, role)
VALUES ('05b57ff9-5082-4a1f-8a33-4277a0879883', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;