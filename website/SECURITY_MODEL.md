# Commission System Security Model

## Overview
The commission calculation system enforces a strict security model where write operations are server-side only and users can only view their own commission data.

## Write Operations (INSERT/UPDATE/DELETE)

### Server-Side Execution Only
All write operations for commissions and settlements are executed exclusively through:
- **Edge Functions**: The `commission-engine` function uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS policies
- **Admin Users**: Users with the `admin` role can perform write operations through the admin panel

### Protected Tables
The following tables have write-protection enforced via RLS:
- `direct_commissions`
- `binary_commissions`
- `override_commissions`
- `weekly_settlements`
- `binary_volume`

## Read Operations (SELECT)

### User Access
Regular users can **only SELECT their own records** from commission tables:
```sql
-- Example RLS Policy
CREATE POLICY "Users can view their own commissions" 
ON direct_commissions 
FOR SELECT 
USING (auth.uid() = user_id);
```

### Admin Access
Admin users can view **all records** across all tables:
```sql
-- Example RLS Policy
CREATE POLICY "Admins can view all commissions" 
ON direct_commissions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));
```

## Edge Function Security

### commission-engine Function
```typescript
// Uses service role key to bypass RLS for writes
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);
```

This allows the function to:
1. Read all transactions and user data
2. Calculate commissions
3. Insert commission records into protected tables
4. Update settlement records

### Function Access Control
The `commission-engine` function should only be called from:
- **Admin Panel**: Protected by `ProtectedRoute` with `requireAdmin` prop
- **Scheduled Jobs**: Server-side cron jobs (future implementation)

## Admin Route Protection

### Frontend Protection
```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <Admin />
    </ProtectedRoute>
  }
/>
```

### Role Verification
The `useAuth` hook verifies admin status by:
1. Fetching user role from `user_roles` table
2. Using security definer function `has_role()` to prevent RLS recursion
3. Setting `isAdmin` flag based on role

## Security Guarantees

✅ **Regular users CANNOT**:
- Insert commission records
- Update commission amounts
- Delete commission data
- Modify settlement records
- Write to binary_volume table

✅ **Regular users CAN**:
- View their own commissions (all types)
- View their own settlements
- View their own binary volume data

✅ **Admin users CAN**:
- Trigger commission calculations
- View all commission data
- Manage all user records
- Access system testing tools

✅ **Edge Functions CAN**:
- Bypass RLS using service role key
- Write commission and settlement records
- Read all user and transaction data

## Verification

To verify the security model:
1. Check RLS policies: `supabase--linter` tool
2. Test user access: Login as regular user, attempt writes (should fail)
3. Test admin access: Login as admin, trigger commission calculation (should succeed)
4. Review edge function logs: Verify service role key usage

## Potential Vulnerabilities

❌ **DO NOT**:
- Call commission-engine from client-side code without admin verification
- Store commission data in localStorage or client-side state
- Expose service role key in frontend code
- Create RLS policies that allow user writes to commission tables

✅ **ALWAYS**:
- Use service role key only in edge functions
- Verify admin role on both frontend and backend
- Keep commission calculations server-side
- Use RLS policies for read access control
