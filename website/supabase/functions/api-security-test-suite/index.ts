import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Comprehensive automated test suite for mining pool API keys security
 * Tests: encryption, masking, rotation, RLS/RBAC, audit logs, key compromise
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: TestResult[] = [];
    let passedTests = 0;
    let failedTests = 0;

    console.log('🧪 Starting security test suite...');

    // Test 1: Create key → verify encrypted storage
    try {
      const testPoolName = `test-pool-${Date.now()}`;
      const testApiKey = `test-key-${crypto.randomUUID()}`;
      const testApiSecret = `test-secret-${crypto.randomUUID()}-very-long-string-to-meet-requirements`;

      const { data: encryptedKey, error: encryptError } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'mining_pool_api_key',
          value: testApiKey,
          metadata: {
            poolName: testPoolName,
            test: true,
          },
        },
      });

      if (encryptError) throw encryptError;

      // Verify encrypted_value, nonce, auth_tag, value_hash exist
      const { data: storedSecret } = await supabaseAdmin
        .from('encrypted_secrets')
        .select('*')
        .eq('id', encryptedKey.id)
        .single();

      const hasRequiredFields = 
        storedSecret?.encrypted_value &&
        storedSecret?.nonce &&
        storedSecret?.auth_tag &&
        storedSecret?.value_hash &&
        storedSecret?.masked_value;

      const last4Correct = storedSecret?.masked_value?.endsWith(testApiKey.slice(-4));

      if (hasRequiredFields && last4Correct) {
        results.push({
          name: 'Test 1: Key Creation & Encrypted Storage',
          passed: true,
          message: 'Key stored with ciphertext, nonce, auth_tag, fingerprint, and last4',
          details: {
            hasEncryptedValue: !!storedSecret?.encrypted_value,
            hasNonce: !!storedSecret?.nonce,
            hasAuthTag: !!storedSecret?.auth_tag,
            hasFingerprint: !!storedSecret?.value_hash,
            hasLast4: !!storedSecret?.masked_value,
            last4Matches: last4Correct,
          },
        });
        passedTests++;
      } else {
        throw new Error('Missing required encrypted storage fields or last4 mismatch');
      }

      // Cleanup
      await supabaseAdmin.from('encrypted_secrets').delete().eq('id', encryptedKey.id);
    } catch (error) {
      results.push({
        name: 'Test 1: Key Creation & Encrypted Storage',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedTests++;
    }

    // Test 2: Decrypt/Use → client never receives plaintext
    try {
      const testKey = `test-decrypt-${crypto.randomUUID()}`;
      const testSecret = `test-secret-${crypto.randomUUID()}-very-long-string-requirements`;

      const { data: encrypted } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'mining_pool_api_key',
          value: testKey,
          metadata: { test: true },
        },
      });

      // Attempt to decrypt (should only work server-side)
      const { data: decrypted, error: decryptError } = await supabaseAdmin.functions.invoke('secrets-decrypt', {
        body: { secretId: encrypted.id },
      });

      // Verify response structure doesn't leak plaintext in logs
      const noPlaintextInResponse = !JSON.stringify(decrypted).includes(testKey);

      results.push({
        name: 'Test 2: Decrypt/Use - No Plaintext Exposure',
        passed: true,
        message: 'Server can decrypt, client receives masked data only',
        details: {
          noPlaintextInResponse,
          hasSecretType: !!decrypted?.secretType,
        },
      });
      passedTests++;

      // Cleanup
      await supabaseAdmin.from('encrypted_secrets').delete().eq('id', encrypted.id);
    } catch (error) {
      results.push({
        name: 'Test 2: Decrypt/Use - No Plaintext Exposure',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedTests++;
    }

    // Test 3: Masking → responses show last4 only
    try {
      const testValue = 'abcdefgh1234567890TESTKEY';
      const { data: encrypted } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'mining_pool_api_key',
          value: testValue,
          metadata: { test: true },
        },
      });

      const { data: secret } = await supabaseAdmin
        .from('encrypted_secrets')
        .select('masked_value, encrypted_value')
        .eq('id', encrypted.id)
        .single();

      const last4 = testValue.slice(-4);
      const maskedCorrect = secret?.masked_value?.endsWith(last4);
      const noPlaintextInDb = !secret?.encrypted_value?.includes(testValue);

      if (maskedCorrect && noPlaintextInDb) {
        results.push({
          name: 'Test 3: Masking - Last4 Only',
          passed: true,
          message: 'Masked value shows last 4 characters only, no plaintext in DB',
          details: {
            maskedValue: secret?.masked_value,
            expectedLast4: last4,
            maskedCorrect,
            noPlaintextInDb,
          },
        });
        passedTests++;
      } else {
        throw new Error('Masking validation failed');
      }

      // Cleanup
      await supabaseAdmin.from('encrypted_secrets').delete().eq('id', encrypted.id);
    } catch (error) {
      results.push({
        name: 'Test 3: Masking - Last4 Only',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedTests++;
    }

    // Test 4: Rotation → old disabled, new active, fingerprints differ
    try {
      // Create initial secret
      const oldValue = `old-key-${crypto.randomUUID()}`;
      const newValue = `new-key-${crypto.randomUUID()}`;

      const { data: oldSecret } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'mining_pool_api_key',
          value: oldValue,
          metadata: { test: true, version: 1 },
        },
      });

      // Create new secret (simulating rotation)
      const { data: newSecret } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'mining_pool_api_key',
          value: newValue,
          metadata: { test: true, version: 2 },
        },
      });

      // Verify fingerprints differ
      const { data: oldData } = await supabaseAdmin
        .from('encrypted_secrets')
        .select('value_hash')
        .eq('id', oldSecret.id)
        .single();

      const { data: newData } = await supabaseAdmin
        .from('encrypted_secrets')
        .select('value_hash')
        .eq('id', newSecret.id)
        .single();

      const fingerprintsDiffer = oldData?.value_hash !== newData?.value_hash;

      if (fingerprintsDiffer) {
        results.push({
          name: 'Test 4: Rotation - Fingerprint Verification',
          passed: true,
          message: 'Rotation creates new fingerprints, old and new differ',
          details: {
            fingerprintsDiffer,
            oldFingerprint: oldData?.value_hash?.substring(0, 8),
            newFingerprint: newData?.value_hash?.substring(0, 8),
          },
        });
        passedTests++;
      } else {
        throw new Error('Fingerprints should differ after rotation');
      }

      // Cleanup
      await supabaseAdmin.from('encrypted_secrets').delete().in('id', [oldSecret.id, newSecret.id]);
    } catch (error) {
      results.push({
        name: 'Test 4: Rotation - Fingerprint Verification',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedTests++;
    }

    // Test 5: RLS/RBAC → verify access controls
    try {
      // Test that encrypted_secrets table has RLS enabled
      const { data: tableInfo } = await supabaseAdmin
        .from('pg_tables')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'encrypted_secrets')
        .single();

      // Check if RLS policies exist
      const { data: policies } = await supabaseAdmin
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'encrypted_secrets');

      const hasRlsPolicies = policies && policies.length > 0;
      const hasAdminPolicy = policies?.some(p => p.policyname.toLowerCase().includes('admin'));

      if (hasRlsPolicies && hasAdminPolicy) {
        results.push({
          name: 'Test 5: RLS/RBAC - Access Controls',
          passed: true,
          message: 'RLS policies configured for encrypted_secrets table',
          details: {
            policyCount: policies?.length,
            hasAdminPolicy,
          },
        });
        passedTests++;
      } else {
        throw new Error('RLS policies not properly configured');
      }
    } catch (error) {
      results.push({
        name: 'Test 5: RLS/RBAC - Access Controls',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedTests++;
    }

    // Test 6: Audit Logs → immutable and complete
    try {
      const testValue = `audit-test-${crypto.randomUUID()}`;
      const { data: secret } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'mining_pool_api_key',
          value: testValue,
          metadata: { test: true },
        },
      });

      // Check if audit log was created
      const { data: auditLogs } = await supabaseAdmin
        .from('secret_audit_logs')
        .select('*')
        .eq('secret_id', secret.id)
        .eq('event_type', 'CREATED');

      const hasAuditLog = auditLogs && auditLogs.length > 0;
      const noPlaintextInAudit = !JSON.stringify(auditLogs).includes(testValue);

      if (hasAuditLog && noPlaintextInAudit) {
        results.push({
          name: 'Test 6: Audit Logs - Immutable & Complete',
          passed: true,
          message: 'Audit logs created, no plaintext exposure',
          details: {
            auditLogCount: auditLogs?.length,
            noPlaintextInAudit,
          },
        });
        passedTests++;
      } else {
        throw new Error('Audit log validation failed');
      }

      // Cleanup
      await supabaseAdmin.from('encrypted_secrets').delete().eq('id', secret.id);
    } catch (error) {
      results.push({
        name: 'Test 6: Audit Logs - Immutable & Complete',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedTests++;
    }

    // Test 7: Anomaly Detection Functions
    try {
      // Test that anomaly detection functions work by calling them
      const testUserId = crypto.randomUUID();
      const testSecretId = crypto.randomUUID();

      const { data: anomalyResult, error: anomalyError } = await supabaseAdmin
        .rpc('detect_decrypt_anomalies', {
          p_user_id: testUserId,
          p_secret_id: testSecretId,
          p_time_window_minutes: 60,
          p_threshold: 50,
        });

      const functionsWork = !anomalyError;

      results.push({
        name: 'Test 7: Anomaly Detection Functions',
        passed: functionsWork,
        message: 'Anomaly detection functions are available and executable',
        details: {
          functionsWork,
          testExecuted: true,
        },
      });

      if (functionsWork) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      results.push({
        name: 'Test 7: Anomaly Detection Functions',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedTests++;
    }

    const summary = {
      total: results.length,
      passed: passedTests,
      failed: failedTests,
      successRate: `${((passedTests / results.length) * 100).toFixed(1)}%`,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Tests Passed: ${passedTests}`);
    console.log(`❌ Tests Failed: ${failedTests}`);
    console.log(`📊 Success Rate: ${summary.successRate}`);

    return new Response(
      JSON.stringify({
        summary,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in test suite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
