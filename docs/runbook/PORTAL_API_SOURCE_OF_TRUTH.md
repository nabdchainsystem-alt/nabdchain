# Portal API Source of Truth

> **Generated**: 2026-02-08
> **Scope**: Orders, Invoices, Payments, Tracking, Workspace
> **Total Endpoints Mapped**: 130+

---

## Architecture Note: Dual Route Systems

The backend has **two parallel route systems** for orders:

| Route System | Mount Point | Auth Model | Used By |
|---|---|---|---|
| **itemRoutes.ts** | `/api/items/orders/*` | Portal JWT (`resolveBuyerId`/`resolveAllSellerIds`) | Portal frontend (primary) |
| **orderRoutes.ts** | `/api/orders/*` | Clerk auth (`auth.userId`) | Main app; portal uses only tracking-stats |

The portal frontend's `marketplaceOrderService.ts` uses `/api/items/orders/*` for all CRUD operations and `/api/orders/*/tracking-stats` for dashboard KPIs.

---

## 1. Orders API

### 1A. Portal Order Endpoints (itemRoutes.ts -> `/api/items/orders/*`)

**Backend File**: `server/src/routes/itemRoutes.ts`
**Backend Service**: `server/src/services/marketplaceOrderService.ts`
**Prisma Models**: `MarketplaceOrder`, `MarketplaceOrderAudit`

| Method | Path | Auth | Handler Line | Service Function | Description |
|--------|------|------|-------------|-----------------|-------------|
| GET | `/api/items/orders/buyer` | requireAuth | 2799 | `getBuyerOrders()` | List buyer orders |
| GET | `/api/items/orders/seller` | requireAuth | 2835 | `getSellerOrders()` | List seller orders |
| GET | `/api/items/orders/:id` | requireAuth | 2876 | `getOrder()` | Single order |
| GET | `/api/items/orders/:id/history` | requireAuth | 2911 | `getOrderHistory()` | Audit trail |
| POST | `/api/items/orders/:id/confirm` | requireAuth | 2946 | `confirmOrder()` | Seller confirms |
| GET | `/api/items/orders/stats/buyer` | requireAuth | 2977 | `getOrderStats(buyer)` | Buyer KPIs |
| GET | `/api/items/orders/stats/seller` | requireAuth | 2998 | `getOrderStats(seller)` | Seller KPIs |
| POST | `/api/items/orders/:id/reject` | requireAuth | 3052 | `rejectOrder()` | Seller rejects |
| POST | `/api/items/orders/:id/process` | requireAuth | 3093 | `startProcessing()` | Begin fulfillment |
| POST | `/api/items/orders/:id/ship` | requireAuth | 3134 | `shipOrder()` | Mark shipped |
| POST | `/api/items/orders/:id/deliver` | requireAuth | 3178 | `markDelivered()` | Confirm delivery |
| POST | `/api/items/orders/:id/close` | requireAuth | 3223 | `closeOrder()` | Close lifecycle |
| POST | `/api/items/orders/:id/cancel` | requireAuth | 3251 | `cancelOrder()` | Cancel order |
| PATCH | `/api/items/orders/:id/tracking` | requireAuth | 3291 | `updateTracking()` | Update tracking |

#### Frontend Mapping (Portal)

