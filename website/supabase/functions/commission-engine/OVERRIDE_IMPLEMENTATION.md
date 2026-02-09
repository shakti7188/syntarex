# Override Commission Implementation

## calculateOverrideCommissions()

### Purpose
Calculate 3-level leadership override commissions on binary commissions with rank-based qualification.

### Algorithm

```typescript
function calculateOverrideCommissions(
  users: User[],
  binaryCommissions: BinaryCommission[],
  salesVolume: number
): OverrideCommission[]
```

### Override Structure

Leadership overrides reward upline leaders for developing successful binary teams. The commission is calculated as a percentage of the **downline's binary commission** (not their sales volume).

### Commission Rates

```typescript
const OVERRIDE_RATES = [0.015, 0.010, 0.005];
```

- **Level 1**: 1.5% of downline's binary commission
- **Level 2**: 1.0% of downline's binary commission  
- **Level 3**: 0.5% of downline's binary commission

**Total**: 3.0% of binary commissions
**Target**: ≈ 3% of SV when binary system is healthy

### Rank Requirements

```typescript
const MIN_RANKS_FOR_OVERRIDE = {
  1: 'Bronze',   // Level 1 override requires at least Bronze rank
  2: 'Silver',   // Level 2 override requires at least Silver rank
  3: 'Gold',     // Level 3 override requires at least Gold rank
};

const RANK_HIERARCHY = [
  'Member',    // Index 0
  'Bronze',    // Index 1
  'Silver',    // Index 2
  'Gold',      // Index 3
  'Platinum',  // Index 4
  'Diamond'    // Index 5
];
```

**Qualification Logic:**
- User must meet minimum rank to receive override at that level
- Higher ranks qualify for all lower levels
- Example: Gold rank qualifies for levels 1, 2, and 3

### Step-by-Step Process

#### Step 1: Setup Data Structures

```typescript
const commissions: OverrideCommission[] = [];
const userMap = new Map(users.map(u => [u.id, u]));
const binaryByUser = new Map(binaryCommissions.map(bc => [bc.user_id, bc]));
```

#### Step 2: For Each User with Binary Commission

```typescript
for (const bc of binaryCommissions) {
  const user = userMap.get(bc.user_id);
  if (!user || !user.binary_parent_id) continue;
  
  // Walk upline chain...
}
```

**Starting Point**: User who earned binary commission
**Direction**: Walk up binary_parent_id chain
**Limit**: Up to 3 qualified leaders

#### Step 3: Walk Binary Upline Chain

```typescript
let currentUpline: string | null = user.binary_parent_id;
let foundQualified = 0;
let currentLevel = 1;

while (currentUpline && foundQualified < 3 && currentLevel <= 3) {
  const upline = userMap.get(currentUpline);
  if (!upline) break;
  
  // Check qualification...
  // Calculate override...
  // Move to next upline...
}
```

**Important**: 
- `foundQualified` tracks qualified leaders found (not just any upline)
- `currentLevel` indicates override level (1, 2, or 3)
- If upline doesn't qualify, skip them and continue up the chain

#### Step 4: Check Rank Qualification

```typescript
const qualifiesForOverride = (user: User, level: number): boolean => {
  const minRank = MIN_RANKS_FOR_OVERRIDE[level];
  const userRankIndex = RANK_HIERARCHY.indexOf(user.rank || 'Member');
  const minRankIndex = RANK_HIERARCHY.indexOf(minRank);
  
  return userRankIndex >= minRankIndex;
};
```

**Examples:**
- Bronze user qualifies for Level 1 only
- Silver user qualifies for Levels 1 and 2
- Gold user qualifies for Levels 1, 2, and 3
- Member (no rank) qualifies for nothing

#### Step 5: Calculate Override Amount

```typescript
if (qualifiesForOverride(upline, currentLevel)) {
  // Calculate override: percentage of downline's BASE binary commission
  const overrideAmount = bc.base_amount * COMMISSION_CONFIG.OVERRIDE_RATES[currentLevel - 1];
  
  commissions.push({
    user_id: currentUpline,
    source_user_id: bc.user_id,
    level: currentLevel,
    base_amount: overrideAmount,
    scaled_amount: overrideAmount, // Will be scaled later
  });

  foundQualified++;
  currentLevel++;
}
```

**Key Points:**
- Override is calculated on `bc.base_amount` (binary commission BEFORE pool scaling)
- Each qualified leader gets the next level override
- Level increments only when qualified leader is found

#### Step 6: Continue Up Chain

```typescript
currentUpline = upline.binary_parent_id;
```

Continue walking up binary tree until:
- Found 3 qualified leaders, OR
- Reached top of tree (binary_parent_id = null), OR
- Exceeded search limit

### Complete Example

**Network Structure:**
```
Diamond (Level 3)
  ↓ binary_parent
Platinum (Level 2)
  ↓ binary_parent
Gold (Level 1)
  ↓ binary_parent
Silver (Level 0 - earning binary)
  ↓ binary_parent
Bronze
  ↓ binary_parent
Member (source - made purchases)
```

**Scenario:**
- Member made purchases: $1,000
- Silver has binary commission: $100 (base_amount)
- Sales Volume: $50,000

**Calculation:**

1. **Silver earns binary**: $100

2. **Walk upline from Silver**:

   **First upline: Gold**
   - Rank: Gold → Qualifies for Level 1
   - Override: $100 × 1.5% = $1.50
   - Level: 1, Found: 1

   **Second upline: Platinum**
   - Rank: Platinum → Qualifies for Level 2  
   - Override: $100 × 1.0% = $1.00
   - Level: 2, Found: 2

   **Third upline: Diamond**
   - Rank: Diamond → Qualifies for Level 3
   - Override: $100 × 0.5% = $0.50
   - Level: 3, Found: 3
   
   Stop: Found 3 qualified leaders

