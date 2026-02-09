-- Add rank_level column to user_rank_history if it doesn't exist
ALTER TABLE public.user_rank_history 
ADD COLUMN IF NOT EXISTS rank_level integer;

-- Drop existing triggers if they exist (to recreate them)
DROP TRIGGER IF EXISTS trigger_rank_on_volume_update ON public.binary_tree;
DROP TRIGGER IF EXISTS trigger_rank_on_transaction ON public.transactions;
DROP TRIGGER IF EXISTS trigger_rank_on_referral ON public.referrals;

-- Recreate trigger on binary_tree for volume updates
CREATE TRIGGER trigger_rank_on_volume_update
  AFTER UPDATE ON public.binary_tree
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_evaluate_rank_on_volume_update();

-- Recreate trigger on transactions for new sales
CREATE TRIGGER trigger_rank_on_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_evaluate_rank_on_transaction();

-- Recreate trigger on referrals for new team members
CREATE TRIGGER trigger_rank_on_referral
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_evaluate_rank_on_referral();