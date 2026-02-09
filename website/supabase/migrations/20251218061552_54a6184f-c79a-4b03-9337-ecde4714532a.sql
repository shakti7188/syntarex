-- Clean up expired orders
UPDATE public.payment_orders 
SET status = 'EXPIRED'
WHERE status = 'PENDING' 
  AND expires_at < now();

-- Create function to auto-expire orders (can be called by trigger or cron)
CREATE OR REPLACE FUNCTION public.expire_payment_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.payment_orders 
  SET status = 'EXPIRED'
  WHERE status IN ('PENDING', 'AWAITING_CONFIRMATION') 
    AND expires_at < now();
END;
$$;

-- Create trigger function that expires orders on new order creation
CREATE OR REPLACE FUNCTION public.cleanup_expired_orders_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Expire old orders from the same user
  UPDATE public.payment_orders 
  SET status = 'EXPIRED'
  WHERE user_id = NEW.user_id
    AND status IN ('PENDING', 'AWAITING_CONFIRMATION')
    AND expires_at < now()
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS cleanup_expired_orders_trigger ON public.payment_orders;
CREATE TRIGGER cleanup_expired_orders_trigger
  AFTER INSERT ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_expired_orders_on_insert();

-- Add index for efficient expired order queries
CREATE INDEX IF NOT EXISTS idx_payment_orders_status_expires 
  ON public.payment_orders (status, expires_at) 
  WHERE status IN ('PENDING', 'AWAITING_CONFIRMATION');