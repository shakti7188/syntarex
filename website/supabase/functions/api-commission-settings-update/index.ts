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
    const { setting_name, setting_value } = body;

    if (!setting_name || setting_value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: setting_name, setting_value' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the setting to validate range
    const { data: setting, error: fetchError } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('setting_name', setting_name)
      .single();

    if (fetchError || !setting) {
      return new Response(JSON.stringify({ error: 'Setting not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate range
    const numValue = parseFloat(setting_value);
    if (numValue < setting.min_value || numValue > setting.max_value) {
      return new Response(
        JSON.stringify({ 
          error: `Value must be between ${setting.min_value} and ${setting.max_value}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update the setting
    const { data, error } = await supabase
      .from('commission_settings')
      .update({
        setting_value: numValue,
        updated_by: auth.user!.id,
      })
      .eq('setting_name', setting_name)
      .select()
      .single();

    if (error) {
      console.error('Error updating commission setting:', error);
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
    console.error('Error in commission settings update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
