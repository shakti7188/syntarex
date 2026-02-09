# MLM Compensation System - Comprehensive Test Guide

## 🎯 Test Overview

This guide provides a comprehensive testing strategy for the Hybrid Affiliate & Binary Compensation Platform.

## 📋 Pre-Test Checklist

- [x] Database schema created (12 tables)
- [x] Authentication system implemented
- [x] RLS policies configured
- [x] Admin/user roles set up
- [x] Dashboard components created
- [x] Test system edge function deployed

## 🧪 Test Categories

### 1. **Authentication Testing**

#### Manual Test Steps:

1. **Sign Up Flow**
   - Navigate to `/auth`
   - Create a new account with:
     - Email: `test-user@example.com`
     - Password: `TestPassword123!`
     - Full Name: `Test User`
   - Verify successful signup and auto-login
   - Check that user is redirected to `/dashboard`

2. **Sign In Flow**
   - Sign out from current session
   - Return to `/auth`
   - Sign in with created credentials
   - Verify successful login

3. **Password Reset**
   - On `/auth` page
   - Enter email in "Forgot password?" section
   - Check email for reset link
   - Follow reset process

4. **Protected Routes**
   - Try accessing `/dashboard` without authentication → should redirect to `/auth`
   - Try accessing `/admin` without authentication → should redirect to `/auth`
   - Sign in as regular user → access `/dashboard` ✓, access `/admin` ✗

### 2. **Database Schema Testing**

#### Automated Test (via Admin Panel):

1. Navigate to `/admin` (requires admin role)
2. Go to "System Settings" → "System Tests" tab
3. Click "Run Comprehensive Test"
4. Review test results for:
   - ✅ All 12 tables exist and accessible
   - ✅ 5 enum types properly defined
   - ✅ 4 database functions available
   - ✅ RLS enabled on all tables
   - ✅ Indexes created
   - ✅ 13 triggers configured
   - ✅ Foreign key constraints

### 3. **Role-Based Access Control (RBAC)**

#### Test Admin Role:

1. **Create Admin User**:
   ```sql
   -- Run this in Supabase SQL Editor or via edge function
   -- First sign up as admin@example.com
   -- Then run:
   INSERT INTO user_roles (user_id, role)
   VALUES (
     (SELECT id FROM profiles WHERE email = 'admin@example.com'),
     'admin'
   );
   ```

2. **Verify Admin Access**:
   - Sign in as admin user
   - Access `/admin` → should work ✓
   - View all users in user management
   - Run system tests
   - Modify system settings

3. **Verify User Restrictions**:
   - Sign in as regular user
   - Try to access `/admin` → should redirect to `/dashboard` ✓
   - Verify can only see own data in dashboard

### 4. **Database Relationships Testing**

#### Test Data Creation:

```sql
-- Create test transactions
INSERT INTO transactions (user_id, amount, currency, week_start)
VALUES (
  (SELECT id FROM profiles LIMIT 1),
  1000.00,
  'USDT',
  '2025-01-06'
);

-- Verify binary_tree auto-creation
SELECT * FROM binary_tree WHERE user_id = (SELECT id FROM profiles LIMIT 1);

-- Verify user_activity auto-creation
SELECT * FROM user_activity WHERE user_id = (SELECT id FROM profiles LIMIT 1);
```

### 5. **Commission System Testing**

#### Test Commission Records:

```sql
-- Insert direct commission
INSERT INTO direct_commissions (
  user_id,
  source_user_id,
  transaction_id,
  tier,
  rate,
  amount,
  week_start
)
SELECT 
  id,
  id,
  (SELECT id FROM transactions LIMIT 1),
  1,
  10.00,
  100.00,
  '2025-01-06'
FROM profiles
LIMIT 1;

-- Insert binary commission
INSERT INTO binary_commissions (
  user_id,
  week_start,
  weak_leg_volume,
  base_amount,
  scaled_amount
)
SELECT 
  id,
  '2025-01-06',
  5000.00,
  500.00,
  500.00
FROM profiles
LIMIT 1;

-- Verify commissions appear in dashboard
```

### 6. **Binary Tree Structure Testing**

#### Test Binary Placement:

```sql
-- Update binary tree relationships
UPDATE profiles
SET 
  sponsor_id = (SELECT id FROM profiles WHERE email = 'test-user@example.com'),
  binary_parent_id = (SELECT id FROM profiles WHERE email = 'test-user@example.com'),
  binary_position = 'left'
WHERE email = 'referral1@example.com';

-- Verify binary tree updates
SELECT * FROM binary_tree WHERE user_id = (SELECT id FROM profiles WHERE email = 'test-user@example.com');
```

