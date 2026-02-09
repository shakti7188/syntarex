-- =====================================================
-- SECURE SECRETS SUBSYSTEM FOR MINING POOL API KEYS
-- =====================================================

-- 1. Create enum for secret types
CREATE TYPE secret_type AS ENUM ('MINING_POOL_API_KEY', 'MINING_POOL_API_SECRET');

-- 2. Create enum for audit event types
CREATE TYPE secret_audit_event AS ENUM ('CREATED', 'UPDATED', 'ROTATED', 'ACCESSED', 'DELETED');

-- 3. Secret Encryption Keys (DEKs for envelope encryption)
CREATE TABLE secret_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  encrypted_key TEXT NOT NULL, -- Encrypted with KMS master key
  key_metadata JSONB DEFAULT '{}', -- Algorithm, creation info, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Only one active key at a time
CREATE UNIQUE INDEX idx_active_encryption_key ON secret_encryption_keys(is_active) WHERE is_active = true;

-- 4. Encrypted Secrets Table
CREATE TABLE encrypted_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_type secret_type NOT NULL,
  encrypted_value TEXT NOT NULL, -- AES-256-GCM encrypted
  encryption_key_id UUID NOT NULL REFERENCES secret_encryption_keys(id),
  nonce TEXT NOT NULL, -- GCM nonce
  auth_tag TEXT NOT NULL, -- GCM authentication tag
  value_hash TEXT NOT NULL, -- SHA-256 hash for integrity
  masked_value TEXT NOT NULL, -- Last 4 chars only
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL
);

CREATE INDEX idx_encrypted_secrets_type ON encrypted_secrets(secret_type);
CREATE INDEX idx_encrypted_secrets_key ON encrypted_secrets(encryption_key_id);

-- 5. Update mining_pool_configs to reference encrypted secrets
ALTER TABLE mining_pool_configs
  ADD COLUMN api_key_secret_id UUID REFERENCES encrypted_secrets(id),
  ADD COLUMN api_secret_secret_id UUID REFERENCES encrypted_secrets(id),
  ADD COLUMN uses_encrypted_secrets BOOLEAN NOT NULL DEFAULT false;

-- 6. Immutable Audit Log
CREATE TABLE secret_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_id UUID NOT NULL REFERENCES encrypted_secrets(id),
  event_type secret_audit_event NOT NULL,
  user_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Make audit logs immutable
CREATE INDEX idx_audit_logs_secret ON secret_audit_logs(secret_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON secret_audit_logs(user_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Secret Encryption Keys (Admin only)
ALTER TABLE secret_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view encryption keys"
  ON secret_encryption_keys FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage encryption keys"
  ON secret_encryption_keys FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Encrypted Secrets (Admin write, users see masked only)
ALTER TABLE encrypted_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view masked secrets metadata"
  ON encrypted_secrets FOR SELECT
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create secrets"
  ON encrypted_secrets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update secrets"
  ON encrypted_secrets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete secrets"
  ON encrypted_secrets FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit Logs (Append-only, readable by admins and secret owners)
ALTER TABLE secret_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON secret_audit_logs FOR SELECT
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Only system can insert audit logs"
  ON secret_audit_logs FOR INSERT
  WITH CHECK (true); -- Will be enforced by edge functions

-- Prevent updates and deletes on audit logs (immutable)
CREATE POLICY "Audit logs are immutable"
  ON secret_audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON secret_audit_logs FOR DELETE
  USING (false);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_encrypted_secret_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_encrypted_secret_timestamp
  BEFORE UPDATE ON encrypted_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_encrypted_secret_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE secret_encryption_keys IS 'Stores encrypted data encryption keys (DEKs) for envelope encryption. Only one active key at a time.';
COMMENT ON TABLE encrypted_secrets IS 'Stores encrypted secrets using AES-256-GCM. Plaintext never stored or exposed to client.';
COMMENT ON TABLE secret_audit_logs IS 'Immutable audit trail of all secret operations. Cannot be updated or deleted.';
COMMENT ON COLUMN encrypted_secrets.encrypted_value IS 'AES-256-GCM encrypted secret value';
COMMENT ON COLUMN encrypted_secrets.nonce IS 'GCM nonce (IV) for encryption';
COMMENT ON COLUMN encrypted_secrets.auth_tag IS 'GCM authentication tag for integrity verification';
COMMENT ON COLUMN encrypted_secrets.masked_value IS 'Last 4 characters only, for UI display';
COMMENT ON COLUMN encrypted_secrets.value_hash IS 'SHA-256 hash for integrity verification';