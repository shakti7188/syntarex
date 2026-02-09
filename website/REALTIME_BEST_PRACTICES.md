# Real-Time Subscription Best Practices

## Implementation Constraints

### 1. Channel-Level Filtering

**❌ NEVER do this:**
```typescript
// BAD: Subscribing to entire table without filtering
supabase
  .channel("all-transactions")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "transactions",
    // No filter! Receives ALL transactions for ALL users
  }, callback)
  .subscribe();
```

**✅ ALWAYS do this:**
```typescript
// GOOD: Channel-level filtering by user_id
supabase
  .channel("user-transactions")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "transactions",
    filter: `user_id=eq.${user.id}`, // Only this user's transactions
  }, callback)
  .subscribe();
```

### 2. Respect Row Level Security (RLS)

All subscriptions automatically respect RLS policies:

**Normal Users:**
- Only see events for rows they're allowed to access
- Must filter by `user_id` or related fields
- Cannot access other users' data

**Admins:**
- Can subscribe to broader channels
- RLS policies still enforce `has_role(auth.uid(), 'admin')`
- Component checks `isAdmin` before subscribing

### 3. Debouncing & Batching

**Problem**: Many rapid events can cause excessive updates

❌ **Without debouncing:**
```typescript
// BAD: Refetches immediately on every event
.on("postgres_changes", ..., () => {
  fetchData(); // Called 10 times if 10 events arrive
})
```

✅ **With debouncing:**
```typescript
// GOOD: Groups updates within time window
const debouncedFetch = useDebounce(fetchData, 2000);

.on("postgres_changes", ..., () => {
  debouncedFetch(); // Only calls once after 2s of no new events
})
```

**Debounce Delays:**
- User commissions: 2 seconds (balance between responsiveness and efficiency)
- Team structure: 3 seconds (more complex backend calls)
- Admin metrics: 3 seconds (many simultaneous events possible)

### 4. Cleanup on Logout/Route Change

**✅ ALWAYS cleanup subscriptions:**

```typescript
useEffect(() => {
  if (!user) return; // Guard clause
  
  const channel = supabase
    .channel("my-channel")
    .on(...)
    .subscribe();
  
  // CRITICAL: Cleanup function
  return () => {
    console.log("Cleaning up subscriptions");
    supabase.removeChannel(channel);
  };
}, [user]); // Rerun when user changes (logout/login)
```

**What happens without cleanup:**
- Memory leaks
- Multiple subscriptions to same channel
- Stale data updates
- Callbacks fire for logged-out users

## Implementation Examples

### User-Specific Subscription

```typescript
// src/hooks/useRealtimeCommissions.tsx
export const useRealtimeCommissions = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return; // 1. Guard: Only subscribe when logged in
    
    const debouncedFetch = useDebounce(fetchCommissions, 2000); // 2. Debouncing
    
    const channel = supabase
      .channel("user-commissions")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "direct_commissions",
        filter: `user_id=eq.${user.id}`, // 3. Channel-level filtering
      }, () => {
        debouncedFetch(); // 4. Debounced callback
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel); // 5. Cleanup
    };
  }, [user]); // 6. Dependency: Resubscribe on user change
};
```

### Admin-Only Subscription

```typescript
// src/hooks/useRealtimeAdminMetrics.tsx
export const useRealtimeAdminMetrics = () => {
  const { isAdmin } = useAuth();
  
  useEffect(() => {
    if (!isAdmin) return; // 1. Admin-only guard
    
    const debouncedFetch = useDebounce(fetchMetrics, 3000); // 2. Longer delay for admin
    
    const channel = supabase
      .channel("admin-transactions")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "transactions",
        // 3. No filter: Admin sees all (RLS still enforced)
      }, () => {
        debouncedFetch(); // 4. Debounced callback
      })
      .subscribe();
    
    return () => {
      console.log("Cleaning up admin subscriptions");
      supabase.removeChannel(channel); // 5. Cleanup
    };
  }, [isAdmin]); // 6. Dependency: Resubscribe on role change
};
```

## Debounce Hook Implementation

```typescript
// src/hooks/useDebounce.tsx
import { useEffect, useRef } from 'react';

export const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};
```

## Filter Patterns

### By User ID
```typescript
filter: `user_id=eq.${user.id}`
```

### By Referrer ID
```typescript
filter: `referrer_id=eq.${user.id}`
```

### By Status
```typescript
filter: `status=eq.pending`
```

