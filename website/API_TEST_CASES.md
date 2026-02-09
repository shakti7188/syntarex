# API Test Cases - Comprehensive Test Suite

## 🎯 Overview

This document outlines comprehensive test cases for all API endpoints in the Hybrid Affiliate & Binary Compensation Platform, following the standardized API interface using camelCase responses and decimal string money values.

---

## 📋 Test Environment Setup

### Prerequisites
- Active Supabase project with all tables migrated
- Test users created (regular user + admin user)
- Sample data populated (transactions, commissions, settlements)
- Authentication tokens obtained

### Test Data Requirements
```sql
-- Create test users
INSERT INTO profiles (id, email, full_name, rank)
VALUES 
  ('user-test-001', 'testuser@example.com', 'Test User', 'Member'),
  ('admin-test-001', 'testadmin@example.com', 'Test Admin', 'Diamond');

-- Assign admin role
INSERT INTO user_roles (user_id, role)
VALUES ('admin-test-001', 'admin');

-- Create test transactions
INSERT INTO transactions (user_id, amount, currency, week_start)
VALUES 
  ('user-test-001', 1000.00, 'USDT', '2025-01-06'),
  ('user-test-001', 2500.00, 'USDT', '2025-01-06');

-- Create test commissions
INSERT INTO direct_commissions (user_id, source_user_id, tier, rate, amount, week_start)
VALUES ('user-test-001', 'user-test-001', 1, 10.00, 100.00, '2025-01-06');

INSERT INTO binary_commissions (user_id, week_start, weak_leg_volume, base_amount, scaled_amount)
VALUES ('user-test-001', '2025-01-06', 5000.00, 500.00, 500.00);

INSERT INTO override_commissions (user_id, source_user_id, level, base_amount, scaled_amount, week_start)
VALUES ('user-test-001', 'user-test-001', 1, 50.00, 50.00, '2025-01-06');
```

---

## 🔐 Authentication & Profile Tests

### **Test Case 1.1: GET /api/me - Successful Request**

**Objective**: Verify authenticated user can retrieve their profile

**Prerequisites**: 
- User signed in with valid JWT token

**Request**:
```bash
curl -X GET \
  'https://[PROJECT_URL]/functions/v1/api-me' \
  -H 'Authorization: Bearer [JWT_TOKEN]'
```

**Expected Response**:
```json
{
  "id": "uuid",
  "email": "testuser@example.com",
  "role": "user",
  "rank": "Member",
  "walletAddress": null,
  "sponsorId": null,
  "binaryParentId": null,
  "binaryPosition": null
}
```

**Validation Checks**:
- ✅ Status code: 200
- ✅ Response uses camelCase keys
- ✅ All required fields present
- ✅ `id` is valid UUID
- ✅ `email` matches authenticated user
- ✅ `role` is either "admin" or "user"
- ✅ Nullable fields return `null` not `undefined`

---

### **Test Case 1.2: GET /api/me - Missing Authorization**

**Objective**: Verify endpoint rejects unauthenticated requests

**Request**:
```bash
curl -X GET \
  'https://[PROJECT_URL]/functions/v1/api-me'
```

**Expected Response**:
```json
{
  "error": "Authorization header required"
}
```

**Validation Checks**:
- ✅ Status code: 401
- ✅ Error message is clear

---

### **Test Case 1.3: GET /api/me - Invalid Token**

**Objective**: Verify endpoint rejects invalid JWT tokens

**Request**:
```bash
curl -X GET \
  'https://[PROJECT_URL]/functions/v1/api-me' \
  -H 'Authorization: Bearer INVALID_TOKEN_123'
```

**Expected Response**:
```json
{
  "error": "Invalid token"
}
```

**Validation Checks**:
- ✅ Status code: 401
- ✅ Error handling works correctly

---

### **Test Case 1.4: GET /api/me - Admin User**

**Objective**: Verify admin role is correctly returned

**Prerequisites**: 
- Admin user signed in

**Request**:
```bash
curl -X GET \
  'https://[PROJECT_URL]/functions/v1/api-me' \
  -H 'Authorization: Bearer [ADMIN_JWT_TOKEN]'
```

