# NABD System Cleanup Plan
**Generated:** 2026-02-05
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a comprehensive audit and cleanup plan for the NABD portal system. The audit identified significant structural issues that need to be addressed before continuing feature development.

### Key Findings
| Category | Critical Issues | Medium Issues | Low Issues |
|----------|----------------|---------------|------------|
| Page Structure | 8 duplicated pages | 4 orphaned pages | - |
| UI Components | 2 major duplications | 3 inconsistencies | 5 minor |
| i18n | 803 untranslated keys | - | - |
| Unused Code | ~5,000 lines | 14 unused components | - |
| Large Files | 23 files >1,000 lines | - | - |
| Services | 3 deprecated services | 6 API inconsistencies | - |

---

## PHASE 1: Product Structure Audit

### Current State Analysis

#### Buyer Portal Pages (13 pages)
| Page | Purpose | Lines | Status |
|------|---------|-------|--------|
| BuyerHome | Landing dashboard | ~400 | KEEP |
| Marketplace | Product browsing | 2,088 | KEEP - refactor |
| ItemDetails | Product detail view | ~600 | KEEP |
| Cart | Shopping cart | ~500 | KEEP |
| RequestQuote | RFQ creation form | ~400 | MERGE into MyRFQs |
| MyRFQs | RFQ tracking | 1,382 | KEEP |
| MyOrders | Order summary | ~300 | MERGE - redirect to Workspace |
| Purchases | Purchase summary | ~300 | MERGE - redirect to Workspace |
| Tracking | Shipment tracking | ~250 | REMOVE - orphaned |
| BuyerSuppliers | Supplier management | 1,045 | MERGE with Workspace tab |
| DisputeCenter | Dispute management | 1,290 | KEEP |
| BuyerAnalytics | Analytics dashboard | ~600 | KEEP |
| BuyerExpenses | Expense tracking | ~500 | MERGE with Workspace tab |
| BuyerInvoices | Invoice list | ~400 | MERGE with Workspace tab |

#### Buyer Workspace Tabs (7 tabs)
| Tab | Purpose | Status |
|-----|---------|--------|
| DashboardTab | Intelligence overview | KEEP - make primary |
| OrdersTab | Full order management | KEEP - source of truth |
| PurchasesTab | Full PO management | KEEP - source of truth |
| InvoicesTab | Invoice management | KEEP - source of truth |
| SuppliersTab | Supplier management | KEEP - source of truth |
| InventoryTab | Inventory tracking | KEEP |
| ExpensesTab | Expense tracking | KEEP - source of truth |

#### Seller Portal Pages (15 pages)
| Page | Purpose | Lines | Status |
|------|---------|-------|--------|
| SellerHome | Dashboard landing | ~600 | KEEP |
| Listings | Product catalog | 2,382 | KEEP - refactor |
| RFQsInbox | RFQ management | 2,298 | KEEP - refactor |
| RFQMarketplace | Open RFQ discovery | ~800 | KEEP |
| SellerOrders | Order fulfillment | 3,105 | KEEP - urgent refactor |
| Analytics | Sales analytics | ~700 | KEEP |
| SellerWorkspace | Internal ops | ~600 | KEEP |
| SellerPublicProfile | Public profile | ~500 | REMOVE from sidebar - orphaned |
| SellerSettings | Account settings | 1,616 | KEEP |
| SellerDashboard | Business health | ~500 | REMOVE - duplicate of SellerHome |
| SellerInventory | Inventory intelligence | ~600 | MERGE into Workspace |
| DisputeInbox | Dispute handling | ~700 | KEEP |
| SellerPayouts | Payout management | 1,994 | KEEP |
| SellerAutomation | Automation rules | ~700 | KEEP |
| SellerOnboarding | New seller wizard | ~800 | KEEP |

---

### Recommended Actions

#### Pages to KEEP (14 Buyer + 12 Seller = 26 total)

**Buyer:**
- `BuyerHome` - Entry point
- `Marketplace` - Product discovery
- `ItemDetails` - Product detail
- `Cart` - Checkout flow
- `MyRFQs` - RFQ management (absorb RequestQuote)
- `BuyerWorkspace` - Operational hub (7 tabs)
- `DisputeCenter` - Dispute resolution
- `BuyerAnalytics` - Procurement insights

**Seller:**
- `SellerHome` - Entry point
- `Listings` - Product management
- `RFQsInbox` - RFQ handling
- `RFQMarketplace` - RFQ discovery
- `SellerOrders` - Order fulfillment
- `Analytics` - Business insights
- `SellerWorkspace` - Internal ops (expand to absorb SellerInventory)
- `SellerSettings` - Account management
- `DisputeInbox` - Dispute handling
- `SellerPayouts` - Financial management
- `SellerAutomation` - Workflow automation
- `SellerOnboarding` - Onboarding flow

