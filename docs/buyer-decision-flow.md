# Buyer Decision Flow - Unified Design

> **Purpose**: Eliminate buyer confusion between RFQ and Purchase by creating a single, clear decision flow.

## Executive Summary

The buyer journey has **one goal**: acquire products. The current system has two paths (Buy Now vs RFQ) that can confuse users. This document unifies them into a **single decision flow** where the system guides buyers through the optimal path based on item availability and pricing.

---

## 1. The Unified Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUYER DECISION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   DISCOVER   │
                              │  (Entry)     │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │ Marketplace │  │ Saved Items │  │ Seller      │
            │ Browse      │  │ Wishlist    │  │ Storefront  │
            └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                   │                │                │
                   └────────────────┼────────────────┘
                                    ▼
                         ┌────────────────────┐
                         │   SELECT ITEMS     │
                         │   (Add to Cart)    │
                         └─────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
           ┌───────────────────┐       ┌───────────────────┐
           │  COMPARE (Opt.)   │       │  SKIP TO CART     │
           │  ────────────────  │       │                   │
           │  • Side-by-side   │       │                   │
           │  • Smart scoring  │       │                   │
           │  • Best pick      │       │                   │
           └─────────┬─────────┘       └─────────┬─────────┘
                     │                           │
                     └─────────────┬─────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │           CART              │
                    │     (Decision Point)        │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   SYSTEM AUTO-SORTS BY    │
                    │   AVAILABILITY + PRICE    │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  ✅ READY NOW    │   │  💬 QUOTE NEEDED │   │  ⚠️ UNAVAILABLE  │
│  ──────────────  │   │  ──────────────  │   │  ──────────────  │
│  In stock        │   │  Negotiable      │   │  Out of stock    │
│  Fixed price     │   │  Bulk order      │   │  Discontinued    │
│  Direct purchase │   │  Custom specs    │   │  Region blocked  │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         │                      │                      ▼
         │                      │             ┌──────────────────┐
         │                      │             │  REMOVE/NOTIFY   │
         │                      │             │  ──────────────  │
         │                      │             │  • Remove item   │
         │                      │             │  • Watch for     │
         │                      │             │    restock       │
         │                      │             │  • Find similar  │
         │                      │             └──────────────────┘
         │                      │
         │                      ▼
         │             ┌──────────────────┐
         │             │  REQUEST QUOTE   │
         │             │  ──────────────  │
         │             │  • Delivery info │
         │             │  • Quantity      │
         │             │  • Timeline      │
         │             │  • Notes         │
         │             └────────┬─────────┘
         │                      │
         │                      ▼
         │             ┌──────────────────┐
         │             │  AWAIT RESPONSE  │
         │             │  (1-3 days typ.) │
         │             └────────┬─────────┘
         │                      │
         │      ┌───────────────┼───────────────┐
         │      ▼               ▼               ▼
         │ ┌─────────┐    ┌─────────┐    ┌─────────┐
         │ │ Quote   │    │ Counter │    │ No      │
         │ │ Received│    │ Offer   │    │ Response│
         │ └────┬────┘    └────┬────┘    └────┬────┘
         │      │              │              │
         │      │              ▼              ▼
         │      │         ┌─────────┐   ┌─────────┐
         │      │         │Negotiate│   │ Expire/ │
         │      │         │ Price   │   │ Retry   │
         │      │         └────┬────┘   └─────────┘
         │      │              │
         │      └──────┬───────┘
         │             ▼
         │    ┌──────────────────┐
         │    │  ACCEPT QUOTE    │
         │    └────────┬─────────┘
         │             │
         └─────────────┼─────────────────────────────────────┐
                       │                                     │
                       ▼                                     │
              ┌──────────────────┐                           │
              │     CHECKOUT     │◄──────────────────────────┘
              │  ──────────────  │
              │  • Review items  │
              │  • Confirm qty   │
              │  • Select ship   │
              │  • Payment       │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   ORDER PLACED   │
              └────────┬─────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│  TRACK ORDER     │       │  MANAGE ORDER    │
