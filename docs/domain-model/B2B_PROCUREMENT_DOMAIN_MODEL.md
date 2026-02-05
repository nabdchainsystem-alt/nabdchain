# B2B Procurement Domain Model

> Authoritative specification for the NABD B2B marketplace procurement system.
> Version: 1.0.0 | Last Updated: 2026-02-05

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Definitions](#2-entity-definitions)
3. [State Machines](#3-state-machines)
4. [Business Rules](#4-business-rules)
5. [Cross-Entity Relationships](#5-cross-entity-relationships)
6. [Appendix: Event Types](#appendix-event-types)

---

## 1. Overview

### 1.1 Domain Scope

This domain model covers the complete B2B procurement lifecycle:

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│   RFQ   │───▶│  Quote  │───▶│  Order  │───▶│ Invoice │───▶│ Payment │───▶│ Payout  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     │              │              ▼              │
     │              │         ┌─────────┐        │
     │              │         │ Dispute │────────┘
     │              │         └────┬────┘
     │              │              │
     │              │              ▼
     │              │         ┌─────────┐
     │              │         │ Return  │
     │              │         └─────────┘
     ▼              ▼
┌────────────────────────────────────────┐
│          Negotiation Layer             │
└────────────────────────────────────────┘
```

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Immutability** | Quotes are versioned; Invoices freeze after issue |
| **Audit Trail** | Every state change logged with actor, timestamp, metadata |
| **Trust-First** | No auto-penalties; SLA data for analytics only |
| **Configurability** | Per-seller settings for payouts, scoring, automation |
| **Denormalization** | Intelligence data duplicated for query performance |

### 1.3 Actor Definitions

| Actor | Description |
|-------|-------------|
| **Buyer** | Portal user requesting quotes and placing orders |
| **Seller** | Portal user listing items and fulfilling orders |
| **System** | Automated processes (jobs, triggers, expiration) |
| **Platform** | Admin/support staff with elevated privileges |

---

## 2. Entity Definitions

### 2.1 RFQ (Request for Quote)

The RFQ represents a buyer's formal request for pricing on an item.

#### 2.1.1 ItemRFQ (Item-Level RFQ)

```typescript
interface ItemRFQ {
  // Identification
  id: string;                    // UUID
  rfqNumber: string;             // Format: RFQ-YYYY-NNNN

  // Parties
  buyerId: string;               // Requesting buyer
  sellerId: string;              // Target seller (derived from item)

  // Request Details
  itemId: string;                // Referenced item
  quantity: number;              // Requested quantity
  message?: string;              // Buyer's notes/requirements
  deliveryLocation?: string;     // Delivery destination
  priority: RFQPriority;         // normal | urgent | critical
  source: RFQSource;             // item | profile | listing

  // Deadlines
  expiresAt?: DateTime;          // When RFQ expires if not responded
  responseDeadline?: DateTime;   // Seller's deadline to respond

  // Seller Evaluation (Stage 2)
  viewedAt?: DateTime;           // When seller first viewed
  underReviewAt?: DateTime;      // When seller started evaluation
  ignoredAt?: DateTime;          // When seller chose to ignore
  internalNotes?: string;        // Seller's private notes
  priorityLevel: PriorityTier;   // Computed: critical | high | medium | low
  priorityScore: number;         // 0-100 composite score

  // Response (Stage 3)
  quotedPrice?: Decimal;         // Seller's quoted unit price
  quotedLeadTime?: number;       // Days to deliver
  responseMessage?: string;      // Seller's response notes
  respondedAt?: DateTime;        // When quote was sent

  // Status
  status: ItemRFQStatus;

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

type ItemRFQStatus =
  | 'new'           // Just created, not yet viewed
  | 'viewed'        // Seller has seen the RFQ
  | 'under_review'  // Seller is evaluating
  | 'ignored'       // Seller declined to respond
  | 'quoted'        // Seller has submitted a quote
  | 'accepted'      // Buyer accepted the quote
  | 'rejected'      // Buyer rejected the quote
  | 'expired';      // Passed deadline without response

type RFQPriority = 'normal' | 'urgent' | 'critical';
type RFQSource = 'item' | 'profile' | 'listing';
type PriorityTier = 'critical' | 'high' | 'medium' | 'low';
```

#### 2.1.2 MarketplaceRFQ (Platform-Managed RFQ)

Extended RFQ with platform intelligence and multi-round negotiation.

```typescript
interface MarketplaceRFQ extends ItemRFQ {
  // Intelligence Scoring
  score: number;                 // 0-100 composite score
  urgencyScore: number;          // Deadline proximity score
  quantityScore: number;         // Order value score
  buyerScore: number;            // Buyer history score
  marginScore: number;           // Potential profit score

  // AI Suggestions
  suggestedPrice?: Decimal;      // Platform-computed price
  suggestedLeadTime?: number;    // Platform-computed lead time
  pricingConfidence?: number;    // 0-100 confidence in suggestion

  // Negotiation
  negotiationRound: number;      // Current round (1-based)
  maxNegotiationRounds: number;  // Limit before auto-close

  // Denormalized Buyer Intelligence
  buyerTotalOrders: number;
  buyerTotalSpend: Decimal;
  buyerAvgOrderValue: Decimal;
  buyerLastOrderDate?: DateTime;

  // Communication
  messages: MarketplaceRFQMessage[];
}

interface MarketplaceRFQMessage {
  id: string;
  rfqId: string;
  senderId: string;
  senderType: 'buyer' | 'seller';
  message: string;
  offeredPrice?: Decimal;        // Counter-offer price
  offeredLeadTime?: number;      // Counter-offer lead time
  createdAt: DateTime;
}
```

### 2.2 Quote

Immutable, versioned pricing response to an RFQ.

```typescript
interface Quote {
  // Identification
  id: string;
  quoteNumber: string;           // Format: QT-YYYY-NNNN

  // Relationships
  rfqId: string;                 // Source RFQ
  sellerId: string;
  buyerId: string;

  // Pricing
  unitPrice: Decimal;
  quantity: number;
  totalPrice: Decimal;           // Computed: unitPrice * quantity
  discount?: Decimal;            // Flat discount amount
  discountPercent?: number;      // Percentage discount
  currency: string;              // ISO 4217 (default: SAR)

  // Delivery
  deliveryDays: number;          // Lead time in days
  deliveryTerms: DeliveryTerms;  // FOB | CIF | EXW | DDP

  // Validity
  validUntil: DateTime;          // Quote expiration

  // Content
  notes?: string;                // Terms & conditions (visible to buyer)
  internalNotes?: string;        // Seller-only notes

  // Versioning (Immutability)
  version: number;               // Auto-increment per quote
  isLatest: boolean;             // Only one version can be latest

  // Status & Timestamps
  status: QuoteStatus;
  sentAt?: DateTime;             // When sent to buyer
  expiredAt?: DateTime;          // When validity period ended
  acceptedAt?: DateTime;
  rejectedAt?: DateTime;

  // Acceptance/Rejection
  acceptedBy?: string;           // User who accepted
  rejectedBy?: string;           // User who rejected
  rejectionReason?: string;

  // Order Link
  orderId?: string;              // Created order (if accepted)

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

type QuoteStatus =
  | 'draft'     // Being prepared
  | 'sent'      // Delivered to buyer
  | 'revised'   // New version created
  | 'expired'   // Passed validUntil
  | 'accepted'  // Buyer accepted
  | 'rejected'; // Buyer rejected

type DeliveryTerms = 'FOB' | 'CIF' | 'EXW' | 'DDP';
```

#### 2.2.1 QuoteVersion (Immutable History)

```typescript
interface QuoteVersion {
  id: string;
  quoteId: string;
  version: number;

  // Snapshot of quote at this version
  unitPrice: Decimal;
  totalPrice: Decimal;
  discount?: Decimal;
  deliveryDays: number;
  validUntil: DateTime;
  notes?: string;
  status: QuoteStatus;

  // Metadata
  createdBy: string;             // User who created version
  changeReason?: string;         // Why version was created
  createdAt: DateTime;
}
```

### 2.3 Order

The central entity representing a confirmed purchase.

```typescript
interface MarketplaceOrder {
  // Identification
  id: string;
  orderNumber: string;           // Format: ORD-YYYY-NNNN

  // Origin
  source: OrderSource;           // rfq | direct_buy
  rfqId?: string;                // If from RFQ
  quoteId?: string;              // If from Quote (unique)
  quoteVersion?: number;         // Quote version at acceptance

  // Parties
  buyerId: string;
  sellerId: string;

  // Item Snapshot (immutable at order time)
  itemId: string;
  itemName: string;
  itemSku: string;
  itemImage?: string;

  // Pricing
  quantity: number;
  unitPrice: Decimal;
  totalPrice: Decimal;
  currency: string;

  // Triple Status Model
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // Shipping
  shippingAddress: Address;      // JSON object
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: DateTime;

  // Notes
  buyerNotes?: string;
  sellerNotes?: string;
  internalNotes?: string;        // Platform only

  // Health Intelligence
  healthStatus: HealthStatus;
  healthScore: number;           // 0-100 (higher = better)
  healthLastChecked?: DateTime;

  // Exception Tracking
  hasException: boolean;
  exceptionType?: ExceptionType;
  exceptionSeverity?: ExceptionSeverity;
  exceptionMessage?: string;
  exceptionCreatedAt?: DateTime;
  exceptionResolvedAt?: DateTime;

  // SLA Deadlines
  confirmationDeadline: DateTime;
  shippingDeadline?: DateTime;
  deliveryDeadline?: DateTime;

  // SLA Metrics
  daysToConfirm?: number;
  daysToShip?: number;
  daysToDeliver?: number;

  // Buyer Price Intelligence (denormalized)
  historicalAvgPrice?: Decimal;
  priceVariance?: number;        // Percentage
  priceTrend?: PriceTrend;

  // Supplier Intelligence (denormalized)
  supplierOnTimeRate?: number;
  supplierQualityScore?: number;
  supplierTotalOrders?: number;
  buyerUrgencyScore?: number;

  // Rejection
  rejectionReason?: string;

  // Key Timestamps
  confirmedAt?: DateTime;
  processingAt?: DateTime;
  shippedAt?: DateTime;
  shipmentDate?: DateTime;
  deliveredAt?: DateTime;
  deliveryConfirmedBy?: 'buyer' | 'system';
  closedAt?: DateTime;
  cancelledAt?: DateTime;

  // System Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

type OrderSource = 'rfq' | 'direct_buy';

type OrderStatus =
  | 'pending_confirmation'  // Awaiting seller confirmation
  | 'confirmed'             // Seller accepted
  | 'processing'            // Being prepared
  | 'shipped'               // In transit
  | 'delivered'             // Received by buyer
  | 'cancelled'             // Cancelled before shipment
  | 'failed'                // Delivery failed
  | 'refunded';             // Money returned

type PaymentStatus =
  | 'unpaid'      // No payment received
  | 'authorized'  // Payment authorized, not captured
  | 'paid'        // Payment received
  | 'refunded';   // Payment returned

type FulfillmentStatus =
  | 'not_started'      // Waiting to begin
  | 'picking'          // Items being collected
  | 'packing'          // Items being packaged
  | 'ready_to_ship'    // Ready for carrier
  | 'shipped'          // Handed to carrier
  | 'delivered';       // Received by buyer

type HealthStatus = 'on_track' | 'at_risk' | 'delayed' | 'critical';
type ExceptionType = 'delivery_delay' | 'payment_issue' | 'quality_issue' | 'communication_gap' | 'stock_issue';
type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
type PriceTrend = 'up' | 'down' | 'stable';

interface Address {
  street: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  contactName?: string;
  contactPhone?: string;
}
```

### 2.4 Invoice

Immutable financial document generated from an order.

```typescript
interface MarketplaceInvoice {
  // Identification
  id: string;
  invoiceNumber: string;         // Format: INV-YYYY-NNNN

  // Relationships
  orderId: string;               // Unique - one invoice per order
  sellerId: string;
  buyerId: string;

  // Party Snapshots (immutable at issue time)
  sellerSnapshot: PartySnapshot;
  buyerSnapshot: PartySnapshot;

  // Line Items (immutable snapshot)
  lineItems: InvoiceLineItem[];

  // Amounts
  subtotal: Decimal;
  vatRate: number;               // Default: 15% (Saudi Arabia)
  vatAmount: Decimal;
  totalAmount: Decimal;
  currency: string;

  // Platform Fees
  platformFeeRate: number;       // Percentage
  platformFeeAmount: Decimal;
  netToSeller: Decimal;          // totalAmount - platformFeeAmount

  // Payment Terms
  paymentTerms: PaymentTerms;    // NET_0 | NET_7 | NET_14 | NET_30
  dueDate: DateTime;             // Computed from issuedAt + terms

  // Status
  status: InvoiceStatus;

  // Issuance (immutability point)
  issuedAt?: DateTime;           // Once set, content is frozen
  issuedBy?: string;

  // Status Timestamps
  paidAt?: DateTime;
  overdueAt?: DateTime;          // When marked overdue
  cancelledAt?: DateTime;
  cancelReason?: string;

  // System Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface PartySnapshot {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address: Address;
  vatNumber?: string;
  crNumber?: string;             // Commercial Registration
}

interface InvoiceLineItem {
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unitPrice: Decimal;
  totalPrice: Decimal;
  description?: string;
}

type InvoiceStatus =
  | 'draft'      // Being prepared
  | 'issued'     // Sent to buyer (content frozen)
  | 'paid'       // Payment confirmed
  | 'overdue'    // Past due date, unpaid
  | 'cancelled'; // Voided

type PaymentTerms = 'NET_0' | 'NET_7' | 'NET_14' | 'NET_30';
```

### 2.5 Payment

Record of payment against an invoice.

```typescript
interface MarketplacePayment {
  // Identification
  id: string;
  paymentNumber: string;         // Format: PAY-YYYY-NNNN

  // Relationships
  invoiceId: string;
  orderId: string;
  buyerId: string;
  sellerId: string;

  // Amount
  amount: Decimal;
  currency: string;

  // Method
  paymentMethod: PaymentMethod;

  // Bank Transfer Details
  bankReference?: string;        // Transaction reference
  bankName?: string;

  // Status
  status: PaymentRecordStatus;

  // Confirmation
  confirmedAt?: DateTime;
  confirmedBy?: 'seller' | 'system';
  confirmationNote?: string;

  // Failure
  failedAt?: DateTime;
  failureReason?: string;

  // System Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

type PaymentMethod =
  | 'bank_transfer'
  | 'card'
  | 'wallet'
  | 'cod';  // Cash on delivery

type PaymentRecordStatus =
  | 'pending'    // Awaiting confirmation
  | 'confirmed'  // Payment verified
  | 'failed';    // Payment failed/rejected
```

### 2.6 Dispute

Buyer-initiated complaint about an order.

```typescript
interface MarketplaceDispute {
  // Identification
  id: string;
  disputeNumber: string;         // Format: DSP-YYYY-NNNN

  // Relationships
  orderId: string;
  invoiceId?: string;
  buyerId: string;
  sellerId: string;

  // Item Snapshot
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unitPrice: Decimal;
  totalPrice: Decimal;

  // Party Snapshots
  buyerSnapshot: PartySnapshot;
  sellerSnapshot: PartySnapshot;

  // Dispute Details
  reason: DisputeReason;
  description: string;
  requestedResolution: ResolutionType;
  requestedAmount?: Decimal;     // If partial refund

  // Evidence
  evidence: DisputeEvidence[];

  // Status
  status: DisputeStatus;

  // Seller Response
  sellerResponseType?: SellerResponseType;
  sellerResponse?: string;
  sellerProposedResolution?: ResolutionType;
  sellerProposedAmount?: Decimal;
  respondedAt?: DateTime;

  // Resolution
  resolution?: ResolutionType;
  resolutionAmount?: Decimal;
  resolvedBy?: ResolvedBy;
  resolutionNotes?: string;

  // Escalation
  isEscalated: boolean;
  escalatedAt?: DateTime;
  escalationReason?: string;

  // SLA Deadlines
  responseDeadline: DateTime;
  resolutionDeadline: DateTime;

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
  closedAt?: DateTime;
}

interface DisputeEvidence {
  id: string;
  type: 'image' | 'document' | 'video';
  url: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: DateTime;
  description?: string;
}

type DisputeReason =
  | 'wrong_item'
  | 'damaged_goods'
  | 'missing_quantity'
  | 'late_delivery'
  | 'quality_issue'
  | 'not_as_described'
  | 'other';

type ResolutionType =
  | 'full_refund'
  | 'partial_refund'
  | 'replacement'
  | 'credit_note'
  | 'other';

type DisputeStatus =
  | 'open'              // Just created
  | 'under_review'      // Platform reviewing
  | 'seller_responded'  // Seller has responded
  | 'resolved'          // Resolution accepted
  | 'rejected'          // Dispute rejected
  | 'escalated'         // Escalated to platform
  | 'closed';           // Finalized

type SellerResponseType =
  | 'accept'            // Accept buyer's request
  | 'counter'           // Propose alternative
  | 'reject';           // Deny dispute validity

type ResolvedBy =
  | 'buyer_accepted'    // Buyer accepted seller's proposal
  | 'seller_accepted'   // Seller accepted buyer's request
  | 'platform'          // Platform decided
  | 'auto_closed';      // Timed out
```

### 2.7 Return

Physical return of goods after dispute approval.

```typescript
interface MarketplaceReturn {
  // Identification
  id: string;
  returnNumber: string;          // Format: RET-YYYY-NNNN

  // Relationships
  disputeId: string;             // Unique - one return per dispute
  orderId: string;
  buyerId: string;
  sellerId: string;

  // Return Details
  returnType: ReturnType;
  returnReason: string;

  // Items (subset of order items)
  returnItems: ReturnItem[];

  // Status
  status: ReturnStatus;

  // Seller Approval
  approvedAt?: DateTime;
  approvedBy?: string;
  approvalNotes?: string;
  returnAddress?: Address;       // Where to ship return

  // Rejection
  rejectedAt?: DateTime;
  rejectedBy?: string;
  rejectionReason?: string;

  // Shipping (buyer fills)
  returnTrackingNumber?: string;
  returnCarrier?: string;
  shippedAt?: DateTime;

  // Receipt (seller confirms)
  receivedAt?: DateTime;
  receivedBy?: string;
  receivedCondition: ReceivedCondition;
  receivedNotes?: string;

  // Refund
  refundAmount: Decimal;
  refundStatus: RefundStatus;
  refundProcessedAt?: DateTime;

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
  closedAt?: DateTime;
}

interface ReturnItem {
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  reason?: string;
}

type ReturnType =
  | 'full_return'
  | 'partial_return'
  | 'replacement_only';

type ReturnStatus =
  | 'requested'         // Return requested
  | 'approved'          // Seller approved
  | 'rejected'          // Seller rejected
  | 'in_transit'        // Buyer shipped
  | 'received'          // Seller received
  | 'refund_processed'  // Refund issued
  | 'closed';           // Finalized

type ReceivedCondition =
  | 'as_expected'
  | 'damaged'
  | 'missing_items'
  | 'wrong_items';

type RefundStatus =
  | 'pending'
  | 'processed'
  | 'failed';
```

### 2.8 Payout

Aggregated payment to seller for completed orders.

```typescript
interface SellerPayout {
  // Identification
  id: string;
  payoutNumber: string;          // Format: PAY-OUT-YYYY-NNNN
  sellerId: string;

  // Period
  periodStart: DateTime;
  periodEnd: DateTime;

  // Financials
  grossAmount: Decimal;          // Total invoice amounts
  platformFeeTotal: Decimal;     // Total platform fees
  adjustments: Decimal;          // Refunds, credits, deductions
  netAmount: Decimal;            // Amount to pay seller
  currency: string;

  // Status
  status: PayoutStatus;

  // Hold
  holdReason?: HoldReason;
  holdUntil?: DateTime;

  // Bank Details Snapshot
  bankName: string;
  accountHolder: string;
  ibanMasked: string;            // Last 4 digits visible

  // Processing
  initiatedAt?: DateTime;
  initiatedBy?: string;
  settledAt?: DateTime;
  failedAt?: DateTime;
  failureReason?: string;

  // Bank Confirmation
  bankReference?: string;
  bankConfirmationDate?: DateTime;

  // Line Items
  lineItems: PayoutLineItem[];

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface PayoutLineItem {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceTotal: Decimal;
  platformFee: Decimal;
  netAmount: Decimal;
  currency: string;
  invoiceStatus: InvoiceStatus;
  paidAt: DateTime;
}

type PayoutStatus =
  | 'pending'     // Awaiting processing
  | 'processing'  // Bank transfer initiated
  | 'settled'     // Money received by seller
  | 'on_hold'     // Blocked for review
  | 'failed';     // Transfer failed

type HoldReason =
  | 'dispute_pending'
  | 'verification_required'
  | 'manual_review'
  | 'fraud_check'
  | 'limit_exceeded';
```

#### 2.8.1 Seller Payout Settings

```typescript
interface SellerPayoutSettings {
  sellerId: string;

  // Frequency
  frequency: PayoutFrequency;
  payoutDay?: number;            // Day of week/month

  // Thresholds
  minPayoutAmount: Decimal;      // Default: 100 SAR

  // Hold Logic
  disputeHoldEnabled: boolean;   // Default: true
  holdPeriodDays: number;        // Default: 7 days after order close

  // Automation
  autoPayoutEnabled: boolean;    // Default: false (manual approval)

  // Bank Details
  bankName: string;
  accountHolder: string;
  iban: string;                  // Full IBAN (encrypted at rest)
  swiftCode?: string;

  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}

type PayoutFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly';
```

---

## 3. State Machines

### 3.1 ItemRFQ State Machine

```
                                    ┌─────────────┐
                                    │   expired   │
                                    └─────────────┘
                                          ▲
                                          │ (system: deadline passed)
                                          │
┌─────────┐  view   ┌─────────┐  review  ┌─────────────┐  quote  ┌─────────┐
│   new   │────────▶│ viewed  │─────────▶│under_review │────────▶│ quoted  │
└─────────┘         └─────────┘          └─────────────┘         └─────────┘
                          │                                           │
                          │ ignore                           ┌────────┴────────┐
                          ▼                                  │                 │
                    ┌─────────┐                          accept           reject
                    │ ignored │                              │                 │
                    └─────────┘                              ▼                 ▼
                                                       ┌─────────┐      ┌──────────┐
                                                       │accepted │      │ rejected │
                                                       └─────────┘      └──────────┘
```

#### Transition Rules

| From | To | Actor | Conditions |
|------|-----|-------|------------|
| new | viewed | seller | Seller opens RFQ |
| new | expired | system | expiresAt passed |
| viewed | under_review | seller | Seller starts evaluation |
| viewed | ignored | seller | Seller declines |
| viewed | expired | system | expiresAt passed |
| under_review | quoted | seller | Quote submitted |
| under_review | expired | system | expiresAt passed |
| quoted | accepted | buyer | Buyer accepts quote |
| quoted | rejected | buyer | Buyer rejects quote |
| quoted | expired | system | Quote validUntil passed |

### 3.2 Quote State Machine

```
┌─────────┐  send   ┌─────────┐
│  draft  │────────▶│  sent   │
└─────────┘         └─────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
        revise        accept        expire (system)
            │             │             │
            ▼             ▼             ▼
      ┌─────────┐   ┌─────────┐   ┌─────────┐
      │ revised │   │accepted │   │ expired │
      └─────────┘   └─────────┘   └─────────┘
            │
       ┌────┴────┐
       │         │
   accept    expire
       │         │
       ▼         ▼
 ┌─────────┐ ┌─────────┐
 │accepted │ │ expired │
 └─────────┘ └─────────┘

Note: 'rejected' can occur from 'sent' or 'revised' states
```

#### Transition Rules

| From | To | Actor | Conditions | Side Effects |
|------|-----|-------|------------|--------------|
| draft | sent | seller | All required fields populated | Create QuoteVersion, set sentAt |
| sent | revised | seller | Create new version | Increment version, mark previous as not latest |
| sent | accepted | buyer | validUntil not passed | Create MarketplaceOrder |
| sent | rejected | buyer | - | Set rejectedBy, rejectionReason |
| sent | expired | system | validUntil passed | Set expiredAt |
| revised | accepted | buyer | validUntil not passed | Create MarketplaceOrder |
| revised | rejected | buyer | - | Set rejectedBy, rejectionReason |
| revised | expired | system | validUntil passed | Set expiredAt |

#### Business Rules

1. **Immutability**: Once sent, quote content cannot be changed; only status can transition
2. **Versioning**: Revisions create new versions; previous versions remain accessible
3. **One Order**: Only one order can be created per quote (unique constraint)
4. **Expiration Check**: Acceptance blocked if current time > validUntil

### 3.3 Order State Machine

```
                                                    ┌───────────┐
                                                    │ cancelled │
                                                    └───────────┘
                                                          ▲
                    ┌─────────────────────────────────────┤
                    │                                     │
┌─────────────────────┐ confirm ┌───────────┐ process ┌───────────┐ ship  ┌─────────┐ deliver ┌───────────┐
│pending_confirmation │────────▶│ confirmed │────────▶│processing │──────▶│ shipped │────────▶│ delivered │
└─────────────────────┘         └───────────┘         └───────────┘       └─────────┘         └───────────┘
         │                            │                     │                   │                    │
         │                            │                     │                   │                    │
      reject                       cancel                cancel              fail               refund
         │                            │                     │                   │                    │
         ▼                            ▼                     ▼                   ▼                    ▼
   ┌───────────┐               ┌───────────┐          ┌───────────┐       ┌────────┐          ┌──────────┐
   │ cancelled │               │ cancelled │          │ cancelled │       │ failed │          │ refunded │
   └───────────┘               └───────────┘          └───────────┘       └────────┘          └──────────┘
                                                                                │
                                                                             refund
                                                                                │
                                                                                ▼
                                                                          ┌──────────┐
                                                                          │ refunded │
                                                                          └──────────┘
```

#### Transition Rules

| From | To | Actor | Conditions | Side Effects |
|------|-----|-------|------------|--------------|
| pending_confirmation | confirmed | seller | Within confirmationDeadline | Set confirmedAt, compute shippingDeadline |
| pending_confirmation | cancelled | seller | - | Set cancelledAt, rejectionReason |
| confirmed | processing | seller | - | Set processingAt |
| confirmed | cancelled | seller/buyer | Before processing starts | Set cancelledAt |
| processing | shipped | seller | trackingNumber provided | Set shippedAt, shipmentDate, compute deliveryDeadline |
| processing | cancelled | seller | Rare: stock issue | Set cancelledAt |
| shipped | delivered | seller/buyer/system | - | Set deliveredAt, deliveryConfirmedBy |
| shipped | failed | system | Delivery failed | - |
| delivered | refunded | system | Dispute resolved with refund | - |
| failed | refunded | system | Refund processed | - |

#### Payment Status Transitions

```
┌────────┐  authorize  ┌────────────┐  capture  ┌────────┐  refund  ┌──────────┐
│ unpaid │────────────▶│ authorized │──────────▶│  paid  │─────────▶│ refunded │
└────────┘             └────────────┘           └────────┘          └──────────┘
     │                                               │
     │              (direct payment)                 │
     └───────────────────────────────────────────────┘
```

#### Fulfillment Status Transitions

```
┌─────────────┐  pick  ┌─────────┐  pack  ┌─────────┐  ready  ┌───────────────┐  ship  ┌─────────┐  deliver  ┌───────────┐
│ not_started │───────▶│ picking │───────▶│ packing │────────▶│ ready_to_ship │───────▶│ shipped │──────────▶│ delivered │
└─────────────┘        └─────────┘        └─────────┘         └───────────────┘        └─────────┘           └───────────┘
```

### 3.4 Invoice State Machine

```
┌─────────┐  issue  ┌─────────┐
│  draft  │────────▶│ issued  │
└─────────┘         └─────────┘
     │                   │
  cancel          ┌──────┴──────┐
     │            │             │
     ▼          pay          overdue (system)
┌───────────┐     │             │
│ cancelled │     ▼             ▼
└───────────┘ ┌─────────┐  ┌─────────┐
              │  paid   │  │ overdue │
              └─────────┘  └────┬────┘
                                │
                              pay
                                │
                                ▼
                           ┌─────────┐
                           │  paid   │
                           └─────────┘
```

#### Transition Rules

| From | To | Actor | Conditions | Side Effects |
|------|-----|-------|------------|--------------|
| draft | issued | seller | All required fields | Set issuedAt, compute dueDate, FREEZE CONTENT |
| draft | cancelled | seller | - | Set cancelledAt, cancelReason |
| issued | paid | system | Payment confirmed | Set paidAt |
| issued | overdue | system | Current time > dueDate | Set overdueAt |
| issued | cancelled | seller/platform | Before payment | Set cancelledAt, cancelReason |
| overdue | paid | system | Payment confirmed | Set paidAt |

#### Business Rules

1. **Immutability After Issue**: Once issuedAt is set, lineItems, amounts, and party snapshots cannot be changed
2. **One Invoice Per Order**: Unique constraint on orderId
3. **Auto-Overdue**: System job marks invoices overdue when dueDate passes
4. **Cancel Restrictions**: Cannot cancel after payment

### 3.5 Payment Record State Machine

```
┌─────────┐  confirm  ┌───────────┐
│ pending │──────────▶│ confirmed │
└─────────┘           └───────────┘
     │
   fail
     │
     ▼
┌─────────┐
│ failed  │
└─────────┘
```

#### Transition Rules

| From | To | Actor | Conditions | Side Effects |
|------|-----|-------|------------|--------------|
| pending | confirmed | seller/system | Valid payment proof | Set confirmedAt, update Invoice to paid |
| pending | failed | seller/system | Invalid/rejected | Set failedAt, failureReason |

#### Business Rules

1. **Unique Bank Reference**: No duplicate (invoiceId, bankReference) pairs
2. **Invoice Update**: Confirming payment triggers invoice status update to 'paid'
3. **Idempotency**: Re-confirming already confirmed payment is no-op

### 3.6 Dispute State Machine

```
┌────────┐  review  ┌──────────────┐  respond  ┌──────────────────┐
│  open  │─────────▶│ under_review │──────────▶│ seller_responded │
└────────┘          └──────────────┘           └──────────────────┘
                                                        │
                           ┌────────────────────────────┼────────────────────────────┐
                           │                            │                            │
                       accept                       reject                       escalate
                           │                            │                            │
                           ▼                            ▼                            ▼
                    ┌──────────┐                 ┌──────────┐                 ┌───────────┐
                    │ resolved │                 │ rejected │                 │ escalated │
                    └──────────┘                 └──────────┘                 └───────────┘
                           │                            │                            │
                           │                            │                     platform decision
                           │                            │                            │
                         close                        close                    ┌─────┴─────┐
                           │                            │                      │           │
                           ▼                            ▼                   resolve     reject
                    ┌────────┐                   ┌────────┐                    │           │
                    │ closed │                   │ closed │                    ▼           ▼
                    └────────┘                   └────────┘              ┌──────────┐┌──────────┐
                                                                        │ resolved ││ rejected │
                                                                        └──────────┘└──────────┘
```

#### Transition Rules

| From | To | Actor | Conditions | Side Effects |
|------|-----|-------|------------|--------------|
| open | under_review | platform | Platform starts review | - |
| under_review | seller_responded | seller | Response submitted | Set respondedAt, sellerResponse* |
| seller_responded | resolved | buyer | Accepts seller's proposal | Set resolution*, resolvedBy |
| seller_responded | rejected | buyer | Rejects seller's proposal | - |
| seller_responded | escalated | buyer/platform | Needs platform intervention | Set escalatedAt, escalationReason |
| escalated | resolved | platform | Platform decides | Set resolution*, resolvedBy='platform' |
| escalated | rejected | platform | Platform rejects claim | - |
| resolved | closed | system | - | Set closedAt |
| rejected | closed | system | - | Set closedAt |

#### Business Rules

1. **Response Deadline**: Seller must respond within responseDeadline (default: 48 hours)
2. **Auto-Escalate**: If seller doesn't respond by deadline, auto-escalate
3. **Hold Funds**: Open dispute places associated payout on hold
4. **Resolution Options**: Full refund, partial refund, replacement, credit note

### 3.7 Return State Machine

```
┌───────────┐  approve  ┌──────────┐  ship  ┌────────────┐  receive  ┌──────────┐  process  ┌──────────────────┐  close  ┌────────┐
│ requested │──────────▶│ approved │───────▶│ in_transit │──────────▶│ received │──────────▶│ refund_processed │────────▶│ closed │
└───────────┘           └──────────┘        └────────────┘           └──────────┘           └──────────────────┘         └────────┘
      │
   reject
      │
      ▼
┌──────────┐
│ rejected │
└──────────┘
```

#### Transition Rules

| From | To | Actor | Conditions | Side Effects |
|------|-----|-------|------------|--------------|
| requested | approved | seller | - | Set approvedAt, returnAddress |
| requested | rejected | seller | - | Set rejectedAt, rejectionReason |
| approved | in_transit | buyer | Tracking provided | Set shippedAt, returnTrackingNumber |
| in_transit | received | seller | Item received | Set receivedAt, receivedCondition |
| received | refund_processed | system | Refund issued | Set refundProcessedAt |
| refund_processed | closed | system | - | Set closedAt |

#### Business Rules

1. **One Return Per Dispute**: Unique constraint on disputeId
2. **Return Address Required**: Cannot ship until seller provides return address
3. **Condition Assessment**: Seller records condition upon receipt
4. **Partial Returns**: Can return subset of order items

### 3.8 Payout State Machine

```
┌─────────┐  process  ┌────────────┐  settle  ┌─────────┐
│ pending │──────────▶│ processing │─────────▶│ settled │
└─────────┘           └────────────┘          └─────────┘
     │                      │
  ┌──┴──┐                ┌──┴──┐
  │     │                │     │
hold   fail            hold   fail
  │     │                │     │
  ▼     ▼                ▼     ▼
┌─────────┐          ┌─────────┐
│ on_hold │          │ failed  │
└─────────┘          └─────────┘
     │                    │
  ┌──┴──┐              retry
  │     │                │
release fail             ▼
  │     │           ┌─────────┐
  ▼     ▼           │ pending │
┌─────────┐         └─────────┘
│ pending │
└─────────┘
```

#### Transition Rules

| From | To | Actor | Conditions | Side Effects |
|------|-----|-------|------------|--------------|
| pending | processing | platform | No holds, min amount met | Set initiatedAt |
| pending | on_hold | system | Dispute opened, verification needed | Set holdReason, holdUntil |
| pending | failed | system | Validation failed | Set failedAt, failureReason |
| processing | settled | system | Bank confirms | Set settledAt, bankReference |
| processing | on_hold | system | Bank flags issue | Set holdReason |
| processing | failed | system | Transfer failed | Set failedAt, failureReason |
| on_hold | pending | platform | Hold resolved | Clear holdReason |
| on_hold | failed | platform | Cannot resolve | Set failedAt |
| failed | pending | platform | Retry approved | Clear failure fields |

---

## 4. Business Rules

### 4.1 RFQ Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| RFQ-001 | RFQ must reference valid, active item | Validation on create |
| RFQ-002 | Quantity must be >= item's minOrderQty | Validation on create |
| RFQ-003 | Quantity must be <= item's maxOrderQty (if set) | Validation on create |
| RFQ-004 | One active RFQ per buyer-item-seller combination | Unique constraint check |
| RFQ-005 | Expired RFQs cannot be quoted | Status check before quote |
| RFQ-006 | Priority score computed on view/update | Scoring service |
| RFQ-007 | ResponseDeadline default: 48 hours from creation | Default value |

### 4.2 Quote Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| QOT-001 | Quote must reference valid RFQ | FK constraint |
| QOT-002 | Seller cannot quote on own RFQ | Validation check |
| QOT-003 | Cannot revise expired quote | Status check |
| QOT-004 | ValidUntil must be future date | Validation on create/send |
| QOT-005 | Version auto-increments on revision | Database trigger/service |
| QOT-006 | Only one version marked as isLatest | Database constraint + service |
| QOT-007 | Cannot accept quote after validUntil | Timestamp check |
| QOT-008 | Accepted quote creates order automatically | Service orchestration |

### 4.3 Order Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| ORD-001 | Order from quote inherits pricing exactly | Service logic |
| ORD-002 | ConfirmationDeadline = createdAt + 24 hours | Default value |
| ORD-003 | ShippingDeadline = confirmedAt + 3 days | Computed on confirm |
| ORD-004 | DeliveryDeadline = shippedAt + 7 days | Computed on ship |
| ORD-005 | Cannot cancel after shipped | Status check |
| ORD-006 | Tracking number required to ship | Validation check |
| ORD-007 | Health score computed on status change | Health service |
| ORD-008 | Exception clears when resolved | Service logic |
| ORD-009 | Price intelligence updated on order create | Analytics service |

### 4.4 Invoice Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| INV-001 | One invoice per order | Unique constraint |
| INV-002 | VAT rate default: 15% (Saudi Arabia) | Default value |
| INV-003 | Platform fee deducted from seller's net | Computed field |
| INV-004 | Content frozen after issuedAt is set | Service validation |
| INV-005 | DueDate = issuedAt + paymentTerms days | Computed on issue |
| INV-006 | Cannot cancel paid invoice | Status check |
| INV-007 | Line items snapshot from order (immutable) | Copy on create |

### 4.5 Payment Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PAY-001 | Payment must reference issued invoice | FK + status check |
| PAY-002 | Amount must match invoice totalAmount | Validation (with tolerance) |
| PAY-003 | Bank reference must be unique per invoice | Unique constraint |
| PAY-004 | Confirmed payment updates invoice to paid | Service orchestration |
| PAY-005 | Only seller or system can confirm | Authorization check |

### 4.6 Dispute Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| DSP-001 | Dispute must reference delivered order | Status check |
| DSP-002 | One open dispute per order | Unique constraint + status |
| DSP-003 | ResponseDeadline = createdAt + 48 hours | Default value |
| DSP-004 | ResolutionDeadline = createdAt + 7 days | Default value |
| DSP-005 | Auto-escalate if no seller response | Job/scheduled task |
| DSP-006 | Open dispute holds associated payout | Payout service integration |
| DSP-007 | Evidence upload capped at 10 files | Validation |

### 4.7 Return Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| RET-001 | Return requires approved dispute | FK + status check |
| RET-002 | One return per dispute | Unique constraint |
| RET-003 | Return address required before shipping | Validation on status change |
| RET-004 | Refund amount <= original order total | Validation |
| RET-005 | Condition assessment required on receive | Validation |
| RET-006 | Refund initiated within 48h of receive | SLA tracking |

### 4.8 Payout Business Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PYO-001 | Eligible: paid invoice, closed order, no disputes | Eligibility check |
| PYO-002 | Hold period: order.closedAt + holdPeriodDays | Date calculation |
| PYO-003 | Minimum payout threshold: seller.minPayoutAmount | Amount check |
| PYO-004 | Dispute on any line item holds entire payout | Hold trigger |
| PYO-005 | NetAmount = grossAmount - platformFees - adjustments | Computation |
| PYO-006 | Bank details validated before processing | Pre-processing check |
| PYO-007 | Auto-payout only if seller.autoPayoutEnabled | Setting check |

### 4.9 SLA Rules

| SLA ID | Entity | Metric | Default | Breach Action |
|--------|--------|--------|---------|---------------|
| SLA-001 | Order | Confirmation | 24 hours | Health: at_risk |
| SLA-002 | Order | Shipping | 3 days | Health: delayed |
| SLA-003 | Order | Delivery | 7 days | Health: critical |
| SLA-004 | Dispute | Seller Response | 48 hours | Auto-escalate |
| SLA-005 | Return | Seller Approval | 48 hours | Auto-approve |
| SLA-006 | Return | Refund Processing | 48 hours | Flag for review |

**Note**: SLA breaches are tracked for analytics and trust scoring. No automatic financial penalties.

---

## 5. Cross-Entity Relationships

### 5.1 Entity Relationship Diagram

```
                                    ┌─────────────────┐
                                    │      Item       │
                                    └────────┬────────┘
                                             │
                                             │ 1:N
                                             ▼
┌─────────────┐    1:N     ┌─────────────────────────────────┐
│    Buyer    │───────────▶│            ItemRFQ              │
└─────────────┘            └────────────────┬────────────────┘
      │                                     │
      │                                     │ 1:N
      │                                     ▼
      │                    ┌─────────────────────────────────┐
      │                    │             Quote               │
      │                    └────────────────┬────────────────┘
      │                                     │
      │                                     │ 1:1
      │                                     ▼
      │        1:N         ┌─────────────────────────────────┐         1:N
      └───────────────────▶│        MarketplaceOrder         │◀──────────────────┐
                           └────────────────┬────────────────┘                   │
                                            │                                    │
                           ┌────────────────┼────────────────┐                   │
                           │                │                │                   │
                         1:1              1:1              1:N                    │
                           │                │                │                   │
                           ▼                ▼                ▼                   │
              ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐         │
              │MarketplaceInvoice│  │MarketplaceDispute│  │OrderAudit   │         │
              └───────┬────────┘  └────────┬────────┘  └──────────────┘         │
                      │                    │                                     │
                    1:N                  1:1                                      │
                      │                    │                                     │
                      ▼                    ▼                                     │
            ┌─────────────────┐  ┌─────────────────┐                             │
            │MarketplacePayment│  │MarketplaceReturn│                             │
            └─────────────────┘  └─────────────────┘                             │
                      │                                                          │
                      │                                                          │
                      └──────────────────────────┬───────────────────────────────┘
                                                 │
                                                 │ N:1 (aggregated)
                                                 ▼
                                    ┌─────────────────────────┐
                                    │      SellerPayout       │
                                    └─────────────────────────┘
```

### 5.2 Key Cardinalities

| Relationship | Cardinality | Constraint |
|--------------|-------------|------------|
| Buyer → ItemRFQ | 1:N | |
| Item → ItemRFQ | 1:N | |
| ItemRFQ → Quote | 1:N | Multiple quotes possible |
| Quote → MarketplaceOrder | 1:1 | Unique on quoteId |
| MarketplaceOrder → MarketplaceInvoice | 1:1 | Unique on orderId |
| MarketplaceOrder → MarketplaceDispute | 1:1 | One active at a time |
| MarketplaceDispute → MarketplaceReturn | 1:1 | Unique on disputeId |
| MarketplaceInvoice → MarketplacePayment | 1:N | Multiple payment attempts |
| MarketplaceInvoice → PayoutLineItem | 1:1 | One payout inclusion |
| Seller → SellerPayout | 1:N | |

### 5.3 Cascade Behaviors

| Parent Entity | Child Entity | On Delete |
|---------------|--------------|-----------|
| Item | ItemRFQ | Restrict (cannot delete item with RFQs) |
| ItemRFQ | Quote | Cascade soft-delete |
| Quote | MarketplaceOrder | Restrict (cannot delete accepted quote) |
| MarketplaceOrder | MarketplaceInvoice | Cascade soft-delete |
| MarketplaceOrder | MarketplaceDispute | Restrict |
| MarketplaceDispute | MarketplaceReturn | Cascade |

### 5.4 Audit Trail Linkage

Every major entity has an associated Event/Audit table:

| Entity | Audit Table | Key Events |
|--------|-------------|------------|
| ItemRFQ | ItemRFQEvent | CREATED, VIEWED, QUOTED, ACCEPTED |
| Quote | QuoteEvent | CREATED, SENT, REVISED, ACCEPTED |
| MarketplaceOrder | MarketplaceOrderAudit | created, confirmed, shipped, delivered |
| MarketplaceInvoice | MarketplaceInvoiceEvent | CREATED, ISSUED, PAID |
| MarketplaceDispute | MarketplaceDisputeEvent | CREATED, RESPONDED, RESOLVED |
| MarketplaceReturn | MarketplaceReturnEvent | REQUESTED, APPROVED, RECEIVED |
| SellerPayout | PayoutEvent | CREATED, PROCESSING, SETTLED |

---

## Appendix: Event Types

### A.1 ItemRFQ Events

```typescript
type ItemRFQEventType =
  | 'RFQ_CREATED'
  | 'RFQ_VIEWED'
  | 'RFQ_UNDER_REVIEW'
  | 'RFQ_IGNORED'
  | 'RFQ_QUOTED'
  | 'RFQ_ACCEPTED'
  | 'RFQ_REJECTED'
  | 'RFQ_EXPIRED'
  | 'NOTE_ADDED'
  | 'PRIORITY_CALCULATED';
```

### A.2 Quote Events

```typescript
type QuoteEventType =
  | 'QUOTE_CREATED'
  | 'QUOTE_UPDATED'
  | 'QUOTE_SENT'
  | 'QUOTE_REVISED'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED';
```

### A.3 Order Audit Actions

```typescript
type OrderAuditAction =
  | 'created'
  | 'confirmed'
  | 'rejected'
  | 'processing_started'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'cancelled'
  | 'refunded'
  | 'note_added'
  | 'tracking_added'
  | 'status_changed'
  | 'payment_updated'
  | 'health_changed'
  | 'exception_created'
  | 'exception_resolved';
```

### A.4 Invoice Events

```typescript
type InvoiceEventType =
  | 'INVOICE_CREATED'
  | 'INVOICE_ISSUED'
  | 'INVOICE_PAID'
  | 'INVOICE_OVERDUE'
  | 'INVOICE_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED';
```

### A.5 Dispute Events

```typescript
type DisputeEventType =
  | 'DISPUTE_CREATED'
  | 'DISPUTE_VIEWED'
  | 'SELLER_RESPONDED'
  | 'RESOLUTION_PROPOSED'
  | 'BUYER_ACCEPTED'
  | 'BUYER_REJECTED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'EVIDENCE_ADDED'
  | 'NOTE_ADDED';
```

### A.6 Return Events

```typescript
type ReturnEventType =
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'RETURN_SHIPPED'
  | 'RETURN_RECEIVED'
  | 'REFUND_PROCESSED'
  | 'RETURN_CLOSED';
```

### A.7 Payout Events

```typescript
type PayoutEventType =
  | 'PAYOUT_CREATED'
  | 'PAYOUT_APPROVED'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_SETTLED'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_ON_HOLD'
  | 'HOLD_RELEASED'
  | 'LINE_ITEM_ADDED'
  | 'LINE_ITEM_REMOVED';
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-05 | System | Initial comprehensive domain model |

---

*End of Document*
