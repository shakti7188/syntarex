# Real-Time Features Implementation

This document describes the real-time update capabilities implemented using Supabase Realtime.

## Overview

The platform now features live updates across all key areas:
- **User Dashboard**: Real-time commission updates, referral tree changes, and settlement notifications
- **Admin Panel**: Live metrics including system volume, active users, and pending settlements
- **Network Trees**: Instant updates to binary tree structure and volume calculations

## Enabled Tables

The following tables have real-time updates enabled via Supabase Realtime publication:

### Commission Tables
- `commissions` - General commission records
- `direct_commissions` - Direct referral commissions (L1, L2, L3)
- `binary_commissions` - Binary tree commissions
- `override_commissions` - Leadership override bonuses

### Network Structure Tables
- `referrals` - Referral relationships and tree structure
- `binary_tree` - Binary placement and volume tracking
- `binary_volume` - Weekly volume calculations per leg

### Settlement & Activity Tables
- `weekly_settlements` - Weekly payout settlements
- `weekly_settlements_meta` - Settlement metadata and Merkle roots
- `transactions` - User transactions triggering commissions
- `user_activity` - User activity status tracking

## Real-Time Hooks

### User-Facing Hooks

#### `useRealtimeCommissions`
**Location**: `src/hooks/useRealtimeCommissions.tsx`

Subscribes to commission changes for the authenticated user and provides:
- Direct L1, L2, L3 commission totals
- Binary commission earnings
- Override commission bonuses
- Total earnings calculation
- Loading states

**Usage**:
```typescript
const { commissions, isLoading } = useRealtimeCommissions();
// commissions: { direct_l1, direct_l2, direct_l3, binary, override, total }
```

#### `useRealtimeReferrals`
**Location**: `src/hooks/useRealtimeReferrals.tsx`

Subscribes to referral tree and binary structure changes:
- Total referrals count
- Active referrals count
- Left leg volume
- Right leg volume
- Weak leg identification

**Usage**:
```typescript
const { stats, isLoading } = useRealtimeReferrals();
// stats: { totalReferrals, activeReferrals, leftLegVolume, rightLegVolume }
```

### Admin Hooks

#### `useRealtimeAdminMetrics`
**Location**: `src/hooks/useRealtimeAdminMetrics.tsx`

Subscribes to system-wide metrics (admin only):
- Total users count
- Weekly transaction volume
- Total paid out settlements
- Active user rate percentage
- Pending settlements count

**Usage**:
```typescript
const { metrics, isLoading } = useRealtimeAdminMetrics();
// metrics: { totalUsers, weeklyVolume, totalPaidOut, activeRate, pendingSettlements }
```

## Updated Components

### User Dashboard Components

#### `CommissionBreakdown`
**Location**: `src/components/dashboard/CommissionBreakdown.tsx`

- Displays live commission breakdown by type
- Real-time cap usage calculation
- Animated progress bars that update instantly
- Shows commission rates and amounts

#### `ReferralTree`
**Location**: `src/components/dashboard/ReferralTree.tsx`

- Live binary tree visualization
- Real-time leg volume updates
- Weak leg identification
- Active referral counts
- Binary commission calculation

### Admin Components

#### `Admin` Page
**Location**: `src/pages/Admin.tsx`

- Live dashboard metrics in header cards
- Real-time user count
- Current week volume tracking
- Total payout calculations
- Active rate monitoring

## Security & RLS

All real-time subscriptions respect existing Row-Level Security (RLS) policies:

- Users can only see their own commission data
- Users can only see their own referral tree
- Admin metrics require `admin` role verification
- All database filters use `user_id` or role-based checks

## How It Works

### Subscription Pattern

Each hook follows this pattern:

1. **Initial Data Fetch**: Load current data on mount
2. **Channel Setup**: Create a Supabase realtime channel
3. **Event Listeners**: Subscribe to INSERT, UPDATE, DELETE events
4. **Filter by User**: Use RLS-safe filters (`user_id=eq.${user.id}`)
5. **Refetch on Change**: Reload data when events fire
6. **Cleanup**: Remove channel on unmount

### Example Flow

```typescript
useEffect(() => {
  // 1. Fetch initial data
  const fetchData = async () => { /* ... */ };
  fetchData();

  // 2. Subscribe to changes
  const channel = supabase
    .channel('unique-channel-name')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name',
      filter: `user_id=eq.${user.id}`, // RLS-safe
    }, () => {
      // 3. Refetch on change
      fetchData();
    })
    .subscribe();

  // 4. Cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

## Performance Considerations

- **Efficient Queries**: Only fetch data for the authenticated user
- **Debouncing**: Multiple rapid changes trigger a single refetch
- **Loading States**: Skeleton loaders prevent layout shift
- **Channel Cleanup**: Subscriptions properly removed on unmount
- **Filtered Subscriptions**: Database-level filtering reduces bandwidth

## Testing Real-Time Updates

To test real-time functionality:

1. **Open Multiple Windows**: Login with different users in separate browser windows
2. **Admin + User View**: Open admin panel and user dashboard side-by-side
3. **Trigger Changes**: Make transactions or commission calculations
4. **Observe Updates**: Watch values update instantly without refresh

### Example Test Scenarios

1. **Commission Update Test**:
   - Admin runs commission calculation
   - User sees commission totals update immediately
   - Cap usage percentage adjusts in real-time

2. **Referral Tree Test**:
   - New user signs up under existing user
   - Parent user sees referral count increment instantly
   - Binary tree volumes update automatically

3. **Admin Metrics Test**:
   - Transaction is created
   - Admin dashboard shows updated weekly volume
   - Active user count reflects changes

## Future Enhancements

Potential real-time features to add:
- Live chat for support
- Notification system for new commissions
- Real-time genealogy tree visualization
- Live leaderboard updates
- Instant settlement status changes
- Push notifications for milestone achievements

## Troubleshooting

### Subscriptions Not Working

1. **Check RLS Policies**: Ensure user has SELECT permission
2. **Verify Publication**: Table must be in `supabase_realtime` publication
3. **Check Filters**: Ensure filter syntax is correct (`column=eq.value`)
4. **Console Logs**: Look for subscription events in browser console
5. **Auth Status**: User must be authenticated for filtered subscriptions

### Performance Issues

1. **Too Many Channels**: Combine related subscriptions into one channel
2. **Large Payloads**: Fetch only needed columns in queries
3. **Frequent Updates**: Add debouncing to refetch functions
4. **Memory Leaks**: Ensure channels are properly removed in cleanup

## Related Documentation

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [RLS Security Guide](SECURITY_IMPLEMENTATION.md)
- [Commission Engine](supabase/functions/commission-engine/README.md)
