/**
 * Coding Conventions & Data Transformation Utilities
 * 
 * Global standards:
 * - Database: snake_case
 * - API/JSON: camelCase
 * - Events: dot.separated.lowercase
 * - Time: ISO 8601 strings
 * - Money: string decimals
 * - IDs: UUID strings
 */

/**
 * Transform snake_case object to camelCase
 * Used when converting database results to API responses
 */
export function toCamelCase<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as T;
  }
  
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any) as T;
}

/**
 * Transform camelCase object to snake_case
 * Used when converting API requests to database queries
 */
export function toSnakeCase<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase) as T;
  }
  
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any) as T;
}

/**
 * Format money value as string decimal
 * Ensures precision for financial calculations
 */
export function formatMoney(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0.00";
  
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? "0.00" : parsed.toFixed(2);
  }
  
  return amount.toFixed(2);
}

/**
 * Parse money string to number (for calculations only)
 * Always convert back to string after calculation
 */
export function parseMoney(amount: string): number {
  const parsed = parseFloat(amount);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format date to ISO 8601 string
 */
export function formatISO(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * Format date to YYYY-MM-DD (for weekStart, etc.)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Generate realtime channel name following conventions
 * Format: scope.resource.action
 * Example: user.commissions.updates
 */
export function channelName(scope: string, resource: string, action?: string): string {
  const parts = [scope.toLowerCase(), resource.toLowerCase()];
  if (action) parts.push(action.toLowerCase());
  return parts.join('.');
}

/**
 * Generate realtime event name following conventions
 * Format: resource.action
 * Example: commission.created
 */
export function eventName(resource: string, action: string): string {
  return `${resource.toLowerCase()}.${action.toLowerCase()}`;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Type-safe money calculation helper
 * Always returns string to maintain precision
 */
export function addMoney(...amounts: (string | number)[]): string {
  const total = amounts.reduce<number>((sum, amount) => {
    const value = typeof amount === 'string' ? parseMoney(amount) : amount;
    return sum + value;
  }, 0);
  
  return formatMoney(total);
}

/**
 * Example transformations for common use cases
 */
export const examples = {
  // Database result → API response
  dbToApi: (dbResult: any) => toCamelCase(dbResult),
  
  // API request → Database query
  apiToDb: (apiRequest: any) => toSnakeCase(apiRequest),
  
  // Channel naming
  userChannel: (resource: string) => channelName('user', resource, 'updates'),
  adminChannel: (resource: string) => channelName('admin', resource, 'updates'),
  
  // Event naming
  createdEvent: (resource: string) => eventName(resource, 'created'),
  updatedEvent: (resource: string) => eventName(resource, 'updated'),
  deletedEvent: (resource: string) => eventName(resource, 'deleted'),
};
