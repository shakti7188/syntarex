import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Scheduled rotation endpoint
 * To be called by a cron job for automatic key rotation
 * 
 * Setup with pg_cron:
 * SELECT cron.schedule(
 *   'rotate-pool-keys-monthly',
 *   '0 0 1 * *', -- First day of every month at midnight
 *   $$
 *   SELECT net.http_post(
 *     url:='https://YOUR_PROJECT.supabase.co/functions/v1/api-admin-pools-keys-schedule-rotation',
 *     headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
 *     body:='{"rotationType": "SCHEDULED"}'::jsonb
 *   ) as request_id;
 *   $$
 * );
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is coming from a cron job or admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Service role key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { rotationType = 'SCHEDULED', dryRun = false } = await req.json();

    // Get all active pool configs that use encrypted secrets
    const { data: poolConfigs, error: fetchError } = await supabaseAdmin
      .from('mining_pool_configs')
      .select('*')
      .eq('is_active', true)
      .eq('uses_encrypted_secrets', true);

    if (fetchError) throw fetchError;

    if (!poolConfigs || poolConfigs.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No active pool configs found for rotation',
          rotated: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const config of poolConfigs) {
      try {
        // Check if last rotation was more than 30 days ago
        const { data: lastRotation } = await supabaseAdmin
          .from('mining_pool_key_rotations')
          .select('created_at')
          .eq('pool_config_id', config.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastRotation) {
          const daysSinceRotation = (Date.now() - new Date(lastRotation.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceRotation < 30) {
            console.log(`Skipping ${config.pool_name}: Last rotated ${Math.floor(daysSinceRotation)} days ago`);
            results.push({
              poolConfigId: config.id,
              poolName: config.pool_name,
              status: 'skipped',
              reason: 'Recently rotated',
            });
            continue;
          }
        }

        if (dryRun) {
          results.push({
            poolConfigId: config.id,
            poolName: config.pool_name,
            status: 'would_rotate',
            reason: 'Dry run mode',
          });
          continue;
        }

        // Trigger rotation for this config
        const { data: rotationResult, error: rotationError } = await supabaseAdmin.functions.invoke(
          'api-admin-pools-keys-rotate',
          {
            body: {
              id: config.id,
              rotationType,
              reason: 'Scheduled automatic rotation',
            },
          }
        );

        if (rotationError) {
          throw rotationError;
        }

        successCount++;
        results.push({
          poolConfigId: config.id,
          poolName: config.pool_name,
          status: 'success',
          version: rotationResult?.version,
        });

        console.log(`Successfully rotated: ${config.pool_name}`);
      } catch (error) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          poolConfigId: config.id,
          poolName: config.pool_name,
          status: 'failed',
          error: errorMessage,
        });

        console.error(`Failed to rotate ${config.pool_name}:`, errorMessage);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Scheduled rotation completed',
        rotationType,
        dryRun,
        total: poolConfigs.length,
        succeeded: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-admin-pools-keys-schedule-rotation:', error);
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
