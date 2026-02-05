# System Unification Strategy: Buyer Portal & Workspace

> **Goal:** Establish Workspace as the single source of truth while Buyer pages become focused entry points / deep links into the same data.

---

## 1. Ownership Mapping: Workspace Module → Buyer Page

The Workspace is the **operational hub**. Each tab owns the canonical data and logic. Buyer pages are **presentation views** that link into or summarize workspace data.

| Workspace Tab | Owns | Buyer Pages (Become Views Into) |
|---------------|------|--------------------------------|
| **OrdersTab** | All marketplace orders | `MyOrders` → Summary view with stats + link to workspace |
| **PurchasesTab** | Internal POs | `Purchases` → Smart filter view + link to workspace |
| **InvoicesTab** | All invoices | `BuyerInvoices` → Payment-focused view + link to workspace |
| **SuppliersTab** | Supplier directory & metrics | `BuyerSuppliers` → Card-based discovery view |
| **InventoryTab** | Stock levels & forecasts | *(No standalone page currently)* |
| **ExpensesTab** | Expense records & budget | `BuyerExpenses` → Analytics-focused view |
| **DashboardTab** | Intelligence & alerts | `BuyerAnalytics` → Period-based summary view |

### Navigation Contract

```
Buyer Page (Entry Point) ──→ Workspace Tab (Full Control)
         │                           │
         └── Quick stats             └── Full CRUD operations
         └── Top N items             └── Filtering, sorting, pagination
         └── CTAs to workspace       └── Bulk actions
         └── Single-focus views      └── Detail panels
```

---

## 2. Shared Components & Tables

### Core Data Table

Create **one** `<DataTable>` component used by all workspace tabs and buyer pages:

```typescript
// src/features/portal/components/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];

  // Filtering
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: FilterConfig[];

  // Pagination
  pageSize?: number;
  totalCount?: number;

  // Selection
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;

  // Actions
  rowActions?: (row: T) => ActionConfig[];
  bulkActions?: BulkActionConfig[];

  // Styling
  variant?: 'full' | 'compact' | 'minimal';
  emptyState?: EmptyStateConfig;

  // State sync
  onStateChange?: (state: TableState) => void;
  initialState?: Partial<TableState>;
}
```

**Usage:**
- `OrdersTab` → `<DataTable variant="full" />`
- `MyOrders` → `<DataTable variant="compact" pageSize={5} />`

### Shared Component Library

| Component | Location | Purpose |
|-----------|----------|---------|
| `<DataTable>` | `components/DataTable/` | All tabular data |
| `<StatCard>` | `components/StatCard.tsx` | Metric summaries |
| `<StatusBadge>` | `components/StatusBadge.tsx` | Status indicators |
| `<QuickActionCard>` | `components/QuickActionCard.tsx` | Action shortcuts |
| `<DetailPanel>` | `components/DetailPanel.tsx` | Slide-out details |
| `<FilterBar>` | `components/FilterBar.tsx` | Search + filters |
| `<ExpandableSection>` | `components/ExpandableSection.tsx` | Collapsible content |
| `<AlertBanner>` | `components/AlertBanner.tsx` | Intelligence alerts |

### Table Column Definitions

Centralize column definitions to ensure consistency:

```typescript
// src/features/portal/columns/orderColumns.ts
export const orderColumns = {
  id: createColumn('id', 'Order ID', { sortable: true }),
  status: createColumn('status', 'Status', {
    render: (value) => <StatusBadge status={value} />,
    filterable: true,
  }),
  total: createColumn('total', 'Total', {
    render: formatCurrency,
    sortable: true,
  }),
  // ... shared across OrdersTab and MyOrders
};
```

---

## 3. Entity Naming & State Contract

