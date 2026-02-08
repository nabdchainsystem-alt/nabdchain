# NABD API Changelog

This document records the state of the NABD REST API. All endpoints are prefixed with `/api` (backward-compatible) or `/api/v1` (versioned).

**Current API Version:** v1

**Base URLs:**
- Development: `http://localhost:3001/api`
- Versioned: `http://localhost:3001/api/v1`

---

## 2026-02-08 -- Initial Changelog (Current State)

This is the first changelog entry, capturing all existing API endpoints as of this date.

---

### Authentication

#### Clerk OAuth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auth/google` | Clerk | Get Google OAuth authorization URL |
| GET | `/auth/google/callback` | None | Google OAuth callback (redirects to frontend) |
| GET | `/auth/outlook` | Clerk | Get Outlook OAuth authorization URL |
| GET | `/auth/outlook/callback` | None | Outlook OAuth callback (redirects to frontend) |

#### Portal Auth (`/api/auth/portal`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/portal/buyer/signup` | None | Create buyer account (rate-limited: 5/15min) |
| POST | `/auth/portal/seller/signup` | None | Create seller account (rate-limited: 5/15min) |
| POST | `/auth/portal/login` | None | Login with email/password (rate-limited: 10/15min) |
| POST | `/auth/portal/refresh` | Refresh Token | Refresh access token |
| GET | `/auth/portal/check-email` | None | Check if email is registered |
| GET | `/auth/portal/csrf-token` | None | Get CSRF token |

---

### Orders (`/api/orders`)

#### Seller Order Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders/seller` | Clerk | List seller's orders (paginated, filterable) |
| GET | `/orders/seller/stats` | Clerk | Seller order statistics |
| GET | `/orders/seller/:id` | Clerk | Get order details |
| POST | `/orders/seller/:id/confirm` | Clerk | Confirm a pending order |
| POST | `/orders/seller/:id/ship` | Clerk | Mark order as shipped (idempotent) |
| POST | `/orders/seller/:id/deliver` | Clerk | Mark order as delivered (idempotent) |
| POST | `/orders/seller/:id/cancel` | Clerk | Cancel an order |
| PUT | `/orders/seller/:id` | Clerk | Update order details |
| POST | `/orders/seller/:id/status` | Clerk | Generic status transition |

#### Buyer Order Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders/buyer` | Clerk | List buyer's orders |
| GET | `/orders/buyer/stats` | Clerk | Buyer order statistics |
| GET | `/orders/buyer/dashboard` | Clerk | Buyer order dashboard summary |
| GET | `/orders/buyer/:id` | Clerk | Get order details |
| POST | `/orders` | Clerk | Create a new order |
| POST | `/orders/buyer/:id/cancel` | Clerk | Cancel an order |
| POST | `/orders/buyer/:id/confirm-delivery` | Clerk | Confirm delivery receipt |

#### Order Health (Seller)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders/seller/health-summary` | Clerk | Overall order health summary |
| GET | `/orders/seller/exceptions` | Clerk | List order exceptions |
| GET | `/orders/seller/with-health` | Clerk | Orders with health scores |
| GET | `/orders/seller/health-rules` | Clerk | Health scoring rules |
| POST | `/orders/seller/:id/calculate-health` | Clerk | Recalculate order health |
| POST | `/orders/seller/:id/resolve-exception` | Clerk | Resolve an exception |
| POST | `/orders/seller/update-health-batch` | Clerk | Batch health update |

---

### Items & Listings (`/api/items`)

#### Item CRUD

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/items` | Clerk | List seller's items |
| GET | `/items/stats` | Clerk | Item statistics |
| GET | `/items/:id` | Clerk | Get item details |
| POST | `/items` | Clerk | Create new item |
| PUT | `/items/:id` | Clerk | Update item |
| DELETE | `/items/:id` | Clerk | Delete item |
| POST | `/items/:id/archive` | Clerk | Archive item |
| POST | `/items/bulk/status` | Clerk | Bulk status update |
| POST | `/items/bulk/visibility` | Clerk | Bulk visibility update |
| POST | `/items/migrate` | Clerk | Migrate items |

#### Marketplace (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/items/marketplace/browse` | None | Browse marketplace items |
| GET | `/items/marketplace/:id` | None | Get marketplace item details |
| GET | `/items/marketplace/seller/:sellerId` | None | Items by seller |

#### RFQ (Request for Quote)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/items/rfq` | Clerk | Create RFQ |
| GET | `/items/rfq/seller` | Clerk | Seller's received RFQs |
| GET | `/items/rfq/buyer` | Clerk | Buyer's sent RFQs |
| POST | `/items/rfq/:id/respond` | Clerk | Respond to RFQ |
| POST | `/items/rfq/:id/accept` | Clerk | Accept RFQ response |
| POST | `/items/rfq/:id/reject` | Clerk | Reject RFQ |
| POST | `/items/rfq/:id/cancel` | Clerk | Cancel RFQ |
| POST | `/items/rfq/:id/reactivate` | Clerk | Reactivate expired RFQ |

