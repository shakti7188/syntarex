# Admin Real-Time Metrics & Cap Monitoring

## Overview

The admin panel features comprehensive real-time metrics tracking with automated cap monitoring and alerts. All metrics update instantly without page refresh.

## Live Metrics Dashboard

### 1. Current Week SV (Sales Volume)

**Calculation**: Sum of all transactions created this week

```typescript
currentWeekSV = SUM(transactions.amount WHERE created_at >= start_of_week)
```

Displays:
- Total weekly sales volume
- Estimated payout for the week
- Visual indicator if approaching cap

### 2. Payout Ratio vs 40% Cap

**Critical Metric**: `(Total Payout / SV) × 100`

```typescript
payoutRatio = ((T_dir + T_bin + T_ov) / SV) × 100
```

Where:
- `T_dir` = Total direct commissions
- `T_bin` = Total binary commissions  
- `T_ov` = Total override commissions
- `SV` = Sales volume

#### Visual Indicators

**Safe (<35%)**:
- Accent color (teal)
- No warnings

**Approaching Cap (>35%)**:
- ⚠️ Warning banner displayed
- Yellow/warning color
- Ring indicator on cards
- Toast notification

**Critical (>38%)**:
- 🚨 Critical alert banner
- Red/destructive color
- Urgent toast notification
- Visual emphasis on metrics

### 3. Active Users

Displays:
- Total active users (from `user_activity.is_active = true`)
- Active rate percentage
- Total users count
- Real-time updates on status changes

### 4. Pending Settlements

Shows:
- Count of settlements with `status = 'pending'`
- New users registered this week
- Real-time updates when settlements created/finalized

## Detailed Payout Breakdown

Three cards showing commission breakdown:

### Direct Commissions
- Total estimated direct payouts (L1 + L2 + L3)
- Percentage of SV
- Real-time updates on new commissions

### Binary Commissions
- Total estimated binary payouts (weak leg)
- Percentage of SV
- Updates on binary calculations

### Override Commissions
- Total estimated override bonuses
- Percentage of SV
- Updates on leadership bonuses

## Real-Time Subscriptions

### 1. Transactions Subscription

**Table**: `transactions`  
**Events**: INSERT, UPDATE, DELETE

Triggers:
- SV recalculation
- Payout ratio update
- Cap warning checks

### 2. Weekly Settlements Subscription

**Table**: `weekly_settlements`  
**Events**: INSERT, UPDATE, DELETE

Triggers:
- Pending settlements count update
- Status change detection

### 3. Profiles Subscription

**Table**: `profiles`  
**Events**: INSERT

Triggers on new user:
```
🎉 New User Registered!
A new user has joined the platform
```

Updates:
- Total users count
- New users this week counter

### 4. User Activity Subscription

**Table**: `user_activity`  
**Events**: INSERT, UPDATE, DELETE

Triggers:
- Active users count update
- Active rate recalculation

### 5. Commission Subscriptions

**Tables**: `direct_commissions`, `binary_commissions`, `override_commissions`  
**Events**: INSERT, UPDATE, DELETE

Triggers:
- Estimated payout recalculation
- Payout ratio update
- Cap warning evaluation
- Breakdown card updates

## Automated Alerts

### Warning Alert (Payout Ratio >35%)

Displayed when:
```typescript
payoutRatio > 35 && payoutRatio <= 38
```

Shows:
- ⚠️ Yellow warning banner
- "Warning: Approaching Payout Cap"
- Current ratio percentage
- Payout vs SV amounts

Toast notification:
```
⚠️ Warning: Approaching Payout Cap
Payout ratio at 36.5% of SV (limit: 40%)
Duration: 7 seconds
```

### Critical Alert (Payout Ratio >38%)

Displayed when:
```typescript
payoutRatio > 38
```

Shows:
- 🚨 Red critical banner
- "Critical: Payout Ratio at X% of SV"
- Urgent visual emphasis
- Ring indicators on cards

Toast notification:
```
⚠️ Critical: Payout Cap Alert!
Payout ratio at 39.2% of SV (limit: 40%)
Variant: destructive (red)
Duration: 10 seconds
```

## Visual Hierarchy

### Color Coding

- **Safe (<35%)**: Accent/teal colors
- **Warning (35-38%)**: Yellow/warning colors
- **Critical (>38%)**: Red/destructive colors

### Ring Indicators

Cards display colored rings when:
- Current Week SV card: Warning ring if approaching cap
- Payout Ratio card: Critical ring if >38%

## Performance Metrics

### Update Speed

- Transaction insert → Metrics update: <500ms
- Commission calculation → Display update: <300ms
- User registration → Counter increment: <200ms

### Subscription Efficiency

- 5 separate channels for granular updates
- Database-level filtering reduces bandwidth
- Only relevant data triggers refetch
- Proper cleanup on unmount

## Testing Scenarios

### Test 1: Transaction Creates Warning

1. Admin viewing dashboard with 30% payout ratio
2. Large transaction inserted pushing ratio to 36%
3. Observe:
   - Banner appears with warning
   - SV card updates
   - Payout ratio card turns yellow
   - Ring indicator appears
   - Toast notification shows