### Entity Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROCUREMENT LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────┘

  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
  │   RFQ   │ ───▶ │  Quote  │ ───▶ │  Order  │ ───▶ │ Invoice │
  └─────────┘      └─────────┘      └─────────┘      └─────────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
   REQUESTED        RECEIVED         CREATED          ISSUED
   PENDING          REVIEWING        CONFIRMED        PENDING
   QUOTED           NEGOTIATING      PROCESSING       PAID
   ACCEPTED         ACCEPTED         SHIPPED          OVERDUE
   REJECTED         REJECTED         DELIVERED        CANCELLED
   EXPIRED          EXPIRED          CANCELLED
                    COUNTERED        DISPUTED
                                     RETURNED

                                         │
                                         ▼
                                   ┌─────────┐
                                   │ Payment │
                                   └─────────┘
                                        │
                                        ▼
                                   AUTHORIZED
                                   CAPTURED
                                   REFUNDED
                                   FAILED

                                        │
                                        ▼ (Seller side)
                                   ┌─────────┐
                                   │  Payout │
                                   └─────────┘
                                        │
                                        ▼
                                   PENDING
                                   SCHEDULED
                                   PROCESSING
                                   COMPLETED
                                   FAILED
```

### Canonical Type Definitions

```typescript
// src/features/portal/types/entities.ts

/**
 * RFQ - Request for Quote
 * Buyer initiates a quote request for items
 */
export interface RFQ {
  id: string;
  buyerId: string;
  status: RFQStatus;
  items: RFQItem[];

  // Timing
  createdAt: Date;
  expiresAt: Date;

  // Requirements
  deliveryLocation: Address;
  preferredDeliveryDate?: Date;
  notes?: string;

  // Tracking
  quotesReceived: number;
  selectedQuoteId?: string;
}

export type RFQStatus =
  | 'draft'           // Not yet submitted
  | 'pending'         // Awaiting seller quotes
  | 'quoted'          // Has at least one quote
  | 'accepted'        // Buyer accepted a quote → Order created
  | 'rejected'        // Buyer rejected all quotes
  | 'expired';        // Passed expiration date

/**
 * Quote - Seller's response to an RFQ
 */
export interface Quote {
  id: string;
  rfqId: string;
  sellerId: string;
  status: QuoteStatus;

  // Pricing
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxes: number;
  shipping: number;
  total: number;

  // Terms
  validUntil: Date;
  estimatedDelivery: Date;
  paymentTerms: string;
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type QuoteStatus =
  | 'draft'           // Seller preparing
  | 'submitted'       // Sent to buyer
  | 'reviewing'       // Buyer is reviewing
  | 'negotiating'     // Counter-offer in progress
  | 'accepted'        // Buyer accepted → Order created
  | 'rejected'        // Buyer rejected
  | 'expired'         // Passed validity date
  | 'withdrawn';      // Seller withdrew

/**
 * Order - Confirmed purchase transaction
 */
export interface Order {
  id: string;
  source: OrderSource;
  sourceId?: string;  // RFQ ID or null for direct buy

  buyerId: string;
  sellerId: string;
  status: OrderStatus;

  // Items & Pricing
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  shipping: number;
  total: number;

  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod?: string;

  // Fulfillment
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress: Address;
  trackingNumber?: string;
  carrier?: string;

  // Health (computed)
  healthStatus: OrderHealthStatus;
  healthReason?: string;

  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

export type OrderSource = 'rfq' | 'direct_buy' | 'cart';

export type OrderStatus =
  | 'pending_confirmation'  // Awaiting seller confirmation
  | 'confirmed'             // Seller accepted
  | 'processing'            // Being prepared
  | 'shipped'               // In transit
  | 'delivered'             // Completed successfully
  | 'cancelled'             // Cancelled by either party
  | 'disputed'              // Under dispute
  | 'returned';             // Return completed

export type PaymentStatus =
  | 'unpaid'        // No payment yet
  | 'authorized'    // Card authorized, not captured
  | 'paid'          // Payment captured
  | 'partially_refunded'
  | 'refunded'      // Full refund
  | 'failed';       // Payment failed

export type FulfillmentStatus =
  | 'unfulfilled'       // Not started
  | 'partially_fulfilled'
  | 'fulfilled'         // All items shipped
  | 'delivered';        // Confirmed delivery

export type OrderHealthStatus =
  | 'on_track'      // Everything normal
  | 'at_risk'       // Potential delay
  | 'delayed'       // Behind schedule
  | 'critical';     // Requires immediate attention

/**
 * Invoice - Payment document for an order
 */
export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: InvoiceStatus;

