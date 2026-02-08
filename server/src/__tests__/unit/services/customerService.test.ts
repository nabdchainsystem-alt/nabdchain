/**
 * Customer Service — Unit Tests
 *
 * Tests cover: getSellerCustomers (aggregation, search, sorting),
 * getCustomerDetails (order history, edge cases).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { customerService } from '../../../services/customerService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// getSellerCustomers
// =============================================================================

describe('customerService.getSellerCustomers', () => {
  const mockGroupByData = [
    {
      buyerId: 'buyer-1',
      buyerName: 'Acme Corp',
      buyerEmail: 'acme@test.com',
      buyerCompany: 'Acme Inc',
      currency: 'SAR',
      _count: { id: 5 },
      _sum: { totalPrice: 12500 },
      _max: { createdAt: new Date('2026-01-20T10:00:00Z') },
      _min: { createdAt: new Date('2025-11-01T10:00:00Z') },
    },
    {
      buyerId: 'buyer-2',
      buyerName: 'Beta LLC',
      buyerEmail: 'beta@test.com',
      buyerCompany: 'Beta LLC',
      currency: 'SAR',
      _count: { id: 2 },
      _sum: { totalPrice: 3000 },
      _max: { createdAt: new Date('2026-01-10T10:00:00Z') },
      _min: { createdAt: new Date('2026-01-05T10:00:00Z') },
    },
  ];

  it('returns aggregated customers from orders', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('buyer-1');
    expect(result[0].name).toBe('Acme Corp');
    expect(result[0].totalOrders).toBe(5);
    expect(result[0].totalSpend).toBe(12500);
  });

  it('calls groupBy with correct sellerId', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);
    await customerService.getSellerCustomers('seller-42');

    expect(prismaMock.marketplaceOrder.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sellerId: 'seller-42' },
      })
    );
  });

  it('returns empty array when no orders exist', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([]);
    const result = await customerService.getSellerCustomers('seller-1');
    expect(result).toEqual([]);
  });

  it('handles null buyerName gracefully', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue([
      {
        buyerId: 'buyer-x',
        buyerName: null,
        buyerEmail: null,
        buyerCompany: null,
        currency: 'SAR',
        _count: { id: 1 },
        _sum: { totalPrice: 100 },
        _max: { createdAt: new Date('2026-01-15T10:00:00Z') },
        _min: { createdAt: new Date('2026-01-15T10:00:00Z') },
      },
    ]);

    const result = await customerService.getSellerCustomers('seller-1');
    expect(result[0].name).toBe('Unknown Customer');
  });

  it('filters by search term (name)', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1', { search: 'acme' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('buyer-1');
  });

  it('filters by search term (email)', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1', { search: 'beta@test' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('buyer-2');
  });

  it('filters by search term (company)', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1', { search: 'Beta LLC' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('buyer-2');
  });

  it('returns empty when search matches nothing', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);
    const result = await customerService.getSellerCustomers('seller-1', { search: 'xyz999' });
    expect(result).toHaveLength(0);
  });

  it('sorts by totalSpend desc', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1', {
      sortBy: 'totalSpend',
      sortOrder: 'desc',
    });

    expect(result[0].totalSpend).toBeGreaterThanOrEqual(result[1].totalSpend);
  });

  it('sorts by totalSpend asc', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1', {
      sortBy: 'totalSpend',
      sortOrder: 'asc',
    });

    expect(result[0].totalSpend).toBeLessThanOrEqual(result[1].totalSpend);
  });

  it('sorts by name asc', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1', {
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(result[0].name).toBe('Acme Corp');
    expect(result[1].name).toBe('Beta LLC');
  });

  it('sorts by totalOrders desc', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1', {
      sortBy: 'totalOrders',
      sortOrder: 'desc',
    });

    expect(result[0].totalOrders).toBeGreaterThanOrEqual(result[1].totalOrders);
  });

  it('defaults to lastOrderDate desc sorting', async () => {
    prismaMock.marketplaceOrder.groupBy.mockResolvedValue(mockGroupByData);

    const result = await customerService.getSellerCustomers('seller-1');
    // buyer-1 has more recent lastOrderDate (Jan 20 vs Jan 10)
    expect(result[0].id).toBe('buyer-1');
  });

  it('returns empty array on DB error', async () => {
    prismaMock.marketplaceOrder.groupBy.mockRejectedValue(new Error('DB error'));
    const result = await customerService.getSellerCustomers('seller-1');
    expect(result).toEqual([]);
  });
});

// =============================================================================
// getCustomerDetails
// =============================================================================

describe('customerService.getCustomerDetails', () => {
  const mockOrders = [
    {
      id: 'order-2',
      orderNumber: 'ORD-002',
      buyerName: 'Acme Corp',
      buyerEmail: 'acme@test.com',
      buyerCompany: 'Acme Inc',
      itemName: 'Widget B',
      quantity: 5,
      totalPrice: 2500,
      unitPrice: 500,
      currency: 'SAR',
      status: 'delivered',
      createdAt: new Date('2026-01-20T10:00:00Z'),
    },
    {
      id: 'order-1',
      orderNumber: 'ORD-001',
      buyerName: 'Acme Corp',
      buyerEmail: 'acme@test.com',
      buyerCompany: 'Acme Inc',
      itemName: 'Widget A',
      quantity: 10,
      totalPrice: 5000,
      unitPrice: 500,
      currency: 'SAR',
      status: 'confirmed',
      createdAt: new Date('2025-12-01T10:00:00Z'),
    },
  ];

  it('returns customer with order history', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue(mockOrders);

    const result = await customerService.getCustomerDetails('seller-1', 'buyer-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('buyer-1');
    expect(result!.name).toBe('Acme Corp');
    expect(result!.totalOrders).toBe(2);
    expect(result!.totalSpend).toBe(7500);
    expect(result!.orders).toHaveLength(2);
  });

  it('queries with correct sellerId and buyerId', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue(mockOrders);

    await customerService.getCustomerDetails('seller-1', 'buyer-1');

    expect(prismaMock.marketplaceOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sellerId: 'seller-1', buyerId: 'buyer-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    );
  });

  it('returns null when customer has no orders', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);

    const result = await customerService.getCustomerDetails('seller-1', 'buyer-999');
    expect(result).toBeNull();
  });

  it('maps order dates to ISO strings', async () => {
    prismaMock.marketplaceOrder.findMany.mockResolvedValue(mockOrders);

    const result = await customerService.getCustomerDetails('seller-1', 'buyer-1');
    expect(result!.lastOrderDate).toBe('2026-01-20T10:00:00.000Z');
    expect(result!.firstOrderDate).toBe('2025-12-01T10:00:00.000Z');
  });

  it('returns null on DB error', async () => {
    prismaMock.marketplaceOrder.findMany.mockRejectedValue(new Error('DB error'));
    const result = await customerService.getCustomerDetails('seller-1', 'buyer-1');
    expect(result).toBeNull();
  });
});
