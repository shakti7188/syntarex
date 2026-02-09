# Real-Time Team Structure Updates

## Overview

The platform now features comprehensive real-time updates for team structures, providing instant visualization of:
- **3-Tier Direct Referral Tree**: All direct referrals across 3 generations (L1, L2, L3)
- **Binary Left/Right Teams**: Complete binary team structure with member details

## Features

### 1. Direct Referral Tree (3-Tier)

**Location**: Dashboard → Direct Referrals Tab

Displays all referrals organized by generation:

#### Level 1 (Direct Referrals)
- **Commission Rate**: 20%
- Shows all users you directly referred
- Real-time count and member list

#### Level 2 (Second Generation)
- **Commission Rate**: 10%
- Shows referrals made by your Level 1 members
- Indirect team growth tracking

#### Level 3 (Third Generation)
- **Commission Rate**: 5%
- Shows referrals made by your Level 2 members
- Complete team depth visibility

#### Member Information Displayed
For each member, you see:
- Avatar (with initials fallback)
- Full name or email
- Email address
- Current rank/level
- Binary position (Left or Right)

### 2. Binary Team Structure

**Location**: Dashboard → Binary Tree Tab

Shows your binary organization with:

#### Left Team
- Total volume in left leg
- Count of left team members
- Scrollable list of all left leg members
- Individual member details

#### Right Team
- Total volume in right leg
- Count of right team members
- Scrollable list of all right leg members
- Individual member details

#### Binary Analytics
- Weak leg identification (smaller of two legs)
- Binary commission calculation (10% of weak leg)
- Total team member count
- Volume comparison between legs

## Real-Time Updates

### Automatic Notifications

When team events occur:

#### New Team Member Joins
```
🎉 New Team Member!
A new member has joined your team
```

- Triggers when a new referral is created
- Updates all relevant statistics instantly
- Refreshes team member lists
- Recalculates commissions

#### Team Structure Changes

Updates trigger when:
- New referral added to any level
- Binary position assigned/changed
- Member profile updated (name, avatar, rank)
- Binary tree volumes change

All changes reflect instantly without page refresh.

## Hook Implementation

### `useRealtimeTeamStructure`

**Location**: `src/hooks/useRealtimeTeamStructure.tsx`

Comprehensive hook that manages:

```typescript
const { teamStructure, isLoading } = useRealtimeTeamStructure();

// teamStructure contains:
{
  directReferrals: {
    level1: TeamMember[],  // Direct referrals
    level2: TeamMember[],  // 2nd generation
    level3: TeamMember[]   // 3rd generation
  },
  binaryTeam: {
    left: TeamMember[],     // Left leg members
    right: TeamMember[],    // Right leg members
    leftVolume: number,     // Left leg volume
    rightVolume: number     // Right leg volume
  },
  totalMembers: number      // Total across all levels
}
```

### Subscribed Tables

The hook subscribes to real-time changes on:

1. **referrals table**
   - Filter: `referrer_id = user.id`
   - Events: INSERT, UPDATE, DELETE
   - Triggers: Team member list refresh + notification

2. **binary_tree table**
   - Filter: `user_id = user.id`
   - Events: INSERT, UPDATE
   - Triggers: Volume and position updates

3. **profiles table**
   - Filter: None (listens to all)
   - Events: UPDATE
   - Triggers: Member info refresh (name, avatar, rank)

## Component Structure

### DirectReferralTree Component

**File**: `src/components/dashboard/DirectReferralTree.tsx`

Features:
- Statistics cards for each level (L1, L2, L3)
- Commission rates displayed per level
- Scrollable member lists per generation
- Network growth indicator
- Empty state messaging

### ReferralTree Component (Enhanced)

**File**: `src/components/dashboard/ReferralTree.tsx`

Enhanced features:
- Binary team member lists (not just volumes)
- Member avatars and details
- Scrollable left/right team sections
- Real-time volume tracking
- Weak leg analysis with commission calculation

## User Experience

### Visual Indicators

- **Left Team**: Accent color (teal/cyan)
- **Right Team**: Primary color (purple/pink)
- **Weak Leg**: Highlighted in analysis section
- **Member Count**: Shown in badges
- **Volume**: Displayed in thousands (K)

### Interactive Elements

- Scrollable member lists (handles large teams)
- Hover effects on member cards
- Badge indicators for ranks and positions
- Tooltip-ready design for future enhancements

### Loading States

Skeleton loaders shown while:
- Initial team structure loads
- Real-time updates process
- Network requests complete

## Data Flow

### Fetch Sequence

1. **Initial Load**
   ```
   User logs in → Hook initializes → Fetch all referrals
   → Organize by level → Fetch binary structure
   → Fetch left/right members → Update UI
   ```

2. **Real-Time Update**
   ```
   Database change → Realtime event fires
   → Hook receives event → Refetch affected data
   → Update state → Re-render components
   → Show notification (if applicable)
   ```

