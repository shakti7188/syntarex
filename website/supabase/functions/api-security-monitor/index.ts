import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Security monitoring endpoint
 * Runs anomaly detection and sends alerts for suspicious activity
 * Can be called via cron for continuous monitoring
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const alerts: any[] = [];
    const { timeWindowMinutes = 60 } = await req.json().catch(() => ({}));

    console.log(`🔍 Running security monitoring (window: ${timeWindowMinutes} minutes)...`);

    // Check for decrypt anomalies
    const { data: recentAccess } = await supabaseAdmin
      .from('secret_audit_logs')
      .select('user_id, secret_id, ip_address')
      .eq('event_type', 'ACCESSED')
      .gte('created_at', new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString())
      .limit(1000);

    if (recentAccess && recentAccess.length > 0) {
      // Group by user and secret to detect high-frequency access
      const accessByUserSecret = new Map<string, { count: number; ips: Set<string> }>();

      for (const access of recentAccess) {
        const key = `${access.user_id}:${access.secret_id}`;
        const existing = accessByUserSecret.get(key) || { count: 0, ips: new Set() };
        existing.count++;
        if (access.ip_address) existing.ips.add(access.ip_address);
        accessByUserSecret.set(key, existing);
      }

      // Detect anomalies (>50 accesses per secret per hour)
      for (const [key, stats] of accessByUserSecret.entries()) {
        if (stats.count > 50) {
          const [userId, secretId] = key.split(':');
          alerts.push({
            severity: 'warning',
            type: 'high_decrypt_frequency',
            message: `User ${userId} accessed secret ${secretId} ${stats.count} times in ${timeWindowMinutes} minutes`,
            details: {
              userId,
              secretId,
              accessCount: stats.count,
              uniqueIps: stats.ips.size,
              threshold: 50,
            },
          });
        }
      }
    }

    // Check for unusual IP access patterns
    const { data: ipPatterns, error: ipError } = await supabaseAdmin.rpc('detect_unusual_ip_access', {
      p_user_id: null, // Check all users
      p_time_window_minutes: timeWindowMinutes,
    });

    if (ipPatterns && ipPatterns.length > 0) {
      for (const pattern of ipPatterns) {
        if (pattern.is_suspicious) {
          alerts.push({
            severity: 'warning',
            type: 'suspicious_ip_activity',
            message: `IP ${pattern.ip_address} showed suspicious activity: ${pattern.access_count} accesses across ${pattern.unique_secrets} secrets`,
            details: {
              ipAddress: pattern.ip_address,
              accessCount: pattern.access_count,
              uniqueSecrets: pattern.unique_secrets,
              timeRange: {
                first: pattern.first_access,
                last: pattern.last_access,
              },
            },
          });
        }
      }
    }

    // Check for failed rotation attempts (multiple forced compromises)
    const { data: failedRotations } = await supabaseAdmin.rpc('detect_failed_rotations', {
      p_time_window_hours: Math.ceil(timeWindowMinutes / 60),
    });

    if (failedRotations && failedRotations.length > 0) {
      for (const rotation of failedRotations) {
        alerts.push({
          severity: 'critical',
          type: 'multiple_forced_rotations',
          message: `Pool config ${rotation.pool_config_id} had ${rotation.attempt_count} forced compromise rotations`,
          details: {
            poolConfigId: rotation.pool_config_id,
            attemptCount: rotation.attempt_count,
            lastAttempt: rotation.last_attempt,
            rotatedBy: rotation.rotated_by,
          },
        });
      }
    }

    // Get security events summary
    const { data: eventsSummary } = await supabaseAdmin.rpc('get_security_events_summary', {
      p_time_window_hours: Math.ceil(timeWindowMinutes / 60),
    });

    // Check for unusual event patterns
    if (eventsSummary) {
      for (const event of eventsSummary) {
        // Alert on high volume of ACCESSED events
        if (event.event_type === 'ACCESSED' && event.event_count > 500) {
          alerts.push({
            severity: 'warning',
            type: 'high_access_volume',
            message: `High volume of ACCESSED events: ${event.event_count} in ${Math.ceil(timeWindowMinutes / 60)} hours`,
            details: {
              eventCount: event.event_count,
              uniqueUsers: event.unique_users,
              uniqueSecrets: event.unique_secrets,
              latestEvent: event.latest_event,
            },
          });
        }

        // Alert on multiple ROTATED events (could indicate issues)
        if (event.event_type === 'ROTATED' && event.event_count > 10) {
          alerts.push({
            severity: 'info',
            type: 'high_rotation_activity',
            message: `Unusually high rotation activity: ${event.event_count} rotations in ${Math.ceil(timeWindowMinutes / 60)} hours`,
            details: {
              eventCount: event.event_count,
              uniqueUsers: event.unique_users,
              uniqueSecrets: event.unique_secrets,
            },
          });
        }
      }
    }

    // Send alerts to configured webhooks if any alerts were generated
    if (alerts.length > 0 && Deno.env.get('SECURITY_WEBHOOK_URL')) {
      try {
        await fetch(Deno.env.get('SECURITY_WEBHOOK_URL')!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            monitoringWindow: `${timeWindowMinutes} minutes`,
            alertCount: alerts.length,
            alerts,
          }),
        });
        console.log(`📤 Sent ${alerts.length} alerts to webhook`);
      } catch (error) {
        console.error('Failed to send webhook alerts:', error);
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      monitoringWindow: `${timeWindowMinutes} minutes`,
      alertsGenerated: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      infoAlerts: alerts.filter(a => a.severity === 'info').length,
      eventsSummary,
    };

    console.log(`✅ Monitoring complete: ${alerts.length} alerts generated`);

    return new Response(
      JSON.stringify({
        summary,
        alerts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in security monitor:', error);
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
