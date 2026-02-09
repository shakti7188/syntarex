import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('CSV Template Generator - Request received:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate CSV template with headers and example row
    const csvContent = [
      'brand,model,hash_rate_ths,power_watts,location,status,serial_number,quantity',
      '# Bitmain,S19j Pro,104,3068,Edmonton DC,AVAILABLE,SN123456789,5',
      '# MicroBT,M30S++,112,3472,Sabah Site A,DEPLOYED,SN987654321,3'
    ].join('\n');

    console.log('CSV template generated successfully');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="machine_bulk_upload_template.csv"'
      },
    });

  } catch (error: unknown) {
    console.error('Error generating CSV template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate template';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
