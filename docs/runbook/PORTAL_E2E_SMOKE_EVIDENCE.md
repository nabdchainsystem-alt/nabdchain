# Portal E2E Smoke Evidence — Orders Flow

> **Generated**: 2026-02-08T17:47Z
> **Environment**: localhost:3001, SQLite dev DB
> **Verdict**: ALL 3 STEPS PASS

---

## Preconditions

| Entity | ID | Email |
|--------|----|-------|
| Buyer User | `usr_9cfa1ad6043145ee8149d5817c7d63cd` | smoke-buyer@test.com |
| Buyer Profile | `ef0200b1-89e4-4210-93d5-d107c0cf86bd` | — |
| Seller User | `usr_0a995d8daff94c05b3a7fad507404d8a` | smoke-seller@test.com |
| Seller Profile | `5590c1a7-b5ac-4c0e-b6de-b75aa886f9fe` | — |
| Item | `80e20151-55ec-4822-8bfa-4893169dceda` | SKU: STW-001 |
| RFQ | `e09605d0-c4c5-45e4-ad94-0644cbbdbc63` | RFQ-2026-004 |
| Quote | `2ff393be-dc8a-4af9-9ca5-450d93b531c1` | QT-2026-0006 |

**Accounts created via**: `POST /api/auth/portal/buyer/signup` and `POST /api/auth/portal/seller/signup`
**No mock data, no seed scripts, no demo credentials.**

---

## Setup Commands (Pre-flight)

```bash
# 1. Create buyer
curl -s -X POST http://localhost:3001/api/auth/portal/buyer/signup \
  -H "Content-Type: application/json" \
  --data-raw '{"fullName":"Smoke Test Buyer","email":"smoke-buyer@test.com","password":"SmokeBuyer2024@","companyName":"Smoke Test Corp"}'

# 2. Create seller
curl -s -X POST http://localhost:3001/api/auth/portal/seller/signup \
  -H "Content-Type: application/json" \
  --data-raw '{"fullName":"Smoke Test Seller","email":"smoke-seller@test.com","password":"SmokeSeller2024@","displayName":"Smoke Supplies"}'

# 3. Seller creates item
curl -s -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  --data-raw '{"name":"Smoke Test Widget","sku":"STW-001","category":"Industrial Parts","price":25.50,"currency":"SAR","stock":100,"minOrderQty":10,"status":"active","visibility":"public"}'

# 4. Buyer creates RFQ
curl -s -X POST http://localhost:3001/api/items/rfq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  --data-raw '{"itemId":"<ITEM_ID>","sellerId":"<SELLER_USER_ID>","quantity":50,"message":"Need 50 units","deliveryLocation":"Riyadh, SA","requiredDeliveryDate":"2026-03-15T00:00:00Z"}'

# 5. Seller creates + sends quote
curl -s -X POST http://localhost:3001/api/items/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  --data-raw '{"rfqId":"<RFQ_ID>","unitPrice":24.00,"quantity":50,"deliveryDays":14,"deliveryTerms":"FOB","notes":"Pricing","validUntil":"2026-03-01T00:00:00Z"}'

curl -s -X POST http://localhost:3001/api/items/quotes/<QUOTE_ID>/send \
  -H "Authorization: Bearer $SELLER_TOKEN"
```

---

## Step A: Buyer Accepts Quote -> Order Created

### Request

```
POST /api/items/quotes/2ff393be-dc8a-4af9-9ca5-450d93b531c1/accept
Authorization: Bearer <BUYER_TOKEN>
Idempotency-Key: smoke-accept-2ff393be-1707410844
Content-Type: application/json

{"buyerNotes":"Please ship to Riyadh warehouse"}
```

### Response (201 Created)

```json
{
  "id": "5e4c76fa-f9a8-4691-ad53-3fc90b8e48e7",
  "orderNumber": "ORD-2026-00003",
  "buyerId": "ef0200b1-89e4-4210-93d5-d107c0cf86bd",
  "sellerId": "usr_0a995d8daff94c05b3a7fad507404d8a",
  "itemName": "Smoke Test Widget",
  "itemSku": "STW-001",
  "rfqId": "e09605d0-c4c5-45e4-ad94-0644cbbdbc63",
  "rfqNumber": "RFQ-2026-004",
  "quoteId": "2ff393be-dc8a-4af9-9ca5-450d93b531c1",
  "quoteNumber": "QT-2026-0006",
  "quantity": 50,
  "unitPrice": 24,
  "totalPrice": 1200,
  "currency": "SAR",
  "status": "pending_confirmation",
  "paymentStatus": "unpaid",
  "fulfillmentStatus": "not_started",
  "source": "rfq",
  "healthStatus": "on_track",
  "healthScore": 100,
  "confirmationDeadline": "2026-02-09T17:47:24.430Z",
  "shippingDeadline": "2026-02-24T17:47:24.430Z",
  "createdAt": "2026-02-08T17:47:24.430Z"
}
```

**Frontend path**: `AcceptQuoteDialog.tsx` -> `marketplaceOrderService.acceptQuote()` -> `POST /api/items/quotes/:id/accept`
**Backend path**: `itemRoutes.ts:2377` -> `marketplaceOrderService.acceptQuote()` (server service) -> Prisma transaction
**Result**: PASS

---

## Step B: Buyer Orders List

### Request

```
GET /api/items/orders/buyer?limit=10
Authorization: Bearer <BUYER_TOKEN>
```

### Response (200 OK)

