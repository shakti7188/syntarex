/**
 * HMAC-based authentication utilities for secure server-to-server communication
 * Replaces simple token-based auth with cryptographic request signing
 */

const encoder = new TextEncoder();

/**
 * Generate HMAC-SHA256 signature for request authentication
 * @param secret - The shared secret key
 * @param payload - The request payload (typically: body + timestamp)
 * @returns Base64-encoded signature
 */
export async function generateHmacSignature(
  secret: string,
  payload: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verify HMAC signature from request headers
 * @param secret - The shared secret key
 * @param payload - The request payload
 * @param providedSignature - Signature from request header
 * @returns true if signature is valid
 */
export async function verifyHmacSignature(
  secret: string,
  payload: string,
  providedSignature: string
): Promise<boolean> {
  try {
    const expectedSignature = await generateHmacSignature(secret, payload);
    return expectedSignature === providedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Validate timestamp to prevent replay attacks
 * @param timestamp - Unix timestamp from request
 * @param maxAgeSeconds - Maximum age of request (default 5 minutes)
 * @returns true if timestamp is within acceptable range
 */
export function isTimestampValid(
  timestamp: number,
  maxAgeSeconds: number = 300
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  return age >= 0 && age <= maxAgeSeconds;
}

/**
 * Extract and verify HMAC authentication from request
 * @param req - The request object
 * @param secret - The shared secret key
 * @returns { valid: boolean, error?: string }
 */
export async function verifyHmacRequest(
  req: Request,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  // Extract signature and timestamp from headers
  const signature = req.headers.get('x-hmac-signature');
  const timestampHeader = req.headers.get('x-request-timestamp');

  if (!signature || !timestampHeader) {
    return {
      valid: false,
      error: 'Missing HMAC signature or timestamp headers',
    };
  }

  // Validate timestamp to prevent replay attacks
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp) || !isTimestampValid(timestamp)) {
    return {
      valid: false,
      error: 'Invalid or expired timestamp',
    };
  }

  // Get request body
  const body = await req.text();

  // Create payload: body + timestamp
  const payload = body + timestampHeader;

  // Verify signature
  const isValid = await verifyHmacSignature(secret, payload, signature);

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid HMAC signature',
    };
  }

  return { valid: true };
}
