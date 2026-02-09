-- Create banned_usernames table for blacklist management
CREATE TABLE IF NOT EXISTS public.banned_usernames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  category text DEFAULT 'profanity', -- profanity, brand, reserved, scam
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banned_usernames ENABLE ROW LEVEL SECURITY;

-- Anyone can read banned usernames for validation
CREATE POLICY "Anyone can read banned usernames" ON public.banned_usernames
  FOR SELECT USING (true);

-- Only admins can manage banned usernames
CREATE POLICY "Only admins can manage banned usernames" ON public.banned_usernames
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to check if username is available (not taken and not banned)
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text, p_exclude_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check against blacklist (partial match for embedded profanity)
  IF EXISTS (
    SELECT 1 FROM public.banned_usernames 
    WHERE LOWER(p_username) LIKE '%' || LOWER(word) || '%'
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if already taken (excluding the specified user for updates)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(p_username)
    AND (p_exclude_user_id IS NULL OR id != p_exclude_user_id)
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create trigger function to sync referral_code when username changes
CREATE OR REPLACE FUNCTION public.sync_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username AND NEW.username IS NOT NULL THEN
    NEW.referral_code := UPPER(NEW.username);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to sync username to referral_code on update
DROP TRIGGER IF EXISTS sync_username_to_referral_code ON public.profiles;
CREATE TRIGGER sync_username_to_referral_code
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_referral_code();

-- Update handle_new_user to use username as referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code text;
  v_sponsor_id uuid;
  v_binary_position text;
  v_username text;
BEGIN
  -- Extract referral code from metadata (case-insensitive lookup)
  v_referral_code := new.raw_user_meta_data ->> 'referral_code';
  
  -- Extract username from metadata (required during signup)
  v_username := new.raw_user_meta_data ->> 'username';
  
  -- Look up sponsor by referral code (CASE-INSENSITIVE)
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT id, default_placement_leg::text 
    INTO v_sponsor_id, v_binary_position
    FROM public.profiles 
    WHERE LOWER(referral_code) = LOWER(v_referral_code);
    
    -- Default to 'left' if sponsor has no preference set
    IF v_binary_position IS NULL THEN
      v_binary_position := 'left';
    END IF;
  END IF;
  
  -- Fallback to sponsor_id from metadata if referral lookup failed
  IF v_sponsor_id IS NULL THEN
    v_sponsor_id := (new.raw_user_meta_data ->> 'sponsor_id')::uuid;
    IF v_sponsor_id IS NOT NULL THEN
      SELECT default_placement_leg::text INTO v_binary_position
      FROM public.profiles WHERE id = v_sponsor_id;
      IF v_binary_position IS NULL THEN
        v_binary_position := 'left';
      END IF;
    END IF;
  END IF;

  -- Insert profile with username AS referral_code
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    sponsor_id,
    binary_position,
    binary_parent_id,
    username,
    referral_code
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    v_sponsor_id,
    v_binary_position::binary_position,
    v_sponsor_id,
    v_username,
    COALESCE(UPPER(v_username), UPPER(SUBSTRING(MD5(new.id::text) FROM 1 FOR 8)))
  );
  
  RETURN new;
END;
$$;

-- Seed initial blacklist data
INSERT INTO public.banned_usernames (word, category) VALUES
  -- Profanity (common offensive words)
  ('fuck', 'profanity'), ('shit', 'profanity'), ('cunt', 'profanity'), ('ass', 'profanity'),
  ('bitch', 'profanity'), ('dick', 'profanity'), ('cock', 'profanity'), ('pussy', 'profanity'),
  ('nigger', 'profanity'), ('nigga', 'profanity'), ('faggot', 'profanity'), ('fag', 'profanity'),
  ('whore', 'profanity'), ('slut', 'profanity'), ('bastard', 'profanity'),
  -- Brand protection
  ('jayhao', 'brand'), ('synterax', 'brand'), ('syntera', 'brand'), ('xmining', 'brand'),
  ('bitcoin', 'brand'), ('ethereum', 'brand'), ('coinbase', 'brand'), ('binance', 'brand'),
  ('kraken', 'brand'), ('gemini', 'brand'), ('crypto', 'brand'),
  -- Reserved words
  ('admin', 'reserved'), ('administrator', 'reserved'), ('support', 'reserved'),
  ('help', 'reserved'), ('official', 'reserved'), ('system', 'reserved'),
  ('root', 'reserved'), ('ceo', 'reserved'), ('founder', 'reserved'),
  ('moderator', 'reserved'), ('mod', 'reserved'), ('staff', 'reserved'),
  -- Scam-related
  ('scam', 'scam'), ('fraud', 'scam'), ('fake', 'scam'), ('hack', 'scam'),
  ('hacker', 'scam'), ('phishing', 'scam'), ('steal', 'scam'), ('ponzi', 'scam'),
  ('pyramid', 'scam'), ('mlm', 'scam')
ON CONFLICT (word) DO NOTHING;

-- Update existing users who have usernames to use username-based referral codes
UPDATE public.profiles 
SET referral_code = UPPER(username) 
WHERE username IS NOT NULL AND username != '';