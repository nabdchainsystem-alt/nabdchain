# Marketplace System Hardening Analysis

> **Date:** February 2026
> **Purpose:** Harden and clean the marketplace system post-fulfillment stage
> **Approach:** No new features, no UI redesign, no automation

---

## Executive Summary

After comprehensive review of the RFQ, Quote, Order, and Invoice lifecycles, this document identifies issues, proposes a clean final state machine, and provides UX improvements to make the system "boring, reliable, and impossible to misuse."

---

# PART 1: LIFECYCLE AUDIT & HARDENING

## 1.1 Current State Analysis

### Issues Found

| Entity | Issue | Severity | Recommendation |
|--------|-------|----------|----------------|
| Order | `processing` vs `in_progress` naming conflict | Medium | Standardize to `processing` |
| Order | `closed` vs `delivered` overlap unclear | High | Define: `delivered` = goods received, `closed` = financially settled |
| Order | `failed` state purpose unclear | Medium | Define: delivery failure only |
| RFQ | `pending` vs `new` duplicate meaning | High | Merge to `new` only |
| RFQ | `under_review` is Stage 2 internal state | Low | Keep, but clarify scope |
| Quote | `revised` creates confusion | Medium | Merge into `sent` with version tracking |
| Invoice | `draft` state may never be used | Medium | Auto-issue on delivery, skip draft |

---

## 1.2 CLEAN FINAL LIFECYCLES

### Order Lifecycle (FINAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORDER LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [CREATED] ──► PENDING ──► CONFIRMED ──► PROCESSING ──► SHIPPED │
│                  │            │                            │    │
│                  │            │                            ▼    │
│                  │            │                       DELIVERED │
│                  │            │                            │    │
│                  ▼            ▼                            ▼    │
│             CANCELLED    CANCELLED                      CLOSED  │
│                                                                 │
│  Terminal States: CANCELLED, FAILED, CLOSED                     │
└─────────────────────────────────────────────────────────────────┘
```

**Order Statuses (7 total, down from 9):**
| Status | Description | Next States | Actor |
|--------|-------------|-------------|-------|
| `pending` | Awaiting seller confirmation | confirmed, cancelled | Seller |
| `confirmed` | Seller accepted, ready to process | processing, cancelled | Seller |
| `processing` | Picking & packing in progress | shipped, cancelled | Seller |
| `shipped` | In transit to buyer | delivered, failed | Carrier/Seller |
| `delivered` | Buyer confirmed receipt | closed | System |
| `cancelled` | Order terminated before delivery | - (terminal) | Either party |
| `closed` | Financially settled, lifecycle complete | - (terminal) | System |

**Removed:**
- `pending_confirmation` → Renamed to `pending` (shorter)
- `refunded` → Moved to payment status, not order status
- `failed` → Kept but restricted to delivery failures only

---

### RFQ Lifecycle (FINAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                       RFQ LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [CREATED] ──► NEW ──► REVIEWING ──► QUOTED ──► ACCEPTED        │
│                │           │            │                       │
│                │           │            ▼                       │
│                ▼           ▼         REJECTED                   │
│             IGNORED     IGNORED                                 │
│                                                                 │
│  Auto: EXPIRED (if no response in X days)                       │
│                                                                 │
│  Terminal States: ACCEPTED, REJECTED, IGNORED, EXPIRED          │
└─────────────────────────────────────────────────────────────────┘
```

**RFQ Statuses (6 total):**
| Status | Description | Next States | Actor |
|--------|-------------|-------------|-------|
| `new` | Fresh RFQ, unread | reviewing, ignored | Seller |
| `reviewing` | Seller is evaluating | quoted, ignored | Seller |
| `quoted` | Quote sent to buyer | accepted, rejected, expired | Buyer/System |
| `accepted` | Buyer accepted quote | - (terminal, creates order) | Buyer |
| `rejected` | Buyer rejected quote | - (terminal) | Buyer |
| `ignored` | Seller declined to quote | - (terminal) | Seller |
| `expired` | Quote validity passed | - (terminal) | System |

