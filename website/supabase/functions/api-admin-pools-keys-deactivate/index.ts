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

    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing pool config ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pool config
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

    // Deactivate pool config
    const { error: updateError } = await supabaseAdmin
      .from('mining_pool_configs')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log audit event with DEACTIVATED event type
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log deactivation for both secrets
    if (poolConfig.api_key_secret_id && poolConfig.api_secret_secret_id) {
      await supabaseAdmin
        .from('secret_audit_logs')
        .insert([
          {
            secret_id: poolConfig.api_key_secret_id,
            event_type: 'ACCESSED',
            user_id: auth.user!.id,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: {
              poolConfigId: poolConfig.id,
              action: 'deactivate',
              reason: 'Pool configuration deactivated',
              poolName: poolConfig.pool_name,
            },
          },
          {
            secret_id: poolConfig.api_secret_secret_id,
            event_type: 'ACCESSED',
          user_id: auth.user!.id,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: {
              poolConfigId: poolConfig.id,
              action: 'deactivate',
              reason: 'Pool configuration deactivated',
              poolName: poolConfig.pool_name,
            },
          },
        ]);
    }

    console.log(`Deactivated pool config: ${id} (${poolConfig.pool_name})`);

    return new Response(
      JSON.stringify({
        message: 'Pool keys deactivated successfully',
        poolConfigId: id,
        isActive: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-admin-pools-keys-deactivate:', error);
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