## Testing Scenarios

### Test 1: New Direct Referral

1. User A is logged into dashboard
2. User B signs up with User A as sponsor
3. Insert into referrals table:
   ```sql
   INSERT INTO referrals (referrer_id, referee_id, referral_level, binary_position)
   VALUES ('user-a-id', 'user-b-id', 1, 'left');
   ```
4. Observe:
   - Toast notification appears
   - Level 1 count increments
   - User B appears in Level 1 list
   - Left team count increments
   - User B appears in left leg list

### Test 2: Second Generation Referral

1. User B (from Test 1) refers User C
2. Insert into referrals:
   ```sql
   INSERT INTO referrals (referrer_id, referee_id, referral_level)
   VALUES ('user-a-id', 'user-c-id', 2);
   ```
3. User A observes:
   - Level 2 count increments
   - User C appears in Level 2 list
   - Total members increases

### Test 3: Profile Update

1. User B updates their profile:
   ```sql
   UPDATE profiles 
   SET full_name = 'Bob Smith', rank = 'Silver Partner'
   WHERE id = 'user-b-id';
   ```
2. User A observes:
   - User B's name updates in member lists
   - Rank badge updates to "Silver Partner"
   - No full page refresh needed

### Test 4: Binary Volume Change

1. Update binary tree volumes:
   ```sql
   UPDATE binary_tree
   SET left_volume = 50000, right_volume = 45000
   WHERE user_id = 'user-a-id';
   ```
2. Observe:
   - Volume badges update instantly
   - Weak leg switches to right
   - Binary commission recalculates
   - Weak leg analysis updates

## Performance Considerations

### Optimization Strategies

1. **Efficient Queries**
   - Only fetch referrals for current user
   - Limit to 3 levels deep
   - Use proper indexing on foreign keys

2. **Scroll Areas**
   - Virtualized scrolling for large teams
   - Prevents UI freeze with 100+ members
   - Smooth performance regardless of team size

3. **Debounced Updates**
   - Multiple rapid changes trigger single refetch
   - Reduces database load
   - Improves user experience

4. **Selective Subscriptions**
   - Filter by user_id where possible
   - Only subscribe to relevant tables
   - Cleanup channels on unmount

## Security

### RLS Enforcement

All real-time subscriptions respect Row-Level Security:

- ✅ Users can only see their own downline
- ✅ Profile data filtered by RLS policies
- ✅ Binary tree data access controlled
- ✅ No cross-team data leakage

### Data Privacy

Member information displayed:
- Name (if provided)
- Email (own team only)
- Rank/level
- Binary position

NOT displayed:
- Personal financial data
- Commission amounts of team members
- Contact information beyond email
- Transaction history

## Future Enhancements

Potential additions:
- **Tree Visualization**: Interactive diagram with drag-and-drop
- **Member Search**: Find members by name/email
- **Filtering Options**: Active/inactive, by rank, by volume
- **Export Functionality**: Download team reports
- **Direct Messaging**: Contact team members in-app
- **Team Analytics**: Growth charts, retention metrics
- **Milestone Tracking**: Team achievement celebrations
- **Genealogy View**: Full tree with all generations

## Troubleshooting

### Members Not Showing

1. Check referrals table has correct `referrer_id`
2. Verify `referral_level` is 1, 2, or 3
3. Ensure profiles exist for referee_id
4. Check RLS policies allow SELECT

### Real-Time Not Working

1. Verify tables in `supabase_realtime` publication
2. Check browser console for subscription errors
3. Ensure user is authenticated
4. Verify network connection stable

### Performance Issues

1. Check team size (1000+ members may be slow)
2. Implement pagination if needed
3. Add loading states for better UX
4. Consider caching strategies

## Related Files

- `src/hooks/useRealtimeTeamStructure.tsx` - Main team structure hook
- `src/components/dashboard/DirectReferralTree.tsx` - 3-tier tree component
- `src/components/dashboard/ReferralTree.tsx` - Binary tree component
- `src/pages/Dashboard.tsx` - Dashboard with tabs
- `REALTIME_SUBSCRIPTIONS.md` - General realtime documentation

## API Reference

### TeamMember Interface

```typescript
interface TeamMember {
  id: string;                    // User ID
  email: string;                 // Email address
  full_name: string | null;      // Full name (optional)
  avatar_url: string | null;     // Avatar URL (optional)
  rank: string | null;           // Current rank
  level?: number;                // Referral level (1-3)
  binary_position?: "left" | "right" | null; // Binary position
}
```

### TeamStructure Interface

```typescript
interface TeamStructure {
  directReferrals: {
    level1: TeamMember[];
    level2: TeamMember[];
    level3: TeamMember[];
  };
  binaryTeam: {
    left: TeamMember[];
    right: TeamMember[];
    leftVolume: number;
    rightVolume: number;
  };
  totalMembers: number;
}
```