| Frontend File | Function | Backend Endpoint |
|---|---|---|
| `services/marketplaceOrderService.ts` | `acceptQuote()` | `POST /api/items/quotes/:id/accept` |
| `services/marketplaceOrderService.ts` | `rejectQuote()` | `POST /api/items/quotes/:id/reject` |
| `services/marketplaceOrderService.ts` | `getBuyerOrders()` | `GET /api/items/orders/buyer` |
| `services/marketplaceOrderService.ts` | `getSellerOrders()` | `GET /api/items/orders/seller` |
| `services/marketplaceOrderService.ts` | `getOrder()` | `GET /api/items/orders/:id` |
| `services/marketplaceOrderService.ts` | `getOrderHistory()` | `GET /api/items/orders/:id/history` |
| `services/marketplaceOrderService.ts` | `confirmOrder()` | `POST /api/items/orders/:id/confirm` |
| `services/marketplaceOrderService.ts` | `getBuyerOrderStats()` | `GET /api/items/orders/stats/buyer` |
| `services/marketplaceOrderService.ts` | `getSellerOrderStats()` | `GET /api/items/orders/stats/seller` |
| `services/marketplaceOrderService.ts` | `rejectOrder()` | `POST /api/items/orders/:id/reject` |
| `services/marketplaceOrderService.ts` | `startProcessing()` | `POST /api/items/orders/:id/process` |
| `services/marketplaceOrderService.ts` | `shipOrder()` | `POST /api/items/orders/:id/ship` |
| `services/marketplaceOrderService.ts` | `markDelivered()` | `POST /api/items/orders/:id/deliver` |
| `services/marketplaceOrderService.ts` | `closeOrder()` | `POST /api/items/orders/:id/close` |
| `services/marketplaceOrderService.ts` | `cancelOrder()` | `POST /api/items/orders/:id/cancel` |
| `services/marketplaceOrderService.ts` | `updateTracking()` | `PATCH /api/items/orders/:id/tracking` |

### 1B. Main App Order Endpoints (orderRoutes.ts -> `/api/orders/*`)

**Backend File**: `server/src/routes/orderRoutes.ts`
**Backend Service**: `server/src/services/orderService.ts`
**Prisma Models**: `MarketplaceOrder`, `MarketplaceOrderAudit`

| Method | Path | Auth | Service Function | Description |
|--------|------|------|-----------------|-------------|
| GET | `/api/orders/seller` | requireAuth | `orderService.getSellerOrders()` | Seller orders |
| GET | `/api/orders/seller/stats` | requireAuth | `orderService.getSellerOrderStats()` | Seller stats |
| GET | `/api/orders/seller/:id` | requireAuth | `orderService.getSellerOrder()` | Single order |
| POST | `/api/orders/seller/:id/confirm` | requireAuth | `orderService.confirmOrder()` | Confirm |
| POST | `/api/orders/seller/:id/ship` | requireAuth+idempotency | `orderService.shipOrder()` | Ship |
| POST | `/api/orders/seller/:id/deliver` | requireAuth+idempotency | `orderService.markDelivered()` | Deliver |
| POST | `/api/orders/seller/:id/cancel` | requireAuth | `orderService.cancelOrder()` | Cancel |
| PUT | `/api/orders/seller/:id` | requireAuth | `orderService.updateOrder()` | Update |
| POST | `/api/orders/seller/:id/status` | requireAuth | `orderService.updateOrderStatus()` | Status change |
| GET | `/api/orders/buyer` | requireAuth | `orderService.getBuyerOrders()` | Buyer orders |
| GET | `/api/orders/buyer/stats` | requireAuth | `orderService.getBuyerOrderStats()` | Buyer stats |
| GET | `/api/orders/buyer/dashboard` | requireAuth | `orderService.getBuyerDashboardSummary()` | Dashboard |
| GET | `/api/orders/buyer/:id` | requireAuth | `orderService.getBuyerOrder()` | Single order |
| POST | `/api/orders` | requireAuth | `orderService.createOrder()` | Create (direct) |
| POST | `/api/orders/buyer/:id/cancel` | requireAuth | `orderService.cancelOrderByBuyer()` | Buyer cancel |
| POST | `/api/orders/buyer/:id/confirm-delivery` | requireAuth | Inline (prisma direct) | Confirm delivery |

#### Frontend Mapping (Main App)

