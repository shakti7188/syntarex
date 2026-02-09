/**
 * Security alerting system for mining pool API key events
 * Supports Slack and generic webhooks
 */

export interface SecurityAlert {
  severity: 'info' | 'warning' | 'critical';
  event: string;
  details: Record<string, any>;
  timestamp: string;
  userId?: string;
  ipAddress?: string;
}

/**
 * Send alert to webhook endpoint
 */
export async function sendWebhookAlert(alert: SecurityAlert): Promise<void> {
  const webhookUrl = Deno.env.get('SECURITY_WEBHOOK_URL');
  if (!webhookUrl) {
    console.log('SECURITY_WEBHOOK_URL not configured, skipping alert');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      console.error(`Webhook alert failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send webhook alert:', error);
  }
}

/**
 * Send alert to Slack
 */
export async function sendSlackAlert(alert: SecurityAlert): Promise<void> {
  const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!slackWebhookUrl) {
    console.log('SLACK_WEBHOOK_URL not configured, skipping Slack alert');
    return;
  }

  const colorMap = {
    info: '#36a64f',
    warning: '#ff9800',
    critical: '#f44336',
  };

  const slackMessage = {
    attachments: [
      {
        color: colorMap[alert.severity],
        title: `🔐 Security Alert: ${alert.event}`,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Timestamp',
            value: alert.timestamp,
            short: true,
          },
          ...(alert.userId ? [{
            title: 'User ID',
            value: alert.userId,
            short: true,
          }] : []),
          ...(alert.ipAddress ? [{
            title: 'IP Address',
            value: alert.ipAddress,
            short: true,
          }] : []),
          {
            title: 'Details',
            value: JSON.stringify(alert.details, null, 2),
            short: false,
          },
        ],
        footer: 'Mining Pool Security System',
        ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      console.error(`Slack alert failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

/**
 * Send security alert to all configured channels
 */
export async function sendSecurityAlert(alert: SecurityAlert): Promise<void> {
  await Promise.allSettled([
    sendWebhookAlert(alert),
    sendSlackAlert(alert),
  ]);

  console.log(`Security alert sent: ${alert.severity} - ${alert.event}`);
}

/**
 * Alert for key creation
 */
export async function alertKeyCreated(
  userId: string,
  poolName: string,
  scopes: string[],
  ipAddress?: string
): Promise<void> {
  await sendSecurityAlert({
    severity: 'info',
    event: 'Pool API Key Created',
    details: {
      poolName,
      scopes,
      action: 'create',
    },
    timestamp: new Date().toISOString(),
    userId,
    ipAddress,
  });
}

/**
 * Alert for key rotation
 */
export async function alertKeyRotated(
  userId: string,
  poolName: string,
  rotationType: string,
  reason?: string,
  ipAddress?: string
): Promise<void> {
  await sendSecurityAlert({
    severity: rotationType === 'FORCED_COMPROMISE' ? 'critical' : 'warning',
    event: 'Pool API Key Rotated',
    details: {
      poolName,
      rotationType,
      reason,
      action: 'rotate',
    },
    timestamp: new Date().toISOString(),
    userId,
    ipAddress,
  });
}

/**
 * Alert for key deactivation
 */
export async function alertKeyDeactivated(
  userId: string,
  poolName: string,
  ipAddress?: string
): Promise<void> {
  await sendSecurityAlert({
    severity: 'warning',
    event: 'Pool API Key Deactivated',
    details: {
      poolName,
      action: 'deactivate',
    },
    timestamp: new Date().toISOString(),
    userId,
    ipAddress,
  });
}

/**
 * Alert for unusual decrypt activity
 */
export async function alertUnusualDecrypt(
  userId: string,
  secretId: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await sendSecurityAlert({
    severity: 'warning',
    event: 'Unusual Decrypt Activity Detected',
    details: {
      secretId,
      reason,
      action: 'decrypt_anomaly',
    },
    timestamp: new Date().toISOString(),
    userId,
    ipAddress,
  });
}

/**
 * Alert for rate limit exceeded
 */
export async function alertRateLimitExceeded(
  userId: string,
  operation: string,
  ipAddress?: string
): Promise<void> {
  await sendSecurityAlert({
    severity: 'warning',
    event: 'Rate Limit Exceeded',
    details: {
      operation,
      action: 'rate_limit',
    },
    timestamp: new Date().toISOString(),
    userId,
    ipAddress,
  });
}
