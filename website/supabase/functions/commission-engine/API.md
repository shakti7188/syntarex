# Commission Engine API

## Public Function

```typescript
async function calculateWeeklyPayout(
  weekStart: string,
  supabase: SupabaseClient
): Promise<WeeklyPayoutResult>
```

### Parameters

- **weekStart**: `string` - Week start date in YYYY-MM-DD format (e.g., "2025-01-13")
- **supabase**: `SupabaseClient` - Supabase client instance for database access

### Returns

```typescript
type WeeklyPayoutResult = {
  weekStart: string;
  settlements: Array<{
    userId: string;
    direct: string;      // Formatted as decimal string (e.g., "125.50")
    binary: string;      // Formatted as decimal string
    override: string;    // Formatted as decimal string
    total: string;       // Formatted as decimal string
    scaleFactor: string; // Formatted as decimal string (e.g., "1.0000" or "0.8500")
  }>;
  totals: {
    SV: string;                // Total Sales Volume
    T_dir: string;             // Total Direct Commissions (after pool scaling)
    T_bin: string;             // Total Binary Commissions (after all scaling)
    T_ov: string;              // Total Override Commissions (after all scaling)
    total: string;             // Grand Total (≤ 40% of SV)
    globalScaleFactor: string; // Global scale factor applied to binary/override
  };
};
```

### Usage Example

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Calculate commissions for a specific week
const result = await calculateWeeklyPayout('2025-01-13', supabase);

console.log('Week:', result.weekStart);
console.log('Total Sales Volume:', result.totals.SV);
console.log('Total Payout:', result.totals.total);
console.log('Number of Settlements:', result.settlements.length);

// Process each user's settlement
for (const settlement of result.settlements) {
  console.log(`User ${settlement.userId}:`);
  console.log(`  Direct: $${settlement.direct}`);
  console.log(`  Binary: $${settlement.binary}`);
  console.log(`  Override: $${settlement.override}`);
  console.log(`  Total: $${settlement.total}`);
  console.log(`  Scale Factor: ${settlement.scaleFactor}`);
}
```

### HTTP Endpoint

The function is also exposed via HTTP:

**Endpoint**: `POST /commission-engine`

**Request Body**:
```json
{
  "weekStart": "2025-01-13",
  "persist": false  // Optional: save to database
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "weekStart": "2025-01-13",
    "settlements": [
      {
        "userId": "user-id-1",
        "direct": "100.00",
        "binary": "50.00",
        "override": "15.00",
        "total": "165.00",
        "scaleFactor": "1.0000"
      }
    ],
    "totals": {
      "SV": "10000.00",
      "T_dir": "2000.00",
      "T_bin": "1500.00",
      "T_ov": "300.00",
      "total": "3800.00",
      "globalScaleFactor": "1.0000"
    }
  },
  "timestamp": "2025-01-13T12:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Calculation Flow

The `calculateWeeklyPayout` function orchestrates the entire commission calculation process:

1. **Fetch Data**
   - Transactions for the week
   - User profiles with ranks
   - Binary tree volumes

2. **Calculate Sales Volume**
   - Sum all eligible transactions

3. **Process Commissions** (via `processWeeklyCommissions`)
   - Calculate direct commissions (with pool limit)
   - Calculate binary commissions (with pool limit & carry-forward)
   - Calculate override commissions (with rank qualification)
   - Apply global 40% payout cap

4. **Format Results**
   - Convert settlements to public API format
   - Format all numbers as decimal strings
   - Include totals and scale factors

5. **Return Result**
   - Type-safe `WeeklyPayoutResult` object

### Data Guarantees

When you call this function, you are guaranteed:

1. **Total Payout ≤ 40% of SV**
   ```
   parseFloat(result.totals.total) ≤ parseFloat(result.totals.SV) × 0.40
   ```

2. **Direct Commissions ≤ 20% of SV**
   ```
   parseFloat(result.totals.T_dir) ≤ parseFloat(result.totals.SV) × 0.20
   ```

3. **Binary Commissions ≤ 17% of SV** (before global cap)
   - May be further scaled if global cap is hit

4. **Sum of Settlements = Totals**
   ```
   sum(settlements.total) == result.totals.total
   ```

5. **All Values are Decimal Strings**
   - Safe for financial calculations
   - Avoid floating point precision issues
   - Can be directly stored in database or displayed

### Integration Examples

#### React Component