| Frontend File | Function | Backend Endpoint |
|---|---|---|
| `services/orderService.ts` | `getSellerOrders()` | `GET /api/orders/seller` |
| `services/orderService.ts` | `getSellerOrderStats()` | `GET /api/orders/seller/stats` |
| `services/orderService.ts` | `getSellerOrder()` | `GET /api/orders/seller/:id` |
| `services/orderService.ts` | `confirmOrder()` | `POST /api/orders/seller/:id/confirm` |
| `services/orderService.ts` | `updateOrderStatus()` | `POST /api/orders/seller/:id/status` |
| `services/orderService.ts` | `shipOrder()` | `POST /api/orders/seller/:id/ship` |
| `services/orderService.ts` | `markDelivered()` | `POST /api/orders/seller/:id/deliver` |
| `services/orderService.ts` | `cancelOrder()` | `POST /api/orders/seller/:id/cancel` |
| `services/orderService.ts` | `getBuyerOrders()` | `GET /api/orders/buyer` |
| `services/orderService.ts` | `getBuyerOrder()` | `GET /api/orders/buyer/:id` |
| `services/orderService.ts` | `buyerCancelOrder()` | `POST /api/orders/buyer/:id/cancel` |
| `services/orderService.ts` | `confirmDelivery()` | `POST /api/orders/buyer/:id/confirm-delivery` |
| `services/orderService.ts` | `getBuyerDashboardSummary()` | `GET /api/orders/buyer/dashboard` |
| `services/orderService.ts` | `createOrderFromRFQ()` | `POST /api/orders/from-rfq` |
| `services/orderService.ts` | `createDirectOrder()` | `POST /api/orders/direct` |

---

## 2. Tracking API

### Backend Endpoints