**Removed:**
- `pending` → Merged with `new`
- `under_review` → Renamed to `reviewing` (simpler)
- `viewed` → Removed (not a status, just a timestamp)

---

### Quote Lifecycle (FINAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                      QUOTE LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [CREATED] ──► DRAFT ──► SENT ──────► ACCEPTED                  │
│                  │         │                                    │
│                  │         ▼                                    │
│                  │      REJECTED                                │
│                  │         │                                    │
│                  ▼         ▼                                    │
│               (deleted)  EXPIRED                                │
│                                                                 │
│  Version tracking: v1, v2, v3... (revisions stay in SENT)       │
│                                                                 │
│  Terminal States: ACCEPTED, REJECTED, EXPIRED                   │
└─────────────────────────────────────────────────────────────────┘
```

**Quote Statuses (5 total, down from 6):**
| Status | Description | Next States | Actor |
|--------|-------------|-------------|-------|
| `draft` | Being prepared | sent, (deleted) | Seller |
| `sent` | Delivered to buyer (v1, v2...) | accepted, rejected, expired | Buyer/System |
| `accepted` | Buyer accepted | - (terminal, creates order) | Buyer |
| `rejected` | Buyer declined | - (terminal) | Buyer |
| `expired` | Validity period ended | - (terminal) | System |

**Removed:**
- `revised` → Merged into `sent` with version number (v1, v2, v3)

---

### Invoice Lifecycle (FINAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                     INVOICE LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ORDER DELIVERED] ──► ISSUED ──► PAID ──► (Order CLOSED)       │
│                           │                                     │
│                           ▼                                     │
│                        OVERDUE ──► PAID                         │
│                                                                 │
│  No DRAFT state - invoices are auto-generated and issued        │
│                                                                 │
│  Terminal States: PAID, CANCELLED                               │
└─────────────────────────────────────────────────────────────────┘
```

**Invoice Statuses (4 total, down from 5):**
| Status | Description | Next States | Actor |
|--------|-------------|-------------|-------|
| `issued` | Invoice active, awaiting payment | paid, overdue | System/Seller |
| `overdue` | Past due date | paid | System |
| `paid` | Payment confirmed | - (terminal, triggers order close) | Seller |
| `cancelled` | Invoice voided | - (terminal) | Seller |

**Removed:**
- `draft` → Skip draft, auto-issue on delivery

---

## 1.3 ALLOWED TRANSITIONS TABLE

### Order Transitions
| From | To | Trigger | Actor | Validation |
|------|----|---------| ------|------------|
| pending | confirmed | Confirm button | Seller | Order exists, seller owns it |
| pending | cancelled | Reject/Cancel button | Seller | Within 24h or reason required |
| confirmed | processing | Start Processing button | Seller | - |
| confirmed | cancelled | Cancel button | Seller | Reason required |
| processing | shipped | Ship button | Seller | Tracking number required |
| processing | cancelled | Cancel button | Seller | Reason required |
| shipped | delivered | Confirm Receipt button | Buyer | - |
| shipped | failed | Mark Failed | Seller | Reason required |
| delivered | closed | Auto after payment | System | Invoice paid |

### RFQ Transitions
| From | To | Trigger | Actor | Validation |
|------|----|---------| ------|------------|
| new | reviewing | View/Review button | Seller | - |
| new | ignored | Ignore button | Seller | Reason required |
| reviewing | quoted | Send Quote | Seller | Quote must exist |
| reviewing | ignored | Ignore button | Seller | Reason required |
| quoted | accepted | Accept Quote | Buyer | Quote not expired |
| quoted | rejected | Reject Quote | Buyer | - |
| quoted | expired | Auto | System | Past validUntil |

