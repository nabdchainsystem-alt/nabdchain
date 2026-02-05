# NABD Testing Strategy

> Comprehensive testing plan covering unit, integration, and E2E tests for the NABD platform.

---

## Table of Contents

1. [Test Infrastructure Setup](#1-test-infrastructure-setup)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [E2E Tests](#4-e2e-tests)
5. [Test Matrix](#5-test-matrix)
6. [Critical Flows](#6-critical-flows)
7. [CI Gate Rules](#7-ci-gate-rules)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Test Infrastructure Setup

### Current State
- **Frontend**: Vitest configured but unused
- **Backend**: No test infrastructure
- **Test Files**: 0 in codebase

### Recommended Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit (Frontend) | Vitest + Testing Library | Component & service testing |
| Unit (Backend) | Vitest | Service logic testing |
| Integration | Supertest + Vitest | API endpoint testing |
| E2E | Playwright | Full user flow testing |
| Mocking | MSW (Mock Service Worker) | API mocking for frontend |
| Coverage | @vitest/coverage-v8 | Code coverage reporting |
| CI | GitHub Actions | Automated test runs |

### Directory Structure

```
nabd/
├── src/
│   └── __tests__/
│       ├── unit/
│       │   ├── services/
│       │   └── components/
│       └── fixtures/
├── server/
│   └── src/
│       └── __tests__/
│           ├── unit/
│           │   └── services/
│           ├── integration/
│           │   └── routes/
│           └── fixtures/
└── e2e/
    ├── tests/
    │   ├── procurement/
    │   ├── seller/
    │   └── buyer/
    ├── fixtures/
    └── playwright.config.ts
```

### Backend Test Configuration

```typescript
// server/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**', 'src/routes/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 2. Unit Tests

### 2.1 Backend Domain Logic

#### Priority 1: Order Service (Critical)

```typescript
// server/src/__tests__/unit/services/orderService.test.ts

describe('OrderService', () => {
  describe('Status Transitions', () => {
    it('should allow pending → confirmed transition', () => {});
    it('should allow confirmed → shipped transition', () => {});
    it('should allow shipped → delivered transition', () => {});
    it('should reject delivered → pending transition', () => {});
    it('should reject cancelled → any transition', () => {});
    it('should allow pending → cancelled by buyer', () => {});
    it('should allow pending → cancelled by seller', () => {});
    it('should reject cancelled by unauthorized user', () => {});
  });

  describe('Order Creation', () => {
    it('should create order with valid data', () => {});
    it('should reject order below minOrderQty', () => {});
    it('should calculate total correctly', () => {});
    it('should set initial status to pending_confirmation', () => {});
    it('should create audit log entry', () => {});
  });

  describe('Revenue Calculations', () => {
    it('should only count delivered orders in revenue', () => {});
    it('should calculate seller stats correctly', () => {});
    it('should exclude cancelled orders from stats', () => {});
  });

  describe('Permission Checks', () => {
    it('should only allow seller to confirm own orders', () => {});
    it('should only allow seller to ship own orders', () => {});
    it('should allow buyer to view own orders', () => {});
    it('should reject unauthorized access', () => {});
  });
});
```

**Test Cases: 18 | Coverage Target: 90%**

#### Priority 2: Item Service (Critical)

```typescript
// server/src/__tests__/unit/services/itemService.test.ts

describe('ItemService', () => {
  describe('Item Creation', () => {
    it('should create item with valid data', () => {});
    it('should enforce SKU uniqueness per seller', () => {});
    it('should set initial status to draft', () => {});
    it('should validate price >= 0', () => {});
    it('should validate minOrderQty <= maxOrderQty', () => {});
  });

  describe('Publishing Logic', () => {
    it('should allow publishing with all required fields', () => {});
    it('should reject publishing without name', () => {});
    it('should reject publishing without SKU', () => {});
    it('should reject publishing without category', () => {});
    it('should reject publishing without price', () => {});
    it('should set publishedAt timestamp on publish', () => {});
    it('should change visibility to public on publish', () => {});
  });

  describe('Status Determination', () => {
    it('should return out_of_stock when stock = 0', () => {});
    it('should return active when stock > 0 and published', () => {});
    it('should return draft when never published', () => {});
    it('should auto-restore to active when stock replenished', () => {});
  });

  describe('Marketplace Visibility', () => {
    it('should be visible when active and public', () => {});
    it('should not be visible when draft', () => {});
    it('should not be visible when hidden', () => {});
    it('should not be visible when out_of_stock', () => {});
    it('should filter by category correctly', () => {});
    it('should filter by price range correctly', () => {});
  });

  describe('RFQ Creation', () => {
    it('should create RFQ from item page', () => {});
    it('should create RFQ from seller profile', () => {});
    it('should create RFQ from listing', () => {});
    it('should validate quantity > 0', () => {});
    it('should validate delivery date > tomorrow', () => {});
  });
});
```

**Test Cases: 25 | Coverage Target: 90%**

#### Priority 3: Cart Service (Critical)

```typescript
// server/src/__tests__/unit/services/buyerCartService.test.ts

describe('BuyerCartService', () => {
  describe('Cart Operations', () => {
    it('should add item to cart', () => {});
    it('should reject adding to locked cart', () => {});
    it('should update item quantity', () => {});
    it('should remove item from cart', () => {});
    it('should clear cart', () => {});
    it('should respect minOrderQty on add', () => {});
    it('should respect maxOrderQty on add', () => {});
  });

  describe('Cart Locking', () => {
    it('should lock cart when creating RFQs', () => {});
    it('should unlock cart after RFQ creation', () => {});
    it('should reject modifications on locked cart', () => {});
    it('should only allow owner to lock/unlock', () => {});
  });

  describe('RFQ Creation from Cart', () => {
    it('should group items by seller', () => {});
    it('should create one RFQ per seller', () => {});
    it('should clear cart items after RFQ creation', () => {});
    it('should include all cart item details in RFQ', () => {});
    it('should set RFQ status to pending', () => {});
  });

  describe('Cart Totals', () => {
    it('should calculate subtotal correctly', () => {});
    it('should update totals on item add', () => {});
    it('should update totals on item remove', () => {});
    it('should handle multiple sellers correctly', () => {});
  });
});
```

**Test Cases: 20 | Coverage Target: 90%**

#### Priority 4: Quote Service (High)

```typescript
// server/src/__tests__/unit/services/quoteService.test.ts

describe('QuoteService', () => {
  describe('Quote Creation', () => {
    it('should create quote from RFQ', () => {});
    it('should set expiration date', () => {});
    it('should update RFQ status to quoted', () => {});
    it('should validate price > 0', () => {});
    it('should validate lead time > 0', () => {});
  });

  describe('Quote Acceptance', () => {
    it('should accept valid quote', () => {});
    it('should reject expired quote', () => {});
    it('should create order on acceptance', () => {});
    it('should update RFQ status to accepted', () => {});
    it('should increment item successful_orders', () => {});
  });

  describe('Quote Rejection', () => {
    it('should reject quote with reason', () => {});
    it('should update RFQ status to rejected', () => {});
    it('should allow new quote after rejection', () => {});
  });

  describe('Quote Expiration', () => {
    it('should mark expired quotes correctly', () => {});
    it('should not allow acceptance of expired', () => {});
    it('should notify seller of expiration', () => {});
  });
});
```

**Test Cases: 15 | Coverage Target: 85%**

#### Priority 5: Seller Service (Medium)

```typescript
// server/src/__tests__/unit/services/sellerService.test.ts

describe('SellerService', () => {
  describe('Profile Management', () => {
    it('should create seller profile', () => {});
    it('should update display name', () => {});
    it('should validate slug uniqueness', () => {});
    it('should generate slug from display name', () => {});
  });

  describe('Profile Completion', () => {
    it('should track completion percentage', () => {});
    it('should require company info for completion', () => {});
    it('should require address for completion', () => {});
    it('should require bank details for completion', () => {});
    it('should require contact for completion', () => {});
  });

  describe('Bank Details Security', () => {
    it('should mask IBAN on retrieval', () => {});
    it('should store IBAN securely', () => {});
    it('should never expose full IBAN in API', () => {});
  });

  describe('Verification', () => {
    it('should track verification status', () => {});
    it('should allow publishing only when verified', () => {});
    it('should require complete profile for verification', () => {});
  });
});
```

**Test Cases: 15 | Coverage Target: 85%**

#### Priority 6: Analytics Services (Medium)

```typescript
// server/src/__tests__/unit/services/analyticsService.test.ts

describe('BuyerAnalyticsService', () => {
  describe('Spend Calculations', () => {
    it('should calculate total spend from delivered orders', () => {});
    it('should exclude pending orders from spend', () => {});
    it('should exclude cancelled orders from spend', () => {});
    it('should group spend by category', () => {});
    it('should group spend by supplier', () => {});
  });

  describe('Trend Calculations', () => {
    it('should calculate month-over-month change', () => {});
    it('should handle zero previous month', () => {});
    it('should calculate order frequency trend', () => {});
  });

  describe('KPI Calculations', () => {
    it('should calculate average order value', () => {});
    it('should calculate unique supplier count', () => {});
    it('should calculate category distribution', () => {});
  });
});

describe('SellerAnalyticsService', () => {
  describe('Revenue Calculations', () => {
    it('should calculate total revenue', () => {});
    it('should calculate pending revenue', () => {});
    it('should calculate monthly breakdown', () => {});
  });

  describe('Inventory Metrics', () => {
    it('should count active listings', () => {});
    it('should count out of stock items', () => {});
    it('should calculate stock value', () => {});
  });
});
```

**Test Cases: 18 | Coverage Target: 80%**

### 2.2 Frontend Service Tests

```typescript
// src/__tests__/unit/services/cartService.test.ts

describe('CartService (Frontend)', () => {
  describe('API Integration', () => {
    it('should fetch cart state', () => {});
    it('should handle add to cart', () => {});
    it('should handle remove from cart', () => {});
    it('should handle quantity update', () => {});
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {});
    it('should handle 401 unauthorized', () => {});
    it('should handle 400 validation errors', () => {});
  });
});
```

### 2.3 Component Unit Tests

```typescript
// src/__tests__/unit/components/CartDrawer.test.tsx

describe('CartDrawer', () => {
  it('should render empty state when cart is empty', () => {});
  it('should render items grouped by seller', () => {});
  it('should handle quantity change', () => {});
  it('should handle item removal', () => {});
  it('should disable checkout when locked', () => {});
  it('should show loading state during operations', () => {});
});
```

---

## 3. Integration Tests

### 3.1 API Route Testing

#### Order Routes

```typescript
// server/src/__tests__/integration/routes/orderRoutes.test.ts

describe('Order Routes', () => {
  describe('POST /api/orders', () => {
    it('should create order with valid payload', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          itemId: 'item-1',
          quantity: 10,
          unitPrice: 100,
          deliveryAddress: '123 Test St',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('pending_confirmation');
    });

    it('should reject order without auth', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({ itemId: 'item-1', quantity: 10 });

      expect(response.status).toBe(401);
    });

    it('should reject order with invalid quantity', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ itemId: 'item-1', quantity: -1 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/orders/:id/confirm', () => {
    it('should confirm order as seller', async () => {});
    it('should reject confirmation by non-owner seller', async () => {});
    it('should reject confirmation of non-pending order', async () => {});
  });

  describe('POST /api/orders/:id/ship', () => {
    it('should mark order as shipped', async () => {});
    it('should require tracking number', async () => {});
    it('should reject if not confirmed', async () => {});
  });

  describe('GET /api/orders/seller', () => {
    it('should return seller orders with pagination', async () => {});
    it('should filter by status', async () => {});
    it('should filter by date range', async () => {});
  });
});
```

**Test Cases: 20 | Response Time Target: <200ms**

#### Item Routes

```typescript
// server/src/__tests__/integration/routes/itemRoutes.test.ts

describe('Item Routes', () => {
  describe('GET /api/marketplace', () => {
    it('should return active public items', async () => {});
    it('should not return draft items', async () => {});
    it('should not return hidden items', async () => {});
    it('should filter by category', async () => {});
    it('should filter by price range', async () => {});
    it('should paginate results', async () => {});
    it('should sort by relevance', async () => {});
  });

  describe('POST /api/items', () => {
    it('should create item as seller', async () => {});
    it('should reject duplicate SKU', async () => {});
    it('should validate required fields', async () => {});
  });

  describe('PATCH /api/items/:id', () => {
    it('should update item as owner', async () => {});
    it('should reject update by non-owner', async () => {});
    it('should publish item with all required fields', async () => {});
    it('should reject publish without required fields', async () => {});
  });

  describe('POST /api/items/:id/rfq', () => {
    it('should create RFQ for item', async () => {});
    it('should validate quantity', async () => {});
    it('should validate delivery date', async () => {});
  });
});
```

**Test Cases: 18 | Response Time Target: <200ms**

#### Cart Routes

```typescript
// server/src/__tests__/integration/routes/cartRoutes.test.ts

describe('Cart Routes', () => {
  describe('GET /api/buyer/cart', () => {
    it('should return cart for authenticated buyer', async () => {});
    it('should return empty cart for new buyer', async () => {});
    it('should include seller grouping', async () => {});
  });

  describe('POST /api/buyer/cart/items', () => {
    it('should add item to cart', async () => {});
    it('should reject adding to locked cart', async () => {});
    it('should validate quantity bounds', async () => {});
    it('should update existing item quantity', async () => {});
  });

  describe('POST /api/buyer/cart/rfq', () => {
    it('should create RFQs from cart', async () => {});
    it('should lock cart during creation', async () => {});
    it('should group by seller correctly', async () => {});
    it('should clear cart after success', async () => {});
    it('should handle partial failures', async () => {});
  });
});
```

**Test Cases: 14 | Response Time Target: <300ms**

### 3.2 Database Integration Tests

```typescript
// server/src/__tests__/integration/database/transactions.test.ts

describe('Database Transactions', () => {
  describe('Order Creation Transaction', () => {
    it('should rollback on partial failure', async () => {});
    it('should maintain data consistency', async () => {});
    it('should handle concurrent orders', async () => {});
  });

  describe('RFQ to Order Flow', () => {
    it('should atomically update RFQ and create order', async () => {});
    it('should rollback on order creation failure', async () => {});
  });
});
```

---

## 4. E2E Tests

### 4.1 Playwright Configuration

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd server && pnpm dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### 4.2 Procurement Flow Tests

#### Flow 1: Direct Purchase (Buyer → Seller)

```typescript
// e2e/tests/procurement/direct-purchase.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Direct Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal/login');
    await loginAsBuyer(page);
  });

  test('complete direct purchase from marketplace', async ({ page }) => {
    // 1. Browse marketplace
    await page.goto('/portal/buyer/marketplace');
    await expect(page.getByTestId('marketplace-grid')).toBeVisible();

    // 2. Select item
    await page.getByTestId('item-card-item-1').click();
    await expect(page.getByTestId('item-detail-panel')).toBeVisible();

    // 3. Add to cart
    await page.fill('[data-testid="quantity-input"]', '10');
    await page.click('[data-testid="add-to-cart-btn"]');
    await expect(page.getByTestId('cart-badge')).toHaveText('1');

    // 4. Open cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page.getByTestId('cart-drawer')).toBeVisible();

    // 5. Checkout
    await page.click('[data-testid="checkout-btn"]');
    await expect(page.getByTestId('checkout-page')).toBeVisible();

    // 6. Complete order
    await page.fill('[data-testid="delivery-address"]', '123 Test Street');
    await page.click('[data-testid="place-order-btn"]');

    // 7. Verify order created
    await expect(page.getByTestId('order-confirmation')).toBeVisible();
    await expect(page.getByTestId('order-status')).toHaveText('Pending Confirmation');
  });

  test('should validate minimum order quantity', async ({ page }) => {
    await page.goto('/portal/buyer/marketplace');
    await page.getByTestId('item-card-item-1').click();

    // Item has minOrderQty of 5
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-cart-btn"]');

    await expect(page.getByTestId('error-message')).toContainText('minimum order');
  });
});
```

#### Flow 2: RFQ Process (Buyer → Seller Quote → Order)

```typescript
// e2e/tests/procurement/rfq-flow.spec.ts

