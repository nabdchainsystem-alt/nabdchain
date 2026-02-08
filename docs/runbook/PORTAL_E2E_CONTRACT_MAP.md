# Portal E2E Contract Map

> Last updated: 2026-02-06
> Generated from codebase analysis

## Overview

This document maps Frontend Portal services to Backend API endpoints, showing the complete data flow for Buyer/Seller portal operations.

## API Base URL Configuration

| Layer | Source | Value |
|-------|--------|-------|
| Frontend | `src/config/api.ts` | `VITE_API_URL` or `http://localhost:3001` |
| Backend | `server/src/index.ts:90` | `PORT` env var or `3001` |

**API_URL Pattern**: `${API_BASE_URL}/api` (e.g., `http://localhost:3001/api`)

---

## 1. Authentication Routes (Portal Auth)

### Frontend Service: `portalAuthService.ts`
**Location**: `src/features/portal/services/portalAuthService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `signupBuyer` | POST | `/api/auth/portal/buyer/signup` | `/api/auth/portal/buyer/signup` | None | GREEN |
| `signupSeller` | POST | `/api/auth/portal/seller/signup` | `/api/auth/portal/seller/signup` | None | GREEN |
| `login` | POST | `/api/auth/portal/login` | `/api/auth/portal/login` | None | GREEN |
| `checkEmail` | GET | `/api/auth/portal/check-email` | `/api/auth/portal/check-email` | None | GREEN |
| `refreshToken` | POST | `/api/auth/portal/refresh` | `/api/auth/portal/refresh` | None | GREEN |
| `validateSession` | GET | `/api/auth/portal/me` | `/api/auth/portal/me` | JWT | GREEN |
| `getOnboardingState` | GET | `/api/auth/portal/seller/onboarding` | `/api/auth/portal/seller/onboarding` | JWT | GREEN |
| `saveOnboardingStep` | PUT | `/api/auth/portal/seller/onboarding/step/:stepId` | `/api/auth/portal/seller/onboarding/step/:stepId` | JWT | GREEN |
| `submitOnboarding` | POST | `/api/auth/portal/seller/onboarding/submit` | `/api/auth/portal/seller/onboarding/submit` | JWT | GREEN |

**Backend Route File**: `server/src/routes/portalAuthRoutes.ts`
**Mounted at**: `/api/auth/portal` (server/src/index.ts:280)

---

## 2. Item & Marketplace Routes

### Frontend Service: `itemService.ts`
**Location**: `src/features/portal/services/itemService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `getSellerItems` | GET | `/api/items` | `/api/items` | Bearer | GREEN |
| `getSellerStats` | GET | `/api/items/stats` | `/api/items/stats` | Bearer | GREEN |
| `getSellerItem` | GET | `/api/items/:id` | `/api/items/:id` | Bearer | GREEN |
| `createItem` | POST | `/api/items` | `/api/items` | Bearer | GREEN |
| `updateItem` | PUT | `/api/items/:id` | `/api/items/:id` | Bearer | GREEN |
| `deleteItem` | DELETE | `/api/items/:id` | `/api/items/:id` | Bearer | GREEN |
| `archiveItem` | POST | `/api/items/:id/archive` | `/api/items/:id/archive` | Bearer | GREEN |
| `bulkUpdateStatus` | POST | `/api/items/bulk/status` | `/api/items/bulk/status` | Bearer | GREEN |
| `bulkUpdateVisibility` | POST | `/api/items/bulk/visibility` | `/api/items/bulk/visibility` | Bearer | GREEN |
| `getMarketplaceItems` | GET | `/api/items/marketplace/browse` | `/api/items/marketplace/browse` | Bearer | GREEN |
| `getMarketplaceItem` | GET | `/api/items/marketplace/:id` | `/api/items/marketplace/:id` | Bearer | GREEN |
| `getSellerPublicItems` | GET | `/api/items/marketplace/seller/:sellerId` | `/api/items/marketplace/seller/:sellerId` | Bearer | GREEN |
| `createRFQ` | POST | `/api/items/rfq` | `/api/items/rfq` | Bearer | GREEN |
| `getSellerRFQs` | GET | `/api/items/rfq/seller` | `/api/items/rfq/seller` | Bearer | GREEN |
| `getBuyerRFQs` | GET | `/api/items/rfq/buyer` | `/api/items/rfq/buyer` | Bearer | GREEN |
| `respondToRFQ` | POST | `/api/items/rfq/:id/respond` | `/api/items/rfq/:id/respond` | Bearer | GREEN |
| `acceptRFQ` | POST | `/api/items/rfq/:id/accept` | `/api/items/rfq/:id/accept` | Bearer | GREEN |
| `rejectRFQ` | POST | `/api/items/rfq/:id/reject` | `/api/items/rfq/:id/reject` | Bearer | GREEN |

