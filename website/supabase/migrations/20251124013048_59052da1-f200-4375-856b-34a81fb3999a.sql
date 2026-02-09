-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are referee" ON public.referrals;
DROP POLICY IF EXISTS "Admins can manage all user activity" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can update their own activity" ON public.user_activity;

-- Create referrals table to track all referral relationships
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_level INTEGER NOT NULL DEFAULT 1 CHECK (referral_level >= 1 AND referral_level <= 3),
  binary_position TEXT CHECK (binary_position IN ('left', 'right')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_level ON public.referrals(referral_level);

-- Create user_activity table for tracking active users
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_volume NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for user activity lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_active ON public.user_activity(is_active);

-- Add referral_code to profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
    CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
  END IF;
END $$;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Function to create referral relationships recursively
CREATE OR REPLACE FUNCTION public.create_referral_chain(
  p_referee_id UUID,
  p_sponsor_id UUID,
  p_binary_position TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level INTEGER;
  v_current_referrer UUID;
BEGIN
  v_current_referrer := p_sponsor_id;
  v_level := 1;
  
  WHILE v_level <= 3 AND v_current_referrer IS NOT NULL LOOP
    INSERT INTO public.referrals (
      referrer_id, referee_id, referral_level, binary_position
    ) VALUES (
      v_current_referrer, p_referee_id, v_level,
      CASE WHEN v_level = 1 THEN p_binary_position ELSE NULL END
    ) ON CONFLICT (referrer_id, referee_id) DO NOTHING;
    
    SELECT sponsor_id INTO v_current_referrer
    FROM public.profiles WHERE id = v_current_referrer;
    
    v_level := v_level + 1;
  END LOOP;
END;
$$;

-- Trigger to generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  
  INSERT INTO public.user_activity (user_id)
  VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  
  IF NEW.sponsor_id IS NOT NULL THEN
    PERFORM create_referral_chain(NEW.id, NEW.sponsor_id, NEW.binary_position);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_referral_setup ON public.profiles;
CREATE TRIGGER on_profile_referral_setup
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_referral();

-- Function to update referral chain when sponsor changes
CREATE OR REPLACE FUNCTION public.handle_sponsor_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.sponsor_id IS DISTINCT FROM NEW.sponsor_id AND NEW.sponsor_id IS NOT NULL THEN
    DELETE FROM public.referrals WHERE referee_id = NEW.id;
    PERFORM create_referral_chain(NEW.id, NEW.sponsor_id, NEW.binary_position);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_sponsor_change ON public.profiles;
CREATE TRIGGER on_profile_sponsor_change
  AFTER UPDATE OF sponsor_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_sponsor_change();

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Admins can manage all referrals"
  ON public.referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_activity
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON public.user_activity FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user activity"
  ON public.user_activity FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));