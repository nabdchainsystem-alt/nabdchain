# Business Rules Reference

> Consolidated reference for all B2B procurement business rules.
> Version: 1.0.0 | Last Updated: 2026-02-05

---

## Quick Reference Index

| Entity | Rules | Page |
|--------|-------|------|
| RFQ | RFQ-001 to RFQ-010 | Section 1 |
| Quote | QOT-001 to QOT-012 | Section 2 |
| Order | ORD-001 to ORD-015 | Section 3 |
| Invoice | INV-001 to INV-010 | Section 4 |
| Payment | PAY-001 to PAY-008 | Section 5 |
| Dispute | DSP-001 to DSP-012 | Section 6 |
| Return | RET-001 to RET-010 | Section 7 |
| Payout | PYO-001 to PYO-012 | Section 8 |
| SLA | SLA-001 to SLA-010 | Section 9 |
| Negotiation | NEG-001 to NEG-015 | Section 10 |

---

## 1. RFQ Rules

### Creation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| RFQ-001 | RFQ must reference a valid, active item | Validation | FK check + item.status = 'active' |
| RFQ-002 | Quantity must be >= item.minOrderQty | Validation | Numeric comparison |
| RFQ-003 | Quantity must be <= item.maxOrderQty (if set) | Validation | Numeric comparison |
| RFQ-004 | One active RFQ per (buyer, item, seller) | Uniqueness | Unique partial index |
| RFQ-005 | Buyer cannot submit RFQ to own items | Authorization | buyerId != item.sellerId |

### Lifecycle Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| RFQ-006 | RFQ expires if not responded within expiresAt | Expiration | Scheduled job |
| RFQ-007 | Expired RFQ cannot receive quotes | State | Status check |
| RFQ-008 | Ignored RFQ is terminal state | State | No transitions from 'ignored' |
| RFQ-009 | Priority score recalculated on view/status change | Computation | Service hook |
| RFQ-010 | ResponseDeadline defaults to 48 hours | Default | createdAt + 48h |

---

## 2. Quote Rules

### Creation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| QOT-001 | Quote must reference valid RFQ | Validation | FK constraint |
| QOT-002 | Seller must own the item being quoted | Authorization | quote.sellerId = item.userId |
| QOT-003 | Cannot quote on own RFQ | Authorization | sellerId != rfq.buyerId |
| QOT-004 | ValidUntil must be future date | Validation | validUntil > now() |
| QOT-005 | UnitPrice must be positive | Validation | unitPrice > 0 |
| QOT-006 | Quantity must match RFQ quantity (unless negotiated) | Validation | Match or documented change |

### Versioning Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| QOT-007 | Version auto-increments on revision | Automation | MAX(version) + 1 |
| QOT-008 | Only one version marked isLatest per quote | Uniqueness | Unique partial index |
| QOT-009 | Previous versions are immutable | Immutability | No UPDATE on versions |
| QOT-010 | Each version creates QuoteVersion record | Automation | Service hook |

### Status Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| QOT-011 | Cannot accept quote after validUntil | State | now() < validUntil |
| QOT-012 | Accepted quote creates order automatically | Side Effect | Service orchestration |

---

## 3. Order Rules

### Creation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| ORD-001 | Order from quote inherits pricing exactly | Data Integrity | Copy on create |
| ORD-002 | One order per quote (unique constraint) | Uniqueness | Unique on quoteId |
| ORD-003 | Direct buy order requires item in stock | Validation | item.status != 'out_of_stock' |
| ORD-004 | OrderNumber format: ORD-YYYY-NNNN | Format | Auto-generate |

### SLA Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| ORD-005 | ConfirmationDeadline = createdAt + 24 hours | Computation | Default value |
| ORD-006 | ShippingDeadline = confirmedAt + 3 days | Computation | Set on confirm |
| ORD-007 | DeliveryDeadline = shippedAt + 7 days | Computation | Set on ship |

### Status Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| ORD-008 | Cannot cancel after shipped | State | orderStatus check |
| ORD-009 | Cannot ship without tracking number | Validation | Required field |
| ORD-010 | Cannot mark delivered without shipment | State | Must be 'shipped' first |
| ORD-011 | Refund only from delivered/failed states | State | Status check |

### Intelligence Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| ORD-012 | Health score computed on status change | Computation | Health service |
| ORD-013 | Exception auto-creates on SLA breach | Automation | Health service |
| ORD-014 | Price intelligence updated on create | Analytics | Analytics service |
| ORD-015 | Supplier metrics updated on close | Analytics | Analytics service |

---

## 4. Invoice Rules

### Creation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| INV-001 | One invoice per order | Uniqueness | Unique on orderId |
| INV-002 | Invoice requires confirmed order | Validation | order.status = 'confirmed'+ |
| INV-003 | InvoiceNumber format: INV-YYYY-NNNN | Format | Auto-generate |
| INV-004 | LineItems snapshot from order (immutable) | Data Integrity | Copy on create |