│  ──────────────  │       │  ──────────────  │
│  • Status        │       │  • Cancel        │
│  • Shipping      │       │  • Modify        │
│  • ETA           │       │  • Dispute       │
│  • Docs          │       │  • Reorder       │
└──────────────────┘       └──────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │    COMPLETE      │
              │    (Exit)        │
              └──────────────────┘
```

---

## 2. Entry Points

### Primary Entry Points

| Entry Point | Location | User Intent | Flow Starts At |
|-------------|----------|-------------|----------------|
| **Marketplace** | Sidebar → Marketplace | Browse & discover products | DISCOVER |
| **Search** | Top bar search | Find specific item | DISCOVER |
| **Cart Icon** | Top bar | Continue shopping | CART |
| **Saved Items** | Sidebar → Saved | Review wishlist | SELECT ITEMS |
| **Seller Profile** | Marketplace → Seller | Buy from known supplier | DISCOVER |
| **Reorder** | Orders → Reorder | Repeat purchase | CART |
| **RFQ Response** | Notifications | Quote received | AWAIT RESPONSE |

### Secondary Entry Points

| Entry Point | Location | User Intent | Flow Starts At |
|-------------|----------|-------------|----------------|
| **Email Link** | External | Quote notification | AWAIT RESPONSE |
| **Compare** | Marketplace comparison | Evaluate options | COMPARE |
| **At-Risk Orders** | Dashboard widget | Resolve issues | MANAGE ORDER |

---

## 3. Exit Points

### Successful Exits

| Exit Point | Condition | Next Step | Re-entry Point |
|------------|-----------|-----------|----------------|
| **Order Complete** | Delivery confirmed | Rate & review | New order |
| **Quote Declined** | Buyer rejects quote | Browse alternatives | DISCOVER |
| **Cart Abandoned** | Session ends | Cart persisted | CART |

### Unsuccessful Exits

| Exit Point | Condition | Recovery Action | User Message |
|------------|-----------|-----------------|--------------|
| **Item Unavailable** | Stock depleted | Watch/Alternative | "Item unavailable. Get notified when back in stock?" |
| **Quote Expired** | No response | Retry with seller | "Quote expired. Request a new quote?" |
| **Payment Failed** | Transaction error | Retry payment | "Payment couldn't be processed. Try again?" |
| **Order Cancelled** | Seller/system cancel | Reorder option | "Order cancelled. Reason: [X]. Reorder?" |

---

## 4. Decision Points & Logic

### Cart Auto-Sort Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ITEM CLASSIFICATION LOGIC                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  For each item in cart:                                             │
│                                                                     │
│  1. Is item.status === 'active'?                                    │
│     └─ NO  → UNAVAILABLE (remove or watch)                          │
│     └─ YES → continue                                               │
│                                                                     │
│  2. Is item.stock >= cart.quantity?                                 │
│     └─ NO  → QUOTE NEEDED (insufficient stock)                      │
│     └─ YES → continue                                               │
│                                                                     │
│  3. Is item.allowDirectPurchase === true?                           │
│     └─ NO  → QUOTE NEEDED (seller prefers negotiation)              │
│     └─ YES → continue                                               │
│                                                                     │
│  4. Is item.isFixedPrice === true?                                  │
│     └─ NO  → QUOTE NEEDED (negotiable pricing)                      │
│     └─ YES → continue                                               │
│                                                                     │
│  5. Is cart.quantity > item.moqForDirectPurchase?                   │
│     └─ YES → QUOTE NEEDED (bulk order)                              │
│     └─ NO  → READY NOW ✅                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### User-Facing Categories (Simplified)

Instead of showing technical terms, show **buyer-friendly categories**:

| Internal Status | User Sees | Icon | Color |
|-----------------|-----------|------|-------|
| READY_NOW | "Ready to Order" | ✓ | Green |
| QUOTE_NEEDED | "Price on Request" | 💬 | Blue |
| UNAVAILABLE | "Currently Unavailable" | ⚠️ | Gray |

---

## 5. Error States

### Cart Errors

| Error | Cause | User Message | Recovery Action |
|-------|-------|--------------|-----------------|
| `ITEM_REMOVED` | Seller removed listing | "This item is no longer available" | Remove from cart, suggest alternatives |
| `PRICE_CHANGED` | Price updated after adding | "Price updated to $X (was $Y)" | Show diff, confirm to continue |
| `STOCK_REDUCED` | Stock dropped below qty | "Only X available (you requested Y)" | Adjust quantity or request quote |
| `SELLER_INACTIVE` | Seller paused account | "Seller temporarily unavailable" | Watch for reactivation |
| `CART_EXPIRED` | Session timeout (rare) | "Your cart has been updated" | Refresh cart |

### Quote/RFQ Errors

| Error | Cause | User Message | Recovery Action |
|-------|-------|--------------|-----------------|
| `QUOTE_EXPIRED` | Response window closed | "This quote has expired" | Request new quote |
| `QUOTE_MODIFIED` | Seller changed terms | "Seller updated the quote" | Review new terms |
| `RFQ_REJECTED` | Seller declined request | "Seller cannot fulfill this request" | Try different seller |
| `RFQ_TIMEOUT` | No response in X days | "No response received" | Resend or try alternate |
| `DUPLICATE_RFQ` | Already pending RFQ | "You have a pending request for this item" | View existing RFQ |

### Checkout Errors

| Error | Cause | User Message | Recovery Action |
|-------|-------|--------------|-----------------|
| `PAYMENT_FAILED` | Card declined | "Payment could not be processed" | Try different method |
| `ADDRESS_INVALID` | Delivery issue | "We can't deliver to this address" | Update address |
| `MINIMUM_NOT_MET` | Below MOQ | "Minimum order is X units" | Adjust quantity |
| `REGION_BLOCKED` | Shipping restriction | "Seller doesn't ship to your region" | Contact seller |

### Order Errors

| Error | Cause | User Message | Recovery Action |
|-------|-------|--------------|-----------------|
| `SHIPMENT_DELAYED` | Logistics issue | "Your order is delayed" | Track updates |
| `PARTIAL_SHIP` | Stock issue | "Part of your order shipped separately" | Track both |
| `DELIVERY_FAILED` | Address issue | "Delivery attempt failed" | Reschedule |
| `ORDER_CANCELLED` | Seller/system | "Order cancelled: [reason]" | Refund + reorder option |

---

## 6. UX Copy Suggestions

### Cart Page Headlines

**Current Problem**: Users see "Buy Now" vs "Request Quote" and don't understand the difference.

**Solution**: Use outcome-focused language:

```
INSTEAD OF                          USE
────────────────────────────────    ────────────────────────────────
"Buy Now"                           "Order Now — ships in 2-3 days"
"Request Quote"                     "Get Price — seller will respond"
"RFQ Required"                      "Price on Request"
"Not eligible for purchase"         "Contact Seller for Availability"
```

### Cart Section Headers

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Ready to Order (3 items)                     Subtotal: $450 │
│  ──────────────────────────────────────────────────────────────│
│  These items are in stock with confirmed pricing.               │
│                                                                 │
│  [ItemCard] [ItemCard] [ItemCard]                               │
│                                                                 │
│                               [ Continue to Checkout → ]        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  💬 Price on Request (2 items)                  Est: ~$1,200   │
│  ──────────────────────────────────────────────────────────────│
│  Request pricing from sellers. Most respond within 24 hours.    │
│                                                                 │
│  [ItemCard] [ItemCard]                                          │
│                                                                 │
│                               [ Request All Prices → ]          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Currently Unavailable (1 item)                              │
│  ──────────────────────────────────────────────────────────────│
│  These items aren't available right now.                        │
│                                                                 │
│  [ItemCard]                                                     │
│                                                                 │
│  [ Remove ] [ Notify When Available ] [ Find Similar ]          │
└─────────────────────────────────────────────────────────────────┘
```