### Quote Transitions
| From | To | Trigger | Actor | Validation |
|------|----|---------| ------|------------|
| draft | sent | Send button | Seller | All required fields filled |
| draft | (deleted) | Delete button | Seller | - |
| sent | sent (v+1) | Revise & Send | Seller | Creates new version |
| sent | accepted | Accept button | Buyer | Not expired |
| sent | rejected | Reject button | Buyer | - |
| sent | expired | Auto | System | Past validUntil |

### Invoice Transitions
| From | To | Trigger | Actor | Validation |
|------|----|---------| ------|------------|
| issued | paid | Confirm Payment | Seller | Payment record exists |
| issued | overdue | Auto | System | Past dueDate |
| issued | cancelled | Cancel button | Seller | No payments recorded |
| overdue | paid | Confirm Payment | Seller | Payment record exists |

---

## 1.4 DEAD ACTIONS & UNUSED STATES IDENTIFIED

### Dead Actions (Remove or Fix)
| Action | Location | Issue | Recommendation |
|--------|----------|-------|----------------|
| Counter Offer button | Buyer MyRFQs | Placeholder implementation | Remove until implemented |
| Negotiate tab | Buyer RFQ detail | Empty/placeholder | Remove until implemented |
| Bulk actions dropdown | Seller Orders | Only confirm works | Keep confirm, remove dropdown |

### Unused States (Remove)
| State | Entity | Reason | Action |
|-------|--------|--------|--------|
| `pending` (RFQ) | RFQ | Duplicate of `new` | Merge to `new` |
| `viewed` | RFQ | Timestamp, not status | Remove as status |
| `revised` | Quote | Confusing, use versioning | Merge to `sent` |
| `draft` | Invoice | Never visible to users | Skip, auto-issue |
| `refunded` | Order | Payment concern, not order | Move to payment |

### Redundant Fields (Clean Up)
| Field | Entity | Issue | Action |
|-------|--------|-------|--------|
| `priorityLevel` vs `priority` | RFQ | Two priority fields | Keep `priority` only |
| `priorityScore` | RFQ | Unused in UI | Remove or use |
| `healthScore` | Order | Complex, rarely shown | Simplify to healthStatus only |

---

# PART 2: SIMPLE INVOICING & PAYMENT FLOW

## 2.1 Design Principles

1. **No payment gateways** - Manual bank transfer only
2. **No automation** - Human confirms everything
3. **No refunds** - Handle outside system initially
4. **No disputes** - Handle via communication

## 2.2 Invoice Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      INVOICE FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Order DELIVERED                                                 │
│       │                                                         │
│       ▼                                                         │
│  Invoice AUTO-GENERATED (ISSUED)                                │
│       │                                                         │
│       │  Contains:                                              │
│       │  - Invoice number (INV-2024-00001)                      │
│       │  - Buyer company, address, VAT ID                       │
│       │  - Seller company, address, VAT ID, bank details        │
│       │  - Line items: name, qty, unit price, total             │
│       │  - Subtotal, VAT (15%), Grand Total                     │
│       │  - Payment terms (NET_30 default)                       │
│       │  - Due date                                             │
│       │                                                         │
│       ▼                                                         │
│  Buyer VIEWS invoice                                            │
│       │                                                         │
│       ▼                                                         │
│  Buyer makes BANK TRANSFER (outside system)                     │
│       │                                                         │
│       ▼                                                         │
│  Buyer RECORDS PAYMENT in system                                │
│       │  - Amount paid                                          │
│       │  - Bank reference number                                │
│       │  - Bank name                                            │
│       │  - Optional: upload proof                               │
│       │                                                         │
│       ▼                                                         │
│  Seller CONFIRMS PAYMENT                                        │
│       │  - Verifies bank reference                              │
│       │  - Marks as confirmed                                   │
│       │                                                         │
│       ▼                                                         │
│  Invoice → PAID                                                 │
│  Order → CLOSED (auto)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2.3 Invoice Lifecycle