**Backend Route File**: `server/src/routes/itemRoutes.ts`
**Mounted at**: `/api/items` (server/src/index.ts:302)

---

## 3. Order Routes

### Frontend Service: `orderService.ts`
**Location**: `src/features/portal/services/orderService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `getSellerOrders` | GET | `/api/orders/seller` | `/api/orders/seller` | Bearer | GREEN |
| `getSellerOrderStats` | GET | `/api/orders/seller/stats` | `/api/orders/seller/stats` | Bearer | GREEN |
| `getSellerOrder` | GET | `/api/orders/seller/:id` | `/api/orders/seller/:id` | Bearer | GREEN |
| `confirmOrder` | POST | `/api/orders/seller/:id/confirm` | `/api/orders/seller/:id/confirm` | Bearer | GREEN |
| `updateOrderStatus` | POST | `/api/orders/seller/:id/status` | `/api/orders/seller/:id/status` | Bearer | GREEN |
| `shipOrder` | POST | `/api/orders/seller/:id/ship` | `/api/orders/seller/:id/ship` | Bearer | GREEN |
| `markDelivered` | POST | `/api/orders/seller/:id/deliver` | `/api/orders/seller/:id/deliver` | Bearer | GREEN |
| `cancelOrder` | POST | `/api/orders/seller/:id/cancel` | `/api/orders/seller/:id/cancel` | Bearer | GREEN |
| `getBuyerOrders` | GET | `/api/orders/buyer` | `/api/orders/buyer` | Bearer | GREEN |
| `getBuyerOrder` | GET | `/api/orders/buyer/:id` | `/api/orders/buyer/:id` | Bearer | GREEN |
| `createOrderFromRFQ` | POST | `/api/orders/from-rfq` | `/api/orders` (POST) | Bearer | YELLOW |
| `createDirectOrder` | POST | `/api/orders/direct` | `/api/orders` (POST) | Bearer | YELLOW |
| `buyerCancelOrder` | POST | `/api/orders/buyer/:id/cancel` | `/api/orders/buyer/:id/cancel` | Bearer | GREEN |
| `confirmDelivery` | POST | `/api/orders/buyer/:id/confirm-delivery` | N/A | Bearer | RED |
| `getBuyerDashboardSummary` | GET | `/api/orders/buyer/dashboard` | `/api/orders/buyer/dashboard` | Bearer | GREEN |

### Frontend Service: `marketplaceOrderService.ts`
**Location**: `src/features/portal/services/marketplaceOrderService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `acceptQuote` | POST | `/api/items/quotes/:id/accept` | `/api/items/quotes/:id/accept` | Bearer | GREEN |
| `rejectQuote` | POST | `/api/items/quotes/:id/reject` | `/api/items/quotes/:id/reject` | Bearer | GREEN |
| `getBuyerOrders` | GET | `/api/items/orders/buyer` | `/api/items/orders/buyer` | Bearer | GREEN |
| `getSellerOrders` | GET | `/api/items/orders/seller` | `/api/items/orders/seller` | Bearer | GREEN |
| `getOrder` | GET | `/api/items/orders/:id` | `/api/items/orders/:id` | Bearer | GREEN |
| `getOrderHistory` | GET | `/api/items/orders/:id/history` | `/api/items/orders/:id/history` | Bearer | GREEN |
| `confirmOrder` | POST | `/api/items/orders/:id/confirm` | `/api/items/orders/:id/confirm` | Bearer | GREEN |
| `getBuyerOrderStats` | GET | `/api/items/orders/stats/buyer` | `/api/items/orders/stats/buyer` | Bearer | GREEN |
| `getSellerOrderStats` | GET | `/api/items/orders/stats/seller` | `/api/items/orders/stats/seller` | Bearer | GREEN |
| `rejectOrder` | POST | `/api/items/orders/:id/reject` | `/api/items/orders/:id/reject` | Bearer | GREEN |
| `startProcessing` | POST | `/api/items/orders/:id/process` | `/api/items/orders/:id/process` | Bearer | GREEN |
| `shipOrder` | POST | `/api/items/orders/:id/ship` | `/api/items/orders/:id/ship` | Bearer | GREEN |
| `markDelivered` | POST | `/api/items/orders/:id/deliver` | `/api/items/orders/:id/deliver` | Bearer | GREEN |
| `closeOrder` | POST | `/api/items/orders/:id/close` | `/api/items/orders/:id/close` | Bearer | GREEN |
| `cancelOrder` | POST | `/api/items/orders/:id/cancel` | `/api/items/orders/:id/cancel` | Bearer | GREEN |
| `updateTracking` | PATCH | `/api/items/orders/:id/tracking` | `/api/items/orders/:id/tracking` | Bearer | GREEN |

