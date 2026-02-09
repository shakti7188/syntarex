import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with anon key for auth verification
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // GET /api/allocation-settings - Fetch all settings (available to all authenticated users)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('allocation_settings')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching allocation settings:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Fetched allocation settings:', data?.length);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/allocation-settings/:id - Update single setting (admin only)
    if (req.method === 'POST') {
      // Verify admin role for updates using centralized validation
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        console.error('User is not admin:', user.id);
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const settingId = pathParts[pathParts.length - 1];
      if (!settingId) {
        return new Response(JSON.stringify({ error: 'Setting ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const { value } = body;

      if (value === undefined || value === null) {
        return new Response(JSON.stringify({ error: 'Value is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch the setting to validate range
      const { data: setting, error: settingError } = await supabase
        .from('allocation_settings')
        .select('*')
        .eq('id', settingId)
        .single();

      if (settingError || !setting) {
        console.error('Setting not found:', settingId);
        return new Response(JSON.stringify({ error: 'Setting not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate value against min/max
      if (setting.min_value !== null && value < setting.min_value) {
        return new Response(
          JSON.stringify({ 
            error: `Value must be at least ${setting.min_value}%` 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (setting.max_value !== null && value > setting.max_value) {
        return new Response(
          JSON.stringify({ 
            error: `Value must be at most ${setting.max_value}%` 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Fetch all settings to calculate total
      const { data: allSettings, error: allError } = await supabase
        .from('allocation_settings')
        .select('*');

      if (allError) {
        console.error('Error fetching all settings:', allError);
        return new Response(JSON.stringify({ error: allError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate what the total would be with this change
      const total = allSettings.reduce((sum, s) => {
        if (s.id === settingId) {
          return sum + parseFloat(value);
        }
        return sum + parseFloat(s.value);
      }, 0);

      console.log('Total allocation after update would be:', total);

      // Validate total doesn't exceed 100%
      if (total > 100) {
        return new Response(
          JSON.stringify({ 
            error: `Total allocation cannot exceed 100%. Current total would be ${total.toFixed(2)}%` 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update the setting
      const { data: updated, error: updateError } = await supabase
        .from('allocation_settings')
        .update({
          value: value,
          updated_by: user.id,
        })
        .eq('id', settingId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating setting:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Updated setting:', updated.name, 'to', updated.value);
      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in allocation settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
