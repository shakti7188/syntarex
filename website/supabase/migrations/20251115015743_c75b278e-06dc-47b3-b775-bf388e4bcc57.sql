-- Create function to detect decrypt anomalies
CREATE OR REPLACE FUNCTION public.detect_decrypt_anomalies(
  p_user_id UUID,
  p_secret_id UUID,
  p_time_window_minutes INTEGER DEFAULT 60,
  p_threshold INTEGER DEFAULT 50
)
RETURNS TABLE(
  is_anomaly BOOLEAN,
  usage_count BIGINT,
  first_access TIMESTAMP WITH TIME ZONE,
  last_access TIMESTAMP WITH TIME ZONE,
  unique_ips BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) > p_threshold AS is_anomaly,
    COUNT(*) AS usage_count,
    MIN(created_at) AS first_access,
    MAX(created_at) AS last_access,
    COUNT(DISTINCT ip_address) AS unique_ips
  FROM public.secret_audit_logs
  WHERE
    user_id = p_user_id
    AND secret_id = p_secret_id
    AND event_type = 'ACCESSED'
    AND created_at >= NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to detect unusual IP access patterns
CREATE OR REPLACE FUNCTION public.detect_unusual_ip_access(
  p_user_id UUID,
  p_time_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  ip_address TEXT,
  access_count BIGINT,
  unique_secrets BIGINT,
  first_access TIMESTAMP WITH TIME ZONE,
  last_access TIMESTAMP WITH TIME ZONE,
  is_suspicious BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sal.ip_address,
    COUNT(*) AS access_count,
    COUNT(DISTINCT sal.secret_id) AS unique_secrets,
    MIN(sal.created_at) AS first_access,
    MAX(sal.created_at) AS last_access,
    (COUNT(*) > 100 OR COUNT(DISTINCT sal.secret_id) > 10) AS is_suspicious
  FROM public.secret_audit_logs sal
  WHERE
    sal.user_id = p_user_id
    AND sal.event_type = 'ACCESSED'
    AND sal.created_at >= NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
  GROUP BY sal.ip_address
  HAVING COUNT(*) > 20
  ORDER BY access_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get recent security events summary
CREATE OR REPLACE FUNCTION public.get_security_events_summary(
  p_time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  event_type TEXT,
  event_count BIGINT,
  unique_users BIGINT,
  unique_secrets BIGINT,
  latest_event TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sal.event_type::TEXT,
    COUNT(*) AS event_count,
    COUNT(DISTINCT sal.user_id) AS unique_users,
    COUNT(DISTINCT sal.secret_id) AS unique_secrets,
    MAX(sal.created_at) AS latest_event
  FROM public.secret_audit_logs sal
  WHERE sal.created_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
  GROUP BY sal.event_type
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check for failed rotation attempts
CREATE OR REPLACE FUNCTION public.detect_failed_rotations(
  p_time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  pool_config_id UUID,
  attempt_count BIGINT,
  last_attempt TIMESTAMP WITH TIME ZONE,
  rotated_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pkr.pool_config_id,
    COUNT(*) AS attempt_count,
    MAX(pkr.created_at) AS last_attempt,
    pkr.rotated_by
  FROM public.mining_pool_key_rotations pkr
  WHERE
    pkr.created_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
    AND pkr.rotation_type = 'FORCED_COMPROMISE'
  GROUP BY pkr.pool_config_id, pkr.rotated_by
  HAVING COUNT(*) > 1
  ORDER BY attempt_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create index for efficient anomaly detection queries
CREATE INDEX IF NOT EXISTS idx_secret_audit_logs_user_accessed 
  ON public.secret_audit_logs(user_id, event_type, created_at DESC)
  WHERE event_type = 'ACCESSED';

CREATE INDEX IF NOT EXISTS idx_secret_audit_logs_ip_accessed 
  ON public.secret_audit_logs(ip_address, event_type, created_at DESC)
  WHERE event_type = 'ACCESSED';

-- Add comment documenting anomaly detection
COMMENT ON FUNCTION public.detect_decrypt_anomalies IS 
  'Detects anomalous decrypt activity by checking if usage count exceeds threshold within time window';

COMMENT ON FUNCTION public.detect_unusual_ip_access IS 
  'Identifies IP addresses with suspicious access patterns (high volume or accessing many secrets)';

COMMENT ON FUNCTION public.get_security_events_summary IS 
  'Provides summary statistics of security events over a time window';

COMMENT ON FUNCTION public.detect_failed_rotations IS 
  'Detects multiple forced compromise rotations which may indicate ongoing security issues';