#### Seller RFQ Inbox

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/items/rfq/seller/inbox` | Clerk | RFQ inbox (paginated, filterable) |
| GET | `/items/rfq/seller/inbox/:id` | Clerk | RFQ inbox detail |
| PATCH | `/items/rfq/seller/inbox/:id/status` | Clerk | Update inbox item status |
| POST | `/items/rfq/seller/inbox/:id/notes` | Clerk | Add note to RFQ |
| GET | `/items/rfq/seller/inbox/:id/history` | Clerk | RFQ history |
| POST | `/items/rfq/seller/inbox/:rfqId/snooze` | Clerk | Snooze RFQ |
| DELETE | `/items/rfq/seller/inbox/:rfqId/snooze` | Clerk | Unsnooze RFQ |
| POST | `/items/rfq/seller/inbox/:rfqId/read` | Clerk | Mark as read |
| DELETE | `/items/rfq/seller/inbox/:rfqId/read` | Clerk | Mark as unread |
| POST | `/items/rfq/seller/inbox/:rfqId/archive` | Clerk | Archive RFQ |
| DELETE | `/items/rfq/seller/inbox/:rfqId/archive` | Clerk | Unarchive RFQ |

Bulk operations: `POST /items/rfq/seller/inbox/bulk/{labels,snooze,read,unread,archive,unarchive}`

#### RFQ Scoring

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/items/rfq/seller/scored` | Clerk | Scored RFQs |
| POST | `/items/rfq/seller/:id/calculate-score` | Clerk | Calculate RFQ score |
| POST | `/items/rfq/seller/recalculate-all` | Clerk | Recalculate all scores |
| GET | `/items/rfq/seller/scoring-config` | Clerk | Get scoring configuration |
| GET | `/items/rfq/seller/timeline` | Clerk | RFQ activity timeline |

#### Quotes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/items/quotes` | Clerk | Create quote |
| GET | `/items/quotes` | Clerk | List quotes |
| GET | `/items/quotes/:id` | Clerk | Get quote details |
| GET | `/items/quotes/rfq/:rfqId` | Clerk | Quotes for an RFQ |
| PUT | `/items/quotes/:id` | Clerk | Update quote |
| POST | `/items/quotes/:id/send` | Clerk | Send quote to buyer |
| GET | `/items/quotes/:id/versions` | Clerk | Quote version history |
| GET | `/items/quotes/:id/history` | Clerk | Quote audit history |
| DELETE | `/items/quotes/:id` | Clerk | Delete draft quote |
| POST | `/items/quotes/:id/accept` | Clerk | Accept quote (creates order, idempotent) |
| POST | `/items/quotes/:id/reject` | Clerk | Reject quote |

#### Counter Offers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/items/quotes/:id/counter-offer` | Clerk | Submit counter offer |
| GET | `/items/quotes/:id/counter-offers` | Clerk | List counter offers for quote |
| POST | `/items/counter-offers/:id/accept` | Clerk | Accept counter offer |
| POST | `/items/counter-offers/:id/reject` | Clerk | Reject counter offer |
| GET | `/items/counter-offers/pending` | Clerk | List pending counter offers |

---

### Disputes (`/api/disputes`)

#### Buyer Disputes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/disputes/buyer` | Clerk | Create dispute (idempotent) |
| GET | `/disputes/buyer` | Clerk | List buyer's disputes |
| GET | `/disputes/buyer/stats` | Clerk | Dispute statistics |
| GET | `/disputes/buyer/:id` | Clerk | Dispute details |
| POST | `/disputes/buyer/:id/accept` | Clerk | Accept seller's resolution |
| POST | `/disputes/buyer/:id/reject` | Clerk | Reject seller's resolution |
| POST | `/disputes/buyer/:id/escalate` | Clerk | Escalate dispute |
| POST | `/disputes/buyer/:id/evidence` | Clerk | Add evidence |
| POST | `/disputes/buyer/:id/close` | Clerk | Close dispute |

#### Seller Disputes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/disputes/seller` | Clerk | List seller's disputes |
| GET | `/disputes/seller/stats` | Clerk | Dispute statistics |
| GET | `/disputes/seller/:id` | Clerk | Dispute details |
| POST | `/disputes/seller/:id/review` | Clerk | Mark as under review |
| POST | `/disputes/seller/:id/respond` | Clerk | Respond to dispute |
| POST | `/disputes/seller/:id/escalate` | Clerk | Escalate dispute |

#### Shared

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/disputes/:id/history` | Clerk | Dispute event history |
| GET | `/disputes/order/:orderId` | Clerk | Disputes for an order |

---

### Customers (`/api/customers`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/customers/seller` | Clerk | List seller's customers (aggregated from orders) |
| GET | `/customers/seller/:customerId` | Clerk | Customer details with order history |

Query parameters for list: `search`, `sortBy` (name, totalOrders, totalSpend, lastOrderDate), `sortOrder` (asc, desc).

---