3. **Total Overrides**: $1.50 + $1.00 + $0.50 = $3.00

### Example with Skipped Upline

**Network:**
```
Gold (will be Level 2)
  ↓ binary_parent
Bronze (doesn't qualify for Level 1 - skipped)
  ↓ binary_parent
Member (earning binary)
```

**Calculation:**
- Member binary commission: $100

**Walk upline**:

1. **First upline: Bronze**
   - Rank: Bronze → Qualifies for Level 1
   - Override: $100 × 1.5% = $1.50
   - Level: 1, Found: 1

2. **Second upline: Gold**
   - Rank: Gold → Qualifies for Level 2
   - Override: $100 × 1.0% = $1.00
   - Level: 2, Found: 2

Result: Bronze gets Level 1 override, Gold gets Level 2 override

### Pool Target and Relationship to Binary Health

**Target**: Override pool should be approximately 3% of Sales Volume

**Calculation:**
```
T_ov_base = Sum of all override commissions

When binary system is healthy:
  T_ov_base ≈ 0.03 × SV
```

**Why "healthy binary"?**

Override commissions are calculated as a percentage of binary commissions. Therefore:
- More binary commissions → More override commissions
- If binary pool is at 17% of SV, overrides will be ≈ 3% of SV
- If binary pool is weak, overrides will be proportionally less

**Example:**
```
Sales Volume: $100,000
Binary Pool (healthy): $17,000 (17% of SV)

Overrides on Binary:
  = $17,000 × (1.5% + 1.0% + 0.5%) × (% of users qualified)
  ≈ $17,000 × 3% × 60%
  ≈ $306

Override as % of SV:
  = $306 / $100,000
  = 0.306%
  
(This will vary based on rank distribution and qualification rates)
```

### Pool Limit Enforcement

**Important**: Unlike direct and binary pools, override pool does **NOT** have independent scaling.

Instead:
1. Override commissions are calculated based on binary commissions
2. All commissions (direct + binary + override) are subject to the **global 40% cap**
3. If global cap is exceeded, all pools are scaled proportionally

**Why no independent override scaling?**
- Overrides are already tied to binary performance
- Allows override pool to flex with binary health
- Simplifies overall commission structure
- Global cap provides ultimate safety limit

### Global Scaling Phase

After all commissions calculated:

```typescript
const totalCommissions = directTotal + binaryTotal + overrideTotal;
const globalCap = salesVolume × 0.40;

if (totalCommissions > globalCap) {
  globalScale = globalCap / totalCommissions;
  
  // Apply to all commissions
  directCommissions.forEach(dc => dc.amount *= globalScale);
  binaryCommissions.forEach(bc => bc.scaled_amount *= globalScale);
  overrideCommissions.forEach(oc => oc.scaled_amount *= globalScale);
}
```

### Data Structure

**Output: OverrideCommission[]**
```typescript
interface OverrideCommission {
  user_id: string;           // Who earns the override
  source_user_id: string;    // Downline who earned binary commission
  level: number;             // 1, 2, or 3
  base_amount: number;       // Before global scaling
  scaled_amount: number;     // After global scaling
}
```

### Database Storage

```sql
INSERT INTO override_commissions (
  user_id,
  source_user_id,
  level,
  base_amount,
  scaled_amount,
  week_start,
  status
) VALUES (...);
```

### Determinism

1. **Pure function**: Same inputs → Same outputs
2. **Order independent**: Processing order doesn't affect results
3. **Reproducible**: Can be recalculated from historical data
4. **Auditable**: Each override traced to source binary commission

### Edge Cases

1. **No binary parent**: Skip user (no overrides earned)
2. **Upline doesn't qualify**: Continue up chain to next upline
3. **Less than 3 qualified uplines**: Only pay those who qualify
4. **Top of tree reached**: Stop searching
5. **Member rank**: Never qualifies for any override
6. **Diamond rank**: Qualifies for all 3 levels

### Performance

- **Time Complexity**: O(U × D) where:
  - U = number of users with binary commissions
  - D = max depth of binary tree traversal (typically 3-10)
  
- **Space Complexity**: O(O) where:
  - O = number of override records generated
  - O ≤ U × 3 (max 3 overrides per binary commission)

### Rank Advancement Strategy

The rank requirements create a progression system:

1. **Start (Member)**: Focus on building your own binary
2. **Bronze rank**: Earn Level 1 overrides (1.5%) from direct binary team
3. **Silver rank**: Add Level 2 overrides (1.0%) from 2nd generation
4. **Gold+ rank**: Add Level 3 overrides (0.5%) from 3rd generation

This encourages users to:
- Build deeper teams
- Advance in rank
- Develop leadership skills
- Create sustainable income from team building

### Testing Checklist

- [ ] Rank qualification enforced correctly
- [ ] Override rates applied correctly (1.5%, 1.0%, 0.5%)
- [ ] Binary upline traversal correct
- [ ] Only 3 overrides per binary commission
- [ ] Unqualified uplines skipped
- [ ] Overrides calculated on base_amount (before pool scaling)
- [ ] Total overrides logged and tracked
- [ ] Source user traced correctly
- [ ] Edge cases handled (no parent, top of tree, etc.)

### Future Enhancements

1. **Dynamic Rates**: Adjust override rates based on team size
2. **Bonus Pools**: Additional rewards for high performers
3. **Compression**: Pay higher level if immediate upline doesn't qualify
4. **Infinity Bonus**: Additional override for top ranks
5. **Matching Bonus**: Match downline leaders' earnings