  // Parties
  buyerId: string;
  sellerId: string;

  // Amounts
  subtotal: number;
  taxes: number;
  shipping: number;
  total: number;
  amountPaid: number;
  amountDue: number;

  // Dates
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;

  // Document
  pdfUrl?: string;
}

export type InvoiceStatus =
  | 'draft'         // Not yet issued
  | 'issued'        // Sent to buyer
  | 'paid'          // Fully paid
  | 'partially_paid'
  | 'overdue'       // Past due date
  | 'cancelled'     // Voided
  | 'disputed';     // Under dispute

/**
 * Payment - Individual payment transaction
 */
export interface Payment {
  id: string;
  invoiceId: string;
  orderId: string;
  status: PaymentTransactionStatus;

  // Amount
  amount: number;
  currency: string;

  // Method
  method: PaymentMethod;
  processorId?: string;  // Stripe, etc.

  // Timestamps
  initiatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;

  // Failure
  failureReason?: string;
}

export type PaymentTransactionStatus =
  | 'pending'       // Initiated
  | 'processing'    // With processor
  | 'authorized'    // Authorized, not captured
  | 'captured'      // Completed
  | 'failed'        // Failed
  | 'refunded';     // Reversed

export type PaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'wallet'
  | 'net_terms';

/**
 * Payout - Seller disbursement
 */
export interface Payout {
  id: string;
  sellerId: string;
  status: PayoutStatus;

  // Amount
  grossAmount: number;
  platformFee: number;
  processingFee: number;
  netAmount: number;
  currency: string;

  // Included orders
  orderIds: string[];
  invoiceIds: string[];

  // Timing
  periodStart: Date;
  periodEnd: Date;
  scheduledAt: Date;
  processedAt?: Date;

  // Destination
  bankAccountId: string;
  transactionRef?: string;
}

export type PayoutStatus =
  | 'pending'       // Awaiting schedule
  | 'scheduled'     // Will process on scheduledAt
  | 'processing'    // In progress
  | 'completed'     // Funds transferred
  | 'failed'        // Transfer failed
  | 'on_hold';      // Held for review
```

### State Machine Transitions

```typescript
// src/features/portal/state/transitions.ts

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'pending_confirmation': ['confirmed', 'cancelled'],
  'confirmed': ['processing', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'disputed', 'returned'],
  'delivered': ['disputed', 'returned'],
  'cancelled': [],
  'disputed': ['cancelled', 'delivered', 'returned'],
  'returned': [],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  'draft': ['issued', 'cancelled'],
  'issued': ['paid', 'partially_paid', 'overdue', 'cancelled', 'disputed'],
  'partially_paid': ['paid', 'overdue', 'cancelled', 'disputed'],
  'paid': ['disputed'],
  'overdue': ['paid', 'partially_paid', 'cancelled', 'disputed'],
  'cancelled': [],
  'disputed': ['paid', 'cancelled'],
};
```

---

## 4. UI Patterns to Standardize

### Pattern 1: Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ContentTopBar (notifications, cart, profile)              │
├──────────────┬──────────────────────────────────────────────┤
│              │  PageHeader                                  │
│              │  ├─ Title                                    │
│   Sidebar    │  ├─ Subtitle (optional)                      │
│              │  └─ Actions (primary CTA)                    │
│              ├──────────────────────────────────────────────│
│              │  Content Area                                │
│              │  ├─ FilterBar (if table)                     │
│              │  ├─ Main Content (table/cards/dashboard)     │
│              │  └─ Pagination (if applicable)               │
│              ├──────────────────────────────────────────────│
│              │  DetailPanel (slide-out, if open)            │
└──────────────┴──────────────────────────────────────────────┘
```

