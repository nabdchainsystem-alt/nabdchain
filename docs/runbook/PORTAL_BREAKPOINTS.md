# Portal Breakpoints

> Last updated: 2026-02-06
> Critical issues blocking Portal E2E functionality

## Breakpoint Categories

| Category | Count | Severity |
|----------|-------|----------|
| Missing Backend Endpoints | 6 | HIGH |
| Path Mismatches | 3 | MEDIUM |
| Auth Wiring Issues | 2 | MEDIUM |
| Mock Fallback Still Used | 4 | LOW |

---

## RED LIST - Missing Backend Endpoints

### 1. Buyer Inventory Forecast Endpoints (MISSING)

**Frontend Service**: `buyerWorkspaceService.ts:470-523`

| Frontend Call | Expected Endpoint | Backend Status |
|---------------|-------------------|----------------|
| `getInventoryWithForecast()` | GET `/api/buyer/inventory/forecast` | NOT IMPLEMENTED |
| `getInventoryAlerts()` | GET `/api/buyer/inventory/alerts` | NOT IMPLEMENTED |
| `simulateCostImpact()` | POST `/api/buyer/inventory/:id/simulate` | NOT IMPLEMENTED |

**Current Behavior**: Returns empty array `[]` silently (no error thrown)

**File References**:
- Frontend: `src/features/portal/services/buyerWorkspaceService.ts:470-523`
- Backend: `server/src/routes/buyerWorkspaceRoutes.ts` - endpoints not defined

**Impact**: Buyer inventory dashboard shows no forecasting data

---

### 2. Buyer Expense Analytics Endpoints (MISSING)

**Frontend Service**: `buyerWorkspaceService.ts:529-573`

| Frontend Call | Expected Endpoint | Backend Status |
|---------------|-------------------|----------------|
| `getEnhancedExpenseSummary()` | GET `/api/buyer/expenses/enhanced-summary` | NOT IMPLEMENTED |
| `getSpendLeakages()` | GET `/api/buyer/expenses/leakages` | NOT IMPLEMENTED |
| `getPriceDriftAlerts()` | GET `/api/buyer/expenses/price-drift` | NOT IMPLEMENTED |

**Current Behavior**:
- `getEnhancedExpenseSummary()` falls back to basic summary + empty analytics arrays
- Other methods return empty arrays `[]`

**File References**:
- Frontend: `src/features/portal/services/buyerWorkspaceService.ts:529-573`
- Backend: `server/src/routes/buyerWorkspaceRoutes.ts` - endpoints not defined

**Impact**: Expense analytics dashboard incomplete

---

### 3. Buyer Confirm Delivery Endpoint (MISSING)

**Frontend Service**: `orderService.ts:341-353`

| Frontend Call | Expected Endpoint | Backend Status |
|---------------|-------------------|----------------|
| `confirmDelivery()` | POST `/api/orders/buyer/:id/confirm-delivery` | NOT IMPLEMENTED |

**Current Behavior**: Throws error "Failed to confirm delivery"

**File References**:
- Frontend: `src/features/portal/services/orderService.ts:341-353`
- Backend: `server/src/routes/orderRoutes.ts` - endpoint not defined

**Note**: Backend has `/api/orders/seller/:id/deliver` but buyer-side confirm endpoint is missing

---

## YELLOW LIST - Path Mismatches

### 1. Order Creation Path Mismatch

**Frontend Service**: `orderService.ts:278-315`

| Frontend Call | Frontend Path | Backend Path | Issue |
|---------------|---------------|--------------|-------|
| `createOrderFromRFQ()` | POST `/api/orders/from-rfq` | POST `/api/orders` | Different path |
| `createDirectOrder()` | POST `/api/orders/direct` | POST `/api/orders` | Different path |

**Backend Handler**: `server/src/routes/orderRoutes.ts` - uses unified POST `/api/orders` with body params to differentiate

**Fix**: Either update frontend to use `/api/orders` or add route aliases in backend

---

