import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-token',
};

// AES-256-GCM decryption using Web Crypto API
async function decryptSecret(
  encrypted: string,
  nonce: string,
  authTag: string,
  keyMaterial: CryptoKey
): Promise<string> {
  const ciphertext = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const nonceArray = Uint8Array.from(atob(nonce), c => c.charCodeAt(0));
  const authTagArray = Uint8Array.from(atob(authTag), c => c.charCodeAt(0));
  
  // Combine ciphertext and auth tag for GCM
  const combined = new Uint8Array(ciphertext.length + authTagArray.length);
  combined.set(ciphertext);
  combined.set(authTagArray, ciphertext.length);
  
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonceArray,
        tagLength: 128,
      },
      keyMaterial,
      combined
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed: Invalid ciphertext or authentication tag');
  }
}

// Verify hash for integrity
async function verifyHash(value: string, expectedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return actualHash === expectedHash;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This endpoint is for server-side use only (e.g., sync functions)
    // Authenticate using service role or sync token
    const syncToken = req.headers.get('x-sync-token');
    const expectedSyncToken = Deno.env.get('MINING_POOL_SYNC_TOKEN');
    
    if (!syncToken || syncToken !== expectedSyncToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid sync token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { secretId } = await req.json();

    if (!secretId) {
      return new Response(JSON.stringify({ error: 'Missing secret ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch encrypted secret with encryption key
    const { data: secret, error: secretError } = await supabaseAdmin
      .from('encrypted_secrets')
      .select(`
        *,
        encryption_key:secret_encryption_keys(encrypted_key)
      `)
      .eq('id', secretId)
      .single();

    if (secretError || !secret) {
      return new Response(JSON.stringify({ error: 'Secret not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Import encryption key
    const keyData = Uint8Array.from(
      atob(secret.encryption_key.encrypted_key), 
      c => c.charCodeAt(0)
    );
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    // Decrypt the secret
    const decryptedValue = await decryptSecret(
      secret.encrypted_value,
      secret.nonce,
      secret.auth_tag,
      cryptoKey
    );

    // Verify integrity
    const isValid = await verifyHash(decryptedValue, secret.value_hash);
    if (!isValid) {
      throw new Error('Integrity check failed: Hash mismatch');
    }

    // Log audit event (without exposing user info in server-to-server call)
    await supabaseAdmin
      .from('secret_audit_logs')
      .insert({
        secret_id: secretId,
        event_type: 'ACCESSED',
        user_id: secret.created_by,
        ip_address: req.headers.get('x-forwarded-for') || 'server',
        user_agent: 'server-to-server',
        metadata: {
          accessed_via: 'sync-function',
        },
      });

    console.log(`Secret accessed: ${secretId}`);

    // IMPORTANT: Never log the decrypted value
    return new Response(
      JSON.stringify({
        value: decryptedValue,
        secret_type: secret.secret_type,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in secrets-decrypt:', errorMessage); // Only log error message, not stack
    return new Response(
      JSON.stringify({ error: 'Decryption failed' }), // Don't expose internal details
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
