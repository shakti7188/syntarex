/**
 * Rate limiting for secret decrypt/use operations
 * Prevents brute force attacks and excessive API usage
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries
  if (entry && now >= entry.resetAt) {
    rateLimitStore.delete(identifier);
  }

  // Get or create entry
  const current = rateLimitStore.get(identifier);
  
  if (!current) {
    // First request in window
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Check if over limit
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  // Increment counter
  current.count++;
  rateLimitStore.set(identifier, current);

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetAt: current.resetAt,
  };
}

/**
 * Rate limit for decrypt operations (stricter)
 */
export function checkDecryptRateLimit(userId: string, secretId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const identifier = `decrypt:${userId}:${secretId}`;
  return checkRateLimit(identifier, {
    windowMs: 60000, // 1 minute
    maxRequests: 10,  // Max 10 decrypt ops per minute per secret
  });
}

/**
 * Rate limit for pool API calls (moderate)
 */
export function checkPoolApiRateLimit(userId: string, poolConfigId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const identifier = `pool-api:${userId}:${poolConfigId}`;
  return checkRateLimit(identifier, {
    windowMs: 60000, // 1 minute
    maxRequests: 60,  // Max 60 pool API calls per minute
  });
}

/**
 * Rate limit for rotation operations (very strict)
 */
export function checkRotationRateLimit(userId: string, poolConfigId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const identifier = `rotation:${userId}:${poolConfigId}`;
  return checkRateLimit(identifier, {
    windowMs: 3600000, // 1 hour
    maxRequests: 5,     // Max 5 rotations per hour
  });
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimits(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * IP allow-list checker
 */
export function checkIpAllowList(
  ipAddress: string,
  allowList: string[]
): { allowed: boolean; reason?: string } {
  if (!allowList || allowList.length === 0) {
    // No allow-list configured, allow all
    return { allowed: true };
  }

  // Check exact match
  if (allowList.includes(ipAddress)) {
    return { allowed: true };
  }

  // Check CIDR ranges (basic implementation)
  // In production, use a proper CIDR library
  for (const range of allowList) {
    if (range.includes('/')) {
      // CIDR notation - simplified check
      const [network] = range.split('/');
      if (ipAddress.startsWith(network.split('.').slice(0, 3).join('.'))) {
        return { allowed: true };
      }
    }
  }

  return {
    allowed: false,
    reason: `IP ${ipAddress} not in allow-list`,
  };
}

/**
 * Middleware wrapper to apply rate limiting to edge function handlers
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  config: RateLimitConfig
) {
  return async (req: Request): Promise<Response> => {
    // Extract identifier from authorization header or IP
    const authHeader = req.headers.get('Authorization');
    const identifier = authHeader || req.headers.get('x-forwarded-for') || 'anonymous';

    const result = checkRateLimit(identifier, config);

    // Add rate limit headers
    const rateLimitHeaders = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    };

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Execute the handler
    const response = await handler(req);

    // Add rate limit headers to successful response
    const newHeaders = new Headers(response.headers);
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