### Tax Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| INV-005 | VAT rate default: 15% (Saudi Arabia) | Default | Configuration |
| INV-006 | VatAmount = subtotal * vatRate | Computation | Calculated field |
| INV-007 | TotalAmount = subtotal + vatAmount | Computation | Calculated field |

### Immutability Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| INV-008 | Content frozen after issuedAt is set | Immutability | Service validation |
| INV-009 | Cannot cancel paid invoice | State | paymentStatus check |
| INV-010 | DueDate = issuedAt + paymentTerms days | Computation | Set on issue |

---

## 5. Payment Rules

### Validation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| PAY-001 | Payment must reference issued invoice | Validation | invoice.status = 'issued'+ |
| PAY-002 | Amount must match invoice total (±1% tolerance) | Validation | Numeric range |
| PAY-003 | Bank reference unique per invoice | Uniqueness | Unique(invoiceId, bankReference) |
| PAY-004 | PaymentNumber format: PAY-YYYY-NNNN | Format | Auto-generate |

### Authorization Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| PAY-005 | Only seller or system can confirm | Authorization | Role check |
| PAY-006 | Buyer can submit payment proof | Authorization | Role check |

### Side Effect Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| PAY-007 | Confirmed payment updates invoice to paid | Side Effect | Service orchestration |
| PAY-008 | Confirmed payment triggers payout eligibility check | Side Effect | Service hook |

---

## 6. Dispute Rules

### Creation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| DSP-001 | Dispute requires delivered order | Validation | order.orderStatus = 'delivered' |
| DSP-002 | One open dispute per order | Uniqueness | Partial unique index |
| DSP-003 | DisputeNumber format: DSP-YYYY-NNNN | Format | Auto-generate |
| DSP-004 | Evidence capped at 10 files | Limit | Array length check |
| DSP-005 | Max file size: 10MB per file | Limit | Upload validation |

### SLA Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| DSP-006 | ResponseDeadline = createdAt + 48 hours | Computation | Default value |
| DSP-007 | ResolutionDeadline = createdAt + 7 days | Computation | Default value |
| DSP-008 | Auto-escalate if no seller response by deadline | Automation | Scheduled job |

### Resolution Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| DSP-009 | Refund amount cannot exceed order total | Validation | Numeric comparison |
| DSP-010 | Partial refund requires amount specification | Validation | Required if partial |

### Financial Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| DSP-011 | Open dispute holds associated payout | Side Effect | Payout service |
| DSP-012 | Resolved dispute releases hold | Side Effect | Payout service |

---

## 7. Return Rules

### Creation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| RET-001 | Return requires approved dispute | Validation | dispute.status + resolution |
| RET-002 | One return per dispute | Uniqueness | Unique on disputeId |
| RET-003 | ReturnNumber format: RET-YYYY-NNNN | Format | Auto-generate |
| RET-004 | Return items must be subset of order items | Validation | Item validation |

### Shipping Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| RET-005 | Return address required before shipping | Validation | Required for 'in_transit' |
| RET-006 | Tracking number required to ship | Validation | Required for 'in_transit' |
| RET-007 | Condition assessment required on receive | Validation | Required for 'received' |

### Refund Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| RET-008 | Refund amount <= original order total | Validation | Numeric comparison |
| RET-009 | Refund initiated within 48h of receive | SLA | Tracking |
| RET-010 | Partial return refund based on returned items | Computation | Line item calculation |

---

## 8. Payout Rules

### Eligibility Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| PYO-001 | Invoice must be paid | Eligibility | invoice.status = 'paid' |
| PYO-002 | Order must be closed | Eligibility | order.closedAt not null |
| PYO-003 | No open disputes on order | Eligibility | Dispute check |
| PYO-004 | Hold period elapsed | Eligibility | order.closedAt + holdPeriodDays < now() |
| PYO-005 | Minimum amount threshold met | Eligibility | sum >= minPayoutAmount |

### Hold Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| PYO-006 | Dispute on any line item holds entire payout | Hold | Payout service |
| PYO-007 | Verification required holds payout | Hold | Seller status check |
| PYO-008 | Manual review holds payout | Hold | Admin flag |
| PYO-009 | Hold can be released by platform | Release | Admin action |

### Calculation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| PYO-010 | NetAmount = grossAmount - platformFees - adjustments | Computation | Calculated field |
| PYO-011 | Platform fee from invoice.platformFeeAmount | Data Source | Invoice data |
| PYO-012 | Adjustments include refunds and credits | Computation | Line item aggregation |

---

## 9. SLA Rules

### Order SLAs

| ID | Metric | Default | Breach Action |
|----|--------|---------|---------------|
| SLA-001 | Order Confirmation | 24 hours | Health: at_risk |
| SLA-002 | Order Shipping | 3 days | Health: delayed |
| SLA-003 | Order Delivery | 7 days | Health: critical |
| SLA-004 | Order Closure | 30 days after delivery | Auto-close |

### Dispute SLAs

| ID | Metric | Default | Breach Action |
|----|--------|---------|---------------|
| SLA-005 | Seller Response | 48 hours | Auto-escalate |
| SLA-006 | Dispute Resolution | 7 days | Platform review |

