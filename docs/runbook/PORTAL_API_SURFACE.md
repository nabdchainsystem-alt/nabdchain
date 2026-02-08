# Portal API Surface Documentation

> Last updated: 2026-02-06
> Complete reference for the NABD Portal API endpoints

## Overview

The Portal API provides endpoints for buyers, sellers, and administrators in the NABD marketplace. All portal endpoints are consolidated under `/api/portal/*` for a clean, organized API surface.

## Base URL

- Development: `http://localhost:3001/api/portal`
- Production: `https://api.nabdchain.com/api/portal`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the `/api/portal/auth/*` endpoints.

---

## Buyer Endpoints

Base path: `/api/portal/buyer`

### Marketplace

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/marketplace` | Browse marketplace items | No |
| GET | `/marketplace/:id` | Get item details | No |

### RFQs (Request for Quotes)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/rfqs` | Get all buyer's RFQs | Yes |
| POST | `/rfqs` | Create a new RFQ | Yes |
| POST | `/rfqs/:id/accept` | Accept an RFQ quote | Yes |
| POST | `/rfqs/:id/reject` | Reject an RFQ quote | Yes |

### Quotes

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/quotes/rfq/:rfqId` | Get quotes for an RFQ | Yes |
| GET | `/quotes/:id` | Get quote details | Yes |
| POST | `/quotes/:id/accept` | Accept quote (creates order) | Yes |
| POST | `/quotes/:id/reject` | Reject quote | Yes |
| POST | `/quotes/:id/counter-offer` | Submit counter offer | Yes |

### Orders

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/orders` | Get all buyer's orders | Yes |
| GET | `/orders/:id` | Get order details | Yes |
| GET | `/orders/stats` | Get order statistics | Yes |
| POST | `/orders/:id/confirm-delivery` | Confirm delivery received | Yes |

### Invoices

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/invoices` | Get all buyer's invoices | Yes |
| GET | `/invoices/:id` | Get invoice details | Yes |

### Cart

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/cart` | Get cart contents | Yes |
| POST | `/cart/items` | Add item to cart | Yes |
| PATCH | `/cart/items/:itemId` | Update cart item quantity | Yes |
| DELETE | `/cart/items/:itemId` | Remove item from cart | Yes |
| DELETE | `/cart` | Clear entire cart | Yes |

### Workspace

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/purchases` | Get purchase history | Yes |
| GET | `/suppliers` | Get supplier list | Yes |
| GET | `/expenses` | Get expense data | Yes |

---

## Seller Endpoints

Base path: `/api/portal/seller`

### Items/Listings

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/items` | Get all seller's items | Yes |
| GET | `/items/:id` | Get item details | Yes |
| POST | `/items` | Create new item | Yes |
| PUT | `/items/:id` | Update item | Yes |
| DELETE | `/items/:id` | Delete item | Yes |
| GET | `/items/stats` | Get item statistics | Yes |

### RFQ Inbox

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/rfq/inbox` | Get paginated RFQ inbox | Yes |
| GET | `/rfq/inbox/:id` | Get RFQ details | Yes |
| PATCH | `/rfq/inbox/:id/status` | Update RFQ status | Yes |
| POST | `/rfq/inbox/:id/read` | Mark RFQ as read | Yes |
| POST | `/rfq/inbox/:id/archive` | Archive RFQ | Yes |
| GET | `/rfq/inbox/:id/history` | Get RFQ history | Yes |

### Quotes

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/quotes` | Get all seller's quotes | Yes |
| GET | `/quotes/:id` | Get quote details | Yes |
| POST | `/quotes` | Create draft quote | Yes |
| PUT | `/quotes/:id` | Update quote | Yes |
| POST | `/quotes/:id/send` | Send quote to buyer | Yes |
| DELETE | `/quotes/:id` | Delete draft quote | Yes |
| GET | `/quotes/:id/versions` | Get quote version history | Yes |

### Counter Offers

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/counter-offers/pending` | Get pending counter offers | Yes |
| POST | `/counter-offers/:id/accept` | Accept counter offer | Yes |
| POST | `/counter-offers/:id/reject` | Reject counter offer | Yes |

### Orders

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/orders` | Get all seller's orders | Yes |
| GET | `/orders/:id` | Get order details | Yes |
| GET | `/orders/stats` | Get order statistics | Yes |
| POST | `/orders/:id/confirm` | Confirm order | Yes |
| POST | `/orders/:id/reject` | Reject order | Yes |
| POST | `/orders/:id/process` | Start processing | Yes |
| POST | `/orders/:id/ship` | Mark as shipped | Yes |
| POST | `/orders/:id/deliver` | Mark as delivered | Yes |

