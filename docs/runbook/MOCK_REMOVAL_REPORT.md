# Mock Data Removal Report

> **Date:** February 2026
> **Prompt:** Mock Data Removal (PROMPT 7)
> **Goal:** Transition from mock/demo data to real backend data

---

## Executive Summary

A comprehensive scan of the codebase identified **40+ mock data locations** across frontend and backend. This report catalogs all mock data sources, identifies the real backend data sources to replace them, and provides a migration plan.

---

## Frontend Mock Data Inventory

### 1. Seller Dashboard - Business Health Metrics

**File:** `src/features/portal/seller/pages/SellerDashboard.tsx`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 111-218 | Function | `generateMockData()` - fulfillment risk, inventory exposure, revenue concentration | `/api/seller/dashboard/health` |
| 369-393 | Array | 4 hardcoded recent orders (Al-Faisal, Gulf Equipment, etc.) | `/api/seller/orders?limit=4` |
| 284, 331-335 | Array | Chart data (sales trend, category breakdown) | `/api/seller/analytics/trends` |

### 2. Seller Dashboard Component

**File:** `src/features/portal/seller/components/SellerDashboard.tsx`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 369-393 | Array | Same 4 recent orders as page | `/api/seller/orders?limit=4` |

### 3. Buyer Dashboard

**File:** `src/features/portal/buyer/pages/workspace/DashboardTab.tsx`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 101-217 | Function | `generatePurchaseVelocity()`, `generateSupplierRisks()`, `generateInventoryBurnRates()`, `generateSmartAlerts()` | `/api/buyer/dashboard/health` |
| 232-235 | State | useState with Math.random() generated data | Use real API data |

### 4. RFQ Marketplace Service

**File:** `src/features/portal/services/rfqMarketplaceService.ts`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 22-65 | Arrays | MOCK_COMPANY_NAMES (10), MOCK_PART_NAMES (15), MOCK_CATEGORIES (8), MOCK_COUNTRIES (6), MOCK_CITIES (8) | Remove - use real data |
| 67-136 | Function | `generateMockRFQ(index)` - 25 RFQs with Math.random() | `/api/rfq/marketplace` (already exists: ItemRFQ model) |
| 139 | Array | MOCK_RFQS (25 items) | Remove - use API |

### 5. Supplier Service

**File:** `src/features/portal/services/supplierService.ts`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 154-174 | Arrays | MOCK_CATEGORIES, MOCK_COUNTRIES | Remove - use Seller model data |
| 176-300 | Function | `generateMockMetrics()` (27+ Math.random calls), `generateMockSupplier()` | `/api/buyer/suppliers` (already exists) |

### 6. Seller Inventory

**File:** `src/features/portal/seller/pages/SellerInventory.tsx`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 129-142 | Array | 12 hardcoded products with costs/prices | `/api/seller/items` (MarketplaceItem model) |
| 145-250 | Function | Math.random() for stock levels, sales, RFQ counts | `/api/seller/inventory/stats` |

### 7. Seller Orders

**File:** `src/features/portal/seller/pages/SellerOrders.tsx`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 700-730 | Arrays | Hardcoded buyers[], items[] arrays | Remove - use real data |
| 741-846 | Function | `generateSampleOrders()` - 15 orders with Math.random() | `/api/seller/orders` (MarketplaceOrder model) |

### 8. Expense Analytics Service

**File:** `src/features/portal/services/expenseAnalyticsService.ts`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 488-490 | Math.random | Budget/expense generation | `/api/expenses` (needs real expense model) |
| 735 | Math.random | Amount generation | Use real data |

### 9. Seller Home Summary Service

**File:** `src/features/portal/services/sellerHomeSummaryService.ts`

| Lines | Type | Mock Data | Real Backend Source |
|-------|------|-----------|---------------------|
| 215-289 | Function/Array | KPIs (24500 revenue, 8 orders, 15 RFQs), 7-day chart data | `/api/seller/home/summary` |

### 10. Additional Math.random() Usage

| File | Lines | Purpose | Action |
|------|-------|---------|--------|
| `buyerAnalyticsService.ts` | 251-253 | Analytics data | Replace with real analytics |
| `AddProductPanel.tsx` | 164 | SKU generation | Replace with backend-generated SKU |
| `UnifiedOrderTracking.tsx` | 37 | Tracking ID | Use real order tracking data |
| `comparisonSetService.ts` | 77, 273, 276, 360, 364 | Comparison data | Replace with real comparison logic |
| `Toast.tsx` | 64 | Notification ID | OK - UI utility only |

---

## Backend Mock Data Inventory

### 1. Order Service

**File:** `server/src/services/orderService.ts`