**Expected Response**:
```json
{
  "id": "uuid",
  "email": "testadmin@example.com",
  "role": "admin",
  "rank": "Diamond",
  "walletAddress": "0xabc...",
  "sponsorId": "uuid",
  "binaryParentId": "uuid",
  "binaryPosition": "LEFT"
}
```

**Validation Checks**:
- ✅ `role` equals "admin"
- ✅ All optional fields populated correctly

---

## 💰 Commission Tests

### **Test Case 2.1: GET /api/commissions/current-week - Successful Request**

**Objective**: Verify user can retrieve current week's commissions

**Prerequisites**: 
- User has commission records for current week
- Current week is 2025-01-06 (Monday)

**Request**:
```bash
curl -X GET \
  'https://[PROJECT_URL]/functions/v1/api-commissions-current-week' \
  -H 'Authorization: Bearer [JWT_TOKEN]'
```

**Expected Response**:
```json
{
  "weekStart": "2025-01-06",
  "direct": "100.00",
  "binary": "500.00",
  "override": "50.00",
  "total": "650.00"
}
```

**Validation Checks**:
- ✅ Status code: 200
- ✅ `weekStart` is current Monday in YYYY-MM-DD format
- ✅ All money values are strings with 2 decimal places
- ✅ `total` equals sum of direct + binary + override
- ✅ camelCase keys used throughout

---

### **Test Case 2.2: GET /api/commissions/current-week - No Commissions**

**Objective**: Verify correct response when user has no commissions

**Prerequisites**: 
- User has no commission records for current week

**Request**:
```bash
curl -X GET \
  'https://[PROJECT_URL]/functions/v1/api-commissions-current-week' \
  -H 'Authorization: Bearer [JWT_TOKEN]'
```

**Expected Response**:
```json
{
  "weekStart": "2025-01-06",
  "direct": "0.00",
  "binary": "0.00",
  "override": "0.00",
  "total": "0.00"
}
```

**Validation Checks**:
- ✅ Status code: 200
- ✅ All values default to "0.00"
- ✅ Response structure remains consistent

---

### **Test Case 2.3: GET /api/commissions/current-week - Unauthorized**

**Objective**: Verify endpoint requires authentication

**Request**:
```bash
curl -X GET \
  'https://[PROJECT_URL]/functions/v1/api-commissions-current-week'
```

**Expected Response**:
```json
{
  "error": "Authorization header required"
}
```

**Validation Checks**:
- ✅ Status code: 401

---

### **Test Case 2.4: GET /api/commissions/current-week - Decimal Precision**

**Objective**: Verify correct decimal handling for money values

**Prerequisites**: 
- User has commissions with fractional cents

**Expected Behavior**:
- All values rounded to 2 decimal places
- No scientific notation
- Consistent formatting (e.g., "0.50" not "0.5")

---

## 🔧 Admin Engine Tests

### **Test Case 3.1: POST /api/admin/payouts/calculate - Successful Calculation**

**Objective**: Verify admin can trigger commission calculation

**Prerequisites**: 
- Admin user authenticated
- Transaction data exists for target week
- Commission engine function deployed

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-calculate' \
  -H 'Authorization: Bearer [ADMIN_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"weekStart": "2025-01-06"}'
```

**Expected Response**:
```json
{
  "weekStart": "2025-01-06",
  "status": "CALCULATED",
  "totals": {
    "sv": "1000000.00",
    "tDir": "200000.00",
    "tBin": "140000.00",
    "tOv": "30000.00",
    "total": "370000.00",
    "payoutRatio": 0.37,
    "globalScaleFactor": "0.985"
  }
}
```

**Validation Checks**:
- ✅ Status code: 200
- ✅ `weekStart` matches request
- ✅ `status` is "CALCULATED"
- ✅ All money values are decimal strings
- ✅ `payoutRatio` is a number (not string)
- ✅ `total` = tDir + tBin + tOv
- ✅ camelCase keys used

---

### **Test Case 3.2: POST /api/admin/payouts/calculate - Missing weekStart**

**Objective**: Verify validation of required parameters

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-calculate' \
  -H 'Authorization: Bearer [ADMIN_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Expected Response**:
```json
{
  "error": "weekStart is required"
}
```

**Validation Checks**:
- ✅ Status code: 400
- ✅ Clear error message

---

### **Test Case 3.3: POST /api/admin/payouts/calculate - Invalid Date Format**

**Objective**: Verify date format validation

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-calculate' \
  -H 'Authorization: Bearer [ADMIN_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"weekStart": "01/06/2025"}'
```

