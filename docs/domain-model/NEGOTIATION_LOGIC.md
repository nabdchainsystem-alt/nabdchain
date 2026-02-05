# Negotiation Logic Specification

> Detailed specification for B2B negotiation workflows including counter-offers, versioning, and audit trails.
> Version: 1.0.0 | Last Updated: 2026-02-05

---

## 1. Negotiation Overview

### 1.1 Negotiation Types

The system supports three negotiation patterns:

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Single-Round** | One quote, accept/reject | Standard item purchases |
| **Multi-Round** | Multiple counter-offers | Custom/bulk orders |
| **Platform-Assisted** | AI-suggested pricing | Complex negotiations |

### 1.2 Negotiation Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              NEGOTIATION LIFECYCLE                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  BUYER                              SYSTEM                              SELLER    │
│    │                                  │                                   │       │
│    │  1. Submit RFQ                   │                                   │       │
│    │─────────────────────────────────▶│                                   │       │
│    │                                  │  2. Score & Route                 │       │
│    │                                  │──────────────────────────────────▶│       │
│    │                                  │                                   │       │
│    │                                  │                    3. Review RFQ  │       │
│    │                                  │◀──────────────────────────────────│       │
│    │                                  │                                   │       │
│    │                                  │                 4. Submit Quote   │       │
│    │                                  │◀──────────────────────────────────│       │
│    │  5. Review Quote                 │                                   │       │
│    │◀─────────────────────────────────│                                   │       │
│    │                                  │                                   │       │
│    │  ┌─────────────────────────────────────────────────────────────┐     │       │
│    │  │                    DECISION POINT                           │     │       │
│    │  ├─────────────────────────────────────────────────────────────┤     │       │
│    │  │  A) ACCEPT  ──▶ Create Order                                │     │       │
│    │  │  B) REJECT  ──▶ End Negotiation                             │     │       │
│    │  │  C) COUNTER ──▶ Continue to Step 6                          │     │       │
│    │  └─────────────────────────────────────────────────────────────┘     │       │
│    │                                  │                                   │       │
│    │  6. Counter-Offer                │                                   │       │
│    │─────────────────────────────────▶│                                   │       │
│    │                                  │  7. Notify Seller                 │       │
│    │                                  │──────────────────────────────────▶│       │
│    │                                  │                                   │       │
│    │                                  │              8. Revised Quote     │       │
│    │                                  │◀──────────────────────────────────│       │
│    │  9. Review Revised Quote         │                                   │       │
│    │◀─────────────────────────────────│                                   │       │
│    │                                  │                                   │       │
│    │        (Repeat until accept/reject/max rounds)                       │       │
│    │                                  │                                   │       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Counter-Offer Mechanics

### 2.1 Counter-Offer Entity

```typescript
interface CounterOffer {
  id: string;

  // Context
  rfqId: string;
  quoteId: string;                   // Reference to current quote
  round: number;                     // Negotiation round (1-based)

  // Initiator
  initiatorId: string;
  initiatorType: 'buyer' | 'seller';

  // Proposed Terms
  proposedPrice?: Decimal;           // Counter price
  proposedQuantity?: number;         // Counter quantity
  proposedLeadTime?: number;         // Counter lead time (days)
  proposedDeliveryTerms?: DeliveryTerms;

  // Justification
  message: string;                   // Explanation/negotiation text

  // Response
  status: CounterOfferStatus;
  responseMessage?: string;
  respondedAt?: DateTime;

  // Timestamps
  createdAt: DateTime;
  expiresAt: DateTime;               // Counter-offer validity
}

type CounterOfferStatus =
  | 'pending'     // Awaiting response
  | 'accepted'    // Other party accepted
  | 'rejected'    // Other party rejected
  | 'countered'   // Other party made counter-counter
  | 'expired';    // Timed out
```

### 2.2 Counter-Offer Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| CTR-001 | Counter-offer must include at least one changed term | Validation |
| CTR-002 | Counter price must differ by at least 1% from current | Validation |
| CTR-003 | Counter-offer expires in 24 hours if not responded | System job |
| CTR-004 | Only active party can initiate counter | State check |
| CTR-005 | Max rounds enforced (default: 5) | Configuration |
| CTR-006 | Each counter creates new quote version | Service logic |

### 2.3 Counter-Offer State Machine

```
┌─────────┐  accept   ┌──────────┐
│ pending │──────────▶│ accepted │
└─────────┘           └──────────┘
     │
     ├────────────────┐
     │                │
  reject          counter
     │                │
     ▼                ▼
┌──────────┐    ┌───────────┐
│ rejected │    │ countered │
└──────────┘    └───────────┘
     │
  expire (system)
     │
     ▼
┌─────────┐
│ expired │
└─────────┘
```

### 2.4 Counter-Offer Flow Example

