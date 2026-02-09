import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { validateAdminAuth } from '../_shared/admin-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadError {
  row: number;
  message: string;
}

interface UploadResult {
  uploadId: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: UploadError[];
}

serve(async (req) => {
  console.log('Bulk Machine Upload - Request received:', req.method);

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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must contain at least a header row and one data row' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1).filter(row => {
      return !row.every(cell => !cell) && !row[0].trim().startsWith('#');
    });

    // Security: Limit maximum rows per upload to prevent DoS
    if (dataRows.length > 1000) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Maximum 1000 rows allowed per upload',
          totalRows: dataRows.length 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const errors: UploadError[] = [];
    let successCount = 0;
    const uploadId = crypto.randomUUID();

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2;

      try {
        const validation = validateRow(row, headers);
        if (!validation.valid) {
          errors.push({ row: rowNumber, message: validation.error! });
          continue;
        }

        const [brand, model, hashRate, powerWatts, location, status, serialNumber, quantity] = row;
        const machineQuantity = quantity ? parseInt(quantity) : 1;

        if (machineQuantity <= 0) {
          errors.push({ row: rowNumber, message: 'Quantity must be greater than 0' });
          continue;
        }

        // Find or create machine_type
        const { data: existingType } = await supabaseClient
          .from('machine_types')
          .select('id')
          .eq('brand', brand.trim())
          .eq('model', model.trim())
          .eq('hash_rate_ths', parseFloat(hashRate))
          .eq('power_watts', parseFloat(powerWatts))
          .maybeSingle();

        let machineTypeId: string;

        if (existingType) {
          machineTypeId = existingType.id;
        } else {
          // Create new machine type
          const efficiency = (parseFloat(powerWatts) / parseFloat(hashRate)).toFixed(2);
          const { data: newType, error: createTypeError } = await supabaseClient
            .from('machine_types')
            .insert({
              brand: brand.trim(),
              model: model.trim(),
              hash_rate_ths: parseFloat(hashRate),
              power_watts: parseFloat(powerWatts),
              efficiency_j_per_th: parseFloat(efficiency),
              price_usdt: 0,
              status: 'ACTIVE',
              available_quantity: 0
            })
            .select('id')
            .single();

          if (createTypeError) throw createTypeError;
          machineTypeId = newType.id;
        }

        // Create machine inventory entries
        const inventoryEntries = Array.from({ length: machineQuantity }, (_, idx) => ({
          user_id: auth.user!.id,
          machine_type_id: machineTypeId,
          status: status?.toUpperCase() || 'AVAILABLE',
          deployment_status: 'ORDERED',
          location: location?.trim() || null,
          tracking_number: serialNumber ? `${serialNumber.trim()}-${idx + 1}` : null
        }));

        const { error: insertError } = await supabaseClient
          .from('machine_inventory')
          .insert(inventoryEntries);

        if (insertError) throw insertError;

        successCount += machineQuantity;
      } catch (error: any) {
        errors.push({ row: rowNumber, message: error.message });
      }
    }

    // Determine upload status
    let status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    if (errors.length === 0) {
      status = 'SUCCESS';
    } else if (successCount > 0) {
      status = 'PARTIAL';
    } else {
      status = 'FAILED';
    }

    // Log the upload to machine_bulk_uploads
    await supabaseClient.from('machine_bulk_uploads').insert({
      admin_user_id: auth.user!.id,
      file_name: file.name,
      total_rows: dataRows.length,
      successful_rows: successCount,
      failed_rows: errors.length,
      status,
      errors_json: errors.length > 0 ? errors : null
    });

    const result: UploadResult = {
      uploadId,
      totalRows: dataRows.length,
      successfulRows: successCount,
      failedRows: errors.length,
      errors
    };

    console.log('Bulk upload completed:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing bulk upload:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process bulk upload' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
}

function validateRow(row: string[], headers: string[]): { valid: boolean; error?: string } {
  if (row.length !== headers.length) {
    return { valid: false, error: `Expected ${headers.length} columns, got ${row.length}` };
  }

  const [brand, model, hashRate, powerWatts, location, status, serialNumber, quantity] = row;

  if (!brand || !brand.trim()) {
    return { valid: false, error: 'Missing brand' };
  }

  // Security: Validate field lengths to prevent database bloat
  if (brand.length > 100) {
    return { valid: false, error: 'Brand name too long (max 100 characters)' };
  }

  if (!model || !model.trim()) {
    return { valid: false, error: 'Missing model' };
  }

  if (model.length > 200) {
    return { valid: false, error: 'Model name too long (max 200 characters)' };
  }

  if (!hashRate || isNaN(Number(hashRate))) {
    return { valid: false, error: 'Missing or invalid hash_rate_ths' };
  }

  if (!powerWatts || isNaN(Number(powerWatts))) {
    return { valid: false, error: 'Missing or invalid power_watts' };
  }

  if (!location || !location.trim()) {
    return { valid: false, error: 'Missing location' };
  }

  if (location.length > 200) {
    return { valid: false, error: 'Location too long (max 200 characters)' };
  }

  if (serialNumber && serialNumber.length > 100) {
    return { valid: false, error: 'Serial number too long (max 100 characters)' };
  }

  const validStatuses = ['AVAILABLE', 'RESERVED', 'SOLD', 'DEPLOYED'];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return { valid: false, error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}` };
  }

  if (quantity && isNaN(Number(quantity))) {
    return { valid: false, error: 'Invalid quantity' };
  }

  return { valid: true };
}