**Expected Response**:
```json
{
  "error": "weekStart must be in YYYY-MM-DD format"
}
```

**Validation Checks**:
- ✅ Status code: 400

---

### **Test Case 3.4: POST /api/admin/payouts/calculate - Non-Admin User**

**Objective**: Verify only admins can calculate payouts

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-calculate' \
  -H 'Authorization: Bearer [USER_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"weekStart": "2025-01-06"}'
```

**Expected Response**:
```json
{
  "error": "Unauthorized: Admin access required"
}
```

**Validation Checks**:
- ✅ Status code: 403
- ✅ Regular users cannot access

---

### **Test Case 3.5: POST /api/admin/payouts/calculate - No Transactions**

**Objective**: Verify behavior when no transactions exist

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-calculate' \
  -H 'Authorization: Bearer [ADMIN_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"weekStart": "2025-12-01"}'
```

**Expected Response**:
```json
{
  "weekStart": "2025-12-01",
  "status": "CALCULATED",
  "totals": {
    "sv": "0.00",
    "tDir": "0.00",
    "tBin": "0.00",
    "tOv": "0.00",
    "total": "0.00",
    "payoutRatio": 0,
    "globalScaleFactor": "1.0"
  }
}
```

**Validation Checks**:
- ✅ Returns zero values instead of error
- ✅ Graceful handling of edge case

---

### **Test Case 3.6: POST /api/admin/payouts/finalize - Successful Finalization**

**Objective**: Verify admin can finalize weekly settlements

**Prerequisites**: 
- Commissions calculated for target week
- Admin user authenticated

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-finalize' \
  -H 'Authorization: Bearer [ADMIN_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"weekStart": "2025-01-06"}'
