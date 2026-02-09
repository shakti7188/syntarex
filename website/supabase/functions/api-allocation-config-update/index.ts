import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const {
      affiliate_network_pct,
      btc_mining_machines_pct,
      core_team_pct,
      investor_returns_pct,
    } = body;

    // Validate ranges
    if (
      affiliate_network_pct < 30 || affiliate_network_pct > 40 ||
      btc_mining_machines_pct < 15 || btc_mining_machines_pct > 25 ||
      core_team_pct < 5 || core_team_pct > 10 ||
      investor_returns_pct < 35 || investor_returns_pct > 40
    ) {
      return new Response(
        JSON.stringify({ error: 'Values outside allowed ranges' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the existing config ID
    const { data: existingConfig } = await supabase
      .from('allocation_config')
      .select('id')
      .single();

    if (!existingConfig) {
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update allocation config
    const { data, error } = await supabase
      .from('allocation_config')
      .update({
        affiliate_network_pct,
        btc_mining_machines_pct,
        core_team_pct,
        investor_returns_pct,
        updated_by: auth.user!.id,
      })
      .eq('id', existingConfig.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating allocation config:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in allocation config update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
