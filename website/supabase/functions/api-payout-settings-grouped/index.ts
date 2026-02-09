import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch all payout settings (no auth required - public read)
    const { data, error } = await supabase
      .from('payout_settings')
      .select('*')
      .order('key');

    if (error) throw error;

    // Group settings by category
    const grouped: any = {
      direct: {},
      binary: {},
      override: {},
      global: {}
    };

    data?.forEach((setting) => {
      if (setting.key.startsWith('direct_tier1')) {
        grouped.direct.tier1 = setting.value;
      } else if (setting.key.startsWith('direct_tier2')) {
        grouped.direct.tier2 = setting.value;
      } else if (setting.key.startsWith('direct_tier3')) {
        grouped.direct.tier3 = setting.value;
      } else if (setting.key === 'binary_weak_leg_percent') {
        grouped.binary.weakLeg = setting.value;
      } else if (setting.key === 'binary_total_cap_percent') {
        grouped.binary.cap = setting.value;
      } else if (setting.key === 'override_level1_percent') {
        grouped.override.level1 = setting.value;
      } else if (setting.key === 'override_level2_percent') {
        grouped.override.level2 = setting.value;
      } else if (setting.key === 'override_level3_percent') {
        grouped.override.level3 = setting.value;
      } else if (setting.key === 'global_payout_cap_percent') {
        grouped.global.payoutCap = setting.value;
      }
    });

    return new Response(JSON.stringify(grouped), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
