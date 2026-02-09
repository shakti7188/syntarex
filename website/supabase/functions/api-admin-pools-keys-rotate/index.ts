import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility: Generate SHA-256 fingerprint
async function generateFingerprint(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authorization
    const auth = await validateAdminAuth(req);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error!.message }), {
        status: auth.error!.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { id, rotationType = 'ON_DEMAND', reason, newApiKey, newApiSecret } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing pool config ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate rotation type
    const validRotationTypes = ['SCHEDULED', 'ON_DEMAND', 'FORCED_COMPROMISE'];
    if (!validRotationTypes.includes(rotationType)) {
      return new Response(JSON.stringify({ error: 'Invalid rotation type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pool config with current secrets
    const { data: poolConfig, error: poolError } = await supabaseAdmin
      .from('mining_pool_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (poolError || !poolConfig) {
      return new Response(JSON.stringify({ error: 'Pool config not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get old secrets for fingerprinting
    const { data: oldApiKeySecret } = await supabaseAdmin
      .from('encrypted_secrets')
      .select('*')
      .eq('id', poolConfig.api_key_secret_id)
      .single();

    const { data: oldApiSecretSecret } = await supabaseAdmin
      .from('encrypted_secrets')
      .select('*')
      .eq('id', poolConfig.api_secret_secret_id)
      .single();

    const oldKeyFingerprint = oldApiKeySecret?.value_hash || '';
    const oldSecretFingerprint = oldApiSecretSecret?.value_hash || '';

    // Create new encrypted secrets with incremented version
    const oldVersion = (oldApiKeySecret?.metadata as any)?.version || 1;
    const newVersion = oldVersion + 1;

    // Encrypt new API key
    const { data: newKeyData, error: newKeyError } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
      body: {
        secretType: 'mining_pool_api_key',
        value: newApiKey || poolConfig.api_key,
        metadata: {
          poolConfigId: id,
          poolName: poolConfig.pool_name,
          poolProvider: poolConfig.pool_provider,
          version: newVersion,
          rotatedAt: new Date().toISOString(),
          rotationType,
          reason,
        },
      },
    });

    if (newKeyError) throw newKeyError;

    // Encrypt new API secret
    const { data: newSecretData, error: newSecretError } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
      body: {
        secretType: 'mining_pool_api_secret',
        value: newApiSecret || poolConfig.api_secret,
        metadata: {
          poolConfigId: id,
          poolName: poolConfig.pool_name,
          poolProvider: poolConfig.pool_provider,
          version: newVersion,
          rotatedAt: new Date().toISOString(),
          rotationType,
          reason,
        },
      },
    });

    if (newSecretError) throw newSecretError;

    // Generate fingerprints for new keys
    const newKeyFingerprint = await generateFingerprint(newApiKey || poolConfig.api_key);
    const newSecretFingerprint = await generateFingerprint(newApiSecret || poolConfig.api_secret);

    // Update pool config with new secret references
    const { error: updateError } = await supabaseAdmin
      .from('mining_pool_configs')
      .update({
        api_key_secret_id: newKeyData.id,
        api_secret_secret_id: newSecretData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Insert rotation record
    const { error: rotationInsertError } = await supabaseAdmin
      .from('mining_pool_key_rotations')
      .insert({
        pool_config_id: id,
        old_secret_id: poolConfig.api_key_secret_id,
        new_secret_id: newKeyData.id,
        old_key_fingerprint: oldKeyFingerprint,
        new_key_fingerprint: newKeyFingerprint,
        rotation_type: rotationType,
        rotated_by: auth.user!.id,
        rotation_reason: reason,
      });

    if (rotationInsertError) throw rotationInsertError;

    // Log audit events
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await supabaseAdmin
      .from('secret_audit_logs')
      .insert([
        {
          secret_id: newKeyData.id,
          event_type: 'ROTATED',
          user_id: auth.user!.id,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            poolConfigId: id,
            action: 'rotate_api_key',
            rotationType,
            reason,
            oldFingerprint: oldKeyFingerprint.substring(0, 8),
            newFingerprint: newKeyFingerprint.substring(0, 8),
            version: newVersion,
          },
        },
        {
          secret_id: newSecretData.id,
          event_type: 'ROTATED',
          user_id: auth.user!.id,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            poolConfigId: id,
            action: 'rotate_api_secret',
            rotationType,
            reason,
            oldFingerprint: oldSecretFingerprint.substring(0, 8),
            newFingerprint: newSecretFingerprint.substring(0, 8),
            version: newVersion,
          },
        },
      ]);

    console.log(`Rotated pool keys for config: ${id}, type: ${rotationType}, version: ${newVersion}`);

    return new Response(
      JSON.stringify({
        message: 'Pool keys rotated successfully',
        poolConfigId: id,
        rotationType,
        version: newVersion,
        rotatedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-admin-pools-keys-rotate:', error);
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