### Quote Request Flow Copy

**Step 1: Request**
```
┌─────────────────────────────────────────────────────────────────┐
│  Request Price                                                  │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  You're requesting pricing for:                                 │
│  • Widget Pro X3 (100 units)                                    │
│  • Connector Kit (50 units)                                     │
│                                                                 │
│  From: Acme Supplies                                            │
│  Typical response: Within 24 hours                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Add a message (optional)                                   │ │
│  │ ─────────────────────────────────────────────────────────  │ │
│  │ e.g., "Need delivery by March 15" or "Can you do better   │ │
│  │ pricing for 200 units?"                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│             [ Cancel ]    [ Request Price → ]                   │
└─────────────────────────────────────────────────────────────────┘
```

**Step 2: Waiting**
```
┌─────────────────────────────────────────────────────────────────┐
│  Price Requested ✓                                              │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  We've sent your request to Acme Supplies.                      │
│                                                                 │
│  📧 You'll get an email when they respond.                      │
│  ⏱️ Average response time: 18 hours                             │
│                                                                 │
│  What happens next:                                             │
│  1. Seller reviews your request                                 │
│  2. They send you a price quote                                 │
│  3. You accept, negotiate, or decline                           │
│  4. Once accepted, you complete your order                      │
│                                                                 │
│             [ View My Requests ]    [ Continue Shopping ]       │
└─────────────────────────────────────────────────────────────────┘
```

