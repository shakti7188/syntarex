# Commission Engine Module

Modular backend commission calculation system for weekly MLM settlements.

## Architecture

The commission engine is built as a series of pure functions that process weekly data deterministically:

```
Input Data → Direct Calc → Binary Calc → Override Calc → Scaling → Settlements
```

## Core Functions

### 1. `calculateDirectCommissions(users, transactions)`
**Purpose**: Calculate 3-tier direct referral commissions

**Algorithm**:
- For each user who made purchases in the week
- Traverse sponsor chain up to 3 levels
- Apply rates: 10% (L1), 5% (L2), 3% (L3)
- Generate commission records per user per tier

**Returns**: `DirectCommission[]`

### 2. `calculateBinaryCommissions(users, binaryVolumes)`
**Purpose**: Calculate binary weak-leg commissions

**Algorithm**:
- For each user with binary volume
- Identify weak leg: `min(leftVolume, rightVolume)`
- Apply 10% commission rate on weak leg
- Generate base commission (before scaling)

**Returns**: `BinaryCommission[]`

### 3. `calculateOverrideCommissions(users, binaryCommissions)`
**Purpose**: Calculate 3-level leadership overrides on binary commissions

**Algorithm**:
- For each user with binary commission
- Traverse binary upline up to 3 levels
- Apply rates: 5% (L1), 3% (L2), 2% (L3) of downline's binary
- Generate override records

**Returns**: `OverrideCommission[]`

### 4. `calculateScaleFactors(directTotal, binaryTotal, overrideTotal, totalSV)`
**Purpose**: Ensure pool limits are respected via deterministic scaling

**Algorithm**:
```
1. Calculate pool limits:
   - Direct Pool: 20% of SV
   - Binary Pool: 17% of SV
   - Override Pool: 3% of SV
   - Global Cap: 40% of SV

2. Calculate individual scale factors:
   - directScale = min(1.0, directPool / directTotal)
   - binaryScale = min(1.0, binaryPool / binaryTotal)
   - overrideScale = min(1.0, overridePool / overrideTotal)

3. Apply pool scaling:
   - scaledDirect = directTotal × directScale
   - scaledBinary = binaryTotal × binaryScale
   - scaledOverride = overrideTotal × overrideScale
   - scaledTotal = scaledDirect + scaledBinary + scaledOverride

4. Apply global cap:
   - globalScale = min(1.0, globalCap / scaledTotal)

5. Final amounts:
   - Each commission × poolScale × globalScale
```

**Returns**: Scale factors and final totals

### 5. `applyScaling(directCommissions, binaryCommissions, overrideCommissions, scaleFactors)`
**Purpose**: Mutate commission arrays with final scaled amounts

**Side Effects**: Updates `amount` and `scaled_amount` fields

### 6. `generateSettlements(users, directCommissions, binaryCommissions, overrideCommissions, weekStart, globalScaleFactor)`
**Purpose**: Create weekly settlement records per user

**Algorithm**:
- Group commissions by user
- Sum direct, binary, override per user
- Create settlement record with breakdown
- Include scale factor for audit trail

**Returns**: `WeeklySettlement[]`

## Main Entry Point

### `processWeeklyCommissions(salesVolume, users, transactions, binaryVolumes, weekStart)`

Orchestrates the complete weekly calculation:

1. Calculate direct commissions
2. Calculate binary commissions
3. Calculate override commissions
4. Calculate scaling factors
5. Apply scaling to all commissions
6. Generate settlement records

**Returns**: `EngineOutput` with all commissions, settlements, and summary

## HTTP Interface

**Endpoint**: `/commission-engine`

**Request**:
```json
{
  "weekStart": "2025-01-13",
  "persist": true  // Optional: save to database
}
```

**Response**:
```json
{
  "success": true,
  "output": {
    "directCommissions": [...],
    "binaryCommissions": [...],
    "overrideCommissions": [...],
    "settlements": [...],
    "summary": {
      "totalSV": 100000,
      "poolLimits": { "globalCap": 40000, ... },
      "unscaledTotals": { "direct": 18000, ... },
      "scaleFactors": { "direct": 1.0, ... },
      "finalTotals": { "direct": 18000, ... }
    }
  }
}
```