### Multiple Conditions (AND)
```typescript
filter: `user_id=eq.${user.id}&status=eq.active`
```

### Multiple Conditions (OR)
Not directly supported in filter syntax - use separate subscriptions or backend filtering

## Security Checklist

Before deploying real-time subscriptions:

- [ ] All user subscriptions filter by `user_id` or equivalent
- [ ] Admin subscriptions check `isAdmin` guard
- [ ] RLS policies configured on all subscribed tables
- [ ] Debouncing implemented for high-frequency events
- [ ] Cleanup functions present in all useEffect hooks
- [ ] Dependencies array includes relevant variables
- [ ] Console logs for debugging enabled
- [ ] Toast notifications respect user preferences
- [ ] Memory leaks tested (check subscriptions after logout)
- [ ] Performance tested with rapid events

## Common Mistakes

### 1. Missing Filter
```typescript
// ❌ WRONG: No filter means all users' data
.on("postgres_changes", {
  table: "commissions",
}, ...)
```

### 2. Client-Side Filtering
```typescript
// ❌ WRONG: Receives all data, filters in callback
.on("postgres_changes", {
  table: "commissions",
}, (payload) => {
  if (payload.new.user_id === user.id) { // Too late!
    updateData(payload);
  }
})
```

### 3. No Cleanup
```typescript
// ❌ WRONG: Missing return statement
useEffect(() => {
  const channel = supabase.channel(...).subscribe();
  // Missing: return () => supabase.removeChannel(channel);
}, []);
```

### 4. No Debouncing
```typescript
// ❌ WRONG: Calls expensive operation on every event
.on("postgres_changes", ..., () => {
  await fetchComplexData(); // Called 100 times if 100 events
})
```

### 5. Wrong Dependencies
```typescript
// ❌ WRONG: Missing user in dependencies
useEffect(() => {
  const channel = supabase
    .channel("my-channel")
    .on(..., filter: `user_id=eq.${user.id}`, ...)
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, []); // Should be [user]!
```

## Performance Optimization

### Measure Event Frequency

Add logging to understand event patterns:

```typescript
let eventCount = 0;
const startTime = Date.now();

.on("postgres_changes", ..., () => {
  eventCount++;
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`${eventCount} events in ${elapsed}s (${(eventCount/elapsed).toFixed(2)}/s)`);
})
```

### Adjust Debounce Delays

Based on event frequency:
- <1 event/second: 1-2 second delay
- 1-5 events/second: 2-3 second delay
- >5 events/second: 3-5 second delay or batch processing

### Use Backend Aggregation

For admin views with many events:
```typescript
// Instead of: Subscribe to all commissions + calculate client-side
// Do: Backend endpoint that aggregates + subscribe to trigger refresh
```

## Testing Guidelines

### Test Rapid Events

```typescript
// Simulate 10 rapid commission inserts
for (let i = 0; i < 10; i++) {
  await supabase.from("commissions").insert({ ... });
}

// Verify: Only 1 fetch called after debounce delay
```

### Test Cleanup

```typescript
// 1. Login user
// 2. Verify subscriptions active (check console logs)
// 3. Logout user
// 4. Verify cleanup logs appear
// 5. Check no further events processed
```

### Test RLS

```typescript
// 1. User A logged in
// 2. Insert commission for User B
// 3. Verify User A sees NO update (filtered out)
// 4. Insert commission for User A
// 5. Verify User A sees update
```

## Related Files

- `src/hooks/useDebounce.tsx` - Debounce utility
- `src/hooks/useRealtimeCommissions.tsx` - User commissions example
- `src/hooks/useRealtimeTeamStructure.tsx` - Team structure example
- `src/hooks/useRealtimeAdminMetrics.tsx` - Admin metrics example
- `REALTIME_SUBSCRIPTIONS.md` - Feature documentation
- `OPTIMIZED_REALTIME_NETWORK.md` - Network optimization guide

## Summary

**Golden Rules:**
1. ✅ Always filter by `user_id` or equivalent (except admin)
2. ✅ Always debounce high-frequency events (2-3 seconds)
3. ✅ Always cleanup subscriptions on unmount
4. ✅ Always guard with `if (!user)` or `if (!isAdmin)`
5. ✅ Always test with rapid events and cleanup scenarios
6. ✅ Always respect RLS policies
7. ✅ Always log events for debugging

Following these practices ensures:
- Secure data access
- Optimal performance
- No memory leaks
- Responsive UI
- Efficient resource usage
