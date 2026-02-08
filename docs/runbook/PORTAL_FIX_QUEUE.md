# Portal Fix Queue

> Last updated: 2026-02-06
> Ordered list of tasks to unblock Portal E2E functionality

## Priority Order

Tasks are ordered by dependency chain: **Auth -> Items -> RFQ -> Quote -> Order -> Invoice -> Payment**

---

## TIER 1: Core Flow Fixes (Do First)

### FIX-001: Add Buyer Confirm Delivery Endpoint

**Goal**: Allow buyers to confirm they received their order

**Files to Edit**:
- `server/src/routes/orderRoutes.ts`

**Endpoint**:
```
POST /api/orders/buyer/:id/confirm-delivery
```

**Expected Request**:
```json
{
  "rating": 5,  // optional
  "feedback": "Great service"  // optional
}
```

**Expected Response**:
```json
{
  "id": "order-uuid",
  "status": "delivered",
  "buyerConfirmedAt": "2026-02-06T..."
}
```

**How to Verify**:
1. Login as buyer
2. Navigate to Orders
3. Click "Confirm Delivery" on shipped order
4. Order status should update to "delivered"

---

### FIX-002: Align Order Creation Path

**Goal**: Frontend uses `/api/orders/from-rfq` but backend expects `/api/orders`

**Option A - Add Backend Aliases** (Recommended):

**Files to Edit**:
- `server/src/routes/orderRoutes.ts`

Add route aliases:
```typescript
// Alias for frontend compatibility
router.post('/from-rfq', requireAuth, async (req, res) => {
  req.body.source = 'rfq';
  // ... same handler as POST /
});

router.post('/direct', requireAuth, async (req, res) => {
  req.body.source = 'direct';
  // ... same handler as POST /
});
```

**Option B - Update Frontend** (Alternative):

**Files to Edit**:
- `src/features/portal/services/orderService.ts:278-315`

Change:
```typescript
// FROM
fetch(`${API_URL}/orders/from-rfq`, ...)
// TO
fetch(`${API_URL}/orders`, { body: JSON.stringify({ ...data, source: 'rfq' }) })
```

**How to Verify**:
1. Accept a quote as buyer
2. Check order is created in database
3. Check order appears in buyer orders list

---

## TIER 2: Analytics Endpoints (Important for Dashboards)

### FIX-003: Add Buyer Inventory Forecast Endpoint (Stub)

**Goal**: Prevent 404 errors, return empty data for now

**Files to Edit**:
- `server/src/routes/buyerWorkspaceRoutes.ts`

**Endpoint**:
```
GET /api/buyer/inventory/forecast
```

**Minimal Implementation**:
```typescript
router.get('/inventory/forecast', requireAuth, async (req: any, res) => {
  // Return empty array - feature pending implementation
  res.json([]);
});

router.get('/inventory/alerts', requireAuth, async (req: any, res) => {
  res.json([]);
});

router.post('/inventory/:id/simulate', requireAuth, async (req: any, res) => {
  res.json({
    currentUnitCost: 0,
    projectedUnitCost: 0,
    recommendedQty: 0,
    totalCost: 0,
    potentialSavings: 0,
    savingsPercent: 0,
    bestSupplier: null,
  });
});
```

**How to Verify**:
1. Navigate to Buyer Workspace -> Inventory
2. No 404 errors in console
3. Empty state shown (not error state)

---

### FIX-004: Add Buyer Expense Analytics Endpoints (Stub)

**Goal**: Prevent 404 errors for expense analytics

**Files to Edit**:
- `server/src/routes/buyerWorkspaceRoutes.ts`

**Endpoints**:
```
GET /api/buyer/expenses/enhanced-summary
GET /api/buyer/expenses/leakages
GET /api/buyer/expenses/price-drift
```

**Minimal Implementation**:
```typescript
router.get('/expenses/enhanced-summary', requireAuth, async (req: any, res) => {
  const basicSummary = await prisma.expense.aggregate({
    where: { buyerId: req.auth.userId },
    _sum: { amount: true },
  });

  res.json({
    monthlyTotal: basicSummary._sum.amount || 0,
    byCategory: [],
    leakages: [],
    priceDriftAlerts: [],
    budgetComparison: [],
    categoryInefficiencies: [],
    totalPotentialSavings: 0,
    healthScore: 100,
  });
});

router.get('/expenses/leakages', requireAuth, async (req: any, res) => {
  res.json([]);
});

router.get('/expenses/price-drift', requireAuth, async (req: any, res) => {
  res.json([]);
});
```