### Pattern 2: Stats Summary Bar

Use at the top of list pages to show quick counts:

```typescript
<StatBar>
  <StatCard label="Total" value={totalCount} />
  <StatCard label="Active" value={activeCount} variant="info" />
  <StatCard label="At Risk" value={atRiskCount} variant="warning" />
  <StatCard label="Overdue" value={overdueCount} variant="error" />
</StatBar>
```

### Pattern 3: Status Badge Colors

Standardize across all entities:

| Status Category | Color | Tailwind Class |
|-----------------|-------|----------------|
| Draft / Pending | Gray | `bg-gray-100 text-gray-700` |
| Active / Processing | Blue | `bg-blue-100 text-blue-700` |
| Success / Completed | Green | `bg-green-100 text-green-700` |
| Warning / At Risk | Amber | `bg-amber-100 text-amber-700` |
| Error / Critical | Red | `bg-red-100 text-red-700` |
| Info / Shipped | Indigo | `bg-indigo-100 text-indigo-700` |

### Pattern 4: Empty States

```typescript
<EmptyState
  icon={<InboxIcon />}
  title="No orders yet"
  description="Your orders will appear here once you make a purchase"
  action={{
    label: "Browse Marketplace",
    onClick: () => navigate('marketplace')
  }}
/>
```

### Pattern 5: Filter Bar

```typescript
<FilterBar
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search orders..."

  filters={[
    { key: 'status', label: 'Status', options: ORDER_STATUS_OPTIONS },
    { key: 'dateRange', label: 'Date', type: 'date-range' },
    { key: 'seller', label: 'Seller', options: sellerOptions },
  ]}
  filterValues={filters}
  onFilterChange={setFilters}

  sortOptions={SORT_OPTIONS}
  sortValue={sort}
  onSortChange={setSort}
/>
```

### Pattern 6: Detail Panel

Slide-out panel for viewing/editing entity details:

```typescript
<DetailPanel
  open={!!selectedId}
  onClose={() => setSelectedId(null)}
  title="Order Details"
  subtitle={`#${selectedOrder?.id}`}

  // Actions at top
  actions={[
    { label: 'Edit', icon: EditIcon, onClick: handleEdit },
    { label: 'Cancel', icon: XIcon, onClick: handleCancel, variant: 'danger' },
  ]}
>
  <DetailSection title="Summary">
    {/* Content */}
  </DetailSection>

  <DetailSection title="Items">
    {/* Content */}
  </DetailSection>

  <DetailSection title="Timeline">
    <ActivityTimeline events={order.events} />
  </DetailSection>
</DetailPanel>
```

### Pattern 7: Quick Actions

For summary pages (MyOrders, BuyerHome):

```typescript
<QuickActionGrid>
  <QuickActionCard
    icon={<PlusIcon />}
    label="Create RFQ"
    onClick={() => navigate('create-rfq')}
  />
  <QuickActionCard
    icon={<SearchIcon />}
    label="Browse Marketplace"
    onClick={() => navigate('marketplace')}
  />
  <QuickActionCard
    icon={<TruckIcon />}
    label="Track Shipments"
    onClick={() => navigate('tracking')}
  />
</QuickActionGrid>
```

### Pattern 8: Navigation from Summary to Workspace

```typescript
// MyOrders.tsx (summary page)
<Button
  variant="secondary"
  onClick={() => navigate('workspace', {
    tab: 'orders',
    filters: { status: 'at_risk' }
  })}
>
  View all at-risk orders →