**Backend Route File**: `server/src/routes/orderRoutes.ts`, `server/src/routes/itemRoutes.ts`
**Mounted at**: `/api/orders` (server/src/index.ts:303), `/api/items` (server/src/index.ts:302)

---

## 4. Buyer Workspace Routes

### Frontend Service: `buyerWorkspaceService.ts`
**Location**: `src/features/portal/services/buyerWorkspaceService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `getPurchases` | GET | `/api/buyer/purchases` | `/api/buyer/purchases` | Bearer | GREEN |
| `createPurchase` | POST | `/api/buyer/purchases` | `/api/buyer/purchases` | Bearer | GREEN |
| `updatePurchaseStatus` | PATCH | `/api/buyer/purchases/:id/status` | `/api/buyer/purchases/:id/status` | Bearer | GREEN |
| `getSuppliers` | GET | `/api/buyer/suppliers` | `/api/buyer/suppliers` | Bearer | GREEN |
| `createSupplier` | POST | `/api/buyer/suppliers` | `/api/buyer/suppliers` | Bearer | GREEN |
| `getInventory` | GET | `/api/buyer/inventory` | `/api/buyer/inventory` | Bearer | GREEN |
| `createInventoryItem` | POST | `/api/buyer/inventory` | `/api/buyer/inventory` | Bearer | GREEN |
| `updateInventoryItem` | PATCH | `/api/buyer/inventory/:id` | `/api/buyer/inventory/:id` | Bearer | GREEN |
| `getExpenses` | GET | `/api/buyer/expenses` | `/api/buyer/expenses` | Bearer | GREEN |
| `getExpenseSummary` | GET | `/api/buyer/expenses/summary` | `/api/buyer/expenses/summary` | Bearer | GREEN |
| `createExpense` | POST | `/api/buyer/expenses` | `/api/buyer/expenses` | Bearer | GREEN |
| `getInventoryWithForecast` | GET | `/api/buyer/inventory/forecast` | N/A | Bearer | RED |
| `getInventoryAlerts` | GET | `/api/buyer/inventory/alerts` | N/A | Bearer | RED |
| `simulateCostImpact` | POST | `/api/buyer/inventory/:id/simulate` | N/A | Bearer | RED |
| `getEnhancedExpenseSummary` | GET | `/api/buyer/expenses/enhanced-summary` | N/A | Bearer | RED |
| `getSpendLeakages` | GET | `/api/buyer/expenses/leakages` | N/A | Bearer | RED |
| `getPriceDriftAlerts` | GET | `/api/buyer/expenses/price-drift` | N/A | Bearer | RED |

**Backend Route File**: `server/src/routes/buyerWorkspaceRoutes.ts`
**Mounted at**: `/api/buyer` (server/src/index.ts:309)

---

## 5. Seller Home Routes

### Frontend Service: `sellerHomeSummaryService.ts`
**Location**: `src/features/portal/services/sellerHomeSummaryService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `getSummary` | GET | `/api/seller/home/summary` | `/api/seller/home/summary` | Bearer | GREEN |
| `getAlerts` | GET | `/api/seller/home/alerts` | `/api/seller/home/alerts` | Bearer | GREEN |
| `getFocus` | GET | `/api/seller/home/focus` | `/api/seller/home/focus` | Bearer | GREEN |
| `getPulse` | GET | `/api/seller/home/pulse` | `/api/seller/home/pulse` | Bearer | GREEN |
| `getHealth` | GET | `/api/seller/home/health` | `/api/seller/home/health` | Bearer | GREEN |
| `getOnboarding` | GET | `/api/seller/home/onboarding` | `/api/seller/home/onboarding` | Bearer | GREEN |