**Backend File**: `server/src/routes/orderRoutes.ts` (inline at bottom)
**Prisma Models**: `MarketplaceOrder` (direct queries)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/orders/seller/tracking-stats` | requireAuth | Seller tracking KPIs (inTransit, outForDelivery, deliveredToday, delayed) |
| GET | `/api/orders/buyer/tracking-stats` | requireAuth | Buyer tracking KPIs (same shape) |

### Order Health Endpoints

**Backend File**: `server/src/routes/orderRoutes.ts`
**Backend Service**: `server/src/services/orderHealthService.ts`

| Method | Path | Auth | Service Function |
|--------|------|------|-----------------|
| GET | `/api/orders/seller/health-summary` | requireAuth | `orderHealthService.getOrderHealthSummary()` |
| GET | `/api/orders/seller/exceptions` | requireAuth | `orderHealthService.getActiveExceptions()` |
| GET | `/api/orders/seller/with-health` | requireAuth | `orderHealthService.getOrdersWithHealth()` |
| POST | `/api/orders/seller/:id/calculate-health` | requireAuth | `orderHealthService.calculateOrderHealth()` |
| POST | `/api/orders/seller/:id/resolve-exception` | requireAuth | `orderHealthService.resolveException()` |
| POST | `/api/orders/seller/update-health-batch` | requireAuth | `orderHealthService.updateOrderHealthBatch()` |
| GET | `/api/orders/seller/:id/rfq-history` | requireAuth | `orderHealthService.getRFQNegotiationHistory()` |
| GET | `/api/orders/seller/health-rules` | requireAuth | `orderHealthService.getOrCreateHealthRules()` |

### Order Timeline Endpoints

**Backend File**: `server/src/routes/orderTimelineRoutes.ts` (mounted at `/api/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/orders/timeline/:orderId` | requireAuth | Order timeline events |
| POST | `/api/orders/:id/delay` | requireAuth | Report delay |
| GET | `/api/orders/at-risk` | requireAuth | Orders at risk |
| GET | `/api/orders/sla-summary` | requireAuth | SLA breach summary |
| GET | `/api/orders/seller-performance` | requireAuth | Seller performance |

### Frontend Mapping

| Frontend File | Function | Backend Endpoint |
|---|---|---|
| `services/marketplaceOrderService.ts` | `getSellerTrackingStats()` | `GET /api/orders/seller/tracking-stats` |
| `services/marketplaceOrderService.ts` | `getBuyerTrackingStats()` | `GET /api/orders/buyer/tracking-stats` |
| `services/orderTimelineService.ts` | `getOrderTimeline()` | `GET /api/orders/timeline/:id` |
| `services/orderTimelineService.ts` | `reportOrderDelay()` | `POST /api/orders/:id/delay` |
| `services/orderTimelineService.ts` | `getOrdersAtRisk()` | `GET /api/orders/at-risk` |
| `services/orderTimelineService.ts` | `getSLABreachSummary()` | `GET /api/orders/sla-summary` |
| `services/orderTimelineService.ts` | `getSellerPerformance()` | `GET /api/orders/seller-performance` |

---

## 3. Invoices API

### Backend Endpoints

**Backend File**: `server/src/routes/invoiceRoutes.ts`
**Backend Service**: `server/src/services/marketplaceInvoiceService.ts`
**Prisma Models**: `MarketplaceInvoice`, `MarketplaceInvoiceEvent`

| Method | Path | Auth | Service Function | Description |
|--------|------|------|-----------------|-------------|
| GET | `/api/invoices/seller` | requireAuth | `getSellerInvoices()` | List seller invoices |
| GET | `/api/invoices/seller/stats` | requireAuth | `getSellerInvoiceStats()` | Seller stats |
| GET | `/api/invoices/seller/:id` | requireAuth | `getInvoice()` | Single invoice |
| POST | `/api/invoices/seller/:id/issue` | requireAuth | `issueInvoice()` | Issue invoice |
| POST | `/api/invoices/seller/:id/cancel` | requireAuth | `cancelInvoice()` | Cancel draft |
| GET | `/api/invoices/seller/:id/history` | requireAuth | `getInvoiceHistory()` | Event log |
| GET | `/api/invoices/buyer` | requireAuth | `getBuyerInvoices()` | List buyer invoices |
| GET | `/api/invoices/buyer/stats` | requireAuth | `getBuyerInvoiceStats()` | Buyer stats |
| GET | `/api/invoices/buyer/:id` | requireAuth | `getInvoice()` | Single invoice |
| GET | `/api/invoices/order/:orderId` | requireAuth | `getInvoiceByOrder()` | Invoice by order |
| POST | `/api/invoices/generate/:orderId` | requireAuth (seller) | `createFromDeliveredOrder()` | Generate invoice |

### Seller Workspace Invoices (Separate System)

**Backend File**: `server/src/routes/sellerWorkspaceRoutes.ts`
**Backend Service**: `server/src/services/sellerWorkspaceService.ts`
**Prisma Models**: `SellerInvoice`

| Method | Path | Auth | Service Function |
|--------|------|------|-----------------|
| GET | `/api/seller/workspace/invoices` | requireAuth | `getInvoices()` |
| GET | `/api/seller/workspace/invoices/:id` | requireAuth | `getInvoice()` |
| POST | `/api/seller/workspace/invoices` | requireAuth | `createInvoice()` |
| PUT | `/api/seller/workspace/invoices/:id` | requireAuth | `updateInvoice()` |
| DELETE | `/api/seller/workspace/invoices/:id` | requireAuth | `deleteInvoice()` |

> **Note**: These are **traditional invoices** (SellerInvoice model), separate from **marketplace invoices** (MarketplaceInvoice model). The seller workspace invoices are for manual/offline invoicing.

### Frontend Mapping

| Frontend File | Function | Backend Endpoint |
|---|---|---|
| `services/marketplaceInvoiceService.ts` | `getSellerInvoices()` | `GET /api/invoices/seller` |
| `services/marketplaceInvoiceService.ts` | `getSellerInvoiceStats()` | `GET /api/invoices/seller/stats` |
| `services/marketplaceInvoiceService.ts` | `getSellerInvoice()` | `GET /api/invoices/seller/:id` |
| `services/marketplaceInvoiceService.ts` | `issueInvoice()` | `POST /api/invoices/seller/:id/issue` |
| `services/marketplaceInvoiceService.ts` | `cancelInvoice()` | `POST /api/invoices/seller/:id/cancel` |
| `services/marketplaceInvoiceService.ts` | `getInvoiceHistory()` | `GET /api/invoices/seller/:id/history` |
| `services/marketplaceInvoiceService.ts` | `getBuyerInvoices()` | `GET /api/invoices/buyer` |
| `services/marketplaceInvoiceService.ts` | `getBuyerInvoiceStats()` | `GET /api/invoices/buyer/stats` |
| `services/marketplaceInvoiceService.ts` | `getBuyerInvoice()` | `GET /api/invoices/buyer/:id` |
| `services/marketplaceInvoiceService.ts` | `getInvoiceByOrder()` | `GET /api/invoices/order/:orderId` |
| `services/marketplaceInvoiceService.ts` | `generateInvoice()` | `POST /api/invoices/generate/:orderId` |

---

## 4. Payments API

### Backend Endpoints

**Backend File**: `server/src/routes/paymentRoutes.ts`
**Backend Service**: `server/src/services/marketplacePaymentService.ts`
**Prisma Models**: `MarketplacePayment`, `MarketplaceInvoice` (status updates)

| Method | Path | Auth | Service Function | Description |
|--------|------|------|-----------------|-------------|
| GET | `/api/payments/invoice/:invoiceId` | requireAuth | `getInvoicePayments()` | Payments for invoice |
| GET | `/api/payments/buyer` | requireAuth | `getBuyerPayments()` | Buyer payment list |
| POST | `/api/payments/buyer` | requireAuth+idempotency | `recordPayment()` | Record payment |
| GET | `/api/payments/buyer/:id` | requireAuth | `getPayment()` | Single payment |
| GET | `/api/payments/seller` | requireAuth | `getSellerPayments()` | Seller payment list |
| GET | `/api/payments/seller/:id` | requireAuth | `getPayment()` | Single payment |
| POST | `/api/payments/seller/:id/confirm` | requireAuth | `confirmPayment()` | Confirm payment |
| POST | `/api/payments/seller/:id/fail` | requireAuth | `failPayment()` | Mark failed |

### Frontend Mapping

| Frontend File | Function | Backend Endpoint |
|---|---|---|
| `services/marketplacePaymentService.ts` | `getInvoicePayments()` | `GET /api/payments/invoice/:invoiceId` |
| `services/marketplacePaymentService.ts` | `getBuyerPayments()` | `GET /api/payments/buyer` |
| `services/marketplacePaymentService.ts` | `recordPayment()` | `POST /api/payments/buyer` |
| `services/marketplacePaymentService.ts` | `getBuyerPayment()` | `GET /api/payments/buyer/:id` |
| `services/marketplacePaymentService.ts` | `getSellerPayments()` | `GET /api/payments/seller` |
| `services/marketplacePaymentService.ts` | `getSellerPayment()` | `GET /api/payments/seller/:id` |
| `services/marketplacePaymentService.ts` | `confirmPayment()` | `POST /api/payments/seller/:id/confirm` |
| `services/marketplacePaymentService.ts` | `failPayment()` | `POST /api/payments/seller/:id/fail` |

---

## 5. Workspace / Reports API

### 5A. Buyer Workspace

**Backend File**: `server/src/routes/buyerWorkspaceRoutes.ts`
**Prisma Models**: `BuyerPurchaseOrder`, `BuyerSupplier`, `BuyerInventory`, `BuyerExpense`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/buyer/purchases` | requireAuth | Purchase orders |
| POST | `/api/buyer/purchases` | requireAuth | Create PO |
| PATCH | `/api/buyer/purchases/:id/status` | requireAuth | Update PO status |
| GET | `/api/buyer/suppliers/stats` | requireAuth | Supplier KPIs |
| GET | `/api/buyer/suppliers` | requireAuth | Supplier list |
| POST | `/api/buyer/suppliers` | requireAuth | Create supplier |
| GET | `/api/buyer/inventory` | requireAuth | Inventory list |
| POST | `/api/buyer/inventory` | requireAuth | Add inventory |
| PATCH | `/api/buyer/inventory/:id` | requireAuth | Update qty |
| GET | `/api/buyer/expenses` | requireAuth | Expenses list |
| GET | `/api/buyer/expenses/summary` | requireAuth | Monthly summary |
| POST | `/api/buyer/expenses` | requireAuth | Add expense |
| GET | `/api/buyer/inventory/forecast` | requireAuth | Forecast (stub) |
| GET | `/api/buyer/inventory/alerts` | requireAuth | Alerts (stub) |
| POST | `/api/buyer/inventory/:id/simulate` | requireAuth | Simulate (stub) |
| GET | `/api/buyer/expenses/enhanced-summary` | requireAuth | Enhanced (stub) |
| GET | `/api/buyer/expenses/analytics/dashboard` | requireAuth | Analytics |
| GET | `/api/buyer/expenses/leakages` | requireAuth | Leakages (stub) |
| GET | `/api/buyer/expenses/price-drift` | requireAuth | Price drift (stub) |