**Step 3: Quote Received**
```
┌─────────────────────────────────────────────────────────────────┐
│  Quote Received 🎉                                              │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Acme Supplies sent pricing for your request:                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Item              Qty    Unit Price    Total            │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Widget Pro X3     100    $12.50        $1,250           │   │
│  │ Connector Kit      50    $8.00         $400             │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Subtotal                               $1,650           │   │
│  │ Shipping (Est.)                        $85              │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Total                                  $1,735           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Valid until: March 10, 2026                                    │
│  Delivery: 5-7 business days                                    │
│                                                                 │
│     [ Decline ]    [ Counter Offer ]    [ Accept & Order → ]    │
└─────────────────────────────────────────────────────────────────┘
```

### Checkout Flow Copy

**Mixed Cart (Ready + Quoted)**
```
┌─────────────────────────────────────────────────────────────────┐
│  Complete Your Order                                            │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  You're ordering from 2 sellers:                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📦 Acme Supplies                                          │ │
│  │    3 items • $450 • Ships in 2-3 days                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📦 TechParts Co                                           │ │
│  │    1 item • $85 • Ships in 1-2 days                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ℹ️ Each seller will ship separately. You'll receive            │
│     tracking info for each shipment.                            │
│                                                                 │
│                                      Order Total: $535          │
│                               [ Place Order → ]                 │
└─────────────────────────────────────────────────────────────────┘
```

### Empty States

**Empty Cart**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        🛒                                       │
│                                                                 │
│                Your cart is empty                               │
│                                                                 │
│     Find products in the Marketplace or check your              │
│     saved items to add them to your cart.                       │
│                                                                 │
│     [ Browse Marketplace ]    [ View Saved Items ]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**No Pending Quotes**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        💬                                       │
│                                                                 │
│              No price requests yet                              │
│                                                                 │
│     When you request pricing from sellers, your                 │
│     requests and their responses will appear here.              │
│                                                                 │
│     [ Go to Cart ]    [ Browse Marketplace ]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. State Transition Table

