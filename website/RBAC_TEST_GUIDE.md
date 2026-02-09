# RBAC Testing Guide

This guide documents how to verify the complete Role-Based Access Control (RBAC) implementation.

## Admin User Configuration

**Admin Email:** `gp.101bc@gmail.com`

This user has been granted the `admin` role in the database via:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE email = 'gp.101bc@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 1. Frontend Route Protection

### ✅ Admin User Tests (gp.101bc@gmail.com)

1. **Navigate to /admin**
   - Expected: Page loads successfully
   - Implementation: `<ProtectedRoute requireAdmin>` in route definition

2. **Check sidebar navigation**
   - Expected: "Admin" section visible with admin menu items
   - Implementation: `AppNavigation.tsx` checks `isAdmin` from `useAuth`

3. **Navigate to /admin/test-tools**
   - Expected: Page loads successfully

4. **Navigate to any /admin/* route**
   - Expected: All admin routes accessible

### ❌ Regular User Tests

1. **Attempt to navigate to /admin**
   - Expected: Redirected to `/`
   - Expected: Toast notification: "Admin access only"
   - Implementation: `ProtectedRoute.tsx` redirect logic

2. **Check sidebar navigation**
   - Expected: "Admin" section NOT visible
   - Implementation: UI gating in `AppNavigation.tsx`

3. **Try direct URL access to /admin/test-tools**
   - Expected: Redirected to `/`
   - Expected: Toast notification shown

---

## 2. API Endpoint Protection

### ✅ Admin User Tests

Test these endpoints with admin credentials:

```bash
# Allocation Config
GET /api-allocation-config-get
POST /api-allocation-config-update

# Commission Settings
GET /api-commission-settings-get
POST /api-commission-settings-update

# Payout Calculations
POST /api-admin-payouts-calculate
POST /api-admin-payouts-finalize

# Pool Keys Management
GET /api-admin-pools-keys-list
POST /api-admin-pools-keys-create
POST /api-admin-pools-keys-rotate
POST /api-admin-pools-keys-update
POST /api-admin-pools-keys-deactivate

# Bulk Operations
POST /api-admin-machines-bulk-upload
POST /api-admin-test-generate-accounts
```

**Expected for all:** Status 200 with valid response data

**Implementation:** All endpoints use `validateAdminAuth()` from `_shared/admin-auth.ts`

### ❌ Regular User Tests

Call any admin endpoint with regular user credentials:

**Expected:**
- Status: `403 Forbidden`
- Response body: `{ error: "Admin access only" }`

---

## 3. Database RLS Policies

### ✅ Admin User - Can See All Records

Test queries (execute in backend or via API):

```sql
-- Should return all records
SELECT * FROM direct_commissions LIMIT 10;
SELECT * FROM binary_commissions LIMIT 10;
SELECT * FROM override_commissions LIMIT 10;
SELECT * FROM weekly_settlements LIMIT 10;
SELECT * FROM profiles LIMIT 10;
```

**Expected:** Query succeeds, returns all records

**Implementation:** RLS policies include:
```sql
CREATE POLICY "Admins can view all X" ON table_name
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
```

### ❌ Regular User - Only Own Records

Test queries as regular user:

```sql
-- Should only return records where user_id = auth.uid()
SELECT * FROM direct_commissions;
SELECT * FROM binary_commissions;
SELECT * FROM override_commissions;
```

**Expected:** Only returns records where `user_id` matches the authenticated user's ID

**Implementation:** RLS policies include:
```sql
CREATE POLICY "Users can view own X" ON table_name
FOR SELECT
USING (auth.uid() = user_id);
```

---

## 4. Admin Role Priority

### Test Case: User with Multiple Roles

If a user has both `admin` and `user` roles in the `user_roles` table:

**Expected Behavior:**
- `useAuth` hook returns `isAdmin: true`
- User gets full admin access
- Admin privileges take precedence

**Implementation in `useAuth.tsx`:**
```typescript
const hasAdmin = data.some(r => r.role === "admin");
setUserRole(hasAdmin ? "admin" : data[0].role);
```

**Verify:**
```sql
SELECT p.email, ur.role 
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email = 'gp.101bc@gmail.com';
```

Expected result shows `role = 'admin'`

---

## 5. Security Definer Function

The `has_role()` function is critical for RLS without recursion:

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Why SECURITY DEFINER?**
- Prevents infinite recursion in RLS policies
- Executes with function owner's privileges
- Bypasses RLS when checking roles

**Test:**
```sql
-- Should return true for admin user
SELECT has_role(
  (SELECT id FROM profiles WHERE email = 'gp.101bc@gmail.com'),
  'admin'::app_role
);

-- Should return false for regular user
SELECT has_role(
  (SELECT id FROM profiles WHERE email = 'regular@user.com'),
  'admin'::app_role
);
```

---

## 6. Complete Flow Tests

### Scenario A: Admin Creates Commission Record

1. Admin logs in (gp.101bc@gmail.com)
2. Admin navigates to `/admin/test-tools`
3. Admin triggers commission calculation
4. Backend validates admin role via `validateAdminAuth()`
5. Backend inserts commission records (bypassing user RLS)
6. Admin queries commissions - sees all records

**Verify:** No 403 errors, all operations succeed

### Scenario B: Regular User Attempts Admin Action

1. Regular user logs in
2. User manually enters `/admin` URL
3. Frontend checks role → not admin
4. User redirected to `/` with toast message
5. User attempts API call to admin endpoint
6. Backend validates role → returns 403
7. User queries own commissions - only sees own data

**Verify:** All admin access blocked, appropriate errors shown

---

## 7. Security Checklist

- ✅ Roles stored in separate `user_roles` table (not in `profiles`)
- ✅ `has_role()` uses `SECURITY DEFINER` to avoid RLS recursion
- ✅ All admin API endpoints validate with `validateAdminAuth()`
- ✅ All admin routes protected with `<ProtectedRoute requireAdmin>`
- ✅ RLS policies use `has_role(auth.uid(), 'admin')` for admin override
- ✅ No client-side role storage (localStorage/sessionStorage)
- ✅ UI gating based on server-verified role from `useAuth`
- ✅ No hardcoded credentials or admin checks
- ✅ Admin role takes priority when user has multiple roles
- ✅ Email `gp.101bc@gmail.com` configured as admin

---

## 8. Manual Testing Script

### As Admin (gp.101bc@gmail.com):

```bash
# 1. Login
# Expected: Successful login

# 2. Check navigation
# Expected: See "Admin" section in sidebar

# 3. Visit /admin
# Expected: Page loads

# 4. Call admin API
curl -X GET https://mmokswccbnfzcwatqcae.supabase.co/functions/v1/api-allocation-config-get \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
# Expected: 200 OK with data

# 5. Query commissions
# Expected: See all users' commission records
```

### As Regular User:

```bash
# 1. Login with non-admin account
# Expected: Successful login

# 2. Check navigation
# Expected: NO "Admin" section

# 3. Visit /admin directly
# Expected: Redirected to / with error toast

# 4. Call admin API
curl -X GET https://mmokswccbnfzcwatqcae.supabase.co/functions/v1/api-allocation-config-get \
  -H "Authorization: Bearer YOUR_USER_JWT"
# Expected: 403 Forbidden

# 5. Query commissions
# Expected: Only see own records
```

---

## Summary

This RBAC implementation provides defense-in-depth:

1. **Frontend Protection:** ProtectedRoute + UI gating
2. **API Protection:** validateAdminAuth in all admin endpoints
3. **Database Protection:** RLS policies with admin override
4. **Priority Handling:** Admin role takes precedence
5. **Security:** Separate roles table + SECURITY DEFINER function

All layers must pass the admin check for complete access control.
