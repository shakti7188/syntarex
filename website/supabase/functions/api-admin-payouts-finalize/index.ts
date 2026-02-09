import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format money as string decimal
function formatMoney(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0.00";
  
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? "0.00" : parsed.toFixed(2);
  }
  
  return amount.toFixed(2);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse request body
    const { weekStart } = await req.json();

    if (!weekStart) {
      return new Response(
        JSON.stringify({ error: 'weekStart is required in YYYY-MM-DD format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin', auth.user!.email, 'finalizing week:', weekStart);

    // Call finalize-week function
    const { data: finalizeResult, error: finalizeError } = await supabase.functions.invoke(
      'finalize-week',
      {
        body: { weekStart }
      }
    );

    if (finalizeError) {
      console.error('Finalize week error:', finalizeError);
      return new Response(
        JSON.stringify({ error: 'Finalization failed', details: finalizeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform response to camelCase API format
    const response = {
      weekStart,
      status: 'FINALIZED',
      merkleRoot: finalizeResult.merkleRoot || null,
      totalUsers: finalizeResult.totalUsers || 0,
      totalAmount: formatMoney(finalizeResult.totalAmount || 0),
      settlementsFinalized: finalizeResult.settlementsCount || 0,
      message: finalizeResult.message || 'Week finalized successfully',
    };

    console.log('Finalization successful:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in api-admin-payouts-finalize:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
