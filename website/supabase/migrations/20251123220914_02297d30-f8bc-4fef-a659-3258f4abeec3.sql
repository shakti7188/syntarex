-- Add username and preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add constraint to ensure username is valid (alphanumeric, underscore, hyphen only)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,20}$' OR username IS NULL);

-- Update existing profiles to have a default username based on email
UPDATE public.profiles 
SET username = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', '_'))
WHERE username IS NULL;