test.describe('RFQ Flow', () => {
  test('complete RFQ to order flow', async ({ page, context }) => {
    // === BUYER: Create RFQ ===
    await loginAsBuyer(page);
    await page.goto('/portal/buyer/marketplace');

    // 1. Create RFQ from item
    await page.getByTestId('item-card-item-1').click();
    await page.click('[data-testid="request-quote-btn"]');

    // 2. Fill RFQ form
    await page.fill('[data-testid="rfq-quantity"]', '100');
    await page.fill('[data-testid="rfq-delivery-location"]', 'Warehouse A');
    await page.fill('[data-testid="rfq-delivery-date"]', '2026-03-01');
    await page.fill('[data-testid="rfq-notes"]', 'Urgent delivery needed');
    await page.click('[data-testid="submit-rfq-btn"]');

    // 3. Verify RFQ created
    await expect(page.getByTestId('rfq-success')).toBeVisible();
    const rfqId = await page.getByTestId('rfq-id').textContent();

    // === SELLER: Respond with Quote ===
    const sellerPage = await context.newPage();
    await loginAsSeller(sellerPage);
    await sellerPage.goto('/portal/seller/rfqs');

    // 4. Open RFQ
    await sellerPage.getByTestId(`rfq-row-${rfqId}`).click();
    await expect(sellerPage.getByTestId('rfq-detail-panel')).toBeVisible();

    // 5. Create quote
    await sellerPage.click('[data-testid="respond-quote-btn"]');
    await sellerPage.fill('[data-testid="quote-unit-price"]', '95');
    await sellerPage.fill('[data-testid="quote-lead-time"]', '7');
    await sellerPage.fill('[data-testid="quote-validity"]', '14');
    await sellerPage.click('[data-testid="submit-quote-btn"]');

    // 6. Verify quote sent
    await expect(sellerPage.getByTestId('quote-success')).toBeVisible();

    // === BUYER: Accept Quote ===
    await page.goto('/portal/buyer/rfqs');
    await page.getByTestId(`rfq-row-${rfqId}`).click();

    // 7. Review quote
    await expect(page.getByTestId('quote-price')).toHaveText('$95.00');
    await expect(page.getByTestId('quote-lead-time')).toHaveText('7 days');

    // 8. Accept quote
    await page.click('[data-testid="accept-quote-btn"]');
    await expect(page.getByTestId('accept-confirmation')).toBeVisible();
    await page.click('[data-testid="confirm-accept-btn"]');

    // 9. Verify order created
    await expect(page.getByTestId('order-created-success')).toBeVisible();
    await page.goto('/portal/buyer/orders');
    await expect(page.getByTestId('order-list')).toContainText('Pending Confirmation');
  });

  test('should handle quote expiration', async ({ page }) => {
    // Create RFQ with short expiration, verify expired state
  });

  test('should allow quote rejection with reason', async ({ page }) => {
    // Create RFQ, receive quote, reject with feedback
  });
});
```

#### Flow 3: Cart Aggregation (Multiple Sellers)

```typescript
// e2e/tests/procurement/cart-aggregation.spec.ts