### Invoices

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/invoices` | Get all seller's invoices | Yes |
| GET | `/invoices/:id` | Get invoice details | Yes |
| POST | `/invoices/:id/issue` | Issue invoice | Yes |

### Dashboard

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/home/summary` | Get dashboard summary | Yes |
| GET | `/home/alerts` | Get dashboard alerts | Yes |
| GET | `/home/focus` | Get focus items | Yes |

---

## Admin Endpoints

Base path: `/api/portal/admin`

**Note:** All admin endpoints require portal admin authentication.

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | Get admin dashboard stats |
| GET | `/dashboard/activity` | Get recent activity |

### User Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sellers` | Get all sellers |
| GET | `/sellers/:id` | Get seller details |
| PATCH | `/sellers/:id/status` | Update seller status |
| GET | `/buyers` | Get all buyers |
| GET | `/buyers/:id` | Get buyer details |
| PATCH | `/buyers/:id/status` | Update buyer status |

### Orders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/orders` | Get all orders |
| GET | `/orders/:id` | Get order details |

### Disputes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/disputes` | Get all disputes |
| GET | `/disputes/:id` | Get dispute details |
| POST | `/disputes/:id/resolve` | Resolve dispute |

### Feature Gating

| Method | Path | Description |
|--------|------|-------------|
| GET | `/features` | Get all feature flags |
| PUT | `/features/:key` | Update feature flag |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/overview` | Get analytics overview |
| GET | `/analytics/transactions` | Get transaction analytics |

### Audit Log

| Method | Path | Description |
|--------|------|-------------|
| GET | `/audit` | Get audit log |

### Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settings` | Get portal settings |
| PUT | `/settings` | Update portal settings |

---

## Authentication Endpoints

Base path: `/api/portal/auth`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/buyer/signup` | Register as buyer | No |
| POST | `/seller/signup` | Register as seller | No |
| POST | `/login` | Login (buyer or seller) | No |
| POST | `/refresh` | Refresh access token | No |
| GET | `/me` | Get current user profile | Yes |
| PUT | `/me` | Update user profile | Yes |
| GET | `/check-email` | Check if email exists | No |

---

## Legacy Endpoints (Backward Compatibility)

The following legacy paths are still supported but deprecated. Use the consolidated `/api/portal/*` paths instead.

| Legacy Path | New Path |
|-------------|----------|
| `/api/items/marketplace/*` | `/api/portal/buyer/marketplace/*` |
| `/api/items/rfq/*` | `/api/portal/buyer/rfqs/*` or `/api/portal/seller/rfq/*` |
| `/api/items/quotes/*` | `/api/portal/buyer/quotes/*` or `/api/portal/seller/quotes/*` |
| `/api/items/orders/*` | `/api/portal/buyer/orders/*` or `/api/portal/seller/orders/*` |
| `/api/buyer/*` | `/api/portal/buyer/*` |
| `/api/seller/*` | `/api/portal/seller/*` |
| `/api/invoices/buyer/*` | `/api/portal/buyer/invoices/*` |
| `/api/invoices/seller/*` | `/api/portal/seller/invoices/*` |
| `/api/portal-admin/*` | `/api/portal/admin/*` |

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message here",
  "details": [] // Optional, for validation errors
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

- Default: 100 requests per minute per IP
- Auth endpoints: 5 login attempts per minute per IP

---

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | For auth endpoints | `Bearer <token>` |
| `Content-Type` | For POST/PUT/PATCH | `application/json` |
| `x-idempotency-key` | For order creation | Prevents duplicate orders |

---

## Query Parameters

### Pagination

Most list endpoints support pagination:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

### Filtering

Common filter parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `search` | string | Search query |
| `sortBy` | string | Field to sort by |
| `sortOrder` | string | `asc` or `desc` |

---

## Examples

### Create RFQ

```bash
curl -X POST http://localhost:3001/api/portal/buyer/rfqs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-123",
    "sellerId": "seller-456",
    "quantity": 10,
    "deliveryLocation": "Riyadh, SA",
    "message": "Need urgent delivery"
  }'
```

### Accept Quote

```bash
curl -X POST http://localhost:3001/api/portal/buyer/quotes/quote-123/accept \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: unique-key-123" \
  -d '{
    "shippingAddress": {
      "line1": "123 Main St",
      "city": "Riyadh",
      "country": "SA"
    }
  }'
```

### Create Quote (Seller)

```bash
curl -X POST http://localhost:3001/api/portal/seller/quotes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rfqId": "rfq-123",
    "unitPrice": 100,
    "quantity": 10,
    "currency": "SAR",
    "deliveryDays": 7,
    "validUntil": "2026-02-20T00:00:00Z",
    "notes": "Price includes shipping"
  }'
```

---

## Changelog

### 2026-02-06
- Consolidated all portal endpoints under `/api/portal/*`
- Added `/api/portal/buyer/*` for buyer operations
- Added `/api/portal/seller/*` for seller operations
- Added `/api/portal/admin/*` for admin operations
- Maintained backward compatibility with legacy paths
