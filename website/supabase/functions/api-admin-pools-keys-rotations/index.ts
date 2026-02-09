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

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing pool config ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pool config
    const { data: poolConfig, error: poolError } = await supabaseAdmin
      .from('mining_pool_configs')
      .select('api_key_secret_id, api_secret_secret_id')
      .eq('id', id)
      .single();

    if (poolError || !poolConfig) {
      return new Response(JSON.stringify({ error: 'Pool config not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get rotation audit logs (ROTATED events)
    const { data: rotations, error: rotationError } = await supabaseAdmin
      .from('secret_audit_logs')
      .select('*')
      .in('secret_id', [poolConfig.api_key_secret_id, poolConfig.api_secret_secret_id])
      .eq('event_type', 'ROTATED')
      .order('created_at', { ascending: false });

    if (rotationError) throw rotationError;

    console.log(`Retrieved ${rotations?.length || 0} rotation events for pool config: ${id}`);

    return new Response(
      JSON.stringify({ rotations: rotations || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-admin-pools-keys-rotations:', error);
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
