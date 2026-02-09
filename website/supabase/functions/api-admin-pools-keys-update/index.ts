import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { id, apiKey, apiSecret, accountLabel, keyAlias, scopes } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing pool config ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get existing pool config
    const { data: poolConfig, error: poolError } = await supabaseAdmin
      .from('mining_pool_configs')
      .select('*, api_key_secret:encrypted_secrets!mining_pool_configs_api_key_secret_id_fkey(*)')
      .eq('id', id)
      .single();

    if (poolError || !poolConfig) {
      return new Response(JSON.stringify({ error: 'Pool config not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updates: any = {};
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Re-encrypt API key if provided
    if (apiKey) {
      const { data: encryptedKey, error: keyError } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'MINING_POOL_API_KEY',
          value: apiKey,
          metadata: {
            poolName: poolConfig.pool_name,
            poolProvider: poolConfig.pool_provider,
            keyAlias: keyAlias || poolConfig.api_key_secret?.metadata?.keyAlias || 'primary',
            accountLabel: accountLabel || poolConfig.api_key_secret?.metadata?.accountLabel || 'main',
            scopes: scopes || poolConfig.api_key_secret?.metadata?.scopes || ['read'],
            poolConfigId: poolConfig.id,
          },
        },
      });

      if (keyError) throw new Error(`Failed to encrypt API key: ${keyError.message}`);

      // Delete old secret
      await supabaseAdmin
        .from('encrypted_secrets')
        .delete()
        .eq('id', poolConfig.api_key_secret_id);

      updates.api_key_secret_id = encryptedKey.id;

      // Log audit event
      await supabaseAdmin
        .from('secret_audit_logs')
        .insert({
          secret_id: encryptedKey.id,
          event_type: 'UPDATED',
          user_id: auth.user!.id,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            poolConfigId: poolConfig.id,
            action: 'update_api_key',
          },
        });
    }

    // Re-encrypt API secret if provided
    if (apiSecret) {
      const { data: encryptedSecret, error: secretError } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
        body: {
          secretType: 'MINING_POOL_API_SECRET',
          value: apiSecret,
          metadata: {
            poolName: poolConfig.pool_name,
            poolProvider: poolConfig.pool_provider,
            keyAlias: keyAlias || poolConfig.api_key_secret?.metadata?.keyAlias || 'primary',
            accountLabel: accountLabel || poolConfig.api_key_secret?.metadata?.accountLabel || 'main',
            scopes: scopes || poolConfig.api_key_secret?.metadata?.scopes || ['read'],
            poolConfigId: poolConfig.id,
          },
        },
      });

      if (secretError) throw new Error(`Failed to encrypt API secret: ${secretError.message}`);

      // Delete old secret
      await supabaseAdmin
        .from('encrypted_secrets')
        .delete()
        .eq('id', poolConfig.api_secret_secret_id);

      updates.api_secret_secret_id = encryptedSecret.id;

      // Log audit event
      await supabaseAdmin
        .from('secret_audit_logs')
        .insert({
          secret_id: encryptedSecret.id,
          event_type: 'UPDATED',
          user_id: auth.user!.id,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            poolConfigId: poolConfig.id,
            action: 'update_api_secret',
          },
        });
    }

    // Update metadata only if no new secrets
    if (!apiKey && !apiSecret && (accountLabel || keyAlias || scopes)) {
      const currentMetadata = poolConfig.api_key_secret?.metadata || {};
      await supabaseAdmin
        .from('encrypted_secrets')
        .update({
          metadata: {
            ...currentMetadata,
            ...(accountLabel && { accountLabel }),
            ...(keyAlias && { keyAlias }),
            ...(scopes && { scopes }),
          },
        })
        .in('id', [poolConfig.api_key_secret_id, poolConfig.api_secret_secret_id]);
    }

    // Update pool config if needed
    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from('mining_pool_configs')
        .update(updates)
        .eq('id', id);
    }

    // Fetch updated config
    const { data: updatedConfig } = await supabaseAdmin
      .from('mining_pool_configs')
      .select('*, api_key_secret:encrypted_secrets!mining_pool_configs_api_key_secret_id_fkey(*)')
      .eq('id', id)
      .single();

    const metadata = updatedConfig.api_key_secret?.metadata || {};

    console.log(`Pool keys updated for config: ${id}`);

    return new Response(
      JSON.stringify({
        id: updatedConfig.id,
        ownerUserId: updatedConfig.user_id,
        poolName: updatedConfig.pool_name,
        accountLabel: metadata.accountLabel || updatedConfig.subaccount || 'main',
        keyAlias: metadata.keyAlias || 'primary',
        last4: updatedConfig.api_key_secret?.masked_value?.slice(-4) || '****',
        scopes: metadata.scopes || ['read'],
        isActive: updatedConfig.is_active,
        createdAt: updatedConfig.created_at,
        updatedAt: updatedConfig.updated_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-admin-pools-keys-update:', error);
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
