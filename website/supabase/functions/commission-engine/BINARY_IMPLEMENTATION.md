# Binary Commission Implementation

## calculateBinaryCommissions()

### Purpose
Calculate binary weak-leg commissions with carry-forward logic and automatic pool limit enforcement.

### Algorithm

```typescript
function calculateBinaryCommissions(
  users: User[],
  binaryVolumes: BinaryVolume[],
  salesVolume: number,
  weekStart: string
): BinaryCommission[]
```

### Step-by-Step Process

#### Step 1: For Each Qualified User

```typescript
for (const vol of binaryVolumes) {
  // Skip if user has no volume on either leg
  if (vol.left_volume <= 0 && vol.right_volume <= 0) continue;
  
  // ... process commission
}
```

**Qualification**: User must have volume on at least one leg
- Assumes qualification hooks (PV requirements, rank requirements, active legs) are enforced upstream
- Binary volume data already filtered for qualified users

#### Step 2: Calculate Weak and Strong Legs

```typescript
const weak = Math.min(vol.left_volume, vol.right_volume);
const strong = Math.max(vol.left_volume, vol.right_volume);
```

**Important**: `left_volume` and `right_volume` already include carry_in from previous week

**Example:**
- Left leg: 10,000 (includes 2,000 carry_in)
- Right leg: 15,000 (includes 1,000 carry_in)
- Weak = min(10,000, 15,000) = 10,000
- Strong = max(10,000, 15,000) = 15,000

#### Step 3: Calculate Base Binary Commission

```typescript
const baseBinary = weak * COMMISSION_CONFIG.BINARY_RATE; // 10%
```

**Rule**: 10% commission on weak leg volume

**Example:**
- Weak leg: 10,000
- Base binary: 10,000 × 0.10 = 1,000

#### Step 4: Calculate Carry-Forward (Carry-Out)

```typescript
let carry_out = strong - weak;
```

**Rule**: Carry-forward is the difference between strong and weak leg
- Represents unmatched volume that will be carried to next week
- Ensures balanced growth on both legs

**Example:**
- Strong: 15,000
- Weak: 10,000  
- Carry-out: 15,000 - 10,000 = 5,000

#### Step 5: Apply Carry-Forward Cap

```typescript
const capCF = calculateCarryForwardCap(vol.user_id, weekStart);
if (carry_out > capCF) {
  console.log(`User ${vol.user_id}: Carry-forward capped at ${capCF} (was ${carry_out})`);
  carry_out = capCF;
}
```

**Cap Formula:**
```
CapCF(u) = 5 × avgWeakLegLast4Weeks(u)
```

**Purpose**: Prevent unlimited carry-forward accumulation
- Caps carry-forward at 5× average weak leg performance
- Encourages consistent team building on both legs

**Example:**
```
User's last 4 weeks weak leg: 8,000, 9,000, 7,500, 10,000
Average weak leg: (8,000 + 9,000 + 7,500 + 10,000) / 4 = 8,625
Cap: 8,625 × 5 = 43,125

If carry_out = 50,000:
  → Trimmed to 43,125
  → Excess 6,875 is lost (not carried forward)
```

#### Step 6: Store Commission Record

```typescript
commissions.push({
  user_id: vol.user_id,
  weak_leg_volume: weak,
  base_amount: baseBinary,
  scaled_amount: baseBinary, // Will be scaled later
  scale_factor: 1.0,
  carry_out: carry_out, // Store for next week
});
```

#### Step 7: Calculate Total and Check Pool Limit

```typescript
const T_bin_base = commissions.reduce((sum, c) => sum + c.base_amount, 0);
const binaryPoolLimit = salesVolume * 0.17; // 17% of SV
```

**Pool Limit Rule**: Total binary commissions must not exceed 17% of SV

#### Step 8: Apply Pool Scaling if Needed

```typescript
if (T_bin_base > binaryPoolLimit) {
  // Calculate pre-scale factor (before global cap)
  const binaryPreScale = binaryPoolLimit / T_bin_base;
  
  console.log(`Binary pool exceeded: $${T_bin_base.toFixed(2)} > $${binaryPoolLimit.toFixed(2)}`);
  console.log(`Applying binary pre-scale factor: ${(binaryPreScale * 100).toFixed(2)}%`);
  
  // Apply scaling to all binary commissions
  commissions.forEach(c => {
    c.scaled_amount = c.base_amount * binaryPreScale;
    c.scale_factor = binaryPreScale;
  });
}
```

**Scaling Formula:**
```
If T_bin_base > 0.17 × SV:
  binaryPreScale = (0.17 × SV) / T_bin_base
  For each commission:
    commission.scaled_amount = commission.base_amount × binaryPreScale
    commission.scale_factor = binaryPreScale
```

**Note**: This is "pre-scale" because global 40% cap will be applied later

### Complete Example

**Scenario:**
- Sales Volume: $100,000
- Binary Pool Limit: $100,000 × 17% = $17,000

**User A:**
- Left leg: 12,000 (includes 1,000 carry_in)
- Right leg: 8,000 (includes 500 carry_in)
- Weak: min(12,000, 8,000) = 8,000
- Strong: max(12,000, 8,000) = 12,000
- Base binary: 8,000 × 10% = 800
- Carry-out: 12,000 - 8,000 = 4,000
- Avg weak last 4 weeks: 7,500
- Cap: 7,500 × 5 = 37,500
- Final carry-out: 4,000 (under cap, no trim)

