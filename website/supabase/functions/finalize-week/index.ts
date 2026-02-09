import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { weekStartDate } = await req.json();

    console.log(`Finalizing week: ${weekStartDate}`);

    // Step 1: Run commission engine
    const commissionResult = await supabase.functions.invoke('commission-engine', {
      body: { weekStartDate },
    });

    if (commissionResult.error) {
      throw new Error(`Commission calculation failed: ${commissionResult.error.message}`);
    }

    console.log('Commission engine completed:', commissionResult.data);

    // Step 2: Generate Merkle tree
    const merkleResult = await supabaseAdmin.functions.invoke('generate-merkle-tree', {
      body: { weekStartDate },
    });

    if (merkleResult.error) {
      throw new Error(`Merkle tree generation failed: ${merkleResult.error.message}`);
    }

    console.log('Merkle tree generated:', merkleResult.data);

    // Step 3: Mark settlements as finalized and ready to claim
    const { error: finalizeError } = await supabaseAdmin
      .from('weekly_settlements')
      .update({ 
        status: 'ready_to_claim',
        is_finalized: true,
      })
      .eq('week_start_date', weekStartDate)
      .not('merkle_proof', 'is', null);

    if (finalizeError) {
      console.error('Error finalizing settlements:', finalizeError);
      throw new Error(`Failed to finalize settlements: ${finalizeError.message}`);
    }

    console.log(`Week ${weekStartDate} finalized successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        weekStartDate,
        commissions: commissionResult.data,
        merkle: merkleResult.data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in finalize-week:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