### 7. **Weekly Settlement Testing**

#### Create Test Settlement:

```sql
INSERT INTO weekly_settlements (
  user_id,
  week_start_date,
  week_end_date,
  direct_l1_commission,
  direct_l2_commission,
  direct_l3_commission,
  binary_commission,
  override_commission,
  direct_total,
  binary_total,
  override_total,
  grand_total,
  total_commission,
  status
)
SELECT 
  id,
  '2025-01-06',
  '2025-01-12',
  100.00,
  50.00,
  30.00,
  500.00,
  45.00,
  180.00,
  500.00,
  45.00,
  725.00,
  725.00,
  'paid'
FROM profiles
LIMIT 1;
```

### 8. **Performance Testing**

#### Query Performance:

```sql
-- Test indexed queries
EXPLAIN ANALYZE SELECT * FROM commissions WHERE user_id = 'some-uuid';
EXPLAIN ANALYZE SELECT * FROM transactions WHERE week_start = '2025-01-06';
EXPLAIN ANALYZE SELECT * FROM referrals WHERE referrer_id = 'some-uuid';

-- Should show Index Scan instead of Seq Scan
```

### 9. **RLS Policy Testing**

#### Test Data Isolation:

1. Sign in as User A
2. Create some data (transactions, view commissions)
3. Note User A's data IDs
4. Sign out
5. Sign in as User B
6. Try to query User A's specific data → should return empty/error
7. Verify User B can only see their own data

### 10. **Edge Function Testing**

#### Test System Test Function:

```javascript
// Using browser console or frontend
const { data, error } = await supabase.functions.invoke('test-system');
console.log('Test Results:', data);
```

## 🎨 UI/UX Testing

### Dashboard Components:

1. **Commission Breakdown**
   - Verify all commission types display
   - Check charts render correctly
   - Test data filters

2. **Referral Tree**
   - Verify tree visualization loads
   - Check binary structure display
   - Test navigation through tree

3. **Weekly Settlement**
   - Verify settlement history displays
   - Check status badges
   - Test date filters

### Admin Panel:

1. **User Management**
   - View all users
   - Search functionality
   - Filter by role/status

2. **Analytics**
   - System-wide metrics
   - Charts and graphs
   - Export functionality

3. **System Settings**
   - Configuration updates
   - Run system tests
   - View test results

## 📊 Success Criteria

- ✅ All automated tests pass (100% success rate)
- ✅ Authentication flows work seamlessly
- ✅ RBAC properly restricts access
- ✅ Database constraints prevent invalid data
- ✅ RLS policies enforce data isolation
- ✅ UI components render without errors
- ✅ Edge functions execute successfully
- ✅ Performance meets expectations (<100ms for most queries)

## 🐛 Known Issues & Limitations

1. **Email Confirmation**: Currently disabled for testing (auto_confirm_email = true)
2. **Commission Calculation**: Edge function not yet implemented (manual data only)
3. **Web3 Integration**: Not yet implemented
4. **Weekly Settlement Automation**: Requires scheduled edge function

## 🚀 Next Steps

1. Implement commission calculation edge function
2. Build referral signup flow with automatic placement
3. Create weekly settlement processor
4. Add Web3 wallet integration for USDT/MUSD payouts
5. Implement real-time updates with Supabase Realtime
6. Add comprehensive logging and monitoring
7. Set up automated weekly settlement cron job

## 📝 Test Results Template

```
Date: _______________
Tester: _______________

Authentication Tests:
- Sign Up: ☐ PASS ☐ FAIL
- Sign In: ☐ PASS ☐ FAIL  
- Password Reset: ☐ PASS ☐ FAIL
- Protected Routes: ☐ PASS ☐ FAIL

Database Tests:
- Schema: ☐ PASS ☐ FAIL
- RLS Policies: ☐ PASS ☐ FAIL
- Relationships: ☐ PASS ☐ FAIL

RBAC Tests:
- Admin Access: ☐ PASS ☐ FAIL
- User Restrictions: ☐ PASS ☐ FAIL

UI Tests:
- Dashboard: ☐ PASS ☐ FAIL
- Admin Panel: ☐ PASS ☐ FAIL

Notes:
_________________________
_________________________
```