</Button>
```

---

## 5. Data Flow Architecture

### Single Source of Truth

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                              │
│  (Canonical data fetching, caching, mutations)                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         WORKSPACE CONTEXT                           │
│  - Orders state                                                     │
│  - Purchases state                                                  │
│  - Invoices state                                                   │
│  - Suppliers state                                                  │
│  - Inventory state                                                  │
│  - Expenses state                                                   │
│  - Computed: alerts, health metrics, analytics                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌────────────┐     ┌────────────┐     ┌────────────┐
       │ Workspace  │     │  Buyer     │     │  Detail    │
       │   Tabs     │     │  Pages     │     │  Panels    │
       │ (full UI)  │     │ (summary)  │     │ (focused)  │
       └────────────┘     └────────────┘     └────────────┘
```

### Context Structure

```typescript
// src/features/portal/context/BuyerWorkspaceContext.tsx

interface BuyerWorkspaceState {
  // Data
  orders: Order[];
  purchases: Purchase[];
  invoices: Invoice[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  expenses: Expense[];

  // Loading states
  loading: {
    orders: boolean;
    purchases: boolean;
    invoices: boolean;
    suppliers: boolean;
    inventory: boolean;
    expenses: boolean;
  };

  // Computed
  alerts: Alert[];
  healthSummary: HealthSummary;
  analytics: AnalyticsSummary;

  // Actions
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  // ... other mutations
}
```

---

## 6. Implementation Phases

### Phase 1: Foundation (No UI Changes)
- [ ] Define canonical types in `types/entities.ts`
- [ ] Create state transitions in `state/transitions.ts`
- [ ] Establish `BuyerWorkspaceContext` provider
- [ ] Migrate services to return canonical types

### Phase 2: Shared Components
- [ ] Extract `<DataTable>` component
- [ ] Extract `<StatCard>`, `<StatusBadge>`, `<QuickActionCard>`
- [ ] Create `<FilterBar>` component
- [ ] Create `<DetailPanel>` component
- [ ] Create `<EmptyState>` component

### Phase 3: Workspace Consolidation
- [ ] Refactor workspace tabs to use shared components
- [ ] Ensure all tabs consume from `BuyerWorkspaceContext`
- [ ] Standardize column definitions

### Phase 4: Buyer Page Simplification
- [ ] Refactor `MyOrders` to consume from context, link to workspace
- [ ] Refactor `Purchases` to consume from context, link to workspace
- [ ] Refactor `BuyerInvoices` to consume from context, link to workspace
- [ ] Refactor `BuyerSuppliers` to consume from context, link to workspace
- [ ] Refactor `BuyerExpenses` to consume from context, link to workspace
- [ ] Refactor `BuyerAnalytics` to consume computed analytics from context

### Phase 5: Cleanup
- [ ] Remove duplicate mock data generators
- [ ] Remove duplicate components
- [ ] Ensure consistent navigation patterns
- [ ] Add URL-based state for deep linking

---

## 7. Decision Log

| Decision | Rationale |
|----------|-----------|
| Workspace = Source of Truth | Prevents data sync issues, single place for CRUD |
| Buyer Pages = Views | Reduces code duplication, simpler maintenance |
| Context over Props | Avoids prop drilling, enables cross-component access |
| Centralized Column Definitions | Consistency across table implementations |
| Status Badge Color System | Visual consistency, accessibility |
| Detail Panel Pattern | Prevents navigation away, keeps context |

---

## 8. Migration Checklist

Before modifying any component, verify:

- [ ] Is this data owned by a workspace tab?
- [ ] Is this component already in the shared library?
- [ ] Does the type match the canonical definition?
- [ ] Does the status badge use the standard colors?
- [ ] Does navigation pass filters to workspace correctly?
- [ ] Is the empty state using the standard component?
- [ ] Is the loading state consistent?

---

*This document is the source of truth for the unification strategy. All future development should align with these patterns.*