```

**Expected Response**:
```json
{
  "success": true,
  "weekStart": "2025-01-06",
  "status": "FINALIZED",
  "totalUsers": 150,
  "totalAmount": "370000.00",
  "merkleRoot": "0x1234abcd...",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

**Validation Checks**:
- ✅ Status code: 200
- ✅ `success` is true
- ✅ `status` is "FINALIZED"
- ✅ `totalAmount` is decimal string
- ✅ `merkleRoot` is hex string
- ✅ `timestamp` is ISO 8601 format
- ✅ camelCase keys used

---

### **Test Case 3.7: POST /api/admin/payouts/finalize - Already Finalized**

**Objective**: Verify idempotency of finalization

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-finalize' \
  -H 'Authorization: Bearer [ADMIN_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"weekStart": "2025-01-06"}'
```

**Expected Response**:
```json
{
  "error": "Week already finalized",
  "weekStart": "2025-01-06"
}
```

**Validation Checks**:
- ✅ Status code: 400
- ✅ Prevents double finalization

---

### **Test Case 3.8: POST /api/admin/payouts/finalize - Non-Admin User**

**Objective**: Verify authorization required

**Request**:
```bash
curl -X POST \
  'https://[PROJECT_URL]/functions/v1/api-admin-payouts-finalize' \
  -H 'Authorization: Bearer [USER_JWT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"weekStart": "2025-01-06"}'
```

**Expected Response**:
```json
{
  "error": "Unauthorized: Admin access required"
}
```

**Validation Checks**:
- ✅ Status code: 403

---

## 🔄 Integration Tests

### **Test Case 4.1: Complete Weekly Payout Flow**

**Objective**: Verify end-to-end weekly payout process

**Steps**:
1. Create transactions for week 2025-01-06
2. POST /api/admin/payouts/calculate with weekStart
3. Verify calculation response
4. GET /api/commissions/current-week as user
5. Verify user sees commissions
6. POST /api/admin/payouts/finalize
7. Verify finalization response
8. Check settlements table for records

**Expected Outcome**:
- All steps succeed
- Data consistency maintained
- Users can see their commissions
- Admin can complete payout cycle

---

### **Test Case 4.2: Multi-User Commission Calculation**

**Objective**: Verify correct distribution across multiple users

**Prerequisites**:
- 3+ test users with referral relationships
- Transactions for each user
- Binary tree structure established

**Steps**:
1. Calculate payouts for week
2. Verify each user's commissions
3. Check tier-based direct commissions
4. Verify binary leg calculations
5. Confirm override commissions for higher ranks

**Expected Outcome**:
- Each user receives correct commission amounts
- Total payouts match totals response
- No double counting or missing commissions

---

### **Test Case 4.3: Week Boundary Testing**

**Objective**: Verify correct week calculation for edge cases

**Test Scenarios**:
- Sunday transaction (should count for next week)
- Monday transaction (should count for current week)
- Transaction at 23:59:59 on Sunday
- Transaction at 00:00:00 on Monday

**Expected Outcome**:
- Week boundaries correctly determined
- Transactions assigned to proper week

---

## 🧪 Edge Cases & Error Handling

### **Test Case 5.1: Large Transaction Volumes**

**Objective**: Verify system handles high volume data

**Test Data**:
- 10,000+ transactions in single week
- 1,000+ users
- Deep referral networks (10+ levels)

**Expected Outcome**:
- API responds within 30 seconds
- No timeout errors
- Correct calculations despite volume

---

### **Test Case 5.2: Decimal Precision Edge Cases**

**Objective**: Verify accurate money handling

**Test Scenarios**:
- Very small amounts (0.01, 0.001)
- Very large amounts (1,000,000.99)
- Repeating decimals (1/3 = 0.333...)
- Rounding edge cases (0.505, 0.515)

**Expected Outcome**:
- All values formatted to 2 decimals
- No rounding errors
- Consistent string formatting

---

### **Test Case 5.3: Concurrent Requests**

**Objective**: Verify thread safety

**Test Scenario**:
- Multiple users requesting /api/me simultaneously
- Admin calculating payouts while users query commissions
- Multiple finalization attempts

**Expected Outcome**:
- No race conditions
- Consistent data returned
- Proper locking mechanisms

---

### **Test Case 5.4: Invalid UUID Handling**

**Objective**: Verify graceful handling of malformed UUIDs

**Test Scenarios**:
- Non-UUID strings in user_id fields
- Null UUIDs
- Empty string UUIDs

**Expected Outcome**:
- Clear error messages
- No server crashes
- Status code 400

---

## 📊 Performance Benchmarks

### Response Time Targets:
- GET /api/me: < 100ms
- GET /api/commissions/current-week: < 200ms
- POST /api/admin/payouts/calculate: < 10s (for 1000 users)
- POST /api/admin/payouts/finalize: < 5s

### Load Testing:
- 100 concurrent users
- 1000 requests per minute
- 99th percentile < 2x target response time

---

## ✅ Test Execution Checklist

### Pre-Test:
- [ ] All edge functions deployed
- [ ] Test database populated
- [ ] Test users created
- [ ] Authentication tokens obtained

### During Test:
- [ ] Record all request/response pairs
- [ ] Monitor console logs
- [ ] Check database state after each test
- [ ] Verify no unexpected side effects

### Post-Test:
- [ ] Document all failures
- [ ] Clean up test data
- [ ] Update test cases based on findings
- [ ] Report issues to development team

---

## 🎯 Success Criteria

### Must Pass:
- ✅ All authentication tests (100%)
- ✅ All authorization tests (100%)
- ✅ All money formatting tests (100%)
- ✅ All camelCase convention tests (100%)

### Should Pass:
- ✅ 95%+ of integration tests
- ✅ 90%+ of edge case tests
- ✅ 100% of performance benchmarks

### Nice to Have:
- ✅ Load testing passes
- ✅ Stress testing passes
- ✅ All documentation accurate

---

## 📝 Test Report Template

```markdown
# API Test Execution Report

**Date**: _______________
**Tester**: _______________
**Environment**: _______________

## Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___
- Success Rate: ___%

## Failed Tests
1. Test Case ID: ___
   - Expected: ___
   - Actual: ___
   - Error: ___

## Performance Metrics
- Average Response Time: ___ms
- 95th Percentile: ___ms
- Max Response Time: ___ms

## Notes
___________________________
```

---

## 🔗 Related Documentation

- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Naming conventions
- [TEST_GUIDE.md](./TEST_GUIDE.md) - Database and UI testing
- [API Documentation](./supabase/functions/) - Edge function code
