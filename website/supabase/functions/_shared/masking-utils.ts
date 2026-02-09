/**
 * Masking and redaction utilities for sensitive data
 * Never log or display plaintext secrets
 */

/**
 * Get last 4 characters of a string for display
 */
export function getLast4(value: string): string {
  if (!value || value.length < 4) return '****';
  return value.slice(-4);
}

/**
 * Get masked display format: **** **** **** LAST4
 */
export function getMaskedDisplay(value: string): string {
  if (!value) return '**** **** **** ****';
  const last4 = getLast4(value);
  return `**** **** **** ${last4}`;
}

/**
 * Generate SHA-256 fingerprint of a value
 */
export async function generateFingerprint(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Redact sensitive values from objects for logging
 */
export function redactSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sensitiveKeys = [
    'api_key', 'apiKey', 'api_secret', 'apiSecret', 
    'secret', 'token', 'password', 'encrypted_value',
    'encryptedValue', 'plaintext', 'value'
  ];

  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in redacted) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      redacted[key] = 'REDACTED';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}

/**
 * Redact sensitive patterns in strings (for log messages)
 */
export function redactString(message: string): string {
  // Redact patterns like: "api_key": "sk_test_...", 'secret': 'abc123', etc.
  const patterns = [
    /(api[_-]?key|secret|token|password)["']?\s*[:=]\s*["']([^"'\s]+)["']/gi,
    /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/gi,
  ];

  let redacted = message;
  for (const pattern of patterns) {
    redacted = redacted.replace(pattern, (match, key) => {
      return key ? `${key}: "REDACTED"` : 'Bearer REDACTED';
    });
  }

  return redacted;
}

/**
 * Create a safe log entry with redacted sensitive data
 */
export function createSafeLogEntry(message: string, data?: any): string {
  const redactedMessage = redactString(message);
  if (!data) return redactedMessage;
  
  const redactedData = redactSensitiveData(data);
  return `${redactedMessage} ${JSON.stringify(redactedData)}`;
}