test.describe('Cart Aggregation Flow', () => {
  test('aggregate items from multiple sellers into RFQs', async ({ page }) => {
    await loginAsBuyer(page);

    // 1. Add items from seller A
    await page.goto('/portal/buyer/marketplace');
    await page.click('[data-testid="item-card-seller-a-item-1"]');
    await page.fill('[data-testid="quantity-input"]', '10');
    await page.click('[data-testid="add-to-cart-btn"]');

    // 2. Add items from seller B
    await page.click('[data-testid="item-card-seller-b-item-1"]');
    await page.fill('[data-testid="quantity-input"]', '20');
    await page.click('[data-testid="add-to-cart-btn"]');

    // 3. Add another item from seller A
    await page.click('[data-testid="item-card-seller-a-item-2"]');
    await page.fill('[data-testid="quantity-input"]', '5');
    await page.click('[data-testid="add-to-cart-btn"]');

    // 4. Open cart
    await page.click('[data-testid="cart-icon"]');

    // 5. Verify grouping
    await expect(page.getByTestId('seller-group-a')).toContainText('2 items');
    await expect(page.getByTestId('seller-group-b')).toContainText('1 item');

    // 6. Request quotes
    await page.click('[data-testid="request-quotes-btn"]');

    // 7. Fill RFQ details
    await page.fill('[data-testid="delivery-location"]', 'Central Warehouse');
    await page.fill('[data-testid="delivery-date"]', '2026-03-15');
    await page.click('[data-testid="submit-rfqs-btn"]');

    // 8. Verify 2 RFQs created (one per seller)
    await expect(page.getByTestId('rfqs-created')).toHaveText('2 RFQs sent');

    // 9. Verify cart cleared
    await page.click('[data-testid="cart-icon"]');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });
});
```

#### Flow 4: Order Fulfillment (Seller Side)

```typescript
// e2e/tests/procurement/order-fulfillment.spec.ts