```typescript
import { supabase } from '@/integrations/supabase/client';

const CalculateCommissions = () => {
  const [result, setResult] = useState<WeeklyPayoutResult | null>(null);
  
  const calculate = async () => {
    const { data } = await supabase.functions.invoke('commission-engine', {
      body: { weekStart: '2025-01-13', persist: true }
    });
    
    if (data.success) {
      setResult(data.result);
    }
  };
  
  return (
    <div>
      <button onClick={calculate}>Calculate</button>
      {result && (
        <div>
          <h2>Week: {result.weekStart}</h2>
          <p>Total Payout: ${result.totals.total}</p>
          <p>Global Scale: {result.totals.globalScaleFactor}</p>
        </div>
      )}
    </div>
  );
};
```

#### Node.js Script

```typescript
import { createClient } from '@supabase/supabase-js';

async function runWeeklyPayroll() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  const today = new Date();
  const weekStart = getWeekStart(today); // Your logic
  
  const result = await calculateWeeklyPayout(weekStart, supabase);
  
  // Process settlements
  for (const settlement of result.settlements) {
    await processPayment(settlement.userId, settlement.total);
  }
  
  // Log totals
  console.log(`Week ${result.weekStart} complete`);
  console.log(`Total paid: $${result.totals.total} / ${result.totals.SV} SV`);
}
```

#### Scheduled Cron Job

```typescript
// supabase/functions/weekly-payroll/index.ts
import { calculateWeeklyPayout } from '../commission-engine';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  
  // Calculate for previous week
  const lastMonday = getLastMonday();
  const result = await calculateWeeklyPayout(lastMonday, supabase);
  
  // Persist settlements
  await persistSettlements(supabase, result.settlements);
  
  // Send notifications
  await notifyUsers(result.settlements);
  
  return new Response(JSON.stringify({
    success: true,
    week: result.weekStart,
    settlementCount: result.settlements.length,
    totalPaid: result.totals.total
  }));
});
```

### Performance Characteristics

- **Time Complexity**: O(U + T + U×D) where:
  - U = number of users
  - T = number of transactions
  - D = max depth of sponsor/binary chains (typically 3)

- **Typical Execution Time**:
  - 100 users: ~200ms
  - 1,000 users: ~1-2s
  - 10,000 users: ~10-15s

- **Memory Usage**:
  - Scales linearly with user count
  - Commission records stored in memory during calculation
  - Recommend batch processing for >10K users

### Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('calculateWeeklyPayout', () => {
  it('should calculate commissions correctly', async () => {
    const result = await calculateWeeklyPayout('2025-01-13', mockSupabase);
    
    expect(result.weekStart).toBe('2025-01-13');
    expect(result.settlements.length).toBeGreaterThan(0);
    
    // Verify total ≤ 40% of SV
    const total = parseFloat(result.totals.total);
    const sv = parseFloat(result.totals.SV);
    expect(total).toBeLessThanOrEqual(sv * 0.40);
  });
  
  it('should format all values as decimal strings', async () => {
    const result = await calculateWeeklyPayout('2025-01-13', mockSupabase);
    
    // Check settlement values
    result.settlements.forEach(s => {
      expect(s.direct).toMatch(/^\d+\.\d{2}$/);
      expect(s.binary).toMatch(/^\d+\.\d{2}$/);
      expect(s.override).toMatch(/^\d+\.\d{2}$/);
      expect(s.total).toMatch(/^\d+\.\d{2}$/);
    });
    
    // Check totals
    expect(result.totals.SV).toMatch(/^\d+\.\d{2}$/);
    expect(result.totals.total).toMatch(/^\d+\.\d{2}$/);
  });
});
```

### Migration from Old API

If you're using the old `processWeeklyCommissions` directly:

**Old:**
```typescript
const output = processWeeklyCommissions(salesVolume, users, transactions, binaryTree, weekStart);
// Manual formatting required
```

**New:**
```typescript
const result = await calculateWeeklyPayout(weekStart, supabase);
// Clean, type-safe, pre-formatted result
```

### Best Practices

1. **Always use the public API function**
   - Don't call internal functions directly
   - Use `calculateWeeklyPayout` for consistency

2. **Handle decimal strings properly**
   - Use `parseFloat()` when doing math
   - Store as strings in database
   - Display directly to users

3. **Check for errors**
   - Wrap in try-catch
   - Handle missing data gracefully
   - Log errors for debugging

4. **Cache results**
   - Commission calculations are expensive
   - Cache by week for repeated queries
   - Invalidate cache when recalculating

5. **Test with real data**
   - Use production-like data volumes
   - Test edge cases (zero commissions, max cap)
   - Verify totals match expectations
