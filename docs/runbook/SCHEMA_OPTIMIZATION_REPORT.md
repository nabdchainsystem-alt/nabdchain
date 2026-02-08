# Schema Optimization Report

> **Date:** February 2026
> **Prompt:** Schema Optimization & Indexes (PROMPT 11)
> **Goal:** Optimize Prisma schema without breaking existing data, APIs, or business logic

---

## Executive Summary

A comprehensive analysis of `server/prisma/schema.prisma` (~3,500 lines, 90+ models) identified several optimization opportunities. This report documents findings across five categories:

1. **Missing Relations** - Foreign keys without `@relation` directives
2. **Missing/Incomplete Models** - Referenced but undefined models
3. **JSON Normalization** - String fields storing JSON that could be tables
4. **Missing Indexes** - Performance optimization opportunities
5. **Sensitive Data** - Fields requiring encryption or special handling

---

## 1. Missing Relations Analysis

### 1.1 Intentionally Unlinked Foreign Keys

The following patterns are **intentional** and should NOT be changed:

| Model | Field | Reason for No Relation |
|-------|-------|------------------------|
| `ItemRFQ` | `buyerId`, `sellerId` | External Clerk user IDs; cascading delete would be problematic |
| `MarketplaceRFQ` | `buyerId`, `sellerId` | Same as above |
| `Quote` | `buyerId`, `sellerId` | Quotes must persist even if user deleted |
| `MarketplaceOrder` | `buyerId`, `sellerId` | Orders are legal documents; must not cascade delete |
| `AuditLog` | `actorId` | Audit logs are immutable; must never cascade |
| `PortalAdminAuditLog` | `actorId`, `targetUserId` | Immutable audit trail |
| `TrustEvent` | `userId` | Trust history must persist |
| `TrustScore` | `userId` | Trust data must persist |
| `EventOutbox` | N/A | Event queue - no user relation needed |
| `JobQueue` | `createdBy` | Job history - intentionally loose |

**Rationale:** These models store user IDs (from Clerk external auth) as strings without Prisma relations because:
- User deletions should not cascade to business-critical data
- Audit trails must remain immutable
- Legal/financial documents (orders, invoices) must persist

### 1.2 Relations That Could Be Added (Low Risk)

These models could benefit from proper relations for data integrity:

| Model | Field | Suggested Relation | Risk Level |
|-------|-------|-------------------|------------|
| `BuyerCart` | `buyerId` | `User` relation with `onDelete: Cascade` | Low |
| `BuyerCartItem` | `itemId` | `Item` relation with `onDelete: Cascade` | Low |
| `PayoutLineItem` | `invoiceId` | `MarketplaceInvoice` relation | Medium |
| `PayoutLineItem` | `orderId` | `MarketplaceOrder` relation | Medium |
| `SellerProfile` | `userId` | Already exists (good) | N/A |
| `BuyerProfile` | `userId` | Already exists (good) | N/A |

### 1.3 Seller Profile Models Without User Relation

The seller profile system (`SellerProfile`, `SellerCompany`, `SellerAddress`, `SellerBank`, `SellerContact`, `SellerDocument`) correctly chains through `SellerProfile.userId -> User.id`. No changes needed.

---

## 2. Missing/Incomplete Models

### 2.1 All Models Present

After full schema scan, no referenced models are missing. The schema is complete.

### 2.2 Model Consistency Check

| Model Group | Status |
|-------------|--------|
| User & Auth | Complete |
| Workspace & Boards | Complete |
| Marketplace Items | Complete |
| RFQ System (2 variants) | Complete (`MarketplaceRFQ`, `ItemRFQ`) |
| Quote System | Complete |
| Order System | Complete |
| Invoice & Payment | Complete |
| Dispute & Returns | Complete |
| Seller Profile | Complete |
| Buyer Profile | Complete |
| Trust & Intelligence | Complete |
| Automation & Payouts | Complete |
| RBAC System | Complete |
| Audit & Events | Complete |
| Queue Systems | Complete |

---

## 3. JSON Fields Review

### 3.1 Appropriate JSON Usage (Keep As-Is)

These fields correctly use JSON for flexibility:

| Model | Field | Type | Reason to Keep |
|-------|-------|------|----------------|
| `AuditLog` | `previousValue`, `newValue` | `@db.Text` | Snapshots of arbitrary data |
| `AuditLog` | `changedFields`, `metadata` | String | Variable structure |
| `EventOutbox` | `payload` | String | Arbitrary event data |
| `JobQueue` | `payload`, `result` | String | Job-specific data |
| `AutomationRule` | `triggerConditions`, `actionConfig` | String | Flexible rule config |
| `TrustFeatureGate` | `requiredLevels`, `overrideRules` | String | Flexible gate config |
| `SellerHealthScore` | `riskReasons`, `restrictedFeatures` | String | Variable array data |

### 3.2 Potential Normalization Candidates

These could be normalized but the effort vs. benefit is low:

| Model | Field | Current | Could Be | Recommendation |
|-------|-------|---------|----------|----------------|
| `BuyerIntelligenceProfile` | `categoryAffinities` | JSON String | Junction table | **Keep** - Computed analytics data |
| `SellerIntelligenceProfile` | `categoryStrengths` | JSON String | Junction table | **Keep** - Computed analytics data |
| `MarketplaceRFQ` | `specifications` | JSON String | Specs table | **Keep** - Flexible buyer input |
| `MarketplaceOrder` | `shippingDetails` | JSON String | Address table | **Consider** - See below |

### 3.3 Recommended Normalization: Order Addresses

The `MarketplaceOrder` model stores `shippingDetails` and `billingDetails` as JSON strings. While this preserves address snapshots at order time (good), a normalized approach would be beneficial for:

