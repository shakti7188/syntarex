
-- Fix the handle_sponsor_change trigger to cast binary_position to text
CREATE OR REPLACE FUNCTION public.handle_sponsor_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.sponsor_id IS DISTINCT FROM NEW.sponsor_id AND NEW.sponsor_id IS NOT NULL THEN
    DELETE FROM public.referrals WHERE referee_id = NEW.id;
    -- Cast binary_position to text to match function signature
    PERFORM create_referral_chain(NEW.id, NEW.sponsor_id, NEW.binary_position::text);
  END IF;
  RETURN NEW;
END;
$function$;