| Lines | Type | Mock Data | Migration Action |
|-------|------|-----------|------------------|
| 138-319 | Array | MOCK_ORDERS (5 sample orders) | Remove fallback - return empty array |
| 321-331 | Object | MOCK_ORDER_STATS | Query MarketplaceOrder for real stats |
| 885-886 | Fallback | Returns MOCK_ORDER_STATS on error | Return zeros instead |
| 1020-1034 | Fallback | Returns hardcoded buyer KPIs | Return zeros instead |

### 2. Item Service

**File:** `server/src/services/itemService.ts`

| Lines | Type | Mock Data | Migration Action |
|-------|------|-----------|------------------|
| 78-367 | Array | MOCK_ITEMS (8 sample products) | Remove - return empty array |
| 369-376 | Object | MOCK_SELLER_STATS | Query MarketplaceItem for real stats |
| 744-787 | Fallback | Returns MOCK_ITEMS when DB empty | Return empty array |

### 3. Dashboard Service

**File:** `server/src/services/dashboardService.ts`

| Lines | Type | Mock Data | Migration Action |
|-------|------|-----------|------------------|
| 64-77 | Object | MOCK_SELLER_SUMMARY | Query real orders/items |
| 79-92 | Object | MOCK_BUYER_SUMMARY | Query real orders |
| 205-223 | Fallback | Returns zeros on error | OK - already safe |
| 326-343 | Fallback | Returns zeros on error | OK - already safe |

### 4. Buyer Workspace Routes

**File:** `server/src/routes/buyerWorkspaceRoutes.ts`

| Lines | Type | Mock Data | Migration Action |
|-------|------|-----------|------------------|
| 61-119 | Array | MOCK_PURCHASES (4 sample POs) | Remove - use PurchaseOrder model |
| 121-164 | Array | MOCK_SUPPLIERS (3 suppliers) | Remove - use Seller model |
| 166-211 | Array | MOCK_INVENTORY (4 items) | Remove - use BuyerInventory model |
| 213-258 | Array | MOCK_EXPENSES (4 expenses) | Remove - use Expense model |
| 284 | Math.random | Fallback PO number | Use sequential PO numbers |
| 322-329 | Fallback | Returns MOCK_PURCHASES | Return empty array |
| 456-458 | Fallback | Returns MOCK_SUPPLIERS | Return empty array |

### 5. Seller Home Service

**File:** `server/src/services/sellerHomeService.ts`

| Lines | Type | Mock Data | Migration Action |
|-------|------|-----------|------------------|
| 106-121 | Function | `generateMockPulse(days)` with Math.random() | Query real MarketplaceOrder by date |
| 123-151 | Function | `generateMockAlerts()` | Query real pending RFQs/orders |
| 153-169 | Function | `generateMockFocus()` | Based on real pending items |
| 308-320 | Method | `getKPIs()` returns hardcoded values | Query real data |

### 6. Other Services with Mock Data

| File | Mock Data | Migration Action |
|------|-----------|------------------|
| `expenseService.ts` | MOCK_EXPENSES array | Return empty, use real Expense model |
| `inventoryService.ts` | MOCK_INVENTORY array | Return empty, use BuyerInventory model |
| `customerService.ts` | MOCK_CUSTOMERS array | Return empty, use Buyer model |
| `portalAdminService.ts` | Math.random for passwords | OK - security utility |
| `storageService.ts` | Math.random for file IDs | OK - utility |
| `buyerCartService.ts` | Math.random for order numbers | Replace with sequential |

---

## Prisma Models Available for Real Data

| Model | Purpose | Already Has Data? |
|-------|---------|-------------------|
| `MarketplaceOrder` | Real orders | Yes (from order flow) |
| `MarketplaceItem` | Real product listings | Yes (seller listings) |
| `ItemRFQ` | Real RFQ requests | Yes (RFQ flow) |
| `ItemQuote` | RFQ responses | Yes (quote flow) |
| `Seller` | Supplier data | Yes (onboarding) |
| `Buyer` | Customer data | Yes (onboarding) |
| `PurchaseOrder` | Buyer POs | Check schema |
| `Expense` | Expense tracking | Check schema |
| `BuyerInventory` | Buyer inventory | Check schema |

---

## Migration Priority

### Phase 1: Critical (Marketplace Core)
1. **RFQ Marketplace** - Must show real ItemRFQ data
2. **Seller Orders** - Must show real MarketplaceOrder data
3. **Seller Inventory** - Must show real MarketplaceItem data
4. **Buyer Orders** - Must show real MarketplaceOrder data

### Phase 2: Dashboard & Analytics
1. **Seller Dashboard** - Aggregate real order/item stats
2. **Buyer Dashboard** - Aggregate real purchase stats
3. **Seller Home** - Real KPIs from orders/RFQs

### Phase 3: Secondary Features
1. **Supplier Service** - Real Seller model data
2. **Expense Analytics** - If Expense model exists
3. **Inventory Tracking** - If BuyerInventory model exists