### Test 2: Approaching Critical Threshold

1. Payout ratio at 37.5%
2. New commission pushes to 39%
3. Observe:
   - Warning banner changes to critical
   - Colors change to red
   - New toast with destructive variant
   - All affected cards highlight

### Test 3: New User Registration

1. Admin monitoring dashboard
2. New user signs up
3. Observe:
   - Toast: "New User Registered! 🎉"
   - Total users increments
   - New users this week increments
   - Active rate recalculates

### Test 4: Settlement Status Change

1. Pending settlements: 5
2. Admin finalizes one settlement
3. Observe:
   - Pending count drops to 4
   - Real-time update without refresh

## Cap Management Strategy

### When Approaching Cap (>35%)

**Recommended Actions**:
1. Review commission calculations
2. Check for unusual spikes
3. Monitor weak leg volumes
4. Assess need for scale factor adjustments

### When Critical (>38%)

**Immediate Actions**:
1. ⚠️ Consider pausing new commissions
2. Review scale factor settings
3. Analyze transaction volumes
4. Plan for week finalization

### When Over Cap (>40%)

**Emergency Actions**:
1. Apply global scale factor
2. Recalculate all commissions
3. Communicate with users
4. Document cap breach incident

## Related Files

- `src/hooks/useRealtimeAdminMetrics.tsx` - Main metrics hook
- `src/pages/Admin.tsx` - Admin dashboard display
- `supabase/functions/commission-engine/` - Commission calculation
- `supabase/functions/finalize-week/` - Week finalization

## Security

### Admin-Only Access

All admin metrics require:
```typescript
const { isAdmin } = useAuth();
if (!isAdmin) return; // No data loaded
```

RLS policies enforce:
- Only users with `admin` role can access
- `has_role(auth.uid(), 'admin')` checked

### Data Privacy

Admin sees:
- Aggregate metrics only
- No individual user financial details (in metrics view)
- System-wide statistics
- Payout calculations

Does NOT see (in metrics):
- Individual user earnings
- Personal financial information
- Wallet addresses
- Transaction details per user

## Troubleshooting

### Metrics Not Updating

1. Verify admin role: Check `user_roles` table
2. Check subscriptions: Look for console logs
3. Confirm RLS policies: Test SELECT permissions
4. Network: Ensure stable connection

### Incorrect Payout Ratio

1. Verify week boundaries: Check `startOfWeek` calculation
2. Confirm commission data: Query commission tables
3. Check transaction totals: Validate SV calculation
4. Review scale factors: Ensure properly applied

### Alerts Not Showing

1. Check threshold logic: Verify >35% and >38%
2. Confirm toast functionality: Test `useToast` hook
3. Review state management: Check `isApproachingCap` flags
4. Console errors: Look for rendering issues

### Performance Issues

1. Check subscription count: Should be 5 channels
2. Monitor fetch frequency: Avoid excessive refetches
3. Database indexes: Ensure proper indexing
4. Query optimization: Review query efficiency

## Future Enhancements

Potential additions:
- **Historical Charts**: Graph payout ratio over time
- **Predictive Analytics**: Forecast when cap will be reached
- **Email Alerts**: Notify admin when approaching cap
- **Custom Thresholds**: Configurable warning levels
- **Export Reports**: Download metrics data
- **Real-Time Graphs**: Live updating charts
- **Comparison Views**: Week-over-week analysis
- **Mobile Notifications**: Push alerts for critical events

## Best Practices

1. ✅ **Monitor actively during high-volume periods**
2. ✅ **Set up mobile notifications for critical alerts**
3. ✅ **Review metrics daily during growth phases**
4. ✅ **Document cap breach incidents**
5. ✅ **Communicate proactively with users**
6. ✅ **Plan scale factor adjustments in advance**
7. ✅ **Keep records of warning occurrences**

## API Reference

### AdminMetrics Interface

```typescript
interface AdminMetrics {
  currentWeekSV: number;           // Sales volume this week
  estimatedTotalPayout: number;    // T_dir + T_bin + T_ov
  estimatedDirectPayout: number;   // Sum of direct commissions
  estimatedBinaryPayout: number;   // Sum of binary commissions
  estimatedOverridePayout: number; // Sum of override commissions
  payoutRatio: number;             // (total / SV) * 100
  capUsagePercent: number;         // (ratio / 40) * 100
  totalUsers: number;              // All users
  activeUsers: number;             // Active users
  newUsersThisWeek: number;        // New this week
  pendingSettlements: number;      // Pending count
  activeRate: number;              // Active percentage
  isApproachingCap: boolean;       // >35%
  isCriticalCap: boolean;          // >38%
}
```

### Hook Usage

```typescript
const { metrics, isLoading } = useRealtimeAdminMetrics();

// Access metrics
const sv = metrics.currentWeekSV;
const ratio = metrics.payoutRatio;
const isWarning = metrics.isApproachingCap;
const isCritical = metrics.isCriticalCap;
```