### Vault (`/api/vault`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/vault` | Clerk | List user's vault items |
| POST | `/vault` | Clerk | Create vault item (folder, file, note, weblink, document) |
| PUT | `/vault/:id` | Clerk | Update vault item (ownership verified) |
| DELETE | `/vault/:id` | Clerk | Delete vault item (ownership verified) |

---

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/seller/summary` | Clerk | Seller dashboard summary (revenue, orders, top items) |
| GET | `/dashboard/buyer/summary` | Clerk | Buyer dashboard summary (spending, orders, suppliers) |

---

### Notifications (`/api/notifications`)

#### Workspace Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Clerk | List notifications (paginated) |
| GET | `/notifications/count` | Clerk | Unread notification count |
| PATCH | `/notifications/:id/read` | Clerk | Mark notification as read |
| PATCH | `/notifications/read-all` | Clerk | Mark all as read |
| DELETE | `/notifications/:id` | Clerk | Delete notification |

#### Portal Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications/portal` | Clerk | List portal notifications |
| GET | `/notifications/portal/count` | Clerk | Portal unread count |
| PATCH | `/notifications/portal/read-all` | Clerk | Mark all portal notifications as read |

#### Preferences

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications/preferences` | Clerk | Get notification preferences |
| PATCH | `/notifications/preferences` | Clerk | Update notification preferences |

---

### Monitoring (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check with component statuses |
| GET | `/health/live` | Kubernetes liveness probe |
| GET | `/health/ready` | Kubernetes readiness probe |
| GET | `/health/db` | Database health with circuit breaker state |
| GET | `/health/dev` | Development status (workers, scheduler, features) |
| GET | `/health/:component` | Individual component health |
| GET | `/metrics` | Prometheus-compatible metrics |
| GET | `/metrics/json` | Metrics in JSON format |
| GET | `/metrics/summary` | High-level metrics summary |
| GET | `/status` | System status summary |

### Error Tracking (Admin/Staff Only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/errors` | Portal (admin/staff) | Error statistics |
| GET | `/errors/recent` | Portal (admin/staff) | Recent errors |
| GET | `/errors/category/:category` | Portal (admin/staff) | Errors by category |
| GET | `/errors/severity/:severity` | Portal (admin/staff) | Errors by severity |
| POST | `/errors/:fingerprint/resolve` | Portal (admin/staff) | Resolve error |

### Debug (Development Only)

Available only when `NODE_ENV !== 'production'`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/debug/env` | Non-sensitive environment info |
| GET | `/debug/memory` | Memory usage breakdown |
| POST | `/debug/gc` | Trigger garbage collection |

---

### Other API Domains

These domains have routes registered but are not detailed in this initial changelog:

| Route Prefix | Domain |
|-------------|--------|
| `/api/boards` | Board CRUD |
| `/api/rooms`, `/api/rows`, `/api/columns` | Board structure |
| `/api/email` | Email account integration |
| `/api/invite` | Workspace invitations |
| `/api/team` | Team management |
| `/api/docs` | Document collaboration |
| `/api/talk` | Communication threads |
| `/api/assignments` | Task assignments |
| `/api/admin` | Admin operations |
| `/api/user` | User profile |
| `/api/upload` | File uploads |
| `/api/ai` | AI features (Gemini) |
| `/api/gtd` | Getting Things Done items |
| `/api/notes` | Quick notes |
| `/api/mobile` | Mobile API |
| `/api/comments` | Comments |
| `/api/time-entries` | Time tracking |
| `/api/templates` | Board templates |
| `/api/portal` | Portal settings |
| `/api/inventory` | Inventory management |
| `/api/expenses` | Expense tracking |
| `/api/buyer` | Buyer workspace |
| `/api/purchases` | Buyer purchases |
| `/api/buyer-cart` | Shopping cart |
| `/api/seller` | Seller settings, workspace, home |
| `/api/public` | Public seller profiles |
| `/api/invoices` | Invoice management |
| `/api/payments` | Payment processing |
| `/api/returns` | Return management |
| `/api/payouts` | Seller payouts |
| `/api/automation` | Automation rules |
| `/api/trust` | Trust scoring |
| `/api/gating` | Feature gating |
| `/api/analytics` | Analytics data |
| `/api/rfq-marketplace` | RFQ marketplace |

---

## Conventions

### Authentication Methods

- **Clerk**: JWT token in `Authorization: Bearer <token>` header, validated via Clerk SDK.
- **Portal**: JWT token issued by `/auth/portal/login`, validated by portal middleware.
- **None**: Publicly accessible endpoint.

### Idempotency

Endpoints marked as idempotent accept an `Idempotency-Key` header. Duplicate requests with the same key return the cached response instead of creating duplicate resources. Used for order creation, shipping, and dispute creation.

### Pagination

List endpoints support `page` and `limit` query parameters. Default page size is 20, maximum is 100.

### Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

Or for validation errors:

```json
{
  "error": "Invalid input",
  "details": [
    { "path": ["field"], "message": "Expected string" }
  ]
}
```

### Rate Limiting

Rate-limited endpoints return `429 Too Many Requests` with:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many attempts. Please try again later."
  }
}
```

Standard rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) are included in responses.