**User B:**
- Left leg: 50,000
- Right leg: 10,000
- Weak: 10,000
- Strong: 50,000
- Base binary: 10,000 × 10% = 1,000
- Carry-out: 50,000 - 10,000 = 40,000
- Avg weak last 4 weeks: 8,000
- Cap: 8,000 × 5 = 40,000
- Final carry-out: 40,000 (exactly at cap)

**User C:**
- Left leg: 100,000
- Right leg: 15,000
- Weak: 15,000
- Strong: 100,000
- Base binary: 15,000 × 10% = 1,500
- Carry-out: 100,000 - 15,000 = 85,000
- Avg weak last 4 weeks: 12,000
- Cap: 12,000 × 5 = 60,000
- Final carry-out: 60,000 (trimmed from 85,000)

**Pool Check:**
- T_bin_base = 800 + 1,000 + 1,500 + ... (all users) = $20,000
- Pool limit: $17,000
- Exceeded: $20,000 > $17,000 ✗

**Apply Scaling:**
- Scale factor: $17,000 / $20,000 = 0.85 (85%)
- User A: 800 × 0.85 = 680
- User B: 1,000 × 0.85 = 850
- User C: 1,500 × 0.85 = 1,275
- New total: $17,000 (exactly at limit)

**Note**: Carry-out values are NOT scaled - they are preserved for next week

### Carry-Forward Cap Helper Function

```typescript
function calculateCarryForwardCap(userId: string, currentWeekStart: string): number
```

**Current Implementation**: Returns default cap of 50,000

**Production Implementation** (TODO):
```typescript
async function calculateCarryForwardCap(
  userId: string, 
  currentWeekStart: string,
  supabase: SupabaseClient
): Promise<number> {
  // Get last 4 weeks of binary volume data
  const fourWeeksAgo = new Date(currentWeekStart);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  
  const { data, error } = await supabase
    .from('binary_volume')
    .select('left_volume, right_volume')
    .eq('user_id', userId)
    .gte('week_start', fourWeeksAgo.toISOString().split('T')[0])
    .lt('week_start', currentWeekStart)
    .order('week_start', { ascending: true });
    
  if (error || !data || data.length === 0) {
    // No history: use default cap
    return 50000;
  }
  
  // Calculate average weak leg
  const weakLegs = data.map(vol => 
    Math.min(vol.left_volume, vol.right_volume)
  );
  
  const avgWeakLeg = weakLegs.reduce((sum, w) => sum + w, 0) / weakLegs.length;
  
  // Cap at 5× average
  return avgWeakLeg * 5;
}
```

### Data Flow

```
Week 1:
  Left: 10,000, Right: 5,000
  → Weak: 5,000, Strong: 10,000
  → Commission: 500
  → Carry-out: 5,000

Week 2:
  New left: 8,000, New right: 6,000
  Carry-in from Week 1: 5,000 (added to strong leg = left)
  Total left: 8,000 + 5,000 = 13,000
  Total right: 6,000
  → Weak: 6,000, Strong: 13,000
  → Commission: 600
  → Carry-out: 7,000

Week 3:
  New left: 7,000, New right: 9,000
  Carry-in from Week 2: 7,000 (added to strong leg = left)
  Total left: 7,000 + 7,000 = 14,000
  Total right: 9,000
  → Weak: 9,000, Strong: 14,000
  → Commission: 900
  → Carry-out: 5,000
```

### Database Storage

**binary_commissions table:**
```sql
INSERT INTO binary_commissions (
  user_id,
  week_start,
  weak_leg_volume,
  base_amount,      -- Before pool scaling
  scaled_amount,    -- After pool scaling (before global cap)
  scale_factor,     -- Pool scale factor applied
  status
) VALUES (...);
```

**Carry-forward storage** (for next week):
- Stored in `binary_volume.carry_out` field
- Becomes `carry_in` for next week's calculation
- Applied to strong leg in next week's volume totals

### Determinism

1. **Pure calculation**: Same inputs → Same outputs
2. **Order independent**: Commission order doesn't affect results
3. **Reproducible**: Historical data allows exact recalculation
4. **Auditable**: Every step logged and traceable

### Edge Cases

1. **No volume on either leg**: Skipped
2. **Volume on only one leg**: Weak = 0, commission = 0, carry-out = strong
3. **Equal legs**: Weak = Strong, carry-out = 0
4. **First week (no history)**: Use default cap
5. **Inactive user**: Historical average may be zero, cap = 0

### Performance

- **Time Complexity**: O(U + H) where:
  - U = number of users with binary volume
  - H = historical queries for carry-forward caps
  
- **Space Complexity**: O(U) for commission records

### Next Week Processing

Carry-forward must be applied when calculating next week's binary volumes:

```typescript
// Next week's volume calculation
const nextWeekLeftVolume = newLeftSales + (prevCarryOut from right leg);
const nextWeekRightVolume = newRightSales + (prevCarryOut from left leg);

// Important: Carry-out is added to opposite leg's NEW sales
```

### Global Cap Interaction

After binary pool scaling, a global 40% cap is applied:

```
Phase 1: Binary pool scaling (this function)
  → Binary commissions scaled to ≤17% of SV

Phase 2: Global cap scaling (processWeeklyCommissions)
  → All commissions (direct + binary + override) scaled to ≤40% of SV
  
Final binary commission:
  = base_amount × binaryPreScale × globalScale
```

### Testing Checklist

- [ ] Pool limit enforced (≤17% of SV)
- [ ] Carry-forward calculated correctly (strong - weak)
- [ ] Carry-forward cap applied (5× avg weak leg)
- [ ] Weak leg identification correct
- [ ] 10% commission rate applied
- [ ] Scaling proportional across all users
- [ ] Carry-out stored for next week
- [ ] Edge cases handled (no volume, equal legs, etc.)
