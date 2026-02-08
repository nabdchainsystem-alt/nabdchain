# Portal E2E Flow Verification

> Last updated: 2026-02-06
> Complete verification guide for the Portal RFQ → Quote → Order → Invoice flow

## Overview

This document provides step-by-step verification of the complete Portal business flow with real database persistence.

## Data Models Used

| Stage | Model | Table |
|-------|-------|-------|
| Items/Listings | `Item` | `Item` |
| RFQ Creation | `ItemRFQ` | `ItemRFQ` |
| Quote | `Quote` | `Quote` |
| Order | `MarketplaceOrder` | `MarketplaceOrder` |
| Invoice | `MarketplaceInvoice` | `MarketplaceInvoice` |

## API Endpoints - Complete E2E Flow

### Stage 0: Seller Lists Items

| Step | Frontend Service | Endpoint | Backend Location |
|------|------------------|----------|------------------|
| Create Item | `itemService.createItem()` | POST `/api/items` | `server/src/routes/itemRoutes.ts:375` |
| List Items | `itemService.getSellerItems()` | GET `/api/items` | `server/src/routes/itemRoutes.ts:346` |
| Activate Item | `itemService.updateItem()` | PUT `/api/items/:id` | `server/src/routes/itemRoutes.ts:405` |

**Visibility Requirements:**
- `status` = `'active'`
- `visibility` = `'public'` or `'rfq_only'`

### Stage 1: Buyer Browses & Creates RFQ

| Step | Frontend Service | Endpoint | Backend Location |
|------|------------------|----------|------------------|
| Browse Marketplace | `itemService.getMarketplaceItems()` | GET `/api/items/marketplace/browse` | `server/src/routes/itemRoutes.ts:462` |
| View Item | `itemService.getMarketplaceItem()` | GET `/api/items/marketplace/:id` | `server/src/routes/itemRoutes.ts:506` |
| Create RFQ | `itemService.createRFQ()` | POST `/api/items/rfq` | `server/src/routes/itemRoutes.ts:558` |
| View My RFQs | `itemService.getBuyerRFQs()` | GET `/api/items/rfq/buyer` | `server/src/routes/itemRoutes.ts:642` |

### Stage 2: Seller Reviews RFQ

| Step | Frontend Service | Endpoint | Backend Location |
|------|------------------|----------|------------------|
| View Inbox | `sellerRfqInboxService.getInbox()` | GET `/api/items/rfq/seller/inbox` | `server/src/routes/itemRoutes.ts:739` |
| View RFQ Detail | `sellerRfqInboxService.getRFQDetail()` | GET `/api/items/rfq/seller/inbox/:id` | `server/src/routes/itemRoutes.ts:774` |
| Mark Under Review | `sellerRfqInboxService.updateStatus()` | PATCH `/api/items/rfq/seller/inbox/:id/status` | `server/src/routes/itemRoutes.ts:796` |

### Stage 3: Seller Creates & Sends Quote

| Step | Frontend Service | Endpoint | Backend Location |
|------|------------------|----------|------------------|
| Create Draft Quote | `quoteService.createDraft()` | POST `/api/items/quotes` | `server/src/routes/itemRoutes.ts:1600` |
| Update Quote | `quoteService.updateQuote()` | PUT `/api/items/quotes/:id` | `server/src/routes/itemRoutes.ts:1733` |
| Send Quote | `quoteService.sendQuote()` | POST `/api/items/quotes/:id/send` | `server/src/routes/itemRoutes.ts:1777` |
| View Quotes | `quoteService.getQuotes()` | GET `/api/items/quotes` | `server/src/routes/itemRoutes.ts:1645` |

### Stage 4: Buyer Accepts Quote → Order Created

| Step | Frontend Service | Endpoint | Backend Location |
|------|------------------|----------|------------------|
| View Received Quotes | `quoteService.getQuotesByRFQ()` | GET `/api/items/quotes/rfq/:rfqId` | `server/src/routes/itemRoutes.ts:1705` |
| Accept Quote | `marketplaceOrderService.acceptQuote()` | POST `/api/items/quotes/:id/accept` | `server/src/routes/itemRoutes.ts:1908` |
| View Buyer Orders | `marketplaceOrderService.getBuyerOrders()` | GET `/api/items/orders/buyer` | `server/src/routes/itemRoutes.ts:2324` |

**Order Auto-Creation:**
When buyer accepts a quote:
1. `MarketplaceOrder` created with `status='pending_confirmation'`
2. `Quote.status` updated to `'accepted'`
3. `ItemRFQ.status` updated to `'accepted'`
4. Audit events logged

### Stage 5: Seller Fulfills Order

