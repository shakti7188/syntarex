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

    const { 
      ownerUserId, 
      poolName, 
      poolProvider,
      apiKey, 
      apiSecret,
      accountLabel,
      keyAlias,
      scopes,
      subaccount 
    } = await req.json();

    if (!ownerUserId || !poolName || !poolProvider || !apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Encrypt API key
    const { data: encryptedKey, error: keyError } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
      body: {
        secretType: 'MINING_POOL_API_KEY',
        value: apiKey,
        metadata: {
          poolName,
          poolProvider,
          keyAlias: keyAlias || 'primary',
          accountLabel: accountLabel || 'main',
        },
      },
    });

    if (keyError) throw new Error(`Failed to encrypt API key: ${keyError.message}`);

    // Encrypt API secret
    const { data: encryptedSecret, error: secretError } = await supabaseAdmin.functions.invoke('secrets-encrypt', {
      body: {
        secretType: 'MINING_POOL_API_SECRET',
        value: apiSecret,
        metadata: {
          poolName,
          poolProvider,
          keyAlias: keyAlias || 'primary',
          accountLabel: accountLabel || 'main',
        },
      },
    });

    if (secretError) throw new Error(`Failed to encrypt API secret: ${secretError.message}`);

    // Create pool config with encrypted secret IDs
    const { data: poolConfig, error: poolError } = await supabaseAdmin
      .from('mining_pool_configs')
      .insert({
        user_id: ownerUserId,
        pool_name: poolName,
        pool_provider: poolProvider,
        api_key: 'encrypted',
        api_secret: 'encrypted',
        api_key_secret_id: encryptedKey.id,
        api_secret_secret_id: encryptedSecret.id,
        uses_encrypted_secrets: true,
        subaccount: subaccount || null,
      })
      .select()
      .single();

    if (poolError) throw poolError;

    // Update encrypted_secrets metadata with pool config ID
    await supabaseAdmin
      .from('encrypted_secrets')
      .update({
        metadata: {
          poolName,
          poolProvider,
          keyAlias: keyAlias || 'primary',
          accountLabel: accountLabel || 'main',
          scopes: scopes || ['read'],
          poolConfigId: poolConfig.id,
        },
      })
      .in('id', [encryptedKey.id, encryptedSecret.id]);

    // Log audit event
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await supabaseAdmin
      .from('secret_audit_logs')
      .insert([
        {
          secret_id: encryptedKey.id,
          event_type: 'CREATED',
          user_id: auth.user!.id,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            poolConfigId: poolConfig.id,
            action: 'create_pool_keys',
          },
        },
        {
          secret_id: encryptedSecret.id,
          event_type: 'CREATED',
          user_id: auth.user!.id,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            poolConfigId: poolConfig.id,
            action: 'create_pool_keys',
          },
        },
      ]);

    console.log(`Pool keys created for config: ${poolConfig.id}`);

    // Return masked response
    return new Response(
      JSON.stringify({
        id: poolConfig.id,
        ownerUserId: poolConfig.user_id,
        poolName: poolConfig.pool_name,
        accountLabel: accountLabel || 'main',
        keyAlias: keyAlias || 'primary',
        last4: encryptedKey.masked_value.slice(-4),
        scopes: scopes || ['read'],
        isActive: poolConfig.is_active,
        createdAt: poolConfig.created_at,
        updatedAt: poolConfig.updated_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-admin-pools-keys-create:', error);
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