| Current State | Action | Next State | Side Effects |
|---------------|--------|------------|--------------|
| `BROWSING` | Add to cart | `IN_CART` | Cart count updates |
| `IN_CART` | Remove item | `BROWSING` | Cart count updates |
| `IN_CART` | Checkout (ready items) | `PENDING_PAYMENT` | Cart locked for items |
| `IN_CART` | Request quote | `RFQ_PENDING` | RFQ created, item locked |
| `RFQ_PENDING` | Quote received | `QUOTE_RECEIVED` | Notification sent |
| `QUOTE_RECEIVED` | Accept quote | `PENDING_PAYMENT` | Quote converted to order |
| `QUOTE_RECEIVED` | Counter offer | `NEGOTIATING` | Counter-quote sent |
| `QUOTE_RECEIVED` | Decline | `BROWSING` | RFQ closed |
| `NEGOTIATING` | New quote | `QUOTE_RECEIVED` | Updated quote |
| `PENDING_PAYMENT` | Payment success | `ORDER_PLACED` | Order created |
| `PENDING_PAYMENT` | Payment failed | `PAYMENT_ERROR` | Retry enabled |
| `ORDER_PLACED` | Seller confirms | `ORDER_CONFIRMED` | ETA updated |
| `ORDER_CONFIRMED` | Shipped | `IN_TRANSIT` | Tracking available |
| `IN_TRANSIT` | Delivered | `DELIVERED` | Completion notification |
| `DELIVERED` | Rate | `COMPLETED` | Review submitted |

---

## 8. Visual Flow Summary (Simplified)

```
           ╔══════════════════════════════════════════════════════════╗
           ║                    BUYER'S JOURNEY                       ║
           ╚══════════════════════════════════════════════════════════╝

                    SHOP                 DECIDE                RECEIVE
              ──────────────       ──────────────        ──────────────

              ┌──────────┐         ┌──────────┐         ┌──────────┐
              │ Discover │         │   Cart   │         │  Track   │
              │ & Browse │───────▶ │ & Quote  │───────▶ │ & Manage │
              └──────────┘         └──────────┘         └──────────┘
                   │                    │                    │
                   ▼                    ▼                    ▼
              ┌──────────┐         ┌──────────┐         ┌──────────┐
              │ Compare  │         │ Checkout │         │ Complete │
              │ Options  │         │ & Pay    │         │ & Review │
              └──────────┘         └──────────┘         └──────────┘


         ───────────────────────────────────────────────────────────────
           STATES:    📂 Cart    💬 Quoting    💳 Paying    📦 Shipping
         ───────────────────────────────────────────────────────────────
```

---

## 9. Implementation Checklist

### Phase 1: Cart Unification
- [ ] Rename "Buy Now" section to "Ready to Order"
- [ ] Rename "Request Quote" section to "Price on Request"
- [ ] Add explanatory copy under each section header
- [ ] Implement auto-sort logic for three categories
- [ ] Add "Unavailable" section with recovery options

### Phase 2: Quote Flow Enhancement
- [ ] Streamline quote request to 1-click for cart items
- [ ] Add expected response time indicator
- [ ] Implement quote acceptance → checkout bridge
- [ ] Add "What happens next" confirmation screen

### Phase 3: Checkout Consolidation
- [ ] Unified checkout for mixed ready/quoted items
- [ ] Per-seller order grouping with clear shipping info
- [ ] Progress indicator: Review → Pay → Confirm

### Phase 4: Order Tracking
- [ ] Single "My Orders" view for all order types
- [ ] Status-based filtering (not source-based)
- [ ] Unified timeline view

---

## 10. Key Principles

1. **One Goal**: Help buyers get products. Period.
2. **No Jargon**: "Price on Request" not "RFQ Required"
3. **Clear Next Steps**: Always show what happens next
4. **Graceful Degradation**: Unavailable items get recovery options
5. **Unified Experience**: Same flow whether buying now or after quote
6. **Proactive Communication**: Tell users before they ask
