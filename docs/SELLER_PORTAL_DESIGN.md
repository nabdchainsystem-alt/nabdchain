# Seller Portal - Comprehensive Design Documentation

> Technical specifications for Seller Settings, Public Profile, Dashboard, Inventory, and Orders pages.

## Table of Contents
1. [Seller Settings](#1-seller-settings)
2. [Seller Public Profile](#2-seller-public-profile)
3. [Seller Dashboard](#3-seller-dashboard)
4. [Seller Inventory](#4-seller-inventory)
5. [Seller Orders](#5-seller-orders)
6. [Data Pipelines](#6-data-pipelines)
7. [Backend Validation](#7-backend-validation)

---

## 1. Seller Settings

### Overview
Step-based single-page onboarding for seller verification and compliance.

### Data Requirements
```typescript
interface SellerProfile {
  displayName: string;
  slug: string;
  shortDescription: string;
  logoUrl: string;
  coverUrl: string;
  company: SellerCompany;
  address: SellerAddress;
  bank: SellerBank;
  contact: SellerContact;
  documents: SellerDocument[];
}

interface VerificationStatus {
  profileStatus: 'complete' | 'incomplete';
  documentsStatus: 'pending' | 'approved' | 'rejected';
  payoutStatus: 'pending' | 'verified';
  canPublish: boolean;
}
```

### Auto-Save Logic
```
1. Debounce form changes (3 seconds)
2. On debounce timeout:
   - Set autoSaving = true
   - POST each section that has required fields filled
   - Update lastSaved timestamp
   - Set autoSaving = false
3. Clear localStorage draft on successful manual save
```

### Document Validation States
| State | Trigger | User Action |
|-------|---------|-------------|
| `not_uploaded` | Initial | Upload button active |
| `pending` | After upload | "Under Review" badge |
| `approved` | Admin approval | Green checkmark |
| `rejected` | Admin rejection | Re-upload prompt |

### Backend Validation Flow
```
POST /api/seller/profile
├─ Validate displayName (3-100 chars, no special chars)
├─ Validate slug (lowercase, alphanumeric, unique)
├─ Sanitize shortDescription (max 160 chars)
└─ Return updated profile

POST /api/seller/company
├─ Validate legalName (required, 3-200 chars)
├─ Validate CR number (10-15 digits for Saudi)
├─ Validate VAT number (15 digits starting with 3)
└─ Cross-check CR against government API (async)

POST /api/seller/bank
├─ Validate IBAN format (SA + 22 chars)
├─ Verify IBAN checksum
├─ Check account holder name matches company
└─ Return masked IBAN (show first 4, last 4)
```

### Approval Workflow
```
1. Seller completes profile (100%)
2. System creates verification request
3. Admin reviews documents:
   - CR Document → Validate against ZATCA
   - VAT Certificate → Cross-reference VAT number
   - Bank Letter → Verify IBAN matches
4. Admin approves/rejects each document
5. When all approved: canPublish = true
6. Seller can now list products publicly
```

---

## 2. Seller Public Profile

### Overview
Marketing-focused storefront similar to Amazon seller pages.

### Data Source (Public API)
```typescript
interface PublicSellerProfile {
  displayName: string;
  slug: string;
  shortDescription: string;
  logoUrl: string;
  coverUrl: string;
  verified: boolean;
  vatRegistered: boolean;
  memberSince: string;
  location: { city: string; country: string };
  statistics: SellerStatistics;
}

interface SellerStatistics {
  totalProducts: number;
  totalOrders: number;
  responseRate: number;
  responseTime: string;
  fulfillmentRate: number;
  rfqWinRate: number;
}
```

### Data Safety Rules
```
1. NEVER expose sensitive data:
   - No IBAN, CR, VAT numbers on public profile
   - No buyer emails or contact info
   - No internal pricing/cost data

2. Rate limiting:
   - GET /api/public/seller/:slug → 100 req/min per IP
   - GET /api/public/seller/:slug/products → 50 req/min per IP

3. Aggregated statistics only:
   - totalOrders → Count only, no amounts
   - responseTime → Averaged, not per-order
   - fulfillmentRate → Percentage, no raw numbers
```

### Product Listing API
```
GET /api/public/seller/:slug/products
├─ Filter: visibility = 'public' AND status = 'active'
├─ Sort: newest | price_low | price_high | popular
├─ Pagination: page, limit (max 50)
└─ Response: Minimal product data (no cost, margin)
```

---

## 3. Seller Dashboard

### Overview
Executive-level business health metrics. Calm, insight-first design.

### Core Metrics

#### Fulfillment Risk
```typescript
interface FulfillmentRisk {
  ordersAtRisk: number;      // SLA deadline within 24h
  ordersCritical: number;    // SLA missed or imminent
  ordersDelayed: number;     // Already past SLA
  avgFulfillmentTime: number; // Hours from order to ship
  slaCompliance: number;     // % orders shipped on time
  predictedLateShipments: number;
  riskTrend: 'improving' | 'stable' | 'worsening';
}
```

**Calculation Pipeline:**
```sql
-- Orders at risk (SLA deadline within 24 hours)
SELECT COUNT(*) FROM orders
WHERE status IN ('pending_confirmation', 'confirmed', 'in_progress')
AND sla_deadline - NOW() < INTERVAL '24 hours'
AND sla_deadline > NOW();

-- Predicted late shipments (ML model input)
SELECT * FROM orders
WHERE status = 'pending_confirmation'
AND created_at < NOW() - INTERVAL '48 hours';
```

#### Inventory Exposure
```typescript
interface InventoryExposure {
  totalInventoryValue: number;
  overstockValue: number;      // Stock > 90 days supply
  overstockItems: number;
  lowTurnoverItems: number;    // < 1 sale per month
  deadStockValue: number;      // No sales in 90 days
  healthyStockPercentage: number;
  avgDaysToSell: number;
  exposureRisk: 'low' | 'moderate' | 'high';
}
```

**Calculation Pipeline:**
```sql
-- Days of stock calculation
WITH sales_velocity AS (
  SELECT item_id,
         COUNT(*) / 30.0 as daily_sales_rate
  FROM order_items
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY item_id
)
SELECT i.id,
       i.current_stock / NULLIF(sv.daily_sales_rate, 0) as days_of_stock
FROM items i
LEFT JOIN sales_velocity sv ON i.id = sv.item_id;

-- Dead stock (no sales in 90 days)
SELECT SUM(current_stock * unit_cost) as dead_stock_value
FROM items i
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.item_id = i.id
  AND o.created_at > NOW() - INTERVAL '90 days'
);
```

#### Revenue Concentration
```typescript
interface RevenueConcentration {
  topBuyerPercentage: number;
  topBuyerName: string;
  top5BuyersPercentage: number;
  singleProductPercentage: number;
  topProductName: string;
  diversificationScore: number; // 0-100
  revenueAtRisk: number;
}
```

**Diversification Score Formula:**
```
Score = 100 - (
  (topBuyerPercentage * 0.4) +
  (singleProductPercentage * 0.3) +
  ((100 - categorySpread) * 0.3)
)

Where:
- topBuyerPercentage: % of revenue from #1 buyer
- singleProductPercentage: % of revenue from #1 product
- categorySpread: Number of categories with >5% revenue
```

#### Buyer Behavior
```typescript
interface BuyerBehavior {
  activeQuotes: number;
  quotesToOrderRate: number;   // RFQs that convert to orders
  repeatBuyerRate: number;     // Orders from returning buyers
  avgOrderValue: number;
  buyerChurnRisk: number;      // % inactive > 60 days
  newBuyersThisMonth: number;
  avgTimeToReorder: number;    // Days between orders
}
```

### Health Score Calculation
```typescript
function calculateHealthScore(
  fulfillment: FulfillmentRisk,
  inventory: InventoryExposure,
  concentration: RevenueConcentration,
  behavior: BuyerBehavior
): number {
  const weights = {
    fulfillment: 0.30,
    inventory: 0.25,
    concentration: 0.20,
    behavior: 0.25
  };

  const fulfillmentScore =
    (fulfillment.slaCompliance * 0.5) +
    ((100 - fulfillment.ordersAtRisk * 5) * 0.5);

  const inventoryScore = inventory.healthyStockPercentage;

  const concentrationScore = concentration.diversificationScore;

  const behaviorScore =
    (behavior.quotesToOrderRate * 0.4) +
    (behavior.repeatBuyerRate * 0.4) +
    ((100 - behavior.buyerChurnRisk) * 0.2);

  return Math.round(
    fulfillmentScore * weights.fulfillment +
    inventoryScore * weights.inventory +
    concentrationScore * weights.concentration +
    behaviorScore * weights.behavior
  );
}
```

---

## 4. Seller Inventory

### Overview
Risk-focused inventory management with actionable recommendations.

### Stock Health Classification
```typescript
type StockHealth =
  | 'healthy'        // 14-90 days of stock
  | 'overstock'      // > 90 days of stock
  | 'low_turnover'   // < 1 sale per month, < 90 days stock
  | 'dead_stock'     // No sales in 90 days
  | 'stockout_risk'; // < 7 days of stock

function classifyStockHealth(item: InventoryItem): StockHealth {
  const daysOfStock = item.availableStock / (item.turnoverRate / 30);

  if (daysOfStock < 7 && item.turnoverRate > 5) {
    return 'stockout_risk';
  }
  if (daysOfStock > 120 || (daysOfStock > 90 && item.salesLast90Days === 0)) {
    return 'dead_stock';
  }
  if (daysOfStock > 90) {
    return 'low_turnover';
  }
  if (daysOfStock > 60 && item.currentStock > 50) {
    return 'overstock';
  }
  return 'healthy';
}
```

### Demand Signal Classification
```typescript
type DemandSignal = 'hot' | 'rising' | 'stable' | 'declining' | 'dormant';

function classifyDemandSignal(item: InventoryItem): DemandSignal {
  const { rfqsLast30Days, salesLast30Days, salesLast90Days, viewsLast30Days } = item;

  // Hot: High RFQ activity or strong sales with good RFQ flow
  if (rfqsLast30Days > 10 || (salesLast30Days > 20 && rfqsLast30Days > 5)) {
    return 'hot';
  }

  // Rising: RFQs exceeding current sales (future demand indicator)
  if (rfqsLast30Days > salesLast30Days * 0.5) {
    return 'rising';
  }

  // Stable: Consistent activity
  if (salesLast30Days > 0 || rfqsLast30Days > 0) {
    return 'stable';
  }

  // Declining: Had sales historically but not recently
  if (salesLast90Days > 0) {
    return 'declining';
  }

  return 'dormant';
}
```

### Pricing Action Recommendations
```typescript
type PricingAction = 'increase' | 'decrease' | 'bundle' | 'clearance' | 'hold';

function suggestPricingAction(
  health: StockHealth,
  demand: DemandSignal,
  margin: number
): { action: PricingAction; reason: string } {
  // Dead stock → Clearance
  if (health === 'dead_stock') {
    return {
      action: 'clearance',
      reason: 'No sales in 90+ days, consider clearance pricing'
    };
  }

  // Overstock with declining demand → Price decrease
  if (health === 'overstock' && demand === 'declining') {
    return {
      action: 'decrease',
      reason: 'Excess inventory with declining demand'
    };
  }

  // Hot demand with healthy stock → Price increase opportunity
  if (demand === 'hot' && health === 'healthy' && margin < 40) {
    return {
      action: 'increase',
      reason: 'High demand allows for price optimization'
    };
  }

  // Low turnover → Bundle with fast movers
  if (health === 'low_turnover') {
    return {
      action: 'bundle',
      reason: 'Bundle with fast-moving items to increase turnover'
    };
  }

  return { action: 'hold', reason: 'Current pricing is optimal' };
}
```

### Demand-Supply Matching Logic
```typescript
interface DemandSupplyMatch {
  itemId: string;
  currentSupply: number;
  projectedDemand: number;    // Based on RFQ + sales trends
  supplyGap: number;          // negative = oversupply
  recommendedReorder: number;
  reorderUrgency: 'immediate' | 'soon' | 'normal' | 'none';
}

function calculateDemandSupplyMatch(item: InventoryItem): DemandSupplyMatch {
  // Project demand based on:
  // 1. Historical sales velocity
  // 2. Current RFQ pipeline (weighted by conversion rate)
  // 3. Seasonality factor (if available)

  const salesVelocity = item.salesLast30Days;
  const rfqPipeline = item.rfqsLast30Days * 0.42; // 42% avg conversion
  const projectedDemand30Days = salesVelocity + rfqPipeline;

  const currentSupply = item.availableStock;
  const supplyGap = currentSupply - (projectedDemand30Days * 2); // 60-day buffer

  let reorderUrgency: 'immediate' | 'soon' | 'normal' | 'none';
  let recommendedReorder = 0;

  if (supplyGap < 0) {
    recommendedReorder = Math.abs(supplyGap) + projectedDemand30Days;
    reorderUrgency = supplyGap < -projectedDemand30Days ? 'immediate' : 'soon';
  } else if (supplyGap < projectedDemand30Days) {
    recommendedReorder = projectedDemand30Days;
    reorderUrgency = 'normal';
  } else {
    reorderUrgency = 'none';
  }

  return {
    itemId: item.id,
    currentSupply,
    projectedDemand: projectedDemand30Days,
    supplyGap,
    recommendedReorder,
    reorderUrgency
  };
}
```

---

## 5. Seller Orders

### Overview
Fulfillment control system with SLA tracking and predictions.

### SLA Risk Indicators
```typescript
interface SLAConfig {
  confirmationDeadline: number;  // Hours to confirm (default: 48)
  shippingDeadline: number;      // Hours to ship after confirm (default: 72)
  deliveryDeadline: number;      // Hours to deliver after ship (default: 168)
}

interface OrderSLAStatus {
  stage: 'confirmation' | 'shipping' | 'delivery';
  deadline: Date;
  hoursRemaining: number;
  riskLevel: 'safe' | 'warning' | 'critical' | 'breached';
}

function calculateSLAStatus(order: Order, config: SLAConfig): OrderSLAStatus {
  const now = new Date();
  let stage: 'confirmation' | 'shipping' | 'delivery';
  let deadline: Date;

  if (order.status === 'pending_confirmation') {
    stage = 'confirmation';
    deadline = new Date(order.createdAt);
    deadline.setHours(deadline.getHours() + config.confirmationDeadline);
  } else if (['confirmed', 'in_progress'].includes(order.status)) {
    stage = 'shipping';
    deadline = new Date(order.confirmedAt!);
    deadline.setHours(deadline.getHours() + config.shippingDeadline);
  } else {
    stage = 'delivery';
    deadline = new Date(order.shippedAt!);
    deadline.setHours(deadline.getHours() + config.deliveryDeadline);
  }

  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  let riskLevel: 'safe' | 'warning' | 'critical' | 'breached';
  if (hoursRemaining < 0) {
    riskLevel = 'breached';
  } else if (hoursRemaining < 6) {
    riskLevel = 'critical';
  } else if (hoursRemaining < 24) {
    riskLevel = 'warning';
  } else {
    riskLevel = 'safe';
  }

  return { stage, deadline, hoursRemaining, riskLevel };
}
```

### Late Shipment Prediction
```typescript
interface LateShipmentPrediction {
  orderId: string;
  probability: number;         // 0-100%
  predictedDelay: number;      // Hours
  riskFactors: string[];
  suggestedAction: string;
}

function predictLateShipment(order: Order, sellerHistory: SellerMetrics): LateShipmentPrediction {
  const factors: string[] = [];
  let probability = 0;

  // Factor 1: Time since order creation
  const hoursSinceCreation = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation > 36 && order.status === 'pending_confirmation') {
    probability += 30;
    factors.push('Order pending for >36 hours');
  }

  // Factor 2: Seller's historical performance
  if (sellerHistory.avgConfirmationTime > 24) {
    probability += 20;
    factors.push('Seller typically slow to confirm');
  }

  // Factor 3: Stock availability
  if (order.itemStock < order.quantity) {
    probability += 40;
    factors.push('Insufficient stock');
  }

  // Factor 4: Weekend/holiday proximity
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    probability += 10;
    factors.push('Weekend proximity');
  }

  probability = Math.min(probability, 99);

  return {
    orderId: order.id,
    probability,
    predictedDelay: probability > 50 ? Math.round(probability * 0.5) : 0,
    riskFactors: factors,
    suggestedAction: getSuggestedAction(probability, factors)
  };
}

function getSuggestedAction(probability: number, factors: string[]): string {
  if (factors.includes('Insufficient stock')) {
    return 'Source inventory or contact buyer about delay';
  }
  if (probability > 70) {
    return 'Prioritize this order for immediate processing';
  }
  if (probability > 40) {
    return 'Review and confirm within next 4 hours';
  }
  return 'Monitor and process in normal queue';
}
```

### Buyer Priority Scoring
```typescript
interface BuyerPriority {
  buyerId: string;
  score: number;               // 0-100
  tier: 'vip' | 'premium' | 'standard' | 'new';
  factors: BuyerPriorityFactors;
}

interface BuyerPriorityFactors {
  totalSpend: number;
  orderCount: number;
  repeatRate: number;
  avgOrderValue: number;
  paymentReliability: number;  // % paid on time
  lastOrderDate: Date;
}

function calculateBuyerPriority(factors: BuyerPriorityFactors): BuyerPriority {
  const weights = {
    totalSpend: 0.25,
    orderCount: 0.20,
    repeatRate: 0.20,
    avgOrderValue: 0.15,
    paymentReliability: 0.15,
    recency: 0.05
  };

  // Normalize each factor to 0-100 scale
  const spendScore = Math.min(factors.totalSpend / 100000 * 100, 100);
  const orderScore = Math.min(factors.orderCount / 50 * 100, 100);
  const repeatScore = factors.repeatRate;
  const aovScore = Math.min(factors.avgOrderValue / 10000 * 100, 100);
  const paymentScore = factors.paymentReliability;

  const daysSinceLastOrder = (Date.now() - factors.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 100 - daysSinceLastOrder);

  const totalScore = Math.round(
    spendScore * weights.totalSpend +
    orderScore * weights.orderCount +
    repeatScore * weights.repeatRate +
    aovScore * weights.avgOrderValue +
    paymentScore * weights.paymentReliability +
    recencyScore * weights.recency
  );

  let tier: 'vip' | 'premium' | 'standard' | 'new';
  if (factors.orderCount === 0) {
    tier = 'new';
  } else if (totalScore >= 80) {
    tier = 'vip';
  } else if (totalScore >= 50) {
    tier = 'premium';
  } else {
    tier = 'standard';
  }

  return {
    buyerId: factors.buyerId,
    score: totalScore,
    tier,
    factors
  };
}
```

---

## 6. Data Pipelines

### Real-Time Data Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   API       │────▶│   Database  │
│   (React)   │◀────│   (Express) │◀────│   (Postgres)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │   Redis     │            │
       │            │   (Cache)   │            │
       │            └─────────────┘            │
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                    ┌─────────────┐
                    │   Metrics   │
                    │   Service   │
                    └─────────────┘
```

### Cache Strategy
```typescript
const CACHE_CONFIG = {
  // Dashboard metrics - refreshed every 5 minutes
  'seller:dashboard:{sellerId}': { ttl: 300 },

  // Inventory summary - refreshed on stock change
  'seller:inventory:{sellerId}': { ttl: 60, invalidateOn: ['stock_change'] },

  // Public profile - cached for 1 hour
  'public:seller:{slug}': { ttl: 3600 },

  // Order stats - real-time, no cache
  'seller:orders:stats:{sellerId}': { ttl: 0 },
};
```

### Background Jobs
```typescript
// Scheduled jobs (cron)
const BACKGROUND_JOBS = [
  {
    name: 'calculate-seller-metrics',
    schedule: '*/5 * * * *',  // Every 5 minutes
    handler: async () => {
      // Recalculate dashboard metrics for active sellers
    }
  },
  {
    name: 'update-demand-signals',
    schedule: '0 * * * *',    // Every hour
    handler: async () => {
      // Recalculate demand signals for all inventory
    }
  },
  {
    name: 'sla-breach-alerts',
    schedule: '*/15 * * * *', // Every 15 minutes
    handler: async () => {
      // Check for SLA breaches and send alerts
    }
  },
  {
    name: 'dead-stock-report',
    schedule: '0 0 * * 0',    // Weekly on Sunday
    handler: async () => {
      // Generate dead stock reports for sellers
    }
  }
];
```

---

## 7. Backend Validation

### Seller Settings Validation
```typescript
// Zod schemas for API validation

const sellerProfileSchema = z.object({
  displayName: z.string().min(3).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().max(160).optional(),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

const sellerCompanySchema = z.object({
  legalName: z.string().min(3).max(200),
  crNumber: z.string().regex(/^\d{10,15}$/),  // Saudi CR format
  vatNumber: z.string().regex(/^3\d{14}$/).optional(),  // Saudi VAT format
  companyType: z.enum(['llc', 'establishment', 'corporation', 'partnership', 'branch']),
  dateOfEstablishment: z.string().datetime().optional(),
});

const sellerBankSchema = z.object({
  bankName: z.string().min(3).max(100),
  accountHolderName: z.string().min(3).max(200),
  iban: z.string().regex(/^SA\d{22}$/),  // Saudi IBAN format
  currency: z.enum(['SAR', 'USD', 'EUR', 'AED']),
});

// IBAN validation
function validateIBAN(iban: string): boolean {
  // Move first 4 chars to end
  const rearranged = iban.slice(4) + iban.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, etc.)
  const numericString = rearranged.replace(/[A-Z]/g,
    (char) => (char.charCodeAt(0) - 55).toString()
  );

  // Calculate modulo 97
  let remainder = 0;
  for (const digit of numericString) {
    remainder = (remainder * 10 + parseInt(digit)) % 97;
  }

  return remainder === 1;
}
```

### Order Validation
```typescript
const orderTransitionSchema = z.object({
  fromStatus: z.enum(['pending_confirmation', 'confirmed', 'in_progress', 'shipped']),
  toStatus: z.enum(['confirmed', 'in_progress', 'shipped', 'delivered', 'cancelled']),
});

// Validate state transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['shipped', 'cancelled'],
  shipped: ['delivered', 'failed'],
  delivered: [],  // Terminal state
  cancelled: [],  // Terminal state
  failed: ['shipped'],  // Can retry
  refunded: [],  // Terminal state
};

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### Rate Limiting
```typescript
const RATE_LIMITS = {
  // Public endpoints
  'GET /api/public/seller/:slug': { window: 60, max: 100 },
  'GET /api/public/seller/:slug/products': { window: 60, max: 50 },

  // Authenticated endpoints
  'POST /api/seller/profile': { window: 60, max: 10 },
  'POST /api/seller/bank': { window: 3600, max: 5 },  // Sensitive
  'POST /api/orders/ship': { window: 60, max: 100 },

  // Bulk operations
  'POST /api/orders/bulk/*': { window: 60, max: 10 },
};
```

---

## File References

| Page | File Path |
|------|-----------|
| Seller Settings | [SellerSettings.tsx](../src/features/portal/seller/pages/SellerSettings.tsx) |
| Public Profile | [SellerPublicProfile.tsx](../src/features/portal/seller/pages/SellerPublicProfile.tsx) |
| Dashboard | [SellerDashboard.tsx](../src/features/portal/seller/pages/SellerDashboard.tsx) |
| Inventory | [SellerInventory.tsx](../src/features/portal/seller/pages/SellerInventory.tsx) |
| Orders | [SellerOrders.tsx](../src/features/portal/seller/pages/SellerOrders.tsx) |
| Backend Routes | [sellerSettingsRoutes.ts](../server/src/routes/sellerSettingsRoutes.ts) |
| Services | [sellerSettingsService.ts](../src/features/portal/services/sellerSettingsService.ts) |