**How to Verify**:
1. Navigate to Buyer Workspace -> Expenses
2. No 404 errors in console
3. Dashboard shows empty analytics (not errors)

---

## TIER 3: Auth Header Consistency

### FIX-005: Standardize Auth Headers in Frontend Services

**Goal**: Use consistent Bearer token auth across all services

**Files to Edit**:
- `src/features/portal/services/orderTimelineService.ts`
- `src/features/portal/services/featureGatingService.ts`

**Change Pattern**:

```typescript
// FROM (legacy x-seller-id)
headers: {
  'x-seller-id': sellerId,
}

// TO (standard Bearer)
headers: {
  Authorization: `Bearer ${token}`,
}
```

**How to Verify**:
1. Open Network tab
2. Check all Portal API calls use `Authorization: Bearer ...` header
3. No `x-user-id` or `x-seller-id` headers (except where explicitly needed)

---

## TIER 4: Developer Experience Improvements (SAFE PATCHES)

### FIX-006: Add DEV-only Request Logging (Frontend)

**Goal**: See all API calls in browser console during development

**Files to Create**:
- `src/utils/devLogger.ts`

**Implementation**:
```typescript
// src/utils/devLogger.ts
const isDev = import.meta.env.DEV;

export function logApiCall(method: string, url: string, status: number, error?: string) {
  if (!isDev) return;

  const timestamp = new Date().toISOString().slice(11, 23);
  const statusColor = status >= 400 ? '\x1b[31m' : '\x1b[32m';

  console.log(
    `[${timestamp}] ${method.padEnd(6)} ${url} -> ${statusColor}${status}\x1b[0m${error ? ` (${error})` : ''}`
  );
}
```

**How to Verify**:
1. Open browser console
2. Navigate Portal pages
3. See logged API calls with method, URL, status

---

### FIX-007: Improve Frontend Error Display

**Goal**: Show actual error messages in dev mode

**Files to Edit**:
- `src/features/portal/context/NotificationContext.tsx` (or equivalent)

**Pattern**:
```typescript
// In error handlers
if (import.meta.env.DEV) {
  showNotification({
    type: 'error',
    message: `API Error: ${error.message || response.statusText}`,
    details: JSON.stringify(errorBody),
  });
} else {
  showNotification({
    type: 'error',
    message: 'Something went wrong. Please try again.',
  });
}
```

**How to Verify**:
1. Trigger API error (e.g., invalid data)
2. See detailed error message in dev
3. See generic message in production build

---

### FIX-008: Add Server Port Conflict Handling

**Goal**: Better UX when port 3001 is in use

**Files to Edit**:
- `server/src/index.ts`

**Change** (around line 586):
```typescript
// Before listen, check port availability
import { createServer } from 'net';

const checkPort = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
};

// In startup
const isPortAvailable = await checkPort(PORT);
if (!isPortAvailable) {
  appLogger.error(`Port ${PORT} is in use. Try: PORT=${PORT + 1} pnpm dev`);
  process.exit(1);
}

httpServer.listen(PORT, () => {
  appLogger.info(`NABD API running on port ${PORT}`);
});
```

**How to Verify**:
1. Run server on port 3001
2. Try to run another instance
3. See clear error message with suggested fix

---

## Quick Reference: File Locations

| Fix | Primary File |
|-----|--------------|
| FIX-001 | `server/src/routes/orderRoutes.ts` |
| FIX-002 | `server/src/routes/orderRoutes.ts` OR `src/features/portal/services/orderService.ts` |
| FIX-003 | `server/src/routes/buyerWorkspaceRoutes.ts` |
| FIX-004 | `server/src/routes/buyerWorkspaceRoutes.ts` |
| FIX-005 | `src/features/portal/services/orderTimelineService.ts`, `featureGatingService.ts` |
| FIX-006 | `src/utils/devLogger.ts` (new file) |
| FIX-007 | `src/features/portal/context/NotificationContext.tsx` |
| FIX-008 | `server/src/index.ts` |

---

## Estimated Effort

| Fix | Complexity | Lines of Code |
|-----|------------|---------------|
| FIX-001 | Low | ~30 |
| FIX-002 | Low | ~10 |
| FIX-003 | Low | ~25 |
| FIX-004 | Low | ~40 |
| FIX-005 | Low | ~20 |
| FIX-006 | Low | ~15 |
| FIX-007 | Low | ~20 |
| FIX-008 | Low | ~20 |

**Total**: ~180 lines of code across 8 fixes