test.describe('Order Fulfillment Flow', () => {
  test('complete order lifecycle as seller', async ({ page }) => {
    await loginAsSeller(page);
    await page.goto('/portal/seller/orders');

    // 1. View pending order
    await page.click('[data-testid="order-row-pending"]');
    await expect(page.getByTestId('order-status')).toHaveText('Pending Confirmation');

    // 2. Confirm order
    await page.click('[data-testid="confirm-order-btn"]');
    await expect(page.getByTestId('order-status')).toHaveText('Confirmed');

    // 3. Mark as shipped
    await page.click('[data-testid="ship-order-btn"]');
    await page.fill('[data-testid="tracking-number"]', 'TRACK123456');
    await page.click('[data-testid="confirm-shipment-btn"]');
    await expect(page.getByTestId('order-status')).toHaveText('Shipped');

    // 4. Mark as delivered
    await page.click('[data-testid="mark-delivered-btn"]');
    await expect(page.getByTestId('order-status')).toHaveText('Delivered');

    // 5. Verify in analytics
    await page.goto('/portal/seller/analytics');
    await expect(page.getByTestId('completed-orders')).toContainText('1');
  });
});
```

#### Flow 5: Seller Onboarding

```typescript
// e2e/tests/seller/onboarding.spec.ts

test.describe('Seller Onboarding Flow', () => {
  test('complete seller profile setup', async ({ page }) => {
    // 1. Sign up as new seller
    await page.goto('/portal/signup');
    await page.click('[data-testid="seller-signup"]');
    await page.fill('[data-testid="email"]', 'newvendor@test.com');
    await page.fill('[data-testid="password"]', 'SecurePass123!');
    await page.click('[data-testid="signup-btn"]');

    // 2. Company information
    await expect(page.getByTestId('onboarding-company')).toBeVisible();
    await page.fill('[data-testid="company-name"]', 'Test Supplies Inc.');
    await page.fill('[data-testid="display-name"]', 'Test Supplies');
    await page.fill('[data-testid="legal-name"]', 'Test Supplies Inc.');
    await page.fill('[data-testid="cr-number"]', 'CR123456789');
    await page.fill('[data-testid="vat-number"]', 'VAT123456789');
    await page.click('[data-testid="next-btn"]');

    // 3. Address
    await expect(page.getByTestId('onboarding-address')).toBeVisible();
    await page.fill('[data-testid="street"]', '123 Industrial Ave');
    await page.fill('[data-testid="city"]', 'Riyadh');
    await page.fill('[data-testid="country"]', 'Saudi Arabia');
    await page.fill('[data-testid="postal-code"]', '12345');
    await page.click('[data-testid="next-btn"]');

    // 4. Bank details
    await expect(page.getByTestId('onboarding-bank')).toBeVisible();
    await page.fill('[data-testid="bank-name"]', 'Test Bank');
    await page.fill('[data-testid="iban"]', 'SA0380000000608010167519');
    await page.click('[data-testid="next-btn"]');

    // 5. Contact
    await expect(page.getByTestId('onboarding-contact')).toBeVisible();
    await page.fill('[data-testid="contact-name"]', 'John Doe');
    await page.fill('[data-testid="contact-email"]', 'john@testsupplies.com');
    await page.fill('[data-testid="contact-phone"]', '+966501234567');
    await page.click('[data-testid="finish-btn"]');

    // 6. Verify profile complete
    await expect(page.getByTestId('profile-complete')).toBeVisible();
    await expect(page.getByTestId('can-publish')).toHaveText('Ready to Publish');
  });

  test('should show progress indicator', async ({ page }) => {
    // Verify each step shows correct completion percentage
  });

  test('should mask IBAN after entry', async ({ page }) => {
    // Verify IBAN displays as SA03****7519 after save
  });
});
```

---

## 5. Test Matrix

### 5.1 Service Coverage Matrix

| Service | Unit Tests | Integration Tests | E2E Coverage | Priority |
|---------|:----------:|:-----------------:|:------------:|:--------:|
| **orderService** | ✅ 18 tests | ✅ 20 tests | ✅ Fulfillment flow | P0 |
| **itemService** | ✅ 25 tests | ✅ 18 tests | ✅ Marketplace flow | P0 |
| **buyerCartService** | ✅ 20 tests | ✅ 14 tests | ✅ Cart aggregation | P0 |
| **quoteService** | ✅ 15 tests | ✅ 12 tests | ✅ RFQ flow | P0 |
| **sellerService** | ✅ 15 tests | ✅ 10 tests | ✅ Onboarding flow | P1 |
| **analyticsService** | ✅ 18 tests | ✅ 8 tests | ⚠️ Partial | P1 |
| **portalAuthService** | ✅ 10 tests | ✅ 8 tests | ✅ Login/signup | P1 |
| **disputeService** | ✅ 12 tests | ✅ 8 tests | ⚠️ Partial | P2 |
| **automationService** | ✅ 10 tests | ✅ 6 tests | ❌ None | P2 |
| **featureGatingService** | ✅ 8 tests | ✅ 4 tests | ❌ None | P3 |
| **payoutService** | ✅ 10 tests | ✅ 6 tests | ❌ None | P2 |

### 5.2 API Endpoint Coverage Matrix

| Endpoint Group | Happy Path | Error Cases | Auth Tests | Rate Limit |
|----------------|:----------:|:-----------:|:----------:|:----------:|
| `/api/orders/*` | ✅ | ✅ | ✅ | ⚠️ |
| `/api/items/*` | ✅ | ✅ | ✅ | ⚠️ |
| `/api/buyer/cart/*` | ✅ | ✅ | ✅ | ⚠️ |
| `/api/rfq/*` | ✅ | ✅ | ✅ | ⚠️ |
| `/api/marketplace/*` | ✅ | ✅ | N/A | ⚠️ |
| `/api/seller/*` | ✅ | ✅ | ✅ | ⚠️ |
| `/api/analytics/*` | ✅ | ⚠️ | ✅ | ⚠️ |
| `/api/notifications/*` | ✅ | ⚠️ | ✅ | ❌ |

### 5.3 E2E Flow Coverage Matrix

| Flow | Chrome | Firefox | Mobile | Accessibility |
|------|:------:|:-------:|:------:|:-------------:|
| Direct Purchase | ✅ | ✅ | ✅ | ⚠️ |
| RFQ to Order | ✅ | ✅ | ⚠️ | ⚠️ |
| Cart Aggregation | ✅ | ✅ | ✅ | ⚠️ |
| Order Fulfillment | ✅ | ✅ | ⚠️ | ⚠️ |
| Seller Onboarding | ✅ | ✅ | ✅ | ⚠️ |
| Buyer Analytics | ✅ | ⚠️ | ❌ | ❌ |

**Legend**: ✅ Full | ⚠️ Partial | ❌ None

### 5.4 Test Count Summary

| Category | Test Count | Estimated Time |
|----------|:----------:|:--------------:|
| Unit Tests (Backend) | ~150 | ~30s |
| Unit Tests (Frontend) | ~50 | ~20s |
| Integration Tests | ~100 | ~2min |
| E2E Tests | ~40 | ~8min |
| **Total** | **~340** | **~11min** |

---

## 6. Critical Flows

### 6.1 Business-Critical Paths (Must Not Fail)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH #1                              │
│                   Order Lifecycle                                │
├─────────────────────────────────────────────────────────────────┤
│  pending_confirmation → confirmed → shipped → delivered          │
│                                                                  │
│  Tests Required:                                                 │
│  • State machine transitions (6 valid, 15 invalid)               │
│  • Permission checks (buyer vs seller actions)                   │
│  • Audit logging at each step                                    │
│  • Concurrent modification handling                              │
│  • Revenue calculation accuracy                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH #2                              │
│                   RFQ → Quote → Order                            │
├─────────────────────────────────────────────────────────────────┤
│  RFQ created → quote received → quote accepted → order created   │
│                                                                  │
│  Tests Required:                                                 │
│  • RFQ validation (quantity, date, location)                     │
│  • Quote expiration handling                                     │
│  • Atomic order creation on acceptance                           │
│  • Multi-party notification                                      │
│  • Price consistency (quote price = order price)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH #3                              │
│                  Cart → RFQ Aggregation                          │
├─────────────────────────────────────────────────────────────────┤
│  add items → group by seller → lock cart → create RFQs → clear   │
│                                                                  │
│  Tests Required:                                                 │
│  • Cart locking mechanism                                        │
│  • Correct seller grouping                                       │
│  • Atomic RFQ batch creation                                     │
│  • Rollback on partial failure                                   │
│  • Cart state after success/failure                              │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Security-Critical Tests

```typescript
// Security test checklist
const securityTests = {
  authentication: [
    'Reject requests without valid token',
    'Reject expired tokens',
    'Reject malformed tokens',
    'Handle token refresh correctly',
  ],
  authorization: [
    'Seller cannot access other seller data',
    'Buyer cannot access seller-only endpoints',
    'User cannot modify other user orders',
    'Admin routes protected',
  ],
  dataProtection: [
    'IBAN never exposed in full',
    'Passwords never returned in API',
    'Sensitive fields filtered in logs',
    'PII masked in error messages',
  ],
  inputValidation: [
    'SQL injection prevention',
    'XSS prevention in user content',
    'Path traversal prevention',
    'Request size limits enforced',
  ],
};
```

### 6.3 Data Integrity Tests

```typescript
// Data integrity checklist
const integrityTests = {
  consistency: [
    'Order total = sum(item.price * item.quantity)',
    'Cart total matches item sum',
    'Analytics match actual order data',
    'Stock levels accurate after orders',
  ],
  atomicity: [
    'RFQ acceptance + order creation atomic',
    'Cart clear + RFQ create atomic',
    'Status update + audit log atomic',
  ],
  referential: [
    'Orders reference valid items',
    'RFQs reference valid sellers',
    'Quotes reference valid RFQs',
  ],
};
```

---

## 7. CI Gate Rules

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ============================================
  # STAGE 1: Fast Feedback (< 2 min)
  # ============================================
  lint-and-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm lint

  # ============================================
  # STAGE 2: Unit Tests (< 1 min)
  # ============================================
  unit-tests:
    runs-on: ubuntu-latest
    needs: lint-and-types
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests (shard ${{ matrix.shard }}/3)
        run: pnpm test:unit --shard=${{ matrix.shard }}/3

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          flags: unit-tests

  # ============================================
  # STAGE 3: Integration Tests (< 3 min)
  # ============================================
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nabd_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: |
          pnpm install --frozen-lockfile
          cd server && pnpm install --frozen-lockfile

      - name: Setup database
        run: |
          cd server
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/nabd_test

      - name: Run integration tests
        run: cd server && pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/nabd_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          flags: integration-tests

  # ============================================
  # STAGE 4: E2E Tests (< 10 min)
  # ============================================
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    strategy:
      matrix:
        browser: [chromium, firefox]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: pnpm test:e2e --project=${{ matrix.browser }}

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/

  # ============================================
  # FINAL: Gate Check
  # ============================================
  gate-check:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]
    steps:
      - name: All tests passed
        run: echo "All CI gates passed!"
```

### 7.2 CI Gate Thresholds

| Gate | Threshold | Blocking | Notes |
|------|:---------:|:--------:|-------|
| TypeScript Errors | 0 | ✅ Yes | No type errors allowed |
| Lint Errors | 0 | ✅ Yes | No lint errors allowed |
| Unit Test Pass Rate | 100% | ✅ Yes | All unit tests must pass |
| Unit Test Coverage | ≥80% | ✅ Yes | Block if below threshold |
| Integration Pass Rate | 100% | ✅ Yes | All integration tests must pass |
| Integration Coverage | ≥75% | ⚠️ Warning | Alert but don't block |
| E2E Critical Flows | 100% | ✅ Yes | All critical paths must pass |
| E2E Total Pass Rate | ≥95% | ⚠️ Warning | Allow minor flakiness |
| Build Success | Required | ✅ Yes | Build must succeed |
| Bundle Size | <2MB | ⚠️ Warning | Alert if exceeded |

### 7.3 Branch Protection Rules

```yaml
# Repository settings (via GitHub API or UI)
branch_protection:
  main:
    required_status_checks:
      strict: true
      contexts:
        - lint-and-types
        - unit-tests (1)
        - unit-tests (2)
        - unit-tests (3)
        - integration-tests
        - e2e-tests (chromium)
        - gate-check
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
    enforce_admins: true

  develop:
    required_status_checks:
      strict: false
      contexts:
        - lint-and-types
        - unit-tests (1)
        - unit-tests (2)
        - unit-tests (3)
        - integration-tests
```

### 7.4 Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{ts,tsx}": [
      "vitest related --run"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm test:unit
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Configure Vitest for backend
- [ ] Set up test database (SQLite in-memory)
- [ ] Create test fixtures and factories
- [ ] Write first 20 unit tests for orderService
- [ ] Set up CI pipeline (basic)

### Phase 2: Core Services (Week 3-4)
- [ ] Complete orderService tests (18 tests)
- [ ] Complete itemService tests (25 tests)
- [ ] Complete cartService tests (20 tests)
- [ ] Complete quoteService tests (15 tests)
- [ ] Add code coverage reporting

### Phase 3: Integration Tests (Week 5-6)
- [ ] Set up Supertest for API testing
- [ ] Write order route tests (20 tests)
- [ ] Write item route tests (18 tests)
- [ ] Write cart route tests (14 tests)
- [ ] Add test database seeding

### Phase 4: E2E Setup (Week 7-8)
- [ ] Configure Playwright
- [ ] Write direct purchase flow test
- [ ] Write RFQ flow test
- [ ] Write cart aggregation test
- [ ] Write seller onboarding test

### Phase 5: Hardening (Week 9-10)
- [ ] Add security tests
- [ ] Add performance benchmarks
- [ ] Add accessibility tests
- [ ] Complete coverage gaps
- [ ] Document test patterns

### Success Metrics

| Metric | Target | Current |
|--------|:------:|:-------:|
| Unit Test Coverage | ≥80% | 0% |
| Integration Coverage | ≥75% | 0% |
| E2E Critical Paths | 100% | 0% |
| CI Pipeline Time | <15min | N/A |
| Flaky Test Rate | <2% | N/A |

---

## Appendix A: Test Utilities

```typescript
// server/src/__tests__/utils/factories.ts

export const createTestOrder = (overrides = {}) => ({
  id: `order-${Date.now()}`,
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  itemId: 'item-1',
  quantity: 10,
  unitPrice: 100,
  totalAmount: 1000,
  status: 'pending_confirmation',
  createdAt: new Date(),
  ...overrides,
});

export const createTestItem = (overrides = {}) => ({
  id: `item-${Date.now()}`,
  sellerId: 'seller-1',
  name: 'Test Item',
  sku: `SKU-${Date.now()}`,
  price: 100,
  stock: 100,
  status: 'active',
  visibility: 'public',
  ...overrides,
});

export const createTestRFQ = (overrides = {}) => ({
  id: `rfq-${Date.now()}`,
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  itemId: 'item-1',
  quantity: 100,
  deliveryLocation: 'Warehouse A',
  deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  status: 'pending',
  ...overrides,
});
```

```typescript
// server/src/__tests__/utils/setup.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database between tests
  await prisma.$transaction([
    prisma.order.deleteMany(),
    prisma.rfq.deleteMany(),
    prisma.item.deleteMany(),
    prisma.cart.deleteMany(),
  ]);
});
```

---

## Appendix B: Mock Data Reference

The codebase includes comprehensive mock data in `server/src/services/itemService.ts`:

- **30 mock items** across categories (Fasteners, Electrical, Plumbing, Safety, Tools)
- **5 mock orders** (pending, confirmed, shipped, delivered, cancelled)
- **Mock seller statistics** (156 items, 248 quotes, 187 successful orders)
- **Mock order statistics** (48 total, revenue breakdown)

Use this data as seed data for integration and E2E tests.

---

*Last updated: 2026-02-05*
*Document version: 1.0*