```json
{
  "orders": [
    {
      "id": "5e4c76fa-f9a8-4691-ad53-3fc90b8e48e7",
      "orderNumber": "ORD-2026-00003",
      "itemName": "Smoke Test Widget",
      "status": "pending_confirmation",
      "totalPrice": 1200,
      "currency": "SAR",
      "createdAt": "2026-02-08T17:47:24.430Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Frontend path**: `MyOrders.tsx` -> `UnifiedOrders` -> `useOrdersData` -> `marketplaceOrderService.getBuyerOrders()` -> `GET /api/items/orders/buyer`
**Backend path**: `itemRoutes.ts:2799` -> `marketplaceOrderService.getBuyerOrders()` (server service)
**Result**: PASS — order `ORD-2026-00003` visible in buyer's list

---

## Step C: Seller Orders List

### Request

```
GET /api/items/orders/seller?limit=10
Authorization: Bearer <SELLER_TOKEN>
```

### Response (200 OK)

```json
{
  "orders": [
    {
      "id": "5e4c76fa-f9a8-4691-ad53-3fc90b8e48e7",
      "orderNumber": "ORD-2026-00003",
      "itemName": "Smoke Test Widget",
      "status": "pending_confirmation",
      "totalPrice": 1200,
      "currency": "SAR",
      "slaEvaluation": {
        "currentStep": "pending_confirmation",
        "currentDeadline": "2026-02-09T17:47:24.430Z",
        "status": "on_track",
        "statusText": "On track",
        "timeText": "23h 59m remaining"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Frontend path**: `UnifiedOrders(role="seller")` -> `useOrdersData` -> `marketplaceOrderService.getSellerOrders()` -> `GET /api/items/orders/seller`
**Backend path**: `itemRoutes.ts:2835` -> `marketplaceOrderService.getSellerOrders()` (server service, uses `resolveAllSellerIds()`)
**Result**: PASS — same order `ORD-2026-00003` visible in seller's list with SLA evaluation

---

## DB Evidence

### MarketplaceOrder

```json
{
  "id": "5e4c76fa-f9a8-4691-ad53-3fc90b8e48e7",
  "orderNumber": "ORD-2026-00003",
  "buyerId": "ef0200b1-89e4-4210-93d5-d107c0cf86bd",
  "sellerId": "usr_0a995d8daff94c05b3a7fad507404d8a",
  "quoteId": "2ff393be-dc8a-4af9-9ca5-450d93b531c1",
  "rfqId": "e09605d0-c4c5-45e4-ad94-0644cbbdbc63",
  "status": "pending_confirmation",
  "totalPrice": 1200,
  "currency": "SAR",
  "createdAt": "2026-02-08T17:47:24.430Z"
}
```

### MarketplaceOrderAudit

```json
[
  {
    "id": "a1251496-2357-4132-86cb-8b037178bb04",
    "orderId": "5e4c76fa-f9a8-4691-ad53-3fc90b8e48e7",
    "action": "created",
    "actor": "buyer",
    "actorId": "ef0200b1-89e4-4210-93d5-d107c0cf86bd",
    "previousValue": null,
    "newValue": "pending_confirmation",
    "metadata": "{\"quoteId\":\"2ff393be-dc8a-4af9-9ca5-450d93b531c1\",\"rfqId\":\"e09605d0-c4c5-45e4-ad94-0644cbbdbc63\",\"totalPrice\":1200}",
    "createdAt": "2026-02-08T17:47:24.435Z"
  }
]
```

### Quote (after acceptance)

```json
{
  "id": "2ff393be-dc8a-4af9-9ca5-450d93b531c1",
  "quoteNumber": "QT-2026-0006",
  "status": "accepted",
  "acceptedAt": "2026-02-08T17:47:24.432Z",
  "orderId": "5e4c76fa-f9a8-4691-ad53-3fc90b8e48e7"
}
```

### ItemRFQ (after acceptance)

```json
{
  "id": "e09605d0-c4c5-45e4-ad94-0644cbbdbc63",
  "rfqNumber": "RFQ-2026-004",
  "status": "accepted"
}
```

**Prisma models written**: `MarketplaceOrder`, `MarketplaceOrderAudit`, `Quote` (updated), `ItemRFQ` (updated), `QuoteVersion`, `QuoteEvent`, `ItemRFQEvent`

---

## Fix Suggestions

**No fixes needed.** The entire Orders flow (buyer accept quote -> order created -> seller sees order -> buyer sees order) works end-to-end with zero code changes.

### Notes

1. **Dual Order Route Systems**: The codebase has two parallel order route sets:
   - `/api/items/orders/*` (in `itemRoutes.ts`) — used by the portal frontend, supports portal JWT auth with `resolveBuyerId()`/`resolveAllSellerIds()`
   - `/api/orders/*` (in `orderRoutes.ts`) — uses Clerk auth with direct `auth.userId`, used for tracking stats only by the portal frontend

   This is not a bug — the `/api/items/` routes are the canonical portal routes, while `/api/orders/` routes serve the main app.

2. **Seller ID Resolution**: The seller's `MarketplaceOrder.sellerId` stores the `User.id` (not `SellerProfile.id`). The `resolveAllSellerIds()` function handles this by checking both IDs when querying orders.

3. **SLA Evaluation**: Seller order list enriches each order with `slaEvaluation` (deadline tracking), which the buyer list does not include. This is by design — SLA is seller-facing.

4. **Idempotency**: The accept-quote endpoint requires an `Idempotency-Key` header (enforced by middleware). The frontend generates it as `accept-quote-{quoteId}-{timestamp}`.