| Status | Description | Buyer Actions | Seller Actions |
|--------|-------------|---------------|----------------|
| `issued` | Invoice sent, awaiting payment | View, Record Payment | View |
| `overdue` | Past due date | View, Record Payment | View, Send Reminder |
| `paid` | Payment confirmed | View, Download | View, Download |

## 2.4 Payment Lifecycle

| Status | Description | Buyer Actions | Seller Actions |
|--------|-------------|---------------|----------------|
| `pending` | Buyer recorded payment | Wait | Verify & Confirm |
| `confirmed` | Seller verified | - | - |
| `rejected` | Payment issue | Record new payment | - |

## 2.5 Why This Is Enough

1. **Trust-based** - B2B relationships rely on trust, not escrow
2. **Bank transfers** - Standard B2B payment method in Saudi Arabia
3. **Manual verification** - Seller confirms receipt in their bank
4. **Audit trail** - All actions logged with timestamps
5. **Simple** - No complexity, no failure modes

---

# PART 3: END-TO-END JOURNEY SIMULATION

## 3.1 Scenario

- **Buyer:** Acme Manufacturing (need spare parts)
- **Seller:** Industrial Supplies Co.
- **Product:** "Hydraulic Pump HP-200" (SAR 2,500)

## 3.2 Step-by-Step Journey

### Step 1: Buyer Creates RFQ
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Click "Request Quote" on product | Form with qty, delivery date, notes | Creates RFQ in `new` status | None - clear CTA |
| Fill form, submit | Success toast "RFQ sent" | Notifies seller | Good - confirmation clear |

**Friction:** None observed

### Step 2: Seller Reviews RFQ
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Open RFQ Inbox | List with new RFQ highlighted | - | Label "new" could be "New RFQ" |
| Click RFQ | Detail panel opens | Marks as `viewed` (auto) | Timestamp not visible |
| Click "Mark Under Review" | Status changes to "Under Review" | Updates status | Button label is verbose |

**Friction:** "Mark Under Review" is too long. Use "Start Review"

### Step 3: Seller Creates & Sends Quote
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Click "Create Quote" | Quote form panel | Creates draft quote | Form could pre-fill item details |
| Fill price, lead time, validity | Form fields | - | "Valid Until" vs "Validity Days" confusing |
| Click "Send Quote" | Success toast | Quote `sent`, RFQ `quoted` | Good |

**Friction:** Form fields could be simpler

### Step 4: Buyer Accepts Quote
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Open My RFQs | RFQ shows "Quoted" status | - | Good |
| Click "View Details" | Quote details in modal | - | Good |
| Click "Accept" | Confirmation dialog | Creates order | Dialog could show order preview |

**Friction:** Minor - would be nice to see what order will look like

### Step 5: Order Created
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Redirect to My Orders | New order "Pending" | Order in `pending` | Success message unclear |
| - | Order card with status | - | Status label could be more descriptive |

**Friction:** "Pending" could be "Awaiting Seller Confirmation"

### Step 6: Seller Confirms Order
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Open Seller Orders | New order highlighted | - | Good |
| Click confirm icon | Order status changes | `pending` → `confirmed` | No confirmation dialog (risky) |

**Friction:** Add confirmation dialog for important actions

### Step 7: Seller Fulfills Order
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Click gear icon (Start Processing) | Status → "Processing" | `confirmed` → `processing` | Icon meaning unclear |
| Click truck icon (Ship) | Dialog for tracking | - | Good - dialog explains |
| Enter tracking number | - | `processing` → `shipped` | Good |

**Friction:** Gear icon is not intuitive for "Start Processing"

### Step 8: Buyer Confirms Delivery
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Order shows "Shipped" | Track button available | - | Good |
| Package arrives (real world) | - | - | - |
| Click "Received" button | Confirmation dialog | `shipped` → `delivered` | Good |

**Friction:** None

