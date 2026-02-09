# Commission Engine Implementation Details

## calculateDirectCommissions()

### Purpose
Calculate 3-tier direct referral commissions with automatic pool limit enforcement.

### Algorithm

```typescript
function calculateDirectCommissions(
  users: User[],
  transactions: Transaction[],
  salesVolume: number
): DirectCommission[]
```

### Step-by-Step Process

#### Step 1: Build User Lookup Map
```typescript
const userMap = new Map(users.map(u => [u.id, u]));
```
- Creates O(1) lookup for user information
- Used to traverse sponsor chains efficiently

#### Step 2: Group Transactions by User
```typescript
const txByUser = transactions.reduce((acc, tx) => {
  if (!acc[tx.user_id]) acc[tx.user_id] = [];
  acc[tx.user_id].push(tx);
  return acc;
}, {} as Record<string, Transaction[]>);
```
- Groups all transactions by the purchasing user
- Allows single pass to calculate each user's total SV

#### Step 3: Calculate Base Commissions

For each user who made purchases:

```typescript
for (const [userId, userTxs] of Object.entries(txByUser)) {
  const userSV = userTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const user = userMap.get(userId);
  if (!user) continue;

  // Traverse sponsor chain up to 3 levels
  let currentSponsor = user.sponsor_id;
  for (let tier = 0; tier < 3 && currentSponsor; tier++) {
    const sponsor = userMap.get(currentSponsor);
    if (!sponsor) break; // Only pay if sponsor exists

    const commissionAmount = userSV * COMMISSION_CONFIG.DIRECT_RATES[tier];
    commissions.push({
      user_id: currentSponsor,
      source_user_id: userId,
      tier: tier + 1,
      rate: COMMISSION_CONFIG.DIRECT_RATES[tier],
      amount: commissionAmount,
    });

    currentSponsor = sponsor.sponsor_id;
  }
}
```

**Rules Applied:**
- **Tier 1**: 10% to direct sponsor (immediate sponsor_id)
- **Tier 2**: 5% to sponsor's sponsor (2nd level up)
- **Tier 3**: 3% to third-level sponsor (3rd level up)
- **Existence Check**: Only pay if sponsor exists (break if null)
- **Accumulation**: Create separate commission record for each tier

#### Step 4: Calculate Total and Check Pool Limit

```typescript
const T_dir = commissions.reduce((sum, c) => sum + c.amount, 0);
const directPoolLimit = salesVolume * 0.20; // 20% of SV
```

**Pool Limit Rule**: Total direct commissions must not exceed 20% of SV

#### Step 5: Apply Scaling if Needed

```typescript
if (T_dir > directPoolLimit) {
  // Calculate scale factor
  const directScale = directPoolLimit / T_dir;
  
  console.log(`Direct pool exceeded: $${T_dir.toFixed(2)} > $${directPoolLimit.toFixed(2)}`);
  console.log(`Applying direct scale factor: ${(directScale * 100).toFixed(2)}%`);
  
  // Apply scaling to all direct commissions
  commissions.forEach(c => {
    c.amount = c.amount * directScale;
  });
}
```

**Scaling Formula:**
```
If T_dir > 0.20 × SV:
  directScale = (0.20 × SV) / T_dir
  For each commission:
    commission.amount = commission.amount × directScale
```

### Example Calculation

**Input:**
- Sales Volume: $10,000
- User A purchased: $1,000
  - Sponsor: User B
  - Sponsor's Sponsor: User C
  - Third Sponsor: User D

**Step 3 - Calculate Base:**
- User B gets: $1,000 × 10% = $100 (Tier 1)
- User C gets: $1,000 × 5% = $50 (Tier 2)
- User D gets: $1,000 × 3% = $30 (Tier 3)
- Total for this chain: $180

**Step 4 - Check Pool:**
- Pool Limit: $10,000 × 20% = $2,000
- If T_dir = $2,500 (sum of all commissions)
- Pool exceeded: $2,500 > $2,000 ✗

**Step 5 - Apply Scaling:**
- Scale Factor: $2,000 / $2,500 = 0.80 (80%)
- User B gets: $100 × 0.80 = $80
- User C gets: $50 × 0.80 = $40
- User D gets: $30 × 0.80 = $24
- New total: $144 (scaled proportionally)

### Data Structure

**Output: DirectCommission[]**
```typescript
interface DirectCommission {
  user_id: string;           // Who earns the commission
  source_user_id: string;    // Who made the purchase
  tier: number;              // 1, 2, or 3
  rate: number;              // 0.10, 0.05, or 0.03 (original rate)
  amount: number;            // Final amount (after scaling if applied)
}
```

### Accumulation Per User

To get total direct commissions per user:
```typescript
const directByUser = directCommissions.reduce((acc, dc) => {
  acc[dc.user_id] = (acc[dc.user_id] || 0) + dc.amount;
  return acc;
}, {} as Record<string, number>);
```

### Database Storage

Each commission record is stored in `direct_commissions` table:
```sql
INSERT INTO direct_commissions (
  user_id,
  source_user_id,
  tier,
  rate,
  amount,
  week_start,
  status
) VALUES (...);
```

### Determinism Guarantees

1. **Same inputs → Same outputs**: Pure function, no side effects
2. **Order independence**: Commission calculation order doesn't affect results
3. **Proportional scaling**: All commissions scaled by same factor
4. **Exact pool limit**: Final total always ≤ 20% of SV (within floating point precision)

### Edge Cases Handled

1. **No sponsor**: Loop breaks, no commission paid
2. **Sponsor chain < 3**: Loop terminates early
3. **No transactions**: Empty commissions array returned
4. **Zero sales volume**: No scaling applied (0% commission anyway)
5. **Exactly at limit**: No scaling applied (scale factor = 1.0)
6. **Multiple transactions per user**: Correctly summed before commission calculation

### Performance

- **Time Complexity**: O(U + T + U×D) where:
  - U = number of users
  - T = number of transactions
  - D = max depth of sponsor chain (3)
  
- **Space Complexity**: O(U + T + C) where:
  - C = number of commission records generated
  - C ≤ U × 3 (max 3 tiers per user)

### Testing

To verify implementation:

1. **Pool limit enforcement**:
   ```typescript
   const total = directCommissions.reduce((sum, dc) => sum + dc.amount, 0);
   const limit = salesVolume * 0.20;
   assert(total <= limit);
   ```

2. **Proportional scaling**:
   ```typescript
   if (scaling was applied) {
     assert(all commissions scaled by same factor);
   }
   ```

3. **Tier rates**:
   ```typescript
   assert(tier 1 commissions use 10% rate);
   assert(tier 2 commissions use 5% rate);
   assert(tier 3 commissions use 3% rate);
   ```

### Audit Trail

Each commission record includes:
- **source_user_id**: Traces commission back to purchase
- **tier**: Shows which level of sponsor chain
- **rate**: Shows original commission rate
- **amount**: Shows final amount after scaling

This allows complete reconstruction of:
- Who purchased → Who earned → How much → Why (tier/rate)