## Configuration

All commission rates and pool limits are defined in `COMMISSION_CONFIG`:

```typescript
const COMMISSION_CONFIG = {
  DIRECT_RATES: [0.10, 0.05, 0.03],      // 10%, 5%, 3%
  BINARY_RATE: 0.10,                      // 10% on weak leg
  OVERRIDE_RATES: [0.05, 0.03, 0.02],    // 5%, 3%, 2%
  GLOBAL_CAP_PERCENT: 0.40,               // 40% of SV
  BINARY_POOL_PERCENT: 0.17,              // 17% of SV
  DIRECT_POOL_PERCENT: 0.20,              // 20% of SV
  OVERRIDE_POOL_PERCENT: 0.03,            // 3% of SV
};
```

## Data Requirements

### Input Types

**User**:
```typescript
{
  id: string;
  rank: string;
  sponsor_id: string | null;          // For direct commissions
  binary_parent_id: string | null;    // For override commissions
  binary_position: 'left' | 'right' | null;
}
```

**Transaction**:
```typescript
{
  id: string;
  user_id: string;
  amount: number;
  week_start: string;  // YYYY-MM-DD
}
```

**BinaryVolume**:
```typescript
{
  user_id: string;
  left_volume: number;
  right_volume: number;
  weak_leg: 'left' | 'right' | null;
}
```

### Output Types

**DirectCommission**:
```typescript
{
  user_id: string;           // Who earns
  source_user_id: string;    // Who purchased
  tier: number;              // 1, 2, or 3
  rate: number;              // 0.10, 0.05, or 0.03
  amount: number;            // Final scaled amount
}
```

**BinaryCommission**:
```typescript
{
  user_id: string;
  weak_leg_volume: number;
  base_amount: number;       // Before scaling
  scaled_amount: number;     // After scaling
  scale_factor: number;      // Applied factor
}
```

**OverrideCommission**:
```typescript
{
  user_id: string;           // Who earns
  source_user_id: string;    // Downline who generated binary
  level: number;             // 1, 2, or 3
  base_amount: number;       // Before scaling
  scaled_amount: number;     // After scaling
}
```

**WeeklySettlement**:
```typescript
{
  user_id: string;
  week_start: string;
  week_end: string;
  direct_total: number;
  binary_total: number;
  override_total: number;
  grand_total: number;
  scale_factor_applied: number;
  status: 'pending' | 'paid' | 'cancelled';
}
```

## Determinism Guarantees

1. **Pure Functions**: All calculation functions are pure (no side effects)
2. **Reproducible**: Same inputs always produce same outputs
3. **Auditable**: Every commission includes source user and calculation basis
4. **Transparent Scaling**: Scale factors stored with commissions

## Testing

To test the engine:

```bash
# Invoke without persisting
curl -X POST https://[project].supabase.co/functions/v1/commission-engine \
  -H "Content-Type: application/json" \
  -d '{"weekStart": "2025-01-13", "persist": false}'

# Invoke and persist to database
curl -X POST https://[project].supabase.co/functions/v1/commission-engine \
  -H "Content-Type: application/json" \
  -d '{"weekStart": "2025-01-13", "persist": true}'
```

## Performance Considerations

- **Time Complexity**: O(U + T + U×D) where:
  - U = number of users
  - T = number of transactions
  - D = max depth of sponsor/binary tree (3)
  
- **Space Complexity**: O(U + T + C) where:
  - C = total commission records generated

- **Optimization**: Uses Map lookups for O(1) user access

## Error Handling

- Missing weekStart: Returns 400 error
- Database errors: Logged and returned with 500 status
- Invalid data: Skipped with console warnings
- Persistence errors: Logged but doesn't fail the calculation

## Future Enhancements

1. Rank-based commission multipliers
2. Bonus pool distribution
3. Carry-forward calculations
4. Inactivity flushing
5. Historical audit trails
