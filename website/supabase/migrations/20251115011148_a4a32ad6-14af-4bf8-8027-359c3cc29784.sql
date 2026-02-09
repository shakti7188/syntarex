-- Fix function search path security warning by recreating trigger and function
DROP TRIGGER IF EXISTS trigger_update_encrypted_secret_timestamp ON encrypted_secrets;
DROP FUNCTION IF EXISTS update_encrypted_secret_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_encrypted_secret_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_encrypted_secret_timestamp
  BEFORE UPDATE ON encrypted_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_encrypted_secret_updated_at();