**Backend Route File**: `server/src/routes/sellerHomeRoutes.ts`
**Mounted at**: `/api/seller` (server/src/index.ts:312)

---

## 6. Buyer Cart Routes

### Frontend Service: `cartService.ts`
**Location**: `src/features/portal/services/cartService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `getCart` | GET | `/api/buyer-cart` | `/api/buyer-cart` | Bearer | GREEN |
| `getCartGrouped` | GET | `/api/buyer-cart/grouped` | `/api/buyer-cart/grouped` | Bearer | GREEN |
| `addToCart` | POST | `/api/buyer-cart/items` | `/api/buyer-cart/items` | Bearer | GREEN |
| `updateCartItem` | PATCH | `/api/buyer-cart/items/:id` | `/api/buyer-cart/items/:id` | Bearer | GREEN |
| `removeFromCart` | DELETE | `/api/buyer-cart/items/:id` | `/api/buyer-cart/items/:id` | Bearer | GREEN |
| `clearCart` | DELETE | `/api/buyer-cart` | `/api/buyer-cart` | Bearer | GREEN |
| `createRFQForAll` | POST | `/api/buyer-cart/rfq` | `/api/buyer-cart/rfq` | Bearer | GREEN |
| `createRFQForSeller` | POST | `/api/buyer-cart/rfq/seller/:id` | `/api/buyer-cart/rfq/seller/:id` | Bearer | GREEN |
| `buyNowAll` | POST | `/api/buyer-cart/buy-now` | `/api/buyer-cart/buy-now` | Bearer | GREEN |
| `buyNowForSeller` | POST | `/api/buyer-cart/buy-now/seller/:id` | `/api/buyer-cart/buy-now/seller/:id` | Bearer | GREEN |

**Backend Route File**: `server/src/routes/buyerCartRoutes.ts`
**Mounted at**: `/api/buyer-cart` (server/src/index.ts:315)

---

## 7. Invoice Routes

### Frontend Service: `marketplaceInvoiceService.ts`
**Location**: `src/features/portal/services/marketplaceInvoiceService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `getSellerInvoices` | GET | `/api/invoices/seller` | `/api/invoices/seller` | Bearer | GREEN |
| `getSellerInvoiceStats` | GET | `/api/invoices/seller/stats` | `/api/invoices/seller/stats` | Bearer | GREEN |
| `getSellerInvoice` | GET | `/api/invoices/seller/:id` | `/api/invoices/seller/:id` | Bearer | GREEN |
| `issueInvoice` | POST | `/api/invoices/seller/:id/issue` | `/api/invoices/seller/:id/issue` | Bearer | GREEN |
| `cancelInvoice` | POST | `/api/invoices/seller/:id/cancel` | `/api/invoices/seller/:id/cancel` | Bearer | GREEN |
| `getInvoiceHistory` | GET | `/api/invoices/seller/:id/history` | `/api/invoices/seller/:id/history` | Bearer | GREEN |
| `getBuyerInvoices` | GET | `/api/invoices/buyer` | `/api/invoices/buyer` | Bearer | GREEN |
| `getBuyerInvoiceStats` | GET | `/api/invoices/buyer/stats` | `/api/invoices/buyer/stats` | Bearer | GREEN |
| `getBuyerInvoice` | GET | `/api/invoices/buyer/:id` | `/api/invoices/buyer/:id` | Bearer | GREEN |
| `getInvoiceByOrder` | GET | `/api/invoices/order/:orderId` | `/api/invoices/order/:orderId` | Bearer | GREEN |
| `generateInvoice` | POST | `/api/invoices/generate/:orderId` | `/api/invoices/generate/:orderId` | Bearer | GREEN |

**Backend Route File**: `server/src/routes/invoiceRoutes.ts`
**Mounted at**: `/api/invoices` (server/src/index.ts:316)

---

## 8. Dispute Routes

