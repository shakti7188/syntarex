# Global Payout Cap Strategy

## Overview

The global 40% payout cap ensures total commissions never exceed 40% of Sales Volume, while maintaining the integrity of direct commission payments.

## Cap Strategy: Direct Fixed, Binary/Override Scaled

### Philosophy

**Direct commissions are prioritized** because they:
1. Are the most predictable and expected by users
2. Represent immediate referral rewards
3. Are already capped at 20% of SV (half the global cap)
4. Build trust in the compensation plan

**Binary and override commissions are flexible** because they:
1. Represent performance-based bonuses
2. Scale with team building success
3. Can accommodate market fluctuations
4. Still provide substantial earnings when scaled

## Implementation: applyPayoutCap()

```typescript
function applyPayoutCap(
  directCommissions: DirectCommission[],
  binaryCommissions: BinaryCommission[],
  overrideCommissions: OverrideCommission[],
  salesVolume: number
)
```

### Algorithm

#### Step 1: Calculate Current Totals

```typescript
const T_dir = sum(directCommissions.amount);       // After direct pool scaling
const T_bin = sum(binaryCommissions.scaled_amount); // After binary pool scaling
const T_ov = sum(overrideCommissions.scaled_amount); // Base amounts

const total = T_dir + T_bin + T_ov;
const limit = 0.40 × salesVolume; // 40% of SV
```

**Important**: At this point:
- Direct commissions are already scaled to ≤20% of SV
- Binary commissions are already scaled to ≤17% of SV
- Override commissions are at base amounts (target ~3% of SV)

#### Step 2: Check if Cap is Exceeded

```typescript
if (total ≤ limit) {
  // No action needed
  return { ...totals, globalScaleFactor: 1.0, capApplied: false };
}
```

If within limit, all commissions remain as calculated.

#### Step 3: Cap Exceeded - Apply Strategy

**Rule**: Direct commissions remain FIXED. Only binary and override are scaled.

```typescript
// Calculate remaining space for binary + override
const binOvCurrent = T_bin + T_ov;
const binOvAllowed = limit - T_dir;

// Calculate scale factor
const scaleFactor = binOvAllowed / binOvCurrent;
```

**Formula Breakdown:**
```
Total allowed: 40% of SV
Direct used: T_dir (fixed)
Remaining space: (40% of SV) - T_dir
Current binary + override: T_bin + T_ov
Scale factor: Remaining space / Current
```

#### Step 4: Apply Scaling

```typescript
binaryCommissions.forEach(bc => {
  bc.scaled_amount = bc.scaled_amount × scaleFactor;
});

overrideCommissions.forEach(oc => {
  oc.scaled_amount = oc.scaled_amount × scaleFactor;
});
```

**Result:**
- Direct: Unchanged
- Binary: Scaled by `scaleFactor`
- Override: Scaled by `scaleFactor`

#### Step 5: Calculate Final Totals

```typescript
const T_bin_final = sum(binaryCommissions.scaled_amount);
const T_ov_final = sum(overrideCommissions.scaled_amount);
const grandTotal = T_dir + T_bin_final + T_ov_final;
```

**Guarantee**: `grandTotal = 0.40 × salesVolume` (within floating point precision)

## Worked Example

### Scenario: Cap Not Exceeded

**Sales Volume**: $100,000

**After Pool Scaling:**
- Direct: $18,000 (18% of SV - under 20% limit)
- Binary: $15,000 (15% of SV - under 17% limit)
- Override: $2,500 (2.5% of SV)
- **Total**: $35,500 (35.5% of SV)

**Global Cap Check:**
- Limit: $100,000 × 40% = $40,000
- Total: $35,500
- $35,500 < $40,000 ✓

**Result**: No scaling applied. All commissions paid as calculated.

### Scenario: Cap Exceeded

**Sales Volume**: $100,000

**After Pool Scaling:**
- Direct: $20,000 (20% of SV - at limit, already scaled)
- Binary: $17,000 (17% of SV - at limit, already scaled)
- Override: $8,000 (8% of SV - unusually high)
- **Total**: $45,000 (45% of SV)

**Global Cap Check:**
- Limit: $100,000 × 40% = $40,000
- Total: $45,000
- $45,000 > $40,000 ✗ (exceeded by $5,000)

**Apply Cap Strategy:**

1. **Fix Direct**: $20,000 (unchanged)

2. **Calculate Remaining Space**:
   ```
   binOvAllowed = $40,000 - $20,000 = $20,000
   binOvCurrent = $17,000 + $8,000 = $25,000
   ```

3. **Calculate Scale Factor**:
   ```
   scaleFactor = $20,000 / $25,000 = 0.80 (80%)
   ```

4. **Apply Scaling**:
   ```
   Binary: $17,000 × 0.80 = $13,600
   Override: $8,000 × 0.80 = $6,400
   ```

5. **Final Totals**:
   ```
   Direct: $20,000 (20.0% of SV) - unchanged
   Binary: $13,600 (13.6% of SV) - scaled from 17%
   Override: $6,400 (6.4% of SV) - scaled from 8%
   Total: $40,000 (40.0% of SV) ✓
   ```

## Why This Strategy?

### 1. Predictability for Users