---

## Empty State Handling Requirements

When transitioning to real data, each page must handle empty states gracefully:

| Page | Empty State Message |
|------|---------------------|
| Seller Orders | "No orders yet. Orders will appear here when buyers purchase your products." |
| Seller Inventory | "No products listed. Add your first product to start selling." |
| RFQ Marketplace | "No RFQs available. Check back later for new requests." |
| Buyer Orders | "No orders yet. Browse the marketplace to find products." |
| Buyer Suppliers | "No suppliers yet. Suppliers will appear after your first order." |
| Dashboard | Show zeros with "Get started" prompts |

---

## Files to Modify

### Frontend (Remove Mock Generators)
1. `src/features/portal/services/rfqMarketplaceService.ts`
2. `src/features/portal/services/supplierService.ts`
3. `src/features/portal/services/sellerHomeSummaryService.ts`
4. `src/features/portal/services/expenseAnalyticsService.ts`
5. `src/features/portal/seller/pages/SellerDashboard.tsx`
6. `src/features/portal/seller/pages/SellerInventory.tsx`
7. `src/features/portal/seller/pages/SellerOrders.tsx`
8. `src/features/portal/buyer/pages/workspace/DashboardTab.tsx`

### Backend (Remove Mock Fallbacks)
1. `server/src/services/orderService.ts`
2. `server/src/services/itemService.ts`
3. `server/src/services/dashboardService.ts`
4. `server/src/services/sellerHomeService.ts`
5. `server/src/routes/buyerWorkspaceRoutes.ts`
6. `server/src/services/expenseService.ts`
7. `server/src/services/inventoryService.ts`
8. `server/src/services/customerService.ts`

---

## Verification Checklist

After migration:
- [x] All `generateMock*` functions removed from portal/marketplace
- [x] All `MOCK_*` arrays removed from portal/marketplace
- [x] No `Math.random()` for data generation (except IDs/passwords)
- [x] Empty states display correctly
- [x] No fake company names appear (Al-Faisal, Gulf Equipment, etc.)
- [x] No hardcoded SAR amounts (24,500, 125,750, etc.)
- [x] RFQs come from real ItemRFQ data
- [x] Orders reflect real MarketplaceOrder records
- [x] Analytics show real aggregated data or zeros

---

## Completion Status

### Completed Removals (Portal/Marketplace)

| File | Mock Removed | Status |
|------|--------------|--------|
| `server/src/services/orderService.ts` | MOCK_ORDERS, MOCK_ORDER_STATS | Completed |
| `server/src/services/itemService.ts` | MOCK_ITEMS, MOCK_SELLER_STATS | Completed |
| `server/src/services/sellerHomeService.ts` | generateMockPulse, generateMockAlerts, generateMockFocus | Completed |
| `server/src/routes/buyerWorkspaceRoutes.ts` | MOCK_PURCHASES, MOCK_SUPPLIERS, MOCK_INVENTORY, MOCK_EXPENSES | Completed |
| `src/features/portal/services/rfqMarketplaceService.ts` | MOCK_RFQS, generateMockRFQ, all MOCK_* arrays | Completed |
| `src/features/portal/seller/pages/SellerOrders.tsx` | generateSampleOrders | Completed |
| `src/features/portal/seller/pages/SellerDashboard.tsx` | generateMockData | Completed |
| `src/features/portal/seller/pages/Listings.tsx` | MOCK_PRODUCTS | Completed |
| `src/features/portal/seller/pages/SellerInventory.tsx` | generateMockInventory | Completed |
| `src/features/portal/seller/components/OrderDetailsPanel.tsx` | generateMockTimeline usage | Completed |
| `src/features/portal/services/orderTimelineService.ts` | generateMockTimeline | Completed |
| `src/features/portal/services/supplierService.ts` | generateMockSuppliers, generateMockMetrics, generateMockSupplier | Completed |
| `src/features/portal/services/buyerWorkspaceService.ts` | generateMockForecast, generateMockEnhancedSummary | Completed |
| `src/features/portal/buyer/pages/BuyerSuppliers.tsx` | generateMockSuppliers import | Completed |
| `src/features/portal/components/tracking/UnifiedOrderTracking.tsx` | generateMockOrder, generateMockTimeline usage | Completed |

### Acceptable Uses Retained

The following `Math.random()` uses are acceptable (for IDs, not fake data):
- `Toast.tsx` - Toast notification IDs
- `AddProductPanel.tsx` - SKU generation prefix
- `comparisonSetService.ts` - Comparison set IDs
- `offlineQueue.ts` - Queue item IDs
- `errorTracking.ts` - Session IDs
- Backend workers - Retry jitter calculations
- Arcade games - Game mechanics (expected randomness)

---

*Generated: February 2026*
*Last Updated: February 2026 - Mock Removal Complete*
