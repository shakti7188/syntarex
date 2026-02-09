import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface AuditLog {
  id: string;
  user_id: string | null;
  operation: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  error_message: string | null;
  metadata: any;
  created_at: string;
}

export const useAuditLogs = (userId?: string, limit = 100) => {
  return useQuery({
    queryKey: ['audit-logs', userId],
    queryFn: async () => {
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
};

export const useAuditLogsByOperation = (operation: string, limit = 50) => {
  return useQuery({
    queryKey: ['audit-logs-operation', operation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('operation', operation)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLog[];
    },
  });
};