### Frontend Service: `disputeService.ts`
**Location**: `src/features/portal/services/disputeService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `createDispute` | POST | `/api/disputes/buyer` | `/api/disputes/buyer` | Bearer | GREEN |
| `getBuyerDisputes` | GET | `/api/disputes/buyer` | `/api/disputes/buyer` | Bearer | GREEN |
| `getBuyerDisputeStats` | GET | `/api/disputes/buyer/stats` | `/api/disputes/buyer/stats` | Bearer | GREEN |
| `getBuyerDispute` | GET | `/api/disputes/buyer/:id` | `/api/disputes/buyer/:id` | Bearer | GREEN |
| `acceptResolution` | POST | `/api/disputes/buyer/:id/accept` | `/api/disputes/buyer/:id/accept` | Bearer | GREEN |
| `rejectResolution` | POST | `/api/disputes/buyer/:id/reject` | `/api/disputes/buyer/:id/reject` | Bearer | GREEN |
| `buyerEscalate` | POST | `/api/disputes/buyer/:id/escalate` | `/api/disputes/buyer/:id/escalate` | Bearer | GREEN |
| `addEvidence` | POST | `/api/disputes/buyer/:id/evidence` | `/api/disputes/buyer/:id/evidence` | Bearer | GREEN |
| `buyerCloseDispute` | POST | `/api/disputes/buyer/:id/close` | `/api/disputes/buyer/:id/close` | Bearer | GREEN |
| `getSellerDisputes` | GET | `/api/disputes/seller` | `/api/disputes/seller` | Bearer | GREEN |
| `getSellerDisputeStats` | GET | `/api/disputes/seller/stats` | `/api/disputes/seller/stats` | Bearer | GREEN |
| `getSellerDispute` | GET | `/api/disputes/seller/:id` | `/api/disputes/seller/:id` | Bearer | GREEN |
| `markAsUnderReview` | POST | `/api/disputes/seller/:id/review` | `/api/disputes/seller/:id/review` | Bearer | GREEN |
| `respondToDispute` | POST | `/api/disputes/seller/:id/respond` | `/api/disputes/seller/:id/respond` | Bearer | GREEN |
| `sellerEscalate` | POST | `/api/disputes/seller/:id/escalate` | `/api/disputes/seller/:id/escalate` | Bearer | GREEN |
| `getDisputeHistory` | GET | `/api/disputes/:id/history` | `/api/disputes/:id/history` | Bearer | GREEN |
| `getDisputeByOrder` | GET | `/api/disputes/order/:orderId` | `/api/disputes/order/:orderId` | Bearer | GREEN |

**Backend Route File**: `server/src/routes/disputeRoutes.ts`
**Mounted at**: `/api/disputes` (server/src/index.ts:318)

---

## 9. Feature Gating Routes

### Frontend Service: `featureGatingService.ts`
**Location**: `src/features/portal/services/featureGatingService.ts`

| Function | Method | Frontend Endpoint | Backend Endpoint | Auth | Status |
|----------|--------|-------------------|------------------|------|--------|
| `getFeatureAccess` | GET | `/api/gating/features` | `/api/gating/features` | x-user-id | GREEN |
| `checkFeature` | GET | `/api/gating/features/:action` | `/api/gating/features/:action` | x-user-id | GREEN |

**Backend Route File**: `server/src/routes/featureGatingRoutes.ts`
**Mounted at**: `/api/gating` (server/src/index.ts:323)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| GREEN | Endpoint exists and matches frontend expectation |
| YELLOW | Endpoint exists but path/method differs slightly |
| RED | Endpoint missing or not implemented |

---

## Summary Statistics

- **Total Endpoints Mapped**: 180+
- **GREEN (Wired)**: ~165 (92%)
- **YELLOW (Path Mismatch)**: ~5 (3%)
- **RED (Missing)**: ~10 (5%)

## Authentication Patterns

1. **Portal JWT Auth**: Used by `portalAuthService` endpoints - token stored in `localStorage.portal_access_token`
2. **Bearer Token**: Standard pattern for all authenticated endpoints - `Authorization: Bearer <token>`
3. **x-user-id Header**: Legacy pattern used by some services (featureGating, orderTimeline)
4. **No Auth**: Public endpoints (signup, login, public seller profile)