```
Round 1:
  Buyer RFQ: 1000 units @ market price

Round 2:
  Seller Quote v1: 1000 units @ 50 SAR/unit, 7 days lead time

Round 3:
  Buyer Counter: 1000 units @ 45 SAR/unit, 7 days OK
  Message: "Volume discount expected for this quantity"

Round 4:
  Seller Counter (Quote v2): 1000 units @ 47 SAR/unit, 5 days lead time
  Message: "Best price with expedited delivery"

Round 5:
  Buyer Accept → Order Created
```

---

## 3. Quote Versioning

### 3.1 Version Model

```typescript
interface QuoteVersion {
  id: string;
  quoteId: string;
  version: number;                   // Sequential: 1, 2, 3...

  // Immutable Snapshot
  unitPrice: Decimal;
  quantity: number;
  totalPrice: Decimal;
  discount?: Decimal;
  discountPercent?: number;
  deliveryDays: number;
  deliveryTerms: DeliveryTerms;
  validUntil: DateTime;
  notes?: string;
  status: QuoteStatus;

  // Metadata
  createdBy: string;                 // User who created this version
  createdByType: 'buyer' | 'seller';
  changeReason: VersionChangeReason;
  changeDetails?: string;            // Free-form explanation

  // Diff from Previous
  priceChange?: number;              // Percentage change
  leadTimeChange?: number;           // Days change

  // Timestamps
  createdAt: DateTime;
}

type VersionChangeReason =
  | 'initial'           // First version
  | 'seller_revision'   // Seller updated quote
  | 'buyer_counter'     // Buyer counter-offer accepted
  | 'price_adjustment'  // Market price change
  | 'quantity_change'   // Quantity negotiated
  | 'terms_change'      // Delivery terms changed
  | 'validity_extension'; // Extended validity period
```

### 3.2 Versioning Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| VER-001 | Version numbers are sequential and never reused | Auto-increment |
| VER-002 | Previous versions are immutable | No UPDATE allowed |
| VER-003 | Only one version can be `isLatest = true` | Unique partial index |
| VER-004 | Version must include changeReason | Required field |
| VER-005 | Each version triggers QuoteEvent | Service hook |
| VER-006 | Accepted version is final | State lock |

### 3.3 Version Comparison

```typescript
interface VersionDiff {
  fromVersion: number;
  toVersion: number;

  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    percentChange?: number;
  }[];

  summary: string;                   // Human-readable summary
}

// Example
{
  fromVersion: 1,
  toVersion: 2,
  changes: [
    { field: 'unitPrice', oldValue: 50, newValue: 47, percentChange: -6 },
    { field: 'deliveryDays', oldValue: 7, newValue: 5, percentChange: -28.5 }
  ],
  summary: "Price reduced 6%, lead time reduced 2 days"
}
```

---

## 4. Audit Trail

### 4.1 Audit Event Structure

```typescript
interface NegotiationAuditEvent {
  id: string;

  // Context
  rfqId: string;
  quoteId?: string;
  orderId?: string;                  // If order created

  // Event
  eventType: NegotiationEventType;
  eventCategory: 'rfq' | 'quote' | 'counter' | 'order';

  // Actor
  actorId: string;
  actorType: 'buyer' | 'seller' | 'system' | 'platform';
  actorName?: string;                // Denormalized for display

  // State Change
  fromStatus?: string;
  toStatus?: string;

  // Payload
  payload: {
    version?: number;
    price?: Decimal;
    quantity?: number;
    leadTime?: number;
    message?: string;
    reason?: string;
    [key: string]: any;
  };

  // Metadata
  ipAddress?: string;
  userAgent?: string;

  // Timestamp
  timestamp: DateTime;
}

type NegotiationEventType =
  // RFQ Events
  | 'RFQ_CREATED'
  | 'RFQ_VIEWED'
  | 'RFQ_SCORED'
  | 'RFQ_PRIORITIZED'

  // Quote Events
  | 'QUOTE_DRAFTED'
  | 'QUOTE_SENT'
  | 'QUOTE_VIEWED'
  | 'QUOTE_REVISED'
  | 'QUOTE_EXPIRED'

  // Counter Events
  | 'COUNTER_SUBMITTED'
  | 'COUNTER_VIEWED'
  | 'COUNTER_ACCEPTED'
  | 'COUNTER_REJECTED'
  | 'COUNTER_EXPIRED'

  // Resolution Events
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'ORDER_CREATED'
  | 'NEGOTIATION_ABANDONED'
  | 'NEGOTIATION_TIMEOUT';
```

### 4.2 Audit Trail Example

