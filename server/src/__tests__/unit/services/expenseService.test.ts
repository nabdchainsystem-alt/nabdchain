/**
 * Expense Service — Unit Tests
 *
 * The expense service is a stub (all methods return empty/throw).
 * Tests verify the stub behavior is correct and consistent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { expenseService } from '../../../services/expenseService';

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// getSellerExpenses
// =============================================================================

describe('expenseService.getSellerExpenses', () => {
  it('returns empty array for any seller', async () => {
    const result = await expenseService.getSellerExpenses('seller-1');
    expect(result).toEqual([]);
  });

  it('returns empty array with filters', async () => {
    const result = await expenseService.getSellerExpenses('seller-1', {
      type: 'shipping',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    expect(result).toEqual([]);
  });

  it('returns empty array for empty sellerId', async () => {
    const result = await expenseService.getSellerExpenses('');
    expect(result).toEqual([]);
  });
});

// =============================================================================
// getExpenseSummary
// =============================================================================

describe('expenseService.getExpenseSummary', () => {
  it('returns zero-value summary', async () => {
    const result = await expenseService.getExpenseSummary('seller-1');
    expect(result).toEqual({
      totalThisMonth: 0,
      totalLastMonth: 0,
      byType: [],
      currency: 'SAR',
    });
  });

  it('returns SAR as default currency', async () => {
    const result = await expenseService.getExpenseSummary('seller-2');
    expect(result.currency).toBe('SAR');
  });
});

// =============================================================================
// createExpense
// =============================================================================

describe('expenseService.createExpense', () => {
  it('throws "feature not yet available" error', async () => {
    await expect(
      expenseService.createExpense('seller-1', {
        type: 'shipping',
        amount: 100,
        date: '2026-01-15',
      })
    ).rejects.toThrow('Expense tracking feature is not yet available');
  });

  it('throws for any expense type', async () => {
    await expect(
      expenseService.createExpense('seller-1', {
        type: 'ads',
        amount: 50,
        date: '2026-02-01',
        notes: 'Facebook ads',
      })
    ).rejects.toThrow('Expense tracking feature is not yet available');
  });
});

// =============================================================================
// deleteExpense
// =============================================================================

describe('expenseService.deleteExpense', () => {
  it('returns false (no-op)', async () => {
    const result = await expenseService.deleteExpense('seller-1', 'expense-1');
    expect(result).toBe(false);
  });

  it('returns false for any expense id', async () => {
    const result = await expenseService.deleteExpense('seller-1', 'nonexistent');
    expect(result).toBe(false);
  });
});
