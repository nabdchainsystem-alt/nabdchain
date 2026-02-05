# B2B Procurement Domain Model Documentation

> Complete specification for the NABD B2B marketplace procurement system.

---

## Documents

| Document | Description | Last Updated |
|----------|-------------|--------------|
| [B2B_PROCUREMENT_DOMAIN_MODEL.md](./B2B_PROCUREMENT_DOMAIN_MODEL.md) | Complete entity definitions, state machines, and relationships | 2026-02-05 |
| [NEGOTIATION_LOGIC.md](./NEGOTIATION_LOGIC.md) | Counter-offers, versioning, audit trails, and platform-assisted negotiation | 2026-02-05 |
| [BUSINESS_RULES_REFERENCE.md](./BUSINESS_RULES_REFERENCE.md) | Consolidated reference for all business rules by entity | 2026-02-05 |

---

## Quick Reference

### Entity Overview

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│   RFQ   │───▶│  Quote  │───▶│  Order  │───▶│ Invoice │───▶│ Payment │───▶│ Payout  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                   │
                                   ▼
                              ┌─────────┐    ┌─────────┐
                              │ Dispute │───▶│ Return  │
                              └─────────┘    └─────────┘
```

### Key Entity Relationships

| Relationship | Cardinality |
|--------------|-------------|
| Quote → Order | 1:1 (unique) |
| Order → Invoice | 1:1 (unique) |
| Order → Dispute | 1:1 (one active) |
| Dispute → Return | 1:1 (unique) |
| Invoice → Payment | 1:N |
| Invoice → PayoutLineItem | 1:1 |

### State Machine Summary

| Entity | States | Terminal States |
|--------|--------|-----------------|
| ItemRFQ | new → viewed → under_review/ignored → quoted → accepted/rejected/expired | accepted, rejected, expired, ignored |
| Quote | draft → sent → revised/expired → accepted/rejected | accepted, rejected, expired |
| Order | pending_confirmation → confirmed → processing → shipped → delivered/failed → refunded | cancelled, refunded |
| Invoice | draft → issued → paid/overdue/cancelled | paid, cancelled |
| Payment | pending → confirmed/failed | confirmed, failed |
| Dispute | open → under_review → seller_responded → resolved/rejected/escalated → closed | closed |
| Return | requested → approved/rejected → in_transit → received → refund_processed → closed | rejected, closed |
| Payout | pending → processing/on_hold/failed → settled | settled, failed |

### Default SLAs

| Metric | Default | Entity |
|--------|---------|--------|
| Order Confirmation | 24 hours | Order |
| Order Shipping | 3 days | Order |
| Order Delivery | 7 days | Order |
| Dispute Response | 48 hours | Dispute |
| Dispute Resolution | 7 days | Dispute |
| Return Approval | 48 hours | Return |
| Refund Processing | 48 hours | Return |

### Business Rule Counts

| Entity | Rules |
|--------|-------|
| RFQ | 10 |
| Quote | 12 |
| Order | 15 |
| Invoice | 10 |
| Payment | 8 |
| Dispute | 12 |
| Return | 10 |
| Payout | 12 |
| SLA | 10 |
| Negotiation | 15 |
| **Total** | **114** |

---

## Implementation Status

### Fully Implemented ✅
- ItemRFQ state machine
- Quote versioning and immutability
- Order triple-status model (order/payment/fulfillment)
- Invoice immutability after issue
- Payment confirmation flow
- Dispute lifecycle
- Return workflow
- Payout eligibility and holds
- SLA tracking (data collection)
- Audit events for all entities

### Partially Implemented ⚠️
- Auto-expiration jobs (schema exists, job may need verification)
- Auto-escalation for disputes (deadline exists, automation unclear)
- Platform-assisted negotiation (scoring exists, AI suggestions TBD)
- Payout automation (manual approval by default)

### Not Yet Implemented ❌
- Invoice overdue auto-transition job
- Payment retry mechanism
- Seller suspension enforcement
- Rate limiting enforcement
- Full negotiation round tracking UI

---

## Related Files

### Database Schema
- `server/prisma/schema.prisma`

### Type Definitions
- `src/features/portal/types/order.types.ts`
- `src/features/portal/types/invoice.types.ts`
- `src/features/portal/types/payout.types.ts`
- `src/features/portal/types/dispute.types.ts`
- `src/features/portal/types/return.types.ts`
- `src/features/portal/types/item.types.ts`

### Services
- `server/src/services/orderService.ts`
- `server/src/services/quoteService.ts`
- `server/src/services/marketplacePaymentService.ts`
- `server/src/services/marketplaceInvoiceService.ts`
- `server/src/services/returnService.ts`
- `server/src/services/disputeService.ts`
- `server/src/services/sellerPayoutService.ts`
- `server/src/services/orderHealthService.ts`
- `server/src/services/slaTrackingService.ts`
- `server/src/services/rfqScoringService.ts`
- `server/src/services/automationRulesService.ts`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial domain model documentation |