```
Timeline for RFQ-2026-0042:
─────────────────────────────────────────────────────────────────────────────────
2026-02-01 09:00:00 | RFQ_CREATED      | Buyer: Acme Corp
                    | quantity: 1000, message: "Need for Q2 production"

2026-02-01 09:05:00 | RFQ_SCORED       | System
                    | score: 78, tier: high, urgency: 65, buyer: 82

2026-02-01 10:30:00 | RFQ_VIEWED       | Seller: Parts Inc
                    | viewDuration: 45s

2026-02-01 14:00:00 | QUOTE_DRAFTED    | Seller: Parts Inc
                    | version: 1, price: 50.00, leadTime: 7

2026-02-01 14:15:00 | QUOTE_SENT       | Seller: Parts Inc
                    | version: 1, validUntil: 2026-02-08

2026-02-01 16:00:00 | QUOTE_VIEWED     | Buyer: Acme Corp
                    | viewDuration: 120s

2026-02-02 09:00:00 | COUNTER_SUBMITTED| Buyer: Acme Corp
                    | proposedPrice: 45.00, message: "Volume discount"

2026-02-02 11:00:00 | COUNTER_VIEWED   | Seller: Parts Inc

2026-02-02 14:00:00 | QUOTE_REVISED    | Seller: Parts Inc
                    | version: 2, price: 47.00, leadTime: 5
                    | priceChange: -6%, leadTimeChange: -2 days

2026-02-02 15:00:00 | QUOTE_ACCEPTED   | Buyer: Acme Corp
                    | version: 2, reason: "Terms acceptable"

2026-02-02 15:00:01 | ORDER_CREATED    | System
                    | orderId: ORD-2026-0089, total: 47000.00
─────────────────────────────────────────────────────────────────────────────────
```

### 4.3 Audit Retention Policy

| Event Category | Retention | Archive |
|----------------|-----------|---------|
| RFQ Events | 7 years | Yes |
| Quote Events | 7 years | Yes |
| Counter Events | 7 years | Yes |
| Order Events | 10 years | Yes |
| System Events | 2 years | No |

### 4.4 Audit Query Patterns

```typescript
// Get full negotiation history
function getNegotiationHistory(rfqId: string): NegotiationAuditEvent[];

// Get quote version timeline
function getQuoteVersionTimeline(quoteId: string): QuoteVersion[];

// Get counter-offer chain
function getCounterOfferChain(rfqId: string): CounterOffer[];

// Get actor activity
function getActorNegotiationActivity(
  actorId: string,
  dateRange: DateRange
): NegotiationAuditEvent[];

// Compliance export
function exportNegotiationAudit(
  rfqId: string,
  format: 'json' | 'csv' | 'pdf'
): AuditExport;
```

---

## 5. Negotiation Business Rules

### 5.1 Timing Rules

| Rule ID | Rule | Default | Configurable |
|---------|------|---------|--------------|
| NEG-T01 | Initial quote response deadline | 48 hours | Per-seller |
| NEG-T02 | Counter-offer response deadline | 24 hours | Per-negotiation |
| NEG-T03 | Quote validity period | 7 days | Per-quote |
| NEG-T04 | Auto-expire inactive negotiation | 30 days | Global |
| NEG-T05 | Max time between rounds | 72 hours | Per-seller |

### 5.2 Limit Rules

| Rule ID | Rule | Default | Configurable |
|---------|------|---------|--------------|
| NEG-L01 | Max negotiation rounds | 5 | Per-item category |
| NEG-L02 | Max quote versions | 10 | Global |
| NEG-L03 | Max concurrent negotiations (buyer) | 20 | Per-buyer tier |
| NEG-L04 | Max concurrent negotiations (seller) | 100 | Per-seller tier |
| NEG-L05 | Min price change per counter | 1% | Global |

### 5.3 Validation Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| NEG-V01 | Counter price must be within 50% of current | Validation |
| NEG-V02 | Counter lead time must be positive | Validation |
| NEG-V03 | Counter quantity must be within MOQ-MaxOQ | Validation |
| NEG-V04 | Message required for counter-offers | Validation |
| NEG-V05 | Cannot counter expired quote | State check |
| NEG-V06 | Cannot counter accepted/rejected quote | State check |

### 5.4 Notification Triggers

| Event | Notify Buyer | Notify Seller | Method |
|-------|--------------|---------------|--------|
| RFQ Created | - | Push, Email | Immediate |
| Quote Sent | Push, Email | - | Immediate |
| Counter Submitted | - | Push, Email | Immediate |
| Quote Revised | Push, Email | - | Immediate |
| Quote Accepted | - | Push, Email | Immediate |
| Quote Rejected | - | Push, Email | Immediate |
| Quote Expiring | Push | Push | 24h before |
| Counter Expiring | Push | Push | 6h before |
| Negotiation Timeout | Email | Email | On timeout |

---

## 6. Platform-Assisted Negotiation

### 6.1 AI Price Suggestion

