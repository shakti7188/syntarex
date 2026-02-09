# Mining Pool API Keys Security System

## Overview

Complete server-side secrets management system for mining pool API keys using envelope encryption (AES-256-GCM), with RBAC/RLS, rotation, masking, immutable audit logs, and alerting.

## Architecture

### Encryption Model
- **Envelope Encryption**: AES-256-GCM with data encryption keys (DEKs)
- **Storage**: Encrypted value, nonce (12 bytes), auth tag (16 bytes), SHA-256 fingerprint
- **Masking**: Only last 4 characters exposed to UI/APIs
- **Zero Plaintext**: No credentials ever stored or transmitted in plaintext

### Security Features

1. **Encryption at Rest**
   - All API keys/secrets encrypted before storage
   - Unique nonce per secret
   - Authentication tags for integrity verification
   - SHA-256 fingerprints for key identification

2. **Access Control (RLS/RBAC)**
   - Admins: Full create/update/delete/rotate access
   - Owners: View masked metadata only
   - Non-admins: No access to encrypted secrets

3. **Key Rotation**
   - **Scheduled**: Automated monthly rotation via cron
   - **On-Demand**: Manual rotation by administrators
   - **Forced Compromise**: Emergency rotation with alerting
   - Version tracking and fingerprint comparison

4. **Audit & Compliance**
   - Immutable audit logs for all operations
   - IP address and user agent tracking
   - Rotation history with old/new fingerprints
   - No plaintext in logs or database dumps

5. **Monitoring & Alerting**
   - Anomaly detection (high-frequency decrypt usage)
   - Suspicious IP access patterns
   - Multiple forced compromise rotations
   - Webhook/Slack notifications

## API Endpoints

### Admin Operations (Require Admin Role)

#### Create Pool Key
```http
POST /api/admin/pools/keys
Content-Type: application/json
Authorization: Bearer <user-jwt>

{
  "poolName": "f2pool",
  "poolProvider": "f2pool",
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "accountLabel": "main",
  "keyAlias": "primary",
  "scopes": ["read"],
  "subaccount": "optional-subaccount"
}
```

**Response:**
```json
{
  "id": "uuid",
  "ownerUserId": "uuid",
  "poolName": "f2pool",
  "accountLabel": "main",
  "keyAlias": "primary",
  "last4": "9F3A",
  "scopes": ["read"],
  "isActive": true,
  "createdAt": "2025-11-14T13:00:00Z",
  "updatedAt": "2025-11-14T13:00:00Z"
}
```

#### Update Pool Key
```http
PATCH /api/admin/pools/keys/:id
Content-Type: application/json
Authorization: Bearer <user-jwt>

{
  "newApiKey": "optional-new-key",
  "newApiSecret": "optional-new-secret",
  "metadata": {
    "accountLabel": "updated-label"
  }
}
```

#### Rotate Pool Key
```http
POST /api/admin/pools/keys/:id/rotate
Content-Type: application/json
Authorization: Bearer <user-jwt>

{
  "rotationType": "ON_DEMAND|SCHEDULED|FORCED_COMPROMISE",
  "reason": "Optional rotation reason",
  "newApiKey": "optional-new-key",
  "newApiSecret": "optional-new-secret"
}
```

**Rotation Types:**
- `ON_DEMAND`: Manual rotation by admin
- `SCHEDULED`: Routine rotation for security best practices
- `FORCED_COMPROMISE`: Emergency rotation due to suspected breach

#### Deactivate Pool Key
```http
POST /api/admin/pools/keys/:id/deactivate
Authorization: Bearer <user-jwt>
```

#### List Pool Keys (Admin)
```http
GET /api/admin/pools/keys
Authorization: Bearer <user-jwt>
```

Returns masked list of all pool keys.

#### Get Audit Logs
```http
GET /api/admin/pools/keys/:id/audits
Authorization: Bearer <user-jwt>
```

Returns immutable audit trail (no secrets).

#### Get Rotation History
```http
GET /api/admin/pools/keys/:id/rotations
Authorization: Bearer <user-jwt>
```

Returns rotation events with fingerprints.

### Owner Operations

#### List Own Pool Keys
```http
GET /api/pools/keys/owner
Authorization: Bearer <user-jwt>
```

Returns masked list of keys owned by authenticated user.

## Database Schema

### Tables