- Address validation
- Address reuse across orders
- Analytics on shipping regions

**Recommended Approach:**
```prisma
model OrderAddress {
  id          String   @id @default(uuid())
  orderId     String
  addressType String   // "shipping" | "billing"
  name        String
  company     String?
  street1     String
  street2     String?
  city        String
  state       String?
  postalCode  String?
  country     String
  phone       String?

  order       MarketplaceOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([city, country])
}
```

**Status:** Deferred - Current JSON approach works; normalize in future iteration.

---

## 4. Index Analysis

### 4.1 Existing Index Coverage

The schema has excellent index coverage. Key patterns observed:

- ✅ All foreign keys are indexed
- ✅ Status fields are indexed
- ✅ Composite indexes for common query patterns
- ✅ Date-based indexes for time-series queries

### 4.2 Missing Indexes (To Add)

| Model | Suggested Index | Reason |
|-------|----------------|--------|
| `Activity` | `@@index([type])` | Filter activities by type |
| `Quote` | `@@index([status])` | Filter quotes by status |
| `Quote` | `@@index([createdAt])` | Time-series queries |
| `CounterOffer` | `@@index([status])` | Filter by status |
| `CounterOffer` | `@@index([createdAt])` | Time-series queries |
| `MarketplaceDispute` | `@@index([createdAt])` | Time-series queries |
| `MarketplaceReturn` | `@@index([createdAt])` | Time-series queries |
| `SellerInvoice` | `@@index([createdAt])` | Time-series queries |
| `SellerInvoice` | `@@index([dueDate])` | Due date filtering |

### 4.3 Potential Composite Indexes

For frequently combined queries:

| Model | Composite Index | Use Case |
|-------|----------------|----------|
| `MarketplaceOrder` | `@@index([createdAt])` | Time-series dashboard |
| `Item` | `@@index([category, status])` | Category + status filtering |
| `Quote` | `@@index([sellerId, status])` | Seller quote management |

---

## 5. Sensitive Data Review

### 5.1 Fields Requiring Encryption

| Model | Field | Current State | Recommendation |
|-------|-------|---------------|----------------|
| `SellerBank` | `iban` | Plain text | **ENCRYPT** at application level |
| `EmailAccount` | `accessToken` | Plain text | **ENCRYPT** at application level |
| `EmailAccount` | `refreshToken` | Plain text | **ENCRYPT** at application level |
| `User` | `passwordHash` | Hashed (good) | Already secure |
| `SellerPayout` | `ibanMasked` | Masked (good) | Display-only, secure |

### 5.2 Encryption Implementation

**SellerBank IBAN:**
```typescript
// In server/src/services/sellerProfileService.ts
import { encrypt, decrypt } from '../utils/encryption';

// On save
const encryptedIban = encrypt(iban);
await prisma.sellerBank.update({ data: { iban: encryptedIban } });

// On read
const decryptedIban = decrypt(bank.iban);
```

**Email Tokens:**
Already handled by Clerk integration. If using custom email integration, encrypt tokens at rest.

### 5.3 Masking for Display

The schema already implements proper masking:
- `SellerBank.ibanMasked` - Masked version for UI
- `SellerPayout.ibanMasked` - Copied from SellerBank at payout time

---

## 6. Migration Plan

### Phase 1: Add Missing Indexes (Safe, Non-Breaking)

```prisma
// Activity model
@@index([type])

// Quote model
@@index([status])
@@index([createdAt])

// CounterOffer model
@@index([status])
@@index([createdAt])

// MarketplaceDispute model
@@index([createdAt])

// MarketplaceReturn model
@@index([createdAt])

// MarketplaceOrder model
@@index([createdAt])

// SellerInvoice model
@@index([createdAt])
@@index([dueDate])
```

### Phase 2: Add Optional Relations (Low Risk)

```prisma
// BuyerCart -> User relation
model BuyerCart {
  // existing fields...
  buyer User @relation(fields: [buyerId], references: [id], onDelete: Cascade)
}

// BuyerCartItem -> Item relation
model BuyerCartItem {
  // existing fields...
  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
}
```

### Phase 3: Encryption (Application-Level)

1. Add encryption utility in `server/src/utils/encryption.ts`
2. Update `SellerProfileService` to encrypt IBAN on save
3. Update API responses to decrypt for authorized users only

---

## 7. Implementation Checklist

### Immediate (This Sprint)
- [ ] Add missing indexes (Phase 1)
- [ ] Run `prisma migrate dev --name add_missing_indexes`
- [ ] Verify no breaking changes

### Short-Term (Next Sprint)
- [ ] Add BuyerCart relations (Phase 2)
- [ ] Implement IBAN encryption
- [ ] Update SellerBank service

### Deferred
- [ ] OrderAddress normalization (if analytics require it)
- [ ] Category affinity normalization (if needed)

---

## 8. Commands to Execute

```bash
# Generate migration for indexes
cd server
npx prisma migrate dev --name add_missing_indexes

# If on production (Render)
npx prisma migrate deploy

# Verify schema
npx prisma validate
```

---

## Appendix: Full Model Count

| Category | Count |
|----------|-------|
| Core Platform | 12 models |
| Marketplace Items | 2 models |
| RFQ System | 8 models |
| Quote System | 5 models |
| Order System | 6 models |
| Invoice & Payment | 3 models |
| Dispute & Returns | 2 models |
| Seller Profile | 8 models |
| Buyer Profile & Workspace | 6 models |
| Trust & Intelligence | 8 models |
| Automation & Payouts | 9 models |
| RBAC System | 4 models |
| Audit & Events | 4 models |
| Queue Systems | 4 models |
| Utility Models | 3 models |
| **Total** | **~84 models** |

---

*Generated: February 2026*
*Schema Location: server/prisma/schema.prisma*