### 5B. Buyer Purchases Intelligence

**Backend File**: `server/src/routes/buyerPurchasesRoutes.ts`
**Backend Service**: `server/src/services/buyerPurchaseService.ts`
**Prisma Models**: `MarketplaceOrder`, `BuyerPriceHistory`, `BuyerSupplierMetrics`

| Method | Path | Auth | Service Function |
|--------|------|------|-----------------|
| GET | `/api/purchases/buyer` | requireAuth | `getBuyerPurchases()` |
| GET | `/api/purchases/buyer/stats` | requireAuth | `getBuyerPurchaseStats()` |
| GET | `/api/purchases/buyer/:id` | requireAuth | `getBuyerPurchase()` |
| GET | `/api/purchases/buyer/:id/timeline` | requireAuth | `getPurchaseTimeline()` |
| GET | `/api/purchases/buyer/price-history/:sku` | requireAuth | `getPriceHistory()` |
| GET | `/api/purchases/buyer/price-comparison/:sku` | requireAuth | `calculatePriceComparison()` |
| GET | `/api/purchases/buyer/supplier/:sellerId` | requireAuth | `getSupplierMetrics()` |
| POST | `/api/purchases/buyer/:id/refresh-intelligence` | requireAuth | `updateSupplierMetricsOnOrderChange()` |