#### Pages to MERGE (7 pages)

| Page | Merge Into | Rationale |
|------|------------|-----------|
| `RequestQuote` | `MyRFQs` | Single RFQ management hub |
| `MyOrders` | Redirect to `Workspace/Orders` | Avoid duplicate order views |
| `Purchases` | Redirect to `Workspace/Purchases` | Avoid duplicate purchase views |
| `BuyerSuppliers` | `Workspace/Suppliers` | Single supplier management |
| `BuyerExpenses` | `Workspace/Expenses` | Single expense tracking |
| `BuyerInvoices` | `Workspace/Invoices` | Single invoice management |
| `SellerInventory` | `SellerWorkspace/Inventory` | Add as new workspace tab |

#### Pages to REMOVE (4 pages)

| Page | Reason |
|------|--------|
| `Tracking` (Buyer) | Orphaned - not in navigation, functionality in Orders |
| `SellerDashboard` | Duplicate of SellerHome functionality |
| `SellerPublicProfile` | Orphaned - should be accessed via profile link, not sidebar |
| `Tests` pages (both) | Already deleted per git status |

---

### Before/After Structure

```
BEFORE (Buyer):                          AFTER (Buyer):
├── Home                                 ├── Home
├── Marketplace                          ├── Marketplace
├── ItemDetails                          ├── ItemDetails
├── Cart                                 ├── Cart
├── RequestQuote          ──┐            ├── MyRFQs (with create RFQ modal)
├── MyRFQs               ←──┘            ├── Workspace (7 tabs - primary hub)
├── MyOrders             ──┐             │   ├── Dashboard
├── Purchases            ──┼─→           │   ├── Orders
├── BuyerInvoices        ──┼─→           │   ├── Purchases
├── BuyerSuppliers       ──┼─→           │   ├── Invoices
├── BuyerExpenses        ──┘             │   ├── Suppliers
├── Workspace                            │   ├── Inventory
├── DisputeCenter                        │   └── Expenses
├── BuyerAnalytics                       ├── DisputeCenter
├── Tracking             ──→ REMOVE      └── Analytics
└── [14 pages]                           └── [9 pages + 7 tabs]

BEFORE (Seller):                         AFTER (Seller):
├── Home                                 ├── Home
├── Listings                             ├── Listings
├── RFQsInbox                            ├── RFQsInbox
├── RFQMarketplace                       ├── RFQMarketplace
├── Orders                               ├── Orders
├── Analytics                            ├── Analytics
├── Workspace                            ├── Workspace (expanded)
├── Settings                             │   ├── Invoices
├── PublicProfile        ──→ ORPHAN      │   ├── Stock
├── Dashboard            ──→ REMOVE      │   ├── Costs
├── Inventory            ──→ MERGE       │   ├── Buyers
├── DisputeInbox                         │   └── Inventory (new)
├── Payouts                              ├── Settings
├── Automation                           ├── DisputeInbox
├── Onboarding                           ├── Payouts
└── [15 pages]                           ├── Automation
                                         └── Onboarding
                                         └── [12 pages + 5 tabs]
```

---

## PHASE 2: UI & Design Unification

### Data Display Rules

| Data Type | Component | Location |
|-----------|-----------|----------|
| Operational data (orders, invoices, purchases) | **Table** | Workspace tabs |
| Discovery/browsing (marketplace items) | **Cards/Grid** | Marketplace |
| Summary/KPIs | **StatCard** | Dashboards |
| Insights/alerts | **InsightCard** | Dashboard tabs |
| Status indicators | **StatusBadge** | Everywhere (unified) |

### Component Consolidation

#### Status Badge Unification
**Issue:** Local status badge implementations in seller components
**Action:** Replace all local implementations with shared `StatusBadge`