### Step 9: Invoice Issued
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Check My Invoices | New invoice "Issued" | Auto-created on delivery | Good |
| View invoice | Full invoice details | - | Good - professional format |

**Friction:** None

### Step 10: Payment Recorded & Confirmed
| Action | User sees | System does | Pain points |
|--------|-----------|-------------|-------------|
| Buyer makes bank transfer | - (outside system) | - | N/A |
| Buyer clicks "Record Payment" | Payment form | Creates payment record | Form could show bank details to copy |
| Seller sees pending payment | Payment awaiting confirmation | - | Good |
| Seller clicks "Confirm Payment" | Invoice → Paid | Order → Closed | Good |

**Friction:** Bank details should be easily copyable

## 3.3 Journey Summary

| Metric | Rating | Notes |
|--------|--------|-------|
| **Clarity** | 7/10 | Some labels unclear |
| **Confidence** | 6/10 | Need more confirmation dialogs |
| **Speed** | 8/10 | Flow is efficient |
| **Errors** | 3/10 | No illegal actions possible |
| **Overall** | 7/10 | Usable but needs polish |

## 3.4 Pain Points Summary

1. **Icon-only buttons** - Hard to understand without tooltips
2. **Verbose labels** - "Mark Under Review" → "Start Review"
3. **Missing confirmations** - Confirm Order has no dialog
4. **Unclear statuses** - "Pending" doesn't say what's pending
5. **Bank details** - Not easily copyable for payment

---

# PART 4: UX IMPROVEMENTS

## 4.1 Status Label Improvements

### Order Statuses
| Current | Improved | Reason |
|---------|----------|--------|
| `pending_confirmation` | `Awaiting Confirmation` | Says what's being waited for |
| `confirmed` | `Confirmed` | OK as is |
| `processing` | `Preparing` | More human |
| `shipped` | `In Transit` | Standard e-commerce term |
| `delivered` | `Delivered` | OK as is |
| `cancelled` | `Cancelled` | OK as is |
| `closed` | `Complete` | More positive |

### RFQ Statuses
| Current | Improved | Reason |
|---------|----------|--------|
| `new` | `New` | OK as is |
| `under_review` | `In Review` | Shorter |
| `quoted` | `Quote Sent` | Clearer what happened |
| `accepted` | `Accepted` | OK as is |
| `rejected` | `Declined` | Less harsh |
| `ignored` | `No Quote` | Less judgmental |

### Invoice Statuses
| Current | Improved | Reason |
|---------|----------|--------|
| `issued` | `Awaiting Payment` | Action-oriented |
| `overdue` | `Overdue` | OK as is (red badge) |
| `paid` | `Paid` | OK as is (green badge) |

## 4.2 Button Label Improvements

### Seller Actions
| Current | Improved | Reason |
|---------|----------|--------|
| Icon only (confirm) | `Confirm Order` | Add text on hover/mobile |
| "Mark Under Review" | `Start Review` | Shorter, action verb |
| "Mark as Ignored" | `Decline to Quote` | Professional |
| Icon only (ship) | `Ship Order` | Add text |
| Icon only (processing) | `Start Preparing` | Clearer |

### Buyer Actions
| Current | Improved | Reason |
|---------|----------|--------|
| "Accept" | `Accept Quote` | More specific |
| "Received" | `Confirm Delivery` | Standard term |
| "Record Payment" | `I've Paid` | Human language |

## 4.3 Empty State Improvements

### No Orders Yet (Seller)
**Current:** "No orders yet"
**Improved:** "No orders yet. When buyers place orders, they'll appear here."

### No RFQs Yet (Seller)
**Current:** "No RFQs in inbox"
**Improved:** "Your inbox is empty. Quote requests from buyers will appear here."

### No Invoices (Buyer)
**Current:** "No invoices yet"
**Improved:** "No invoices yet. Invoices are created when your orders are delivered."