#### `encrypted_secrets`
```sql
- id (uuid, primary key)
- secret_type (enum: 'mining_pool_api_key' | 'mining_pool_api_secret')
- encrypted_value (text) -- AES-GCM ciphertext
- nonce (text) -- 12-byte IV
- auth_tag (text) -- 16-byte authentication tag
- value_hash (text) -- SHA-256 fingerprint
- masked_value (text) -- **** **** **** LAST4
- encryption_key_id (uuid) -- FK to secret_encryption_keys
- metadata (jsonb) -- version, poolName, etc.
- created_by (uuid)
- updated_by (uuid)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `secret_audit_logs`
```sql
- id (uuid, primary key)
- secret_id (uuid, FK to encrypted_secrets)
- event_type (enum: 'CREATED' | 'UPDATED' | 'ACCESSED' | 'ROTATED' | 'DELETED')
- user_id (uuid)
- ip_address (text)
- user_agent (text)
- metadata (jsonb) -- action details, no secrets
- created_at (timestamp)
```

#### `mining_pool_key_rotations`
```sql
- id (uuid, primary key)
- pool_config_id (uuid, FK to mining_pool_configs)
- old_secret_id (uuid, FK to encrypted_secrets)
- new_secret_id (uuid, FK to encrypted_secrets)
- old_key_fingerprint (text)
- new_key_fingerprint (text)
- rotation_type (enum: 'SCHEDULED' | 'ON_DEMAND' | 'FORCED_COMPROMISE')
- rotated_by (uuid)
- rotation_reason (text)
- created_at (timestamp)
```

### Postgres Functions

#### `detect_decrypt_anomalies`
```sql
detect_decrypt_anomalies(
  p_user_id UUID,
  p_secret_id UUID,
  p_time_window_minutes INTEGER DEFAULT 60,
  p_threshold INTEGER DEFAULT 50
)
```
Detects if decrypt usage exceeds threshold within time window.

#### `detect_unusual_ip_access`
```sql
detect_unusual_ip_access(
  p_user_id UUID,
  p_time_window_minutes INTEGER DEFAULT 60
)
```
Identifies IPs with suspicious access patterns (high volume or many secrets).

#### `get_security_events_summary`
```sql
get_security_events_summary(
  p_time_window_hours INTEGER DEFAULT 24
)
```
Provides summary statistics of security events.

#### `detect_failed_rotations`
```sql
detect_failed_rotations(
  p_time_window_hours INTEGER DEFAULT 24
)
```
Detects multiple forced compromise rotations (ongoing security issues).

## Security Testing

### Automated Test Suite

Run comprehensive security tests:
```http
POST /api-security-test-suite
Authorization: Bearer <service-role-key>
```

**Tests Included:**
1. ✅ Key Creation & Encrypted Storage (ciphertext, nonce, auth_tag, fingerprint, last4)
2. ✅ Decrypt/Use - Client Never Receives Plaintext
3. ✅ Masking - Last4 Only, No Plaintext in DB
4. ✅ Rotation - Old Disabled, New Active, Fingerprints Differ
5. ✅ RLS/RBAC - Access Controls Verified
6. ✅ Audit Logs - Immutable & Complete, No Plaintext
7. ✅ Anomaly Detection Functions Available

**Expected Output:**
```json
{
  "summary": {
    "total": 7,
    "passed": 7,
    "failed": 0,
    "successRate": "100.0%",
    "timestamp": "2025-11-15T01:00:00Z"
  },
  "results": [...]
}
```

### Manual Testing Checklist

- [ ] Create key → verify encrypted storage
- [ ] Decrypt/use → verify client never receives plaintext
- [ ] Masking → verify responses show last4 only
- [ ] Rotation → verify old disabled, new active, fingerprints differ
- [ ] RLS/RBAC → verify non-admin cannot create/update
- [ ] Audit logs → verify immutable and redacted
- [ ] Key compromise drill → verify deactivate + alert emitted

## Monitoring & Alerting

### Security Monitor

Run anomaly detection and alerting:
```http
POST /api-security-monitor
Authorization: Bearer <service-role-key>

{
  "timeWindowMinutes": 60
}
```

**Alerts Generated For:**
- High decrypt frequency (>50 accesses/secret/hour)
- Suspicious IP activity (high volume or many secrets)
- Multiple forced compromise rotations
- High access volume (>500 events)
- Unusual rotation activity (>10 rotations)

### Webhook Configuration

Set environment variables for alerting:

```env
# Generic webhook
SECURITY_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts

# Slack webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Webhook Payload:**
```json
{
  "timestamp": "2025-11-15T01:00:00Z",
  "monitoringWindow": "60 minutes",
  "alertCount": 3,
  "alerts": [
    {
      "severity": "warning",
      "type": "high_decrypt_frequency",
      "message": "User X accessed secret Y 75 times in 60 minutes",
      "details": {
        "userId": "uuid",
        "secretId": "uuid",
        "accessCount": 75,
        "uniqueIps": 2,
        "threshold": 50
      }
    }
  ]
}
```

### Scheduled Monitoring (Cron)

Setup automatic monitoring with `pg_cron`:

```sql
SELECT cron.schedule(
  'security-monitor-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/api-security-monitor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{"timeWindowMinutes": 60}'::jsonb
  ) as request_id;
  $$
);
```

### Scheduled Rotation (Cron)

Setup automatic monthly key rotation:

```sql
SELECT cron.schedule(
  'rotate-pool-keys-monthly',
  '0 0 1 * *', -- First day of every month at midnight
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/api-admin-pools-keys-schedule-rotation',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{"rotationType": "SCHEDULED"}'::jsonb
  ) as request_id;
  $$
);
```

## Admin UI

### Pool Keys Management Dashboard

**Location:** `/admin` → "Pool Keys" tab

**Features:**
- Masked keys table (pool, label, alias, last4, scopes, status)
- Create new key (secure form, no plaintext echo)
- Rotate keys (with rotation type and reason)
- Deactivate keys
- View audit logs (immutable trail)
- View rotation history (fingerprints only)

**Security UI Guarantees:**
- ✅ No plaintext credentials ever displayed
- ✅ Password fields for sensitive inputs
- ✅ Direct server submission (no client state)
- ✅ Masked responses (last4 only)
- ✅ Audit trail without secrets

### Security Monitoring Dashboard

**Location:** `/admin` → "Security" tab → "Security Monitoring"

**Features:**
- Real-time alert summary
- Critical/warning/info alert breakdown
- Security events timeline
- Anomaly detection results
- Run test suite button
- Auto-refresh every 5 minutes

## Rate Limiting

**Decrypt Operations:**
- 10 decrypt ops per minute per secret per user
- Prevents brute force attacks

**Pool API Calls:**
- 60 pool API calls per minute per config
- Prevents API abuse

**Rotation Operations:**
- 5 rotations per hour per config
- Prevents rotation spam

## Validation & Input Security

### API Key Validation
- Minimum 16 characters, maximum 512
- No leading/trailing whitespace
- Provider-specific format checks
- Test/demo key detection

### API Secret Validation
- Minimum 32 characters, maximum 1024
- Entropy and character diversity checks
- Repeating pattern detection
- Test/demo secret rejection

### Scope Management
- Valid scopes: `read`, `write`, `admin`
- Privilege escalation protection
- Secondary approval for scope increases
- Least privilege recommendation (prefer `read`)

### Metadata Validation
- Pool name: alphanumeric + spaces/hyphens/underscores, max 100 chars
- Account label: max 50 chars
- Key alias: max 50 chars, no spaces

## Environment Variables

```env
# KMS Provider (future enhancement)
KMS_PROVIDER=aws|gcp|azure

# AWS KMS (future)
AWS_REGION=us-east-1
AWS_KMS_KEY_ARN=arn:aws:kms:us-east-1:123456789012:key/...

# GCP KMS (future)
GCP_PROJECT_ID=your-project
GCP_LOCATION=us-east1
GCP_KEYRING=your-keyring
GCP_KEY_NAME=your-key

# Security Alerts
SECURITY_WEBHOOK_URL=https://your-webhook.com/alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Pool API Allow-list
OUTBOUND_POOL_BASEURL_ALLOWLIST=https://api.f2pool.com,https://api.antpool.com
```

## Production Recommendations

1. **Enable KMS Integration**
   - Use AWS KMS, GCP KMS, or Azure Key Vault
   - Store master encryption keys in HSM
   - Implement automatic key rotation

2. **Enhance Logging**
   - Ship audit logs to SIEM (Splunk, Datadog)
   - Enable log aggregation and analysis
   - Set up automated alerting rules

3. **Implement Rate Limiting**
   - Use Redis for distributed rate limiting
   - Set per-user and per-IP limits
   - Implement exponential backoff

4. **Network Security**
   - Enable IP allow-listing for pool APIs
   - Use VPN or private network for sensitive operations
   - Implement TLS certificate pinning

5. **Compliance**
   - Regular security audits (quarterly)
   - Penetration testing (annually)
   - SOC 2 Type II certification
   - GDPR/CCPA compliance for user data

6. **Backup & Recovery**
   - Encrypted database backups
   - Key escrow for emergency recovery
   - Disaster recovery plan and drills

7. **Monitoring**
   - 24/7 security operations center (SOC)
   - Real-time anomaly detection
   - Automated incident response

## Troubleshooting

### Issue: "new row violates row-level security policy"
**Solution:** Ensure `user_id` is set correctly in insert statements. Verify user has required admin role.

### Issue: Rate limit exceeded
**Solution:** Check `checkDecryptRateLimit()` and `checkRotationRateLimit()` thresholds. Implement exponential backoff.

### Issue: Webhook alerts not sending
**Solution:** Verify `SECURITY_WEBHOOK_URL` and `SLACK_WEBHOOK_URL` environment variables are set. Check network connectivity.

### Issue: Test suite failures
**Solution:** Run tests with service role key. Verify database schema is up to date. Check audit log RLS policies.

## Support

For issues or questions:
1. Check audit logs: `/admin` → "Security" → "Security Monitoring"
2. Run test suite: Click "Run Test Suite" in Security Monitoring
3. Review documentation: This file
4. Contact security team: security@yourcompany.com

## License

[Your License Here]

## Contributors

[Your Team Here]