### 2. Comparison Scoring Path Prefix Missing

**Frontend Service**: `compareScoringService.ts`

| Frontend Call | Frontend Path | Expected Backend |
|---------------|---------------|------------------|
| `calculateRecommendation()` | POST `/api/compare/score` | Not mounted |
| `scoreManualCompare()` | POST `/api/compare/manual` | Not mounted |

**Backend Status**: No `/api/compare` routes mounted in `server/src/index.ts`

**Impact**: Compare scoring features may be client-side only

---

## AUTH WIRING ISSUES

### 1. Mixed Auth Headers in Services

Some services use different auth patterns inconsistently:

| Service | Auth Pattern | Expected |
|---------|--------------|----------|
| `orderTimelineService.ts` | `x-seller-id` header | Bearer token |
| `featureGatingService.ts` | `x-user-id` header | Bearer token or portal JWT |
| `portalAdminService.ts` | Both `x-user-id` + Bearer | Should be portal JWT only |

**File References**:
- `src/features/portal/services/orderTimelineService.ts:24-27`
- `src/features/portal/services/featureGatingService.ts:20-25`
- `src/features/portal/services/portalAdminService.ts:20-30`

**Impact**: Requests may fail if wrong auth pattern used

---

### 2. Token Refresh Edge Cases

**Frontend**: `portalAuthService.ts:266-313`

**Issue**: `authenticatedFetch()` doesn't handle all 4xx errors gracefully

| Status Code | Current Handling | Expected |
|-------------|------------------|----------|
| 401 | Refresh + retry | OK |
| 403 | Checks for ACCOUNT_SUSPENDED | Should also check TOKEN_INVALID |
| 400 | Not handled | Should surface error to UI |

---

## MOCK FALLBACK LIST

Services that still have fallback/mock behavior (not breaking, but masks issues):

### 1. sellerAnalyticsService.ts

**Location**: `src/features/portal/services/sellerAnalyticsService.ts`

Has `getMockAnalyticsSummary()` function that generates fake data.

**Status**: Function exists but may not be called - needs verification

---

### 2. buyerWorkspaceService.ts - Silent Empty Returns

**Location**: `src/features/portal/services/buyerWorkspaceService.ts:482-497`

```typescript
if (!response.ok) {
  // Return empty array - API endpoint not available
  return [];
}
```

**Impact**: UI shows empty state instead of error - user doesn't know API failed

---

### 3. rfqMarketplaceService.ts - Silent Error Handling

**Location**: `src/features/portal/services/rfqMarketplaceService.ts`

Returns empty objects/arrays on errors instead of throwing.

---

### 4. compareScoringService.ts - Client-Side Fallback

**Status**: May calculate scores client-side if backend unavailable - needs verification

---

## Runtime Verification Checklist

To verify these breakpoints, run both servers and test:

### Server Startup Check
```bash
# Terminal 1 - Backend
cd server && pnpm dev
# Expected: "NABD API running on port 3001"

# Terminal 2 - Frontend
pnpm dev
# Expected: Vite server on port 5173
```

### Endpoint Tests (curl)

```bash
# 1. Auth - Should work
curl http://localhost:3001/api/auth/portal/check-email?email=test@test.com

# 2. Items (requires token) - Should return 401 without token
curl http://localhost:3001/api/items

# 3. Missing endpoint - Should return 404
curl http://localhost:3001/api/buyer/inventory/forecast

# 4. Missing endpoint - Should return 404
curl http://localhost:3001/api/buyer/expenses/enhanced-summary
```

### Browser Console Check

Navigate to Portal pages and check Network tab for:
- 404 errors (missing endpoints)
- 401/403 errors (auth issues)
- Empty responses that should have data

---

## Port Conflict Handling

If server fails with `EADDRINUSE`:

```bash
# Find process using port 3001
lsof -i :3001

# Expected output shows PID
# Kill process if needed
kill -9 <PID>
```

**Note**: Server already supports `PORT` env override:
```bash
PORT=3002 pnpm dev
```