### 5C. Seller Workspace

**Backend File**: `server/src/routes/sellerWorkspaceRoutes.ts`
**Backend Service**: `server/src/services/sellerWorkspaceService.ts`
**Prisma Models**: `SellerInvoice`, `SellerStockAdjustment`, `SellerCostTag`, `SellerBuyerProfile`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/seller/workspace/invoices` | requireAuth | Invoices |
| GET | `/api/seller/workspace/invoices/:id` | requireAuth | Single invoice |
| POST | `/api/seller/workspace/invoices` | requireAuth | Create invoice |
| PUT | `/api/seller/workspace/invoices/:id` | requireAuth | Update invoice |
| DELETE | `/api/seller/workspace/invoices/:id` | requireAuth | Delete draft |
| GET | `/api/seller/workspace/stock-adjustments` | requireAuth | Stock log |
| POST | `/api/seller/workspace/stock-adjustments` | requireAuth | Add adjustment |
| GET | `/api/seller/workspace/inventory` | requireAuth | Inventory status |
| GET | `/api/seller/workspace/cost-tags` | requireAuth | Cost tags |
| POST | `/api/seller/workspace/cost-tags` | requireAuth | Add tag |
| DELETE | `/api/seller/workspace/cost-tags/:id` | requireAuth | Delete tag |
| GET | `/api/seller/workspace/cost-summary` | requireAuth | Cost summary |
| GET | `/api/seller/workspace/items/:id/margin` | requireAuth | Item margin |
| GET | `/api/seller/workspace/buyer-profiles` | requireAuth | Buyer profiles |
| GET | `/api/seller/workspace/buyer-profiles/:id` | requireAuth | Single profile |
| POST | `/api/seller/workspace/buyer-profiles` | requireAuth | Upsert profile |
| DELETE | `/api/seller/workspace/buyer-profiles/:id` | requireAuth | Delete profile |

### 5D. Dashboard / Analytics

**Backend File**: `server/src/routes/dashboardRoutes.ts`, `server/src/routes/analyticsRoutes.ts`, `server/src/routes/sellerHomeRoutes.ts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/seller/summary` | requireAuth | Seller dashboard |
| GET | `/api/dashboard/buyer/summary` | requireAuth | Buyer dashboard |
| GET | `/api/analytics/seller/summary` | requireAuth | Seller analytics |
| GET | `/api/analytics/seller/kpis` | requireAuth | Seller KPIs |
| GET | `/api/analytics/seller/top-products` | requireAuth | Top products |
| GET | `/api/analytics/seller/conversion` | requireAuth | Conversion funnel |
| GET | `/api/analytics/seller/regions` | requireAuth | Region distribution |
| GET | `/api/analytics/buyer/summary` | requireAuth | Buyer analytics |
| GET | `/api/analytics/buyer/kpis` | requireAuth | Buyer KPIs |
| GET | `/api/analytics/buyer/spend-by-category` | requireAuth | Spend by category |
| GET | `/api/analytics/buyer/supplier-performance` | requireAuth | Supplier perf |
| GET | `/api/analytics/buyer/rfq-funnel` | requireAuth | RFQ funnel |
| GET | `/api/seller/home/summary` | requireAuth | Seller home |
| GET | `/api/seller/home/alerts` | requireAuth | Alerts |
| GET | `/api/seller/home/focus` | requireAuth | Focus items |
| GET | `/api/seller/home/pulse` | requireAuth | Pulse data |
| GET | `/api/seller/home/health` | requireAuth | Health summary |
| GET | `/api/seller/home/onboarding` | requireAuth | Onboarding |

### Frontend Mapping (Workspace/Reports)

| Frontend File | Function | Backend Endpoint |
|---|---|---|
| `services/buyerWorkspaceService.ts` | `getPurchases()` | `GET /api/buyer/purchases` |
| `services/buyerWorkspaceService.ts` | `createPurchase()` | `POST /api/buyer/purchases` |
| `services/buyerWorkspaceService.ts` | `getSuppliers()` | `GET /api/buyer/suppliers` |
| `services/buyerWorkspaceService.ts` | `getInventory()` | `GET /api/buyer/inventory` |
| `services/buyerWorkspaceService.ts` | `getExpenses()` | `GET /api/buyer/expenses` |
| `services/buyerWorkspaceService.ts` | `getExpenseSummary()` | `GET /api/buyer/expenses/summary` |
| `services/buyerAnalyticsService.ts` | `getAnalyticsSummary()` | `GET /api/analytics/buyer/summary` |
| `services/buyerAnalyticsService.ts` | `getKPIs()` | `GET /api/analytics/buyer/kpis` |
| `services/sellerAnalyticsService.ts` | `getAnalyticsSummary()` | `GET /api/analytics/seller/summary` |
| `services/sellerAnalyticsService.ts` | `getKPIs()` | `GET /api/analytics/seller/kpis` |
| `services/sellerHomeSummaryService.ts` | `getSummary()` | `GET /api/seller/home/summary` |
| `services/sellerHomeSummaryService.ts` | `getAlerts()` | `GET /api/seller/home/alerts` |
| `services/dashboardService.ts` | `getSellerSummary()` | `GET /api/dashboard/seller/summary` |
| `services/dashboardService.ts` | `getBuyerSummary()` | `GET /api/dashboard/buyer/summary` |

---

## Gaps & Mismatches

### CONFIRMED MISMATCHES

| # | Frontend Call | Backend Endpoint | Status | Fix |
|---|---|---|---|---|
| 1 | `orderService.ts: createOrderFromRFQ()` | `POST /api/orders/from-rfq` | **MISSING** — no backend route exists | Not blocking; portal uses `POST /api/items/quotes/:id/accept` instead |
| 2 | `orderService.ts: createDirectOrder()` | `POST /api/orders/direct` | **MISSING** — no backend route exists | Not blocking; portal uses `POST /api/orders` (createOrder) for direct buys |

### OBSERVATIONS (Not Bugs)

| # | Observation | Impact |
|---|---|---|
| 3 | Two order service files on frontend: `orderService.ts` (main app, uses `/api/orders/`) and `marketplaceOrderService.ts` (portal, uses `/api/items/orders/`) | Intentional — different auth models. Could be consolidated long-term. |
| 4 | Seller workspace invoices (`SellerInvoice`) vs marketplace invoices (`MarketplaceInvoice`) are separate models | By design — workspace invoices are manual, marketplace invoices auto-generate on delivery. |
| 5 | `orderTimelineService.ts` uses `portalApiClient` (auto token refresh) while `marketplaceOrderService.ts` uses raw `fetch` | Inconsistent but functional. Could standardize on `portalApiClient`. |
| 6 | Tracking stats use `/api/orders/` (orderRoutes.ts, Clerk auth) while all other portal order ops use `/api/items/orders/` (itemRoutes.ts, portal JWT) | Works because the auth middleware in `app.ts` supports both portal JWT and Clerk tokens. |
| 7 | `POST /api/buyer/purchases` creates `BuyerPurchaseOrder` (traditional PO), which is a different table from `MarketplaceOrder` | By design — BuyerPurchaseOrder is for manual/offline POs, MarketplaceOrder is for marketplace transactions. |

### STUBS (Endpoints that return hardcoded/empty data)

| Endpoint | Description |
|---|---|
| `GET /api/buyer/inventory/forecast` | Returns static forecast data |
| `GET /api/buyer/inventory/alerts` | Returns static alert data |
| `POST /api/buyer/inventory/:id/simulate` | Returns static simulation |
| `GET /api/buyer/expenses/enhanced-summary` | Returns static summary |
| `GET /api/buyer/expenses/leakages` | Returns static leakage data |
| `GET /api/buyer/expenses/price-drift` | Returns static drift alerts |

---

## Prisma Model Reference

### Order Lifecycle Models

| Model | Table | Purpose |
|---|---|---|
| `MarketplaceOrder` | `MarketplaceOrder` | Core order (RFQ or direct buy) |
| `MarketplaceOrderAudit` | `MarketplaceOrderAudit` | Order state change log |
| `SLARecord` | `SLARecord` | SLA tracking per order stage |

### Invoice & Payment Models

| Model | Table | Purpose |
|---|---|---|
| `MarketplaceInvoice` | `MarketplaceInvoice` | Auto-generated from delivered orders |
| `MarketplaceInvoiceEvent` | `MarketplaceInvoiceEvent` | Invoice lifecycle log |
| `MarketplacePayment` | `MarketplacePayment` | Payment against invoice |
| `SellerInvoice` | `SellerInvoice` | Manual seller invoices (workspace) |

### Quote & RFQ Models

| Model | Table | Purpose |
|---|---|---|
| `ItemRFQ` | `ItemRFQ` | Request for Quote |
| `ItemRFQEvent` | `ItemRFQEvent` | RFQ audit trail |
| `Quote` | `Quote` | Seller quote response |
| `QuoteVersion` | `QuoteVersion` | Immutable version history |
| `QuoteEvent` | `QuoteEvent` | Quote lifecycle log |
| `CounterOffer` | `CounterOffer` | Buyer counter-proposal |

### Workspace Models

| Model | Table | Purpose |
|---|---|---|
| `BuyerPurchaseOrder` | `BuyerPurchaseOrder` | Manual POs |
| `BuyerSupplier` | `BuyerSupplier` | Supplier master data |
| `BuyerInventory` | `BuyerInventory` | Buyer stock tracking |
| `BuyerExpense` | `BuyerExpense` | Expense tracking |
| `BuyerPriceHistory` | `BuyerPriceHistory` | Price intelligence |
| `BuyerSupplierMetrics` | `BuyerSupplierMetrics` | Supplier performance |
| `SellerStockAdjustment` | `SellerStockAdjustment` | Stock movements |
| `SellerCostTag` | `SellerCostTag` | Cost allocation |
| `SellerBuyerProfile` | `SellerBuyerProfile` | Buyer CRM data |

### Status Enums

| Model | Status Values |
|---|---|
| MarketplaceOrder.status | pending_confirmation -> confirmed -> processing -> shipped -> delivered -> closed \| cancelled \| failed \| refunded |
| MarketplaceOrder.paymentStatus | unpaid \| authorized \| paid \| refunded |
| MarketplaceOrder.healthStatus | on_track \| at_risk \| delayed \| critical |
| MarketplaceInvoice.status | draft -> issued -> paid \| overdue \| cancelled |
| MarketplacePayment.status | pending -> confirmed \| failed |
| Quote.status | draft -> sent -> revised \| expired \| accepted \| rejected |
| ItemRFQ.status | new -> viewed -> under_review -> quoted -> accepted \| rejected \| expired \| ignored |
