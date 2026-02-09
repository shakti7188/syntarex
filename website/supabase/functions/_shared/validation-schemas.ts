/**
 * Validation schemas for mining pool API keys and secrets
 * Enforces strong format and length checks
 */

export interface PoolKeyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate API key format and strength
 */
export function validateApiKey(key: string, provider: string): PoolKeyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic checks
  if (!key || typeof key !== 'string') {
    errors.push('API key is required and must be a string');
    return { isValid: false, errors, warnings };
  }

  // Length checks
  if (key.length < 16) {
    errors.push('API key must be at least 16 characters');
  }
  if (key.length > 512) {
    errors.push('API key exceeds maximum length of 512 characters');
  }

  // Check for whitespace
  if (key !== key.trim()) {
    errors.push('API key contains leading or trailing whitespace');
  }
  if (/\s/.test(key)) {
    warnings.push('API key contains whitespace characters');
  }

  // Provider-specific validation
  switch (provider.toLowerCase()) {
    case 'antpool':
      // AntPool typically uses format: userid.workername with API key
      if (key.length < 20 || key.length > 256) {
        warnings.push('AntPool API keys typically 20-256 characters');
      }
      break;

    case 'f2pool':
      // F2Pool uses email-based access
      if (!key.includes('@') && key.length < 32) {
        warnings.push('F2Pool API keys should be email or 32+ char token');
      }
      break;

    default:
      // Generic validation
      if (key.length < 32) {
        warnings.push('API key may be too short for production use');
      }
  }

  // Check for common weak patterns
  if (/^[0-9]+$/.test(key)) {
    warnings.push('API key contains only numbers - may not be secure');
  }
  if (/^[a-zA-Z]+$/.test(key)) {
    warnings.push('API key contains only letters - may not be secure');
  }

  // Check for test/demo keys
  const testPatterns = ['test', 'demo', 'sample', 'example', 'placeholder'];
  const lowerKey = key.toLowerCase();
  for (const pattern of testPatterns) {
    if (lowerKey.includes(pattern)) {
      errors.push(`API key appears to be a ${pattern} key - use production credentials`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate API secret format and strength
 */
export function validateApiSecret(secret: string, provider: string): PoolKeyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic checks
  if (!secret || typeof secret !== 'string') {
    errors.push('API secret is required and must be a string');
    return { isValid: false, errors, warnings };
  }

  // Length checks
  if (secret.length < 32) {
    errors.push('API secret must be at least 32 characters');
  }
  if (secret.length > 1024) {
    errors.push('API secret exceeds maximum length of 1024 characters');
  }

  // Check for whitespace
  if (secret !== secret.trim()) {
    errors.push('API secret contains leading or trailing whitespace');
  }

  // Entropy check (basic)
  const uniqueChars = new Set(secret.split('')).size;
  if (uniqueChars < 10) {
    warnings.push('API secret has low character diversity - may not be secure');
  }

  // Check for repeating patterns
  if (/(.)\1{5,}/.test(secret)) {
    warnings.push('API secret contains repeating character sequences');
  }

  // Check for test/demo secrets
  const testPatterns = ['test', 'demo', 'sample', 'example', 'placeholder', '12345'];
  const lowerSecret = secret.toLowerCase();
  for (const pattern of testPatterns) {
    if (lowerSecret.includes(pattern)) {
      errors.push(`API secret appears to be a ${pattern} secret - use production credentials`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valid scopes for pool API keys
 */
export const VALID_SCOPES = ['read', 'write', 'admin'] as const;
export type PoolKeyScope = typeof VALID_SCOPES[number];

/**
 * Validate scope changes
 */
export function validateScopeChange(
  oldScopes: string[],
  newScopes: string[],
  requiresApproval = true
): PoolKeyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate scope values
  for (const scope of newScopes) {
    if (!VALID_SCOPES.includes(scope as PoolKeyScope)) {
      errors.push(`Invalid scope: ${scope}. Must be one of: ${VALID_SCOPES.join(', ')}`);
    }
  }

  // Check for privilege escalation
  const scopeHierarchy: Record<string, number> = { read: 1, write: 2, admin: 3 };
  const maxOldScope = Math.max(...oldScopes.map(s => scopeHierarchy[s] || 0));
  const maxNewScope = Math.max(...newScopes.map(s => scopeHierarchy[s] || 0));

  if (maxNewScope > maxOldScope) {
    if (requiresApproval) {
      errors.push('Increasing scope requires secondary admin approval');
    } else {
      warnings.push('Scope is being increased - ensure this is intentional');
    }
  }

  // Warn about admin scope
  if (newScopes.includes('admin') && !oldScopes.includes('admin')) {
    warnings.push('Adding admin scope grants full access - use with extreme caution');
  }

  // Recommend least privilege
  if (newScopes.includes('write') || newScopes.includes('admin')) {
    warnings.push('Consider using read-only scope unless write access is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate pool name and metadata
 */
export function validatePoolMetadata(
  poolName: string,
  accountLabel?: string,
  keyAlias?: string
): PoolKeyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Pool name validation
  if (!poolName || poolName.trim().length === 0) {
    errors.push('Pool name is required');
  } else if (poolName.length > 100) {
    errors.push('Pool name must be less than 100 characters');
  } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(poolName)) {
    errors.push('Pool name contains invalid characters (use letters, numbers, spaces, hyphens, underscores)');
  }

  // Account label validation
  if (accountLabel) {
    if (accountLabel.length > 50) {
      errors.push('Account label must be less than 50 characters');
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(accountLabel)) {
      errors.push('Account label contains invalid characters');
    }
  }

  // Key alias validation
  if (keyAlias) {
    if (keyAlias.length > 50) {
      errors.push('Key alias must be less than 50 characters');
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(keyAlias)) {
      errors.push('Key alias contains invalid characters (use letters, numbers, hyphens, underscores)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
