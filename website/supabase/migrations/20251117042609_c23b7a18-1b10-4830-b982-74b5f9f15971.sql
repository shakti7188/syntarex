-- Set admin role for specified user
-- Replace 'YOUR_EMAIL_HERE' with your actual admin email address

-- First, create a helper function to safely set admin role
CREATE OR REPLACE FUNCTION public.set_admin_role(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user ID from profiles
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = admin_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;

  -- Insert or update admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin role granted to user %', admin_email;
END;
$$;

-- Usage: Call this function with your email to set yourself as admin
-- Example: SELECT public.set_admin_role('your@email.com');