Files to update:
- [SellerSales.tsx:66](src/features/portal/seller/components/SellerSales.tsx#L66) - Remove local OrderStatus badge
- [SellerInventory.tsx:46](src/features/portal/seller/components/SellerInventory.tsx#L46) - Remove local StockStatus badge

#### Comparison Modal Consolidation
**Issue:** `ManualCompareModal` (49K) and `HybridCompareModal` (27K) share ~40% code
**Action:** Extract shared logic

```
Extract to shared utilities:
├── utils/compareExport.ts      (PDF/Excel export logic)
├── utils/compareScoring.ts     (Scoring calculation)
├── utils/compareCsvImport.ts   (CSV parsing)
└── components/CompareModalBase.tsx (Shared modal structure)
```

#### Table Component Standardization
**Action:** All tables should use TanStack React Table with consistent patterns:
- Sorting via column headers
- Filtering via filter bar above table
- Pagination via shared pagination component
- Export via shared `ExportButton`

### Icon Mapping Fixes

Add missing icons to Sidebar iconMap:
```typescript
const iconMap: Record<string, Icon> = {
  // ... existing
  'rfq-marketplace': Storefront,  // Add
  'tracking': MapPin,              // Add (if keeping)
};
```

---

## PHASE 3: i18n & Text Sanity Check

### Translation Coverage

| Namespace | Total Keys | Translated (AR) | Missing |
|-----------|-----------|-----------------|---------|
| buyer.* | 393 | 0 | **393 (100% missing)** |
| seller.* | 497 | 87 | **410 (82% missing)** |
| **Total** | **890** | **87** | **803** |

### Priority Translation Batches

#### Batch 1: Navigation & Core UI (Immediate)
```
buyer.nav.*          (12 keys)
buyer.home.*         (6 keys)
buyer.workspace.*    (70 keys)
seller.nav.*         (already done)
```

#### Batch 2: Operational Pages (High Priority)
```
buyer.orders.*       (45 keys)
buyer.purchases.*    (73 keys)
buyer.invoices.*     (31 keys)
seller.orders.*      (77 keys)
seller.listings.*    (53 keys)
```

#### Batch 3: Secondary Features (Medium Priority)
```
buyer.marketplace.*  (17 keys)
buyer.rfq.*          (19 keys)
buyer.myRfqs.*       (22 keys)
seller.inbox.*       (17 keys)
seller.inventory.*   (21 keys)
```

#### Batch 4: Advanced Features (Lower Priority)
```
buyer.analytics.*    (21 keys)
buyer.expenses.*     (40 keys)
seller.analytics.*   (16 keys)
seller.settings.*    (67 keys)
seller.workspace.*   (57 keys)
```

### Fallback Logic Fix

Ensure LanguageContext provides proper fallback:
```typescript
// In LanguageContext.tsx
const t = (key: string): string => {
  const translation = translations[language]?.[key];
  if (!translation) {
    // Log missing key in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation: ${key}`);
    }
    // Return readable fallback, not the key
    return key.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || key;
  }
  return translation;
};
```

---

## PHASE 4: Performance & Code Cleanup

### Unused Components to Remove (~5,000 lines)

#### Seller Components (4,084 lines)
| File | Lines | Action |
|------|-------|--------|
| `OrderRiskWarnings.tsx` | 487 | Remove or integrate |
| `OrderStepTimeline.tsx` | 393 | Remove or integrate |
| `SellerDashboard.tsx` (component) | 401 | Remove (page exists) |
| `SellerCustomers.tsx` | 594 | Remove (unused) |
| `SellerExpenses.tsx` (component) | 686 | Remove (page exists) |
| `SellerInventory.tsx` (component) | 605 | Remove (page exists) |
| `SellerSales.tsx` | 607 | Remove (unused) |
| `VerificationBanner.tsx` | 311 | Integrate into onboarding |

#### Buyer Components (911 lines)
| File | Lines | Action |
|------|-------|--------|
| `AcceptQuoteDialog.tsx` | 377 | Integrate into MyRFQs or remove |
| `RejectQuoteDialog.tsx` | 261 | Integrate into MyRFQs or remove |
| `CartSummary.tsx` | 273 | Integrate into Cart or remove |

### Large Files to Refactor

#### Critical (>2,000 lines)
| File | Lines | Refactoring Plan |
|------|-------|------------------|
| `PortalContext.tsx` | 2,587 | Split into ThemeContext, TranslationContext, SidebarContext |
| `SellerOrders.tsx` | 3,105 | Extract OrderTable, OrderFilters, OrderTimeline, FulfillmentPanel |
| `Listings.tsx` | 2,382 | Extract ProductTable, ProductFilters, AddProductForm |
| `RFQsInbox.tsx` | 2,298 | Extract RFQTable, QuoteForm, CounterOfferPanel |
| `item.types.ts` | 2,281 | Split by domain: item.types, quote.types, order.types |
| `Marketplace.tsx` | 2,087 | Extract ProductGrid, FilterPanel, ComparisonPanel |

#### High Priority (1,500-2,000 lines)
| File | Lines | Refactoring Plan |
|------|-------|------------------|
| `SellerPayouts.tsx` | 1,994 | Extract PayoutTable, PayoutSettings, FundsTimeline |
| `AddProductPanel.tsx` | 1,812 | Extract VariantsForm, PricingForm, ImagesUpload |
| `SellerSettings.tsx` | 1,616 | Extract ProfileForm, CompanyForm, BankingForm, VerificationForm |

### Service Layer Cleanup

#### Deprecated Services to Remove
| Service | Replacement | Action |
|---------|-------------|--------|
| `orderService.ts` | `marketplaceOrderService.ts` | Mark deprecated, migrate callers |
| `inventoryService.ts` | `itemService.ts` | Merge into itemService |
| `dashboardService.ts` | Analytics services | Remove, use buyerAnalyticsService/sellerHomeSummaryService |

#### API Pattern Standardization
```typescript
// Standard service pattern:
export const serviceTemplate = {
  // 1. Always require token
  async getItems(token: string, filters?: Filters): Promise<PaginatedResponse<Item>> {

  // 2. Use consistent base URL
  const url = new URL(`${API_URL}/items`);

  // 3. Use URLSearchParams for filters
  if (filters?.status) url.searchParams.append('status', filters.status);

  // 4. Consistent error handling
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }

  // 5. Consistent response format
  return response.json() as Promise<PaginatedResponse<Item>>;
}
```

### Memoization Opportunities

Add React.memo to frequently re-rendered components:
```typescript
// Table row components
export const OrderRow = React.memo(({ order, onAction }: OrderRowProps) => { ... });

