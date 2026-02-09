-- Ensure GP.101bc@gmail.com has admin role
-- First, get the user_id from profiles table
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id for GP.101bc@gmail.com
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = 'GP.101bc@gmail.com';

  -- If user exists, ensure they have admin role
  IF v_user_id IS NOT NULL THEN
    -- Insert admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User with email GP.101bc@gmail.com not found';
  END IF;
END $$;