import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM encryption using Web Crypto API
async function encryptSecret(plaintext: string, keyMaterial: CryptoKey): Promise<{
  encrypted: string;
  nonce: string;
  authTag: string;
}> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate random nonce (96 bits for GCM)
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt with AES-256-GCM
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      tagLength: 128, // 128-bit auth tag
    },
    keyMaterial,
    data
  );
  
  // The encrypted buffer includes the auth tag at the end
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedArray.slice(0, -16); // Data without auth tag
  const authTag = encryptedArray.slice(-16); // Last 16 bytes are auth tag
  
  return {
    encrypted: btoa(String.fromCharCode(...ciphertext)),
    nonce: btoa(String.fromCharCode(...nonce)),
    authTag: btoa(String.fromCharCode(...authTag)),
  };
}

// Generate SHA-256 hash for integrity
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate or retrieve active encryption key
async function getOrCreateEncryptionKey(supabase: any): Promise<{
  keyId: string;
  cryptoKey: CryptoKey;
}> {
  // Check for active key
  const { data: activeKey } = await supabase
    .from('secret_encryption_keys')
    .select('id, encrypted_key')
    .eq('is_active', true)
    .single();
  
  if (activeKey) {
    // Decrypt the stored key (in production, this would use KMS)
    // For now, we're using a base64-encoded key
    const keyData = Uint8Array.from(atob(activeKey.encrypted_key), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
    
    return { keyId: activeKey.id, cryptoKey };
  }
  
  // Generate new key
  const newKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  // Export and store (in production, encrypt with KMS)
  const exportedKey = await crypto.subtle.exportKey("raw", newKey);
  const keyArray = new Uint8Array(exportedKey);
  const encryptedKeyBase64 = btoa(String.fromCharCode(...keyArray));
  
  const { data: newKeyRecord, error } = await supabase
    .from('secret_encryption_keys')
    .insert({
      encrypted_key: encryptedKeyBase64,
      key_metadata: {
        algorithm: 'AES-256-GCM',
        created_by: 'system',
      },
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return { keyId: newKeyRecord.id, cryptoKey: newKey };
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

    const { secretType, value, metadata } = await req.json();

    if (!secretType || !value) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create encryption key
    const { keyId, cryptoKey } = await getOrCreateEncryptionKey(supabaseAdmin);

    // Encrypt the secret
    const { encrypted, nonce, authTag } = await encryptSecret(value, cryptoKey);

    // Generate hash for integrity
    const valueHash = await hashValue(value);

    // Create masked value (last 4 chars only)
    const maskedValue = value.length > 4 
      ? '****' + value.slice(-4) 
      : '****';

    // Store encrypted secret
    const { data: encryptedSecret, error: insertError } = await supabaseAdmin
      .from('encrypted_secrets')
      .insert({
        secret_type: secretType,
        encrypted_value: encrypted,
        encryption_key_id: keyId,
        nonce: nonce,
        auth_tag: authTag,
        value_hash: valueHash,
        masked_value: maskedValue,
        metadata: metadata || {},
        created_by: auth.user!.id,
        updated_by: auth.user!.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log audit event
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await supabaseAdmin
      .from('secret_audit_logs')
      .insert({
        secret_id: encryptedSecret.id,
        event_type: 'CREATED',
        user_id: auth.user!.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          secret_type: secretType,
        },
      });

    console.log(`Secret created: ${encryptedSecret.id}, type: ${secretType}`);

    return new Response(
      JSON.stringify({
        id: encryptedSecret.id,
        masked_value: maskedValue,
        secret_type: secretType,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in secrets-encrypt:', error);
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