### Return SLAs

| ID | Metric | Default | Breach Action |
|----|--------|---------|---------------|
| SLA-007 | Return Approval | 48 hours | Auto-approve |
| SLA-008 | Buyer Shipment | 7 days after approval | Return voided |
| SLA-009 | Refund Processing | 48 hours after receipt | Flag for review |

### Payout SLAs

| ID | Metric | Default | Breach Action |
|----|--------|---------|---------------|
| SLA-010 | Payout Processing | 3 business days | Escalate to finance |

---

## 10. Negotiation Rules

### Timing Rules

| ID | Rule | Default | Configurable |
|----|------|---------|--------------|
| NEG-001 | Initial quote response deadline | 48 hours | Per-seller |
| NEG-002 | Counter-offer response deadline | 24 hours | Per-negotiation |
| NEG-003 | Quote validity period | 7 days | Per-quote |
| NEG-004 | Auto-expire inactive negotiation | 30 days | Global |
| NEG-005 | Max time between rounds | 72 hours | Per-seller |

### Limit Rules

| ID | Rule | Default | Configurable |
|----|------|---------|--------------|
| NEG-006 | Max negotiation rounds | 5 | Per-item category |
| NEG-007 | Max quote versions | 10 | Global |
| NEG-008 | Max concurrent negotiations (buyer) | 20 | Per-buyer tier |
| NEG-009 | Max concurrent negotiations (seller) | 100 | Per-seller tier |
| NEG-010 | Min price change per counter | 1% | Global |

### Validation Rules

| ID | Rule | Type | Enforcement |
|----|------|------|-------------|
| NEG-011 | Counter price within 50% of current | Validation | Range check |
| NEG-012 | Counter lead time must be positive | Validation | Positive integer |
| NEG-013 | Counter quantity within MOQ-MaxOQ | Validation | Range check |
| NEG-014 | Message required for counter-offers | Validation | Required field |
| NEG-015 | Cannot counter expired/accepted/rejected quote | State | Status check |

---

## Appendix A: Rule Severity Classification

| Severity | Description | Enforcement |
|----------|-------------|-------------|
| **Critical** | Data integrity, financial accuracy | Hard block, no override |
| **High** | Business logic, compliance | Hard block, admin override |
| **Medium** | Operational efficiency | Soft block, user override |
| **Low** | Best practice, UX | Warning only |

### Critical Rules
- PAY-002 (Amount match)
- INV-008 (Invoice immutability)
- PYO-010 (Payout calculation)
- ORD-001 (Quote pricing integrity)

### High Rules
- RFQ-001 to RFQ-005 (RFQ validation)
- QOT-007 to QOT-010 (Versioning)
- DSP-009, DSP-010 (Refund limits)

### Medium Rules
- SLA rules (timing enforcement)
- NEG-006 to NEG-010 (Negotiation limits)

### Low Rules
- Format rules (numbering)
- Default value rules

---

## Appendix B: Configuration Reference

### Global Configuration

```typescript
interface GlobalBusinessRules {
  // Tax
  defaultVatRate: 0.15;

  // Negotiation
  maxNegotiationRounds: 5;
  maxQuoteVersions: 10;
  minPriceChangePercent: 1;
  inactiveNegotiationDays: 30;

  // Disputes
  maxEvidenceFiles: 10;
  maxEvidenceFileSizeMB: 10;

  // SLA (hours unless noted)
  orderConfirmationSLA: 24;
  sellerResponseSLA: 48;
  refundProcessingSLA: 48;

  // Payout
  defaultPaymentTerms: 'NET_30';
  defaultMinPayoutAmount: 100;
  defaultHoldPeriodDays: 7;
}
```

### Per-Seller Configuration

```typescript
interface SellerBusinessRules {
  sellerId: string;

  // Response
  rfqResponseDeadlineHours: number;
  autoResponseEnabled: boolean;

  // Pricing
  defaultDiscountPercent: number;
  maxDiscountPercent: number;

  // Payout
  payoutFrequency: PayoutFrequency;
  minPayoutAmount: Decimal;
  holdPeriodDays: number;
  autoPayoutEnabled: boolean;

  // Automation
  automationRulesEnabled: boolean;
}
```

---

## Appendix C: Error Code Reference

| Code Range | Domain | Example |
|------------|--------|---------|
| RFQ-xxx | RFQ | RFQ-001: Invalid item |
| QOT-xxx | Quote | QOT-003: Self-quote attempt |
| ORD-xxx | Order | ORD-008: Cancel after ship |
| INV-xxx | Invoice | INV-008: Modify after issue |
| PAY-xxx | Payment | PAY-002: Amount mismatch |
| DSP-xxx | Dispute | DSP-001: Non-delivered order |
| RET-xxx | Return | RET-002: Duplicate return |
| PYO-xxx | Payout | PYO-003: Open dispute |
| SLA-xxx | SLA | SLA-001: Confirmation breach |
| NEG-xxx | Negotiation | NEG-006: Max rounds exceeded |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-05 | System | Initial business rules reference |

---

*End of Document*
