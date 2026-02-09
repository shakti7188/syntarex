-- Add unique partial index on tx_hash to prevent duplicate transaction submissions
-- Only applies to orders that are AWAITING_CONFIRMATION or CONFIRMED
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_tx_hash_unique 
ON public.payment_orders(tx_hash) 
WHERE tx_hash IS NOT NULL AND status IN ('AWAITING_CONFIRMATION', 'CONFIRMED');