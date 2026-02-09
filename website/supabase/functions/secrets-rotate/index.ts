import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Re-encrypt secret with new key
async function reencryptSecret(
  plaintext: string,
  newKey: CryptoKey
): Promise<{
  encrypted: string;
  nonce: string;
  authTag: string;
}> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      tagLength: 128,
    },
    newKey,
    data
  );
  
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);
  
  return {
    encrypted: btoa(String.fromCharCode(...ciphertext)),
    nonce: btoa(String.fromCharCode(...nonce)),
    authTag: btoa(String.fromCharCode(...authTag)),
  };
}

async function decryptWithOldKey(
  encrypted: string,
  nonce: string,
  authTag: string,
  oldKey: CryptoKey
): Promise<string> {
  const ciphertext = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const nonceArray = Uint8Array.from(atob(nonce), c => c.charCodeAt(0));
  const authTagArray = Uint8Array.from(atob(authTag), c => c.charCodeAt(0));
  
  const combined = new Uint8Array(ciphertext.length + authTagArray.length);
  combined.set(ciphertext);
  combined.set(authTagArray, ciphertext.length);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: nonceArray,
      tagLength: 128,
    },
    oldKey,
    combined
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authorization
    const { validateAdminAuth } = await import('../_shared/admin-auth.ts');
    const auth = await validateAdminAuth(req);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error!.message }), {
        status: auth.error!.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting key rotation...');

    // Get current active key
    const { data: oldKeyRecord } = await supabaseAdmin
      .from('secret_encryption_keys')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!oldKeyRecord) {
      return new Response(JSON.stringify({ error: 'No active encryption key found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new encryption key
    const newCryptoKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const exportedNewKey = await crypto.subtle.exportKey("raw", newCryptoKey);
    const newKeyArray = new Uint8Array(exportedNewKey);
    const encryptedNewKeyBase64 = btoa(String.fromCharCode(...newKeyArray));

    // Create new key record
    const { data: newKeyRecord, error: newKeyError } = await supabaseAdmin
      .from('secret_encryption_keys')
      .insert({
        version: oldKeyRecord.version + 1,
        encrypted_key: encryptedNewKeyBase64,
        key_metadata: {
          algorithm: 'AES-256-GCM',
          rotated_from_version: oldKeyRecord.version,
          created_by: auth.user!.id,
        },
        is_active: false, // Set to false initially
      })
      .select()
      .single();

    if (newKeyError) throw newKeyError;

    // Import old key for decryption
    const oldKeyData = Uint8Array.from(atob(oldKeyRecord.encrypted_key), c => c.charCodeAt(0));
    const oldCryptoKey = await crypto.subtle.importKey(
      "raw",
      oldKeyData,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // Get all secrets using old key
    const { data: secretsToRotate, error: secretsError } = await supabaseAdmin
      .from('encrypted_secrets')
      .select('*')
      .eq('encryption_key_id', oldKeyRecord.id);

    if (secretsError) throw secretsError;

    console.log(`Rotating ${secretsToRotate?.length || 0} secrets...`);

    // Re-encrypt each secret with new key
    for (const secret of secretsToRotate || []) {
      try {
        // Decrypt with old key
        const plaintext = await decryptWithOldKey(
          secret.encrypted_value,
          secret.nonce,
          secret.auth_tag,
          oldCryptoKey
        );

        // Re-encrypt with new key
        const { encrypted, nonce, authTag } = await reencryptSecret(plaintext, newCryptoKey);

        // Update secret record
        await supabaseAdmin
          .from('encrypted_secrets')
          .update({
            encrypted_value: encrypted,
            nonce: nonce,
            auth_tag: authTag,
            encryption_key_id: newKeyRecord.id,
            updated_by: auth.user!.id,
          })
          .eq('id', secret.id);

        // Log rotation event
        await supabaseAdmin
          .from('secret_audit_logs')
          .insert({
            secret_id: secret.id,
            event_type: 'ROTATED',
            user_id: auth.user!.id,
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            metadata: {
              old_key_version: oldKeyRecord.version,
              new_key_version: newKeyRecord.version,
            },
          });

        console.log(`Rotated secret: ${secret.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to rotate secret ${secret.id}:`, errorMessage);
        // Continue with other secrets
      }
    }

    // Deactivate old key and activate new key
    await supabaseAdmin
      .from('secret_encryption_keys')
      .update({ 
        is_active: false,
        rotated_at: new Date().toISOString(),
      })
      .eq('id', oldKeyRecord.id);

    await supabaseAdmin
      .from('secret_encryption_keys')
      .update({ is_active: true })
      .eq('id', newKeyRecord.id);

    console.log('Key rotation completed successfully');

    return new Response(
      JSON.stringify({
        message: 'Key rotation completed',
        old_key_version: oldKeyRecord.version,
        new_key_version: newKeyRecord.version,
        secrets_rotated: secretsToRotate?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in secrets-rotate:', error);
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
