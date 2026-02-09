import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { machineInventoryId } = await req.json();

    if (!machineInventoryId) {
      return new Response(
        JSON.stringify({ error: 'machineInventoryId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating allocation for machine ${machineInventoryId} for user ${user.id}`);

    // Fetch machine inventory with machine type
    const { data: machine, error: machineError } = await supabaseClient
      .from('machine_inventory')
      .select('*, machine_types!inner(hash_rate_ths)')
      .eq('id', machineInventoryId)
      .eq('user_id', user.id)
      .single();

    if (machineError || !machine) {
      console.error('Error fetching machine:', machineError);
      return new Response(
        JSON.stringify({ error: 'Machine not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if allocation already exists
    const { data: existingAllocation, error: checkError } = await supabaseClient
      .from('hashrate_allocations')
      .select('id')
      .eq('machine_inventory_id', machineInventoryId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing allocation:', checkError);
    }

    if (existingAllocation) {
      return new Response(
        JSON.stringify({ 
          error: 'Allocation already exists for this machine',
          allocationId: existingAllocation.id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const machineType = Array.isArray(machine.machine_types) 
      ? machine.machine_types[0] 
      : machine.machine_types;
    const totalThs = parseFloat(machineType?.hash_rate_ths || '0');

    // Create allocation
    const { data: allocation, error: allocationError } = await supabaseClient
      .from('hashrate_allocations')
      .insert({
        user_id: user.id,
        machine_inventory_id: machineInventoryId,
        total_ths: totalThs,
        tokenized_ths: 0,
        untokenized_ths: totalThs,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (allocationError) {
      console.error('Error creating allocation:', allocationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create allocation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Allocation created: ${allocation.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        allocation: {
          id: allocation.id,
          machineInventoryId: allocation.machine_inventory_id,
          totalThs: allocation.total_ths,
          tokenizedThs: allocation.tokenized_ths,
          untokenizedThs: allocation.untokenized_ths,
          status: allocation.status,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