Direct commissions are the most predictable:
- "Refer someone, get 10%"
- Users can calculate before earning
- Builds trust in the system

Keeping direct fixed maintains this trust.

### 2. Proportional Impact

When cap is hit, it's usually because of:
- Strong binary performance
- Multiple levels of overrides
- Healthy network growth

Scaling these together is fair because:
- Both are performance-based
- Both scale with network size
- Both represent "bonus" income

### 3. Mathematical Elegance

Direct is already limited to 20% (half of 40%).

This means:
- At worst, direct uses half the global cap
- Binary/override have at least 20% space (50% of cap)
- Ratio between binary/override is preserved

### 4. Business Logic

In MLM compensation:
- Direct = immediate reward (fixed)
- Binary = team performance (scalable)
- Override = leadership bonus (scalable)

This hierarchy is natural and expected.

## Edge Cases

### Case 1: Direct Exceeds or Equals Cap

**Theoretically impossible** because:
- Direct capped at 20% of SV
- Global cap is 40% of SV
- 20% < 40%

**If it happens** (data error):
```typescript
if (binOvAllowed <= 0) {
  console.error('ERROR: Direct exceeds global cap');
  // Emergency fallback: scale all pools proportionally
  const emergencyScale = limit / total;
  // Apply to all commissions
}
```

### Case 2: Binary + Override = 0

If binary and override are both zero:
- No scaling needed
- Direct is only commission type
- Total will be < 40%

### Case 3: Exact Cap Match

If `total == limit`:
- Scale factor = 1.0
- No scaling applied
- Treated as "within limit"

## Comparison with Alternative Strategies

### Alternative 1: Scale All Proportionally

```typescript
// All pools scaled equally
globalScale = limit / total;
direct *= globalScale;
binary *= globalScale;
override *= globalScale;
```

**Problems:**
- Direct commissions become unpredictable
- Violates user expectations
- Breaks trust in compensation plan

### Alternative 2: Priority Order

```typescript
// Pay in order: Direct → Binary → Override
// Stop when cap reached
```

**Problems:**
- Override commissions could be zeroed out
- Unfair to leaders
- Discourages team building

### Alternative 3: Fixed Percentages

```typescript
// Always pay fixed percentages
direct = SV × 0.20;
binary = SV × 0.17;
override = SV × 0.03;
```

**Problems:**
- Inflexible
- Doesn't adapt to network performance
- May underpay or overpay

### Our Strategy is Best Because:

1. ✓ Direct commissions predictable
2. ✓ Performance bonuses scale appropriately
3. ✓ Always within 40% cap
4. ✓ Fair to all user types
5. ✓ Encourages network growth
6. ✓ Mathematically sound

## Testing the Cap

### Test Case 1: Normal Operation

```typescript
SV = 100,000
Direct = 18,000 (18%)
Binary = 15,000 (15%)
Override = 2,500 (2.5%)
Total = 35,500 (35.5%)

Expected:
- No scaling
- All paid as calculated
```

### Test Case 2: Cap Triggered

```typescript
SV = 100,000
Direct = 20,000 (20%)
Binary = 17,000 (17%)
Override = 8,000 (8%)
Total = 45,000 (45%)

Expected:
- Direct: 20,000 (unchanged)
- Scale factor: 0.8
- Binary: 13,600
- Override: 6,400
- Total: 40,000
```

### Test Case 3: Extreme Binary

```typescript
SV = 100,000
Direct = 15,000 (15%)
Binary = 30,000 (30% - would be scaled in binary pool)
Override = 5,000 (5%)
Total = 50,000 (50%)

Expected:
- Binary already scaled to 17,000 in pool scaling
- Then global cap applied if still over
```

## Monitoring and Reporting

### Key Metrics to Track

1. **Cap Hit Rate**: % of weeks where global cap is triggered
2. **Average Scale Factor**: When cap is hit, typical scale factor
3. **Direct vs Binary/Override Ratio**: Health indicator
4. **User Impact**: How many users affected by scaling

### Audit Trail

Every commission record includes:
- Base amount (before any scaling)
- Pool scale factor (if pool limit hit)
- Global scale factor (if cap hit)
- Final amount (after all scaling)

This allows complete reconstruction of:
- Why commission was scaled
- What factors were applied
- What the original amount was

## Documentation for Users

**User-Facing Explanation:**

> **Commission Guarantee**: Your direct referral commissions are always paid as earned (up to 20% of company volume). When total commissions exceed 40% of company volume, we ensure your direct commissions are protected while proportionally adjusting team performance bonuses to stay within our commitment.

**Key Points:**
- Your direct commissions are priority
- Team bonuses may scale based on overall performance
- Total company payout never exceeds 40% of sales
- This ensures long-term sustainability

## Implementation Checklist

- [x] Calculate current totals after pool scaling
- [x] Check if global cap exceeded
- [x] Keep direct commissions fixed
- [x] Calculate scale factor for binary/override
- [x] Apply scaling uniformly to binary/override
- [x] Verify final total ≤ 40% of SV
- [x] Log all calculations for audit
- [x] Handle edge cases (direct > cap, zero binary/override)
- [x] Store scale factors with commission records
- [x] Update settlement records with final totals
