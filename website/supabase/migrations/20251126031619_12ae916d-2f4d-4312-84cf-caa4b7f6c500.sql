
-- Add unique constraint on (referrer_id, referee_id) for ON CONFLICT to work
-- First drop the old unique constraint on referee_id only
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_referee_id_key;

-- Add composite unique constraint
ALTER TABLE public.referrals 
ADD CONSTRAINT referrals_referrer_referee_unique UNIQUE (referrer_id, referee_id);