## 4.4 Success/Error Message Improvements

### Success Messages
| Action | Current | Improved |
|--------|---------|----------|
| Order confirmed | "Order confirmed" | "Order confirmed. You can now start preparing it." |
| Quote sent | "Quote sent successfully" | "Quote sent! The buyer will be notified." |
| Payment confirmed | "Payment confirmed" | "Payment confirmed. This order is now complete." |

### Error Messages
| Error | Current | Improved |
|-------|---------|----------|
| Can't cancel | "Cannot cancel order" | "This order can't be cancelled because it's already shipped." |
| Quote expired | "Quote has expired" | "This quote has expired. Ask the seller for a new quote." |

## 4.5 Confirmation Dialogs (Add These)

### Confirm Order
**Title:** Confirm this order?
**Body:** You'll need to prepare and ship this order within the agreed timeframe.
**Actions:** [Cancel] [Confirm Order]

### Start Processing
**Title:** Start preparing this order?
**Body:** This marks the order as "Preparing" so the buyer knows you're working on it.
**Actions:** [Cancel] [Start Preparing]

### Confirm Delivery (Buyer)
**Title:** Confirm you received this order?
**Body:** By confirming, you agree the items match what you ordered.
**Actions:** [Report Issue] [Confirm Delivery]

---

# PART 5: FINAL CONFIRMATION

## 5.1 System Stability Checklist

| Check | Status | Notes |
|-------|--------|-------|
| All states have clear meanings | ✓ | After cleanup |
| No duplicate states | ✓ | Merged pending/new, revised/sent |
| All transitions are valid | ✓ | Documented in tables |
| All buttons have one purpose | ✓ | Reviewed all actions |
| No dead code paths | ⚠️ | Counter Offer needs removal |
| Error states are handled | ✓ | All have messages |
| Terminal states are truly terminal | ✓ | Verified |

## 5.2 What Was Removed/Merged

| Item | Type | Action | Reason |
|------|------|--------|--------|
| `pending_confirmation` | Order status | Renamed to `pending` | Shorter |
| `refunded` | Order status | Moved to payment | Not order concern |
| `pending` (RFQ) | RFQ status | Merged with `new` | Duplicate |
| `viewed` | RFQ status | Removed | Use timestamp instead |
| `revised` | Quote status | Merged with `sent` | Use versioning |
| `draft` | Invoice status | Removed | Auto-issue |
| Counter Offer button | UI | Remove | Not implemented |
| Negotiate tab | UI | Remove | Not implemented |
| `priorityScore` | RFQ field | Remove | Unused |

## 5.3 Final Verdict

> **"Would a real human use this daily without help?"**

**Answer: YES, with the proposed changes.**

The system is fundamentally sound. The main issues are:
1. **Naming clarity** - Fixed with label improvements
2. **Missing confirmations** - Fixed with dialog additions
3. **Dead features** - Fixed by removal

After implementing these changes, the system will be:
- **Boring** - No surprises, predictable flows
- **Reliable** - Clear state machines, no illegal transitions
- **Impossible to misuse** - Confirmation dialogs prevent accidents

---

## Implementation Priority

### Phase 1: Critical (Do First)
1. Add confirmation dialogs for Confirm Order, Start Processing
2. Remove Counter Offer button and Negotiate tab
3. Rename `pending_confirmation` to `pending` in code

### Phase 2: High (Do Soon)
1. Update all status labels per recommendations
2. Update all button labels per recommendations
3. Improve empty states

### Phase 3: Medium (Do Eventually)
1. Remove `viewed` as a status (keep timestamp)
2. Merge `revised` into `sent` with versioning
3. Skip `draft` invoice state, auto-issue

### Phase 4: Low (Nice to Have)
1. Add copyable bank details in invoice
2. Add order preview before quote acceptance
3. Improve error messages

---

*Document prepared by: System Hardening Analysis*
*Status: Ready for Implementation*