```typescript
interface PriceSuggestion {
  suggestedPrice: Decimal;
  confidence: number;              // 0-100

  factors: {
    historicalAverage: Decimal;
    recentTrend: 'up' | 'down' | 'stable';
    marketComparison: Decimal;     // Average market price
    buyerHistory: Decimal;         // Buyer's typical purchase price
    volumeDiscount: number;        // Percentage for quantity
  };

  reasoning: string;               // Human-readable explanation

  range: {
    min: Decimal;                  // Likely rejected below
    max: Decimal;                  // Likely accepted below
    optimal: Decimal;              // Highest chance of acceptance
  };
}
```

### 6.2 Suggestion Algorithm Inputs

| Input | Weight | Description |
|-------|--------|-------------|
| Historical transactions | 30% | Past sales of same item |
| Buyer purchase history | 20% | What this buyer typically pays |
| Market prices | 15% | Competitor pricing |
| Quantity discount | 15% | Volume-based reduction |
| Lead time premium/discount | 10% | Urgency factor |
| Seller margin target | 10% | Seller's configured margin |

### 6.3 Auto-Response Rules

```typescript
interface AutoResponseRule {
  id: string;
  sellerId: string;

  // Trigger Conditions
  conditions: {
    buyerScoreMin?: number;        // Min buyer trust score
    quantityMin?: number;
    valueMin?: Decimal;
    marginMin?: number;            // Min profit margin %
    itemCategories?: string[];
  };

  // Auto-Response Action
  action: 'auto_quote' | 'auto_accept' | 'flag_for_review';

  // Auto-Quote Configuration
  autoQuoteConfig?: {
    useMarketPrice: boolean;
    discountPercent?: number;
    maxDiscount?: number;
    leadTimeDays: number;
    validityDays: number;
    template?: string;             // Response message template
  };

  // Limits
  maxAutoQuotesPerDay?: number;
  maxTotalValue?: Decimal;

  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

---

## 7. Negotiation Analytics

### 7.1 Metrics Tracked

| Metric | Description | Aggregation |
|--------|-------------|-------------|
| Conversion Rate | RFQs that become orders | Per seller, category, time |
| Average Rounds | Rounds before resolution | Per seller, category |
| Time to Quote | Hours from RFQ to first quote | Per seller |
| Time to Resolution | Hours from RFQ to accept/reject | Per negotiation |
| Counter Rate | % of quotes that get countered | Per seller, buyer |
| Acceptance Rate | % of quotes accepted | Per seller, version |
| Price Erosion | % price reduced through negotiation | Per category |
| Win Rate | Negotiations won vs lost | Per seller |

### 7.2 Seller Performance Dashboard

```typescript
interface SellerNegotiationMetrics {
  sellerId: string;
  period: DateRange;

  // Volume
  totalRFQsReceived: number;
  totalQuotesSent: number;
  totalOrdersWon: number;

  // Conversion
  quoteRate: number;               // % of RFQs quoted
  conversionRate: number;          // % of quotes accepted
  winRate: number;                 // % of competitive wins

  // Speed
  avgTimeToQuote: number;          // Hours
  avgTimeToResolution: number;     // Hours
  responseWithinSLA: number;       // %

  // Pricing
  avgPriceChange: number;          // % change through negotiation
  avgRoundsToClose: number;
  counterRate: number;             // % of quotes countered

  // Comparison
  vsMarketAvg: {
    quoteRate: number;             // Relative to market
    conversionRate: number;
    timeToQuote: number;
  };
}
```

---

## 8. Error Handling

### 8.1 Negotiation Error Codes

| Code | Error | Recovery |
|------|-------|----------|
| NEG-001 | Quote expired | Create new quote |
| NEG-002 | Max rounds exceeded | Accept/reject or request extension |
| NEG-003 | Counter validation failed | Fix and resubmit |
| NEG-004 | Concurrent modification | Refresh and retry |
| NEG-005 | Quote already accepted | No action needed |
| NEG-006 | RFQ expired | Cannot quote, buyer notified |
| NEG-007 | Invalid state transition | Check current state |
| NEG-008 | Seller not authorized | Check item ownership |
| NEG-009 | Buyer blocked | Contact support |
| NEG-010 | System unavailable | Retry with backoff |

### 8.2 Conflict Resolution

```typescript
interface NegotiationConflict {
  type: 'concurrent_counter' | 'simultaneous_accept' | 'version_mismatch';

  resolution: {
    winner: 'first_submitted' | 'buyer_priority' | 'seller_priority';
    action: string;
    notification: string;
  };
}

// Concurrent Counter: Both parties submit counter-offers simultaneously
// Resolution: First submitted wins, other party notified to respond to new terms

// Simultaneous Accept: Both parties accept at same moment
// Resolution: Accept succeeds, order created

// Version Mismatch: Counter references outdated quote version
// Resolution: Reject counter, notify to refresh
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-05 | System | Initial negotiation logic specification |

---

*End of Document*