| Step | Frontend Service | Endpoint | Backend Location |
|------|------------------|----------|------------------|
| View Seller Orders | `marketplaceOrderService.getSellerOrders()` | GET `/api/items/orders/seller` | `server/src/routes/itemRoutes.ts:2357` |
| Confirm Order | `marketplaceOrderService.confirmOrder()` | POST `/api/items/orders/:id/confirm` | `server/src/routes/itemRoutes.ts:2446` |
| Start Processing | `marketplaceOrderService.startProcessing()` | POST `/api/items/orders/:id/process` | `server/src/routes/itemRoutes.ts:2586` |
| Ship Order | `marketplaceOrderService.shipOrder()` | POST `/api/items/orders/:id/ship` | `server/src/routes/itemRoutes.ts:2623` |
| Mark Delivered | `marketplaceOrderService.markDelivered()` | POST `/api/items/orders/:id/deliver` | `server/src/routes/itemRoutes.ts:2663` |

**Order Status Flow:**
```
pending_confirmation → confirmed → processing → shipped → delivered → closed
```

### Stage 6: Invoice Generated

| Step | Frontend Service | Endpoint | Backend Location |
|------|------------------|----------|------------------|
| View Buyer Invoices | `marketplaceInvoiceService.getBuyerInvoices()` | GET `/api/invoices/buyer` | `server/src/routes/invoiceRoutes.ts:189` |
| View Seller Invoices | `marketplaceInvoiceService.getSellerInvoices()` | GET `/api/invoices/seller` | `server/src/routes/invoiceRoutes.ts:39` |
| Get Invoice by Order | `marketplaceInvoiceService.getInvoiceByOrder()` | GET `/api/invoices/order/:orderId` | `server/src/routes/invoiceRoutes.ts:253` |

**Invoice Auto-Generation:**
Invoice is automatically generated when order status changes to `'delivered'` (see `server/src/services/marketplaceOrderService.ts`).

---

## Click-Path Verification Steps

### Prerequisites

1. Start backend server:
   ```bash
   cd server && pnpm dev
   # Should see: "NABD API running on port 3001"
   ```

2. Start frontend:
   ```bash
   pnpm dev
   # Should see: Vite server on http://localhost:5173
   ```

3. Create test accounts via Portal signup:
   - Seller account: `seller@test.com`
   - Buyer account: `buyer@test.com`

---

### Test Flow A: Complete RFQ → Order Cycle

#### A1. Seller Creates & Activates Item

1. Login as seller
2. Navigate to **Listings** page
3. Click **Add Product**
4. Fill in:
   - Name: "Test Widget"
   - SKU: "TW-001"
   - Category: "Parts"
   - Price: 100.00 SAR
   - Stock: 50
5. Click **Save as Draft**
6. Click **Activate** to set status to `active`

**Verify DB:**
```sql
SELECT id, name, sku, status, visibility FROM "Item" WHERE sku = 'TW-001';
-- Should show: status='active', visibility='public'
```

#### A2. Buyer Browses & Creates RFQ

1. Login as buyer
2. Navigate to **Marketplace**
3. Search for "Test Widget"
4. Click on item
5. Click **Request Quote**
6. Fill in:
   - Quantity: 10
   - Delivery Location: "Riyadh, Saudi Arabia"
   - Message: "Need urgent delivery"
7. Submit RFQ

**Verify DB:**
```sql
SELECT id, rfq_number, status, quantity FROM "ItemRFQ" WHERE buyer_id = '<buyer_id>';
-- Should show: status='new', quantity=10
```

#### A3. Seller Reviews & Creates Quote

1. Login as seller
2. Navigate to **RFQs Inbox**
3. Click on the new RFQ
4. Click **Create Quote**
5. Fill in:
   - Unit Price: 95.00 SAR
   - Delivery Days: 5
   - Valid Until: (7 days from now)
6. Click **Save Draft**
7. Click **Send to Buyer**

**Verify DB:**
```sql
SELECT id, quote_number, status, unit_price FROM "Quote" WHERE rfq_id = '<rfq_id>';
-- Should show: status='sent', unit_price=95.00
```

#### A4. Buyer Accepts Quote → Order Created

1. Login as buyer
2. Navigate to **My RFQs**
3. Click on RFQ (should show "Quoted" status)
4. Review quote details
5. Click **Accept Quote**
6. Confirm shipping address
7. Submit

**Verify DB:**
```sql
-- Order created
SELECT id, order_number, status, total_price FROM "MarketplaceOrder" WHERE quote_id = '<quote_id>';
-- Should show: status='pending_confirmation'

-- Quote updated
SELECT status FROM "Quote" WHERE id = '<quote_id>';
-- Should show: status='accepted'

-- RFQ updated
SELECT status FROM "ItemRFQ" WHERE id = '<rfq_id>';
-- Should show: status='accepted'
```