// Badge components
export const StatusBadge = React.memo(({ status, preset }: StatusBadgeProps) => { ... });

// Card components
export const StatCard = React.memo(({ label, value, change }: StatCardProps) => { ... });
```

### Virtualization Requirements

Tables needing virtualization (datasets >100 rows):
- OrdersTab (marketplace orders)
- PurchasesTab (purchase orders)
- InvoicesTab (invoices)
- Marketplace product grid
- Listings table

Recommended: Use `@tanstack/react-virtual` or `react-window`

---

## PHASE 5: Navigation & UX Polish

### Sidebar Structure

#### Buyer Portal (Simplified)
```
Sidebar Items (7 core modules):
├── Home
├── Marketplace
├── My RFQs
├── Workspace          ← Operational hub
├── Disputes
├── Analytics
└── Cart (icon in top bar, not sidebar)
```

#### Seller Portal (Simplified)
```
Sidebar Items (9 core modules):
├── Home
├── Listings
├── RFQ Inbox
├── RFQ Marketplace
├── Orders
├── Workspace          ← Operational hub
├── Payouts
├── Automation
└── Analytics
```

### Pages to Convert to Modals/Tabs

| Current Page | Convert To | Location |
|--------------|------------|----------|
| RequestQuote | Modal | Triggered from Marketplace/MyRFQs |
| ItemDetails | Modal/Drawer | Triggered from Marketplace |
| SellerPublicProfile | Modal | Triggered from supplier links |

### Navigation Flow Fixes

1. **Add breadcrumbs** to deep pages (ItemDetails, DisputeDetail)
2. **Add back button** for modal-like pages
3. **Fix orphaned pages** - Add navigation or remove
4. **Standardize page transitions** - Add loading states

---

## Implementation Checklist

### Week 1: Structure Cleanup
- [ ] Remove unused components (14 files, ~5,000 lines)
- [ ] Remove orphaned pages (4 pages)
- [ ] Create redirects for merged pages
- [ ] Update sidebar navigation

### Week 2: UI Unification
- [ ] Replace local StatusBadge implementations
- [ ] Extract shared comparison modal utilities
- [ ] Add missing icons to iconMap
- [ ] Standardize table component usage

### Week 3: i18n Completion
- [ ] Translate Batch 1 keys (88 keys)
- [ ] Translate Batch 2 keys (279 keys)
- [ ] Fix fallback logic
- [ ] Validate all UI strings render correctly

### Week 4: Performance & Polish
- [ ] Refactor PortalContext.tsx (split into 3 contexts)
- [ ] Add memoization to badge/card components
- [ ] Implement table virtualization for large datasets
- [ ] Clean up deprecated services

### Week 5: Testing & Validation
- [ ] Test all navigation flows
- [ ] Verify no broken links
- [ ] Test RTL layout
- [ ] Performance benchmark

---

## Confirmation

- [x] No new features added
- [x] Focus on fixing, unifying, and optimizing existing code
- [x] Comprehensive audit completed across all 5 phases
- [x] Cleanup plan ready for implementation

---

## Metrics After Cleanup

| Metric | Before | After (Target) |
|--------|--------|----------------|
| Buyer pages | 14 | 9 (+7 workspace tabs) |
| Seller pages | 15 | 12 (+5 workspace tabs) |
| Unused components | 14 | 0 |
| Untranslated keys | 803 | 0 |
| Files >2,000 lines | 6 | 0 |
| Deprecated services | 3 | 0 |
