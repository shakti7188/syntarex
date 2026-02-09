-- Allow regular users to view allocation settings (read-only)
CREATE POLICY "Users can view allocation settings"
ON public.allocation_settings
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role)
);