#### A5. Seller Fulfills Order

1. Login as seller
2. Navigate to **Orders**
3. Click on pending order
4. Click **Confirm Order**
5. Click **Start Processing**
6. Click **Ship** → Enter tracking info
7. (Buyer or system) Click **Mark Delivered**

**Verify DB:**
```sql
SELECT status, shipped_at, delivered_at FROM "MarketplaceOrder" WHERE id = '<order_id>';
-- Should show: status='delivered', shipped_at != null, delivered_at != null
```

#### A6. Invoice Generated

**Verify DB:**
```sql
SELECT id, invoice_number, status, total_amount FROM "MarketplaceInvoice" WHERE order_id = '<order_id>';
-- Should show: status='draft' or 'issued'
```

1. Login as buyer
2. Navigate to **Invoices**
3. Should see invoice for the order

---

## Database Verification Queries

Run these in Prisma Studio or directly via psql:

```bash
# Open Prisma Studio
cd server && npx prisma studio
```

### Check Items Visible in Marketplace
```sql
SELECT id, name, status, visibility FROM "Item"
WHERE status = 'active' AND visibility != 'hidden';
```

### Check RFQ Flow
```sql
SELECT
  r.rfq_number,
  r.status as rfq_status,
  q.quote_number,
  q.status as quote_status,
  o.order_number,
  o.status as order_status
FROM "ItemRFQ" r
LEFT JOIN "Quote" q ON q.rfq_id = r.id
LEFT JOIN "MarketplaceOrder" o ON o.quote_id = q.id
ORDER BY r.created_at DESC;
```

### Check Order → Invoice Chain
```sql
SELECT
  o.order_number,
  o.status as order_status,
  i.invoice_number,
  i.status as invoice_status
FROM "MarketplaceOrder" o
LEFT JOIN "MarketplaceInvoice" i ON i.order_id = o.id
ORDER BY o.created_at DESC;
```

---

## Troubleshooting

### Issue: Items not showing in Marketplace

**Check:**
1. Item `status` must be `'active'`
2. Item `visibility` must be `'public'` or `'rfq_only'` (not `'hidden'`)
3. Item `stock` should be > 0 (or `allowDirectPurchase` doesn't matter for RFQ)

**Fix:**
```sql
UPDATE "Item" SET status = 'active', visibility = 'public' WHERE id = '<item_id>';
```

### Issue: Quote creation fails with "RFQ not in under_review status"

**Expected:** RFQ must be marked as "under_review" before creating a quote.

**Fix:** Seller must click "Mark as Reviewing" in the RFQ inbox first.

### Issue: Order not created after accepting quote

**Check:**
1. Quote `status` must be `'sent'` or `'revised'`
2. Quote `validUntil` must be in the future
3. RFQ `status` must be `'quoted'`
4. No existing order for this quote

**Debug:**
```sql
SELECT status, valid_until FROM "Quote" WHERE id = '<quote_id>';
SELECT status FROM "ItemRFQ" WHERE id = '<rfq_id>';
SELECT * FROM "MarketplaceOrder" WHERE quote_id = '<quote_id>';
```

### Issue: Invoice not generated after delivery

**Check:** Invoice is auto-generated in `marketplaceOrderService.markDelivered()`.

**Manual generation:**
```
POST /api/invoices/generate/:orderId
```

---

## API Testing with cURL

### Test Item Visibility
```bash
curl http://localhost:3001/api/items/marketplace/browse | jq '.items | length'
```

### Test RFQ Creation (requires auth token)
```bash
curl -X POST http://localhost:3001/api/items/rfq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "itemId": "<item_id>",
    "sellerId": "<seller_id>",
    "quantity": 10,
    "deliveryLocation": "Riyadh, SA"
  }'
```

### Test Quote Accept (creates order)
```bash
curl -X POST http://localhost:3001/api/items/quotes/<quote_id>/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <buyer_token>" \
  -H "x-idempotency-key: unique-key-123" \
  -d '{}'
```

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Item Creation | GREEN | Real DB writes |
| Marketplace Browse | GREEN | Filters by status='active' |
| RFQ Creation | GREEN | Creates ItemRFQ record |
| Seller Inbox | GREEN | Reads from ItemRFQ |
| Quote Creation | GREEN | Creates Quote record |
| Quote Accept | GREEN | Creates MarketplaceOrder |
| Order Fulfillment | GREEN | Updates order status |
| Invoice Generation | GREEN | Auto-generates on delivery |

**All core E2E flows are functional with real database persistence.**
