
-- Fix create_referral_chain to properly cast text to binary_position enum
CREATE OR REPLACE FUNCTION public.create_referral_chain(p_referee_id uuid, p_sponsor_id uuid, p_binary_position text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      v_current_referrer, 
      p_referee_id, 
      v_level,
      -- Cast text to binary_position enum type
      CASE WHEN v_level = 1 THEN p_binary_position::binary_position ELSE NULL END
    ) ON CONFLICT (referrer_id, referee_id) DO NOTHING;
    
    SELECT sponsor_id INTO v_current_referrer
    FROM public.profiles WHERE id = v_current_referrer;
    
    v_level := v_level + 1;
  END LOOP;
END;
$function$;
