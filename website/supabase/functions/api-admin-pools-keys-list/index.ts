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

    // Get all pool configs with encrypted secrets
    const { data: poolConfigs, error: poolError } = await supabaseAdmin
      .from('mining_pool_configs')
      .select(`
        id,
        user_id,
        pool_name,
        pool_provider,
        subaccount,
        is_active,
        created_at,
        updated_at,
        api_key_secret:encrypted_secrets!mining_pool_configs_api_key_secret_id_fkey(
          id,
          masked_value,
          metadata
        )
      `)
      .eq('uses_encrypted_secrets', true)
      .order('created_at', { ascending: false });

    if (poolError) throw poolError;

    // Transform to masked response format
    const maskedKeys = (poolConfigs || []).map((config: any) => {
      const metadata = config.api_key_secret?.metadata || {};
      return {
        id: config.id,
        ownerUserId: config.user_id,
        poolName: config.pool_name,
        accountLabel: metadata.accountLabel || config.subaccount || 'main',
        keyAlias: metadata.keyAlias || 'primary',
        last4: config.api_key_secret?.masked_value?.slice(-4) || '****',
        scopes: metadata.scopes || ['read'],
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      };
    });

    console.log(`Listed ${maskedKeys.length} pool keys (admin)`);

    return new Response(
      JSON.stringify({ keys: maskedKeys }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-admin-pools-keys-list:', error);
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
