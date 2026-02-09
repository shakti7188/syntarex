# Coding Standards & Conventions

This document defines the global naming and data format conventions used across the Hybrid Affiliate & Binary platform.

## 📋 Table of Contents
- [Naming Conventions](#naming-conventions)
- [Data Format Standards](#data-format-standards)
- [Examples](#examples)
- [Migration Checklist](#migration-checklist)

---

## Naming Conventions

### 1. Database (Tables & Columns)
**Convention**: `snake_case`

```sql
-- ✅ CORRECT
CREATE TABLE user_roles (
  user_id UUID,
  created_at TIMESTAMP,
  is_active BOOLEAN
);

-- ❌ INCORRECT
CREATE TABLE userRoles (
  userId UUID,
  createdAt TIMESTAMP,
  isActive BOOLEAN
);
```

**Rationale**: PostgreSQL convention, case-insensitive, readable.

---

### 2. API & JSON (Requests/Responses)
**Convention**: `camelCase`

```typescript
// ✅ CORRECT - API Response
{
  userId: "uuid-here",
  createdAt: "2025-01-11T12:00:00Z",
  totalCommission: "1234.56",
  isActive: true
}

// ❌ INCORRECT
{
  user_id: "uuid-here",
  created_at: "2025-01-11T12:00:00Z",
  total_commission: "1234.56",
  is_active: true
}
```

**Rationale**: JavaScript/TypeScript standard, better JSON interop.

---

### 3. Realtime Events & Channels
**Convention**: `dot.separated.lowercase`

```typescript
// ✅ CORRECT - Channel Names
supabase.channel('user.commissions')
supabase.channel('admin.metrics')
supabase.channel('team.activity')

// ✅ CORRECT - Event Names
.on('commission.created', ...)
.on('user.joined', ...)
.on('settlement.finalized', ...)

// ❌ INCORRECT
supabase.channel('userCommissions')
supabase.channel('AdminMetrics')
.on('commissionCreated', ...)
```

**Rationale**: Hierarchical naming, namespace clarity, Supabase convention.

---

## Data Format Standards

### 4. Timestamps
**Convention**: ISO 8601 strings

```typescript
// ✅ CORRECT
{
  createdAt: "2025-01-11T12:00:00.000Z",
  updatedAt: "2025-01-11T14:30:00.000Z",
  weekStart: "2025-01-06"  // YYYY-MM-DD for date-only
}

// ❌ INCORRECT
{
  createdAt: 1736596800000,  // Unix timestamp
  updatedAt: new Date(),      // Date object
  weekStart: "01/06/2025"     // US format
}
```

**Rationale**: 
- Unambiguous timezone handling
- Human-readable
- Standard across all systems
- `weekStart` uses YYYY-MM-DD for consistency with PostgreSQL `date` type

---

### 5. Money Values
**Convention**: String representation of decimal values

```typescript
// ✅ CORRECT
{
  amount: "1234.56",
  commission: "0.12",
  total: "99999.99"
}

// ❌ INCORRECT
{
  amount: 1234.56,      // Float (precision loss!)
  commission: 0.12,     // Float
  total: 99999.99       // Float
}
```

**Rationale**: 
- Avoids floating-point precision errors
- Matches PostgreSQL `NUMERIC` type
- Financial accuracy required for money

---

### 6. Identifiers
**Convention**: UUID strings (version 4)

```typescript
// ✅ CORRECT
{
  userId: "550e8400-e29b-41d4-a716-446655440000",
  transactionId: "123e4567-e89b-12d3-a456-426614174000"
}

// ❌ INCORRECT
{
  userId: 12345,              // Integer
  transactionId: "TX-12345"   // Custom format
}
```

**Rationale**: 
- Globally unique
- No collision risk
- Database-agnostic
- Security (non-sequential)

---

## Examples

### Edge Function Response (API)
```typescript
// Edge function: get-network-tree
return new Response(JSON.stringify({
  directReferrals: {
    level1: [...],
    level2: [...],
    level3: [...]
  },
  binaryTeam: {
    left: [...],
    right: [...],
    leftVolume: "12345.67",    // String, not number
    rightVolume: "9876.54"
  },
  totalMembers: 42,
  timestamp: "2025-01-11T12:00:00.000Z"
}), {
  headers: { 'Content-Type': 'application/json' }
});
```

### Database to API Mapping
```typescript
// Database query result (snake_case)
const dbResult = {
  user_id: "uuid-here",
  created_at: "2025-01-11T12:00:00Z",
  total_commission: "1234.56"
};

// Transform to API response (camelCase)
const apiResponse = {
  userId: dbResult.user_id,
  createdAt: dbResult.created_at,
  totalCommission: dbResult.total_commission
};
```

### Realtime Subscriptions
```typescript
// ✅ CORRECT
const channel = supabase
  .channel('user.commissions.updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'direct_commissions',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle event with camelCase in code
    const commission = {
      userId: payload.new.user_id,
      amount: payload.new.amount.toString(),
      createdAt: payload.new.created_at
    };
  })
  .subscribe();
```

---

## Migration Checklist

### Immediate Actions Required:
- [ ] **Edge Functions**: Ensure all JSON responses use camelCase
- [ ] **TypeScript Interfaces**: Use camelCase for all properties
- [ ] **Money Values**: Convert all numeric amounts to strings
- [ ] **Realtime Channels**: Rename to dot.separated.lowercase
- [ ] **Date Handling**: Ensure ISO 8601 format everywhere

### Files to Review:
1. `supabase/functions/*/index.ts` - API responses
2. `src/hooks/useRealtime*.tsx` - Event handling
3. `src/components/**/*.tsx` - Data display
4. Edge function responses - camelCase transformation
5. Database query results - snake_case to camelCase mapping

### Testing:
- [ ] Verify API responses match camelCase
- [ ] Test money precision (no float errors)
- [ ] Validate ISO 8601 timestamps
- [ ] Check realtime event names

---

## Notes

### When to Transform:
- **Database → API**: Transform `snake_case` to `camelCase` in edge functions
- **API → UI**: Keep `camelCase` in React components
- **UI → Database**: Transform `camelCase` to `snake_case` in mutations

### Tools:
```typescript
// Helper: snake_case to camelCase
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj === null || typeof obj !== 'object') return obj;
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
}

// Helper: Format money as string
function formatMoney(amount: number | string): string {
  return typeof amount === 'number' 
    ? amount.toFixed(2) 
    : amount;
}
```

---

**Last Updated**: 2025-01-11  
**Version**: 1.0.0
