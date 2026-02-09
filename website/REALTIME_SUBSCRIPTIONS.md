# Real-Time Subscriptions Implementation

## Overview

The platform now features comprehensive real-time subscriptions for authenticated users, providing instant updates across all commission and network data without requiring page refreshes.

## Subscribed Tables

All subscriptions are filtered by `user_id = auth.uid()` to ensure users only see their own data:

### Commission Tables
- **direct_commissions** - Direct referral commissions (L1: 20%, L2: 10%, L3: 5%)
- **binary_commissions** - Binary tree weak leg commissions (10%)
- **override_commissions** - Leadership override bonuses (2-5%)

### Settlement Tables  
- **weekly_settlements** - Weekly payout settlements with Merkle proofs

### Network Tables
- **referrals** - User's referral relationships
- **binary_tree** - Binary tree structure and volumes
- **binary_volume** - Weekly volume per leg

### Profile Tables
- **profiles** - User profile updates (with field restrictions via RLS)

## Live Dashboard Features

### 1. Real-Time Commission Updates

When a new commission is earned (INSERT event):
- Dashboard totals update instantly:
  - **Total Earnings**: Lifetime commission total
  - **Weekly Volume**: Current week's binary leg volume
  - **Cap Usage**: Percentage of weekly cap used
  - **Direct Referrals**: Count of direct referrals

- Non-intrusive toast notification appears:
  ```
  🎉 New Commission Earned!
  You've earned +$X.XX
  ```

### 2. Commission Breakdown Tab

Real-time updates for:
- Direct L1, L2, L3 commission amounts
- Binary commission (weak leg calculation)
- Override bonus amounts
- Commission progress bars
- Weekly cap usage percentage

### 3. Network Tree Tab

Instant updates when:
- New referrals join your network
- Binary leg volumes change
- Active referral status changes
- Weak leg switches

Shows:
- Left leg volume
- Right leg volume
- Weak leg identification
- Active vs total referrals
- Calculated binary commission

### 4. Weekly Settlement Updates

Toast notification when:
- New weekly settlement is created
- Settlement status changes
- Settlement is finalized

Message:
```
Settlement Updated
Your weekly settlement has been processed
```

## Technical Implementation

### Subscription Pattern

Each real-time hook follows this secure pattern:

```typescript
const channel = supabase
  .channel("unique-channel-name")
  .on(
    "postgres_changes",
    {
      event: "*", // INSERT, UPDATE, DELETE
      schema: "public",
      table: "table_name",
      filter: `user_id=eq.${user.id}`, // RLS-safe filter
    },
    (payload) => {
      console.log("Event:", payload.eventType);
      // Refetch data and update UI
    }
  )
  .subscribe();
```

### Security

All subscriptions:
- ✅ Filter by authenticated user ID
- ✅ Respect Row-Level Security (RLS) policies
- ✅ Only expose data user has SELECT permission for
- ✅ Automatically clean up on component unmount

### Toast Notifications

Notifications are shown when:
1. **Total commission increases** (any commission type)
   - Calculates difference from previous total
   - Shows earned amount with celebration emoji
   - Duration: 5 seconds

2. **Settlement is processed** (INSERT or UPDATE)
   - Confirms settlement was created/updated
   - Duration: 5 seconds

Toast implementation uses `@/hooks/use-toast` (shadcn).

## Testing Real-Time Features

### Test Scenario 1: Commission Earning
1. Open user dashboard
2. From admin panel or via API, insert a new commission:
   ```sql
   INSERT INTO direct_commissions (user_id, source_user_id, tier, rate, amount, week_start)
   VALUES ('user-uuid', 'source-uuid', 1, 0.20, 100, '2025-01-06');
   ```
3. Observe:
   - Toast notification appears instantly
   - Total Earnings increases by $100
   - Commission Breakdown tab updates
   - Cap Usage percentage recalculates

### Test Scenario 2: Referral Network Growth
1. Open Network Tree tab
2. Create a new referral:
   ```sql
   INSERT INTO referrals (referrer_id, referee_id, referral_level, is_active)
   VALUES ('user-uuid', 'new-user-uuid', 1, true);
   ```
3. Observe:
   - Direct Referrals count increments
   - Network Tree updates structure
   - Active referrals count changes

### Test Scenario 3: Binary Volume Changes
1. View Dashboard showing leg volumes
2. Update binary volume:
   ```sql
   UPDATE binary_tree 
   SET left_volume = left_volume + 5000
   WHERE user_id = 'user-uuid';
   ```
3. Observe:
   - Weekly Volume updates
   - Network Tree shows new volumes
   - Weak leg may switch
   - Binary commission recalculates

### Test Scenario 4: Settlement Processing
1. User viewing Claim tab
2. Admin finalizes weekly settlement
3. Observe:
   - Toast notification: "Settlement Updated"
   - Claimable settlements list updates
   - Merkle proof becomes available

## Performance Considerations

- **Efficient queries**: Only fetch user's own data
- **Single refetch**: Multiple rapid changes trigger one update
- **Loading states**: Skeleton loaders prevent layout shifts
- **Cleanup**: Channels properly removed on unmount
- **Database filtering**: Server-side filters reduce bandwidth

## Event Logging

Console logs track all events:
```
Direct commission updated: INSERT
Binary commission updated: UPDATE
Override commission updated: INSERT
Weekly settlement updated: INSERT
```

Useful for debugging and monitoring real-time functionality.

## Calculation Updates

### Dashboard Stats
- **Total Earnings**: `SUM(all commission types)`
- **Weekly Volume**: `left_volume + right_volume`
- **Cap Usage**: `(weekly_total / 15000) * 100`
- **Direct Referrals**: `COUNT(referrals WHERE referrer_id = user.id)`

### Commission Breakdown
- **Direct Total**: `direct_l1 + direct_l2 + direct_l3`
- **Binary Commission**: `MIN(left_volume, right_volume) * 0.10`
- **Override Total**: `SUM(override_commissions.scaled_amount)`

All calculations update automatically when underlying data changes.

## Troubleshooting

### Subscriptions Not Working
1. Check user is authenticated
2. Verify RLS policies allow SELECT
3. Ensure table is in `supabase_realtime` publication
4. Check browser console for error messages

### Toast Not Appearing
1. Verify `Toaster` component is in layout
2. Check console for errors
3. Ensure `use-toast` is imported from `@/hooks/use-toast`
4. Verify commission total actually increased

### Data Not Updating
1. Check channel subscription status in console
2. Verify filter syntax: `user_id=eq.${user.id}`
3. Ensure cleanup function runs on unmount
4. Check database triggers are not blocked

## Related Files

- `src/hooks/useRealtimeCommissions.tsx` - Commission subscriptions
- `src/hooks/useRealtimeReferrals.tsx` - Network subscriptions  
- `src/hooks/useRealtimeAdminMetrics.tsx` - Admin metrics (admin only)
- `src/pages/Dashboard.tsx` - Dashboard with live stats
- `src/components/dashboard/CommissionBreakdown.tsx` - Live breakdown
- `src/components/dashboard/ReferralTree.tsx` - Live tree visualization

## Future Enhancements

Potential additions:
- Push notifications for mobile devices
- Sound alerts for commission earnings
- Real-time leaderboard rankings
- Live activity feed component
- Batch notification settings
- Commission milestone celebrations
