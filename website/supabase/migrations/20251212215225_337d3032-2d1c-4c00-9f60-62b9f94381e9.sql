-- Create function to log rank changes
CREATE OR REPLACE FUNCTION public.log_rank_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.rank IS DISTINCT FROM NEW.rank THEN
    INSERT INTO public.user_rank_history (user_id, old_rank, new_rank, achieved_at, criteria_met)
    VALUES (NEW.id, OLD.rank, NEW.rank, NOW(), '{}'::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to track rank changes on profiles table
DROP TRIGGER IF EXISTS track_rank_changes ON public.profiles;
CREATE TRIGGER track_rank_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_rank_change();

-- Seed initial rank history for all existing users with their current rank
INSERT INTO public.user_rank_history (user_id, old_rank, new_rank, achieved_at, criteria_met)
SELECT 
  id, 
  NULL, 
  COALESCE(rank, 'Member'), 
  created_at, 
  '{}'::jsonb
FROM public.profiles
WHERE id NOT IN (SELECT DISTINCT user_id FROM public.user_rank_history);