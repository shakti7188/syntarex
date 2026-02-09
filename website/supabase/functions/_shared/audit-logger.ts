import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuditLogEntry {
  userId?: string;
  operation: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Log security-critical operations to audit trail
 * Uses service role client to bypass RLS
 */
export async function logAuditEvent(
  supabaseAdmin: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('security_audit_logs')
      .insert({
        user_id: entry.userId || null,
        operation: entry.operation,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId || null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
        status: entry.status,
        error_message: entry.errorMessage || null,
        metadata: entry.metadata || null,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

/**
 * Extract client IP from request
 */
export function getClientIp(req: Request): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         undefined;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: Request): string | undefined {
  return req.headers.get('user-agent') || undefined;
}
