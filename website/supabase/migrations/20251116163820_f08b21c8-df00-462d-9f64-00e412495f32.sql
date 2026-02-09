-- Remove foreign key constraints to auth schema (reserved by Supabase)
-- This prevents migration and restoration issues

-- Remove FK from commission_settings
ALTER TABLE public.commission_settings 
  DROP CONSTRAINT IF EXISTS commission_settings_updated_by_fkey;

-- Remove FK from commission_settings_audit
ALTER TABLE public.commission_settings_audit 
  DROP CONSTRAINT IF EXISTS commission_settings_audit_changed_by_fkey;

-- Add comments to document the relationship
COMMENT ON COLUMN public.commission_settings.updated_by IS 'References auth.users(id) but FK removed to avoid reserved schema issues. Validation handled at application layer.';
COMMENT ON COLUMN public.commission_settings_audit.changed_by IS 'References auth.users(id) but FK removed to avoid reserved schema issues. Validation handled at application layer.';

-- Note: Columns remain as uuid type, validation happens in edge functions via auth.getUser()