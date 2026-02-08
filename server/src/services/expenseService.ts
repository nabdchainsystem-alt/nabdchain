// =============================================================================
// Expense Service - Expense Tracking for Sellers
// =============================================================================
// NOTE: Expense tracking feature not yet implemented with database backing.
// All methods return empty results. To enable, add SellerExpense model to Prisma.

import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type ExpenseType = 'shipping' | 'ads' | 'platform_fee' | 'supplies' | 'other';

export interface Expense {
  id: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface ExpenseFilters {
  type?: ExpenseType;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpenseSummary {
  totalThisMonth: number;
  totalLastMonth: number;
  byType: { type: ExpenseType; total: number }[];
  currency: string;
}

export interface CreateExpenseInput {
  type: ExpenseType;
  amount: number;
  date: string;
  notes?: string;
}

// =============================================================================
// Expense Service
// =============================================================================

export const expenseService = {
  /**
   * Get all expenses for a seller
   * Stub: Returns empty until SellerExpense model is added to the schema
   */
  async getSellerExpenses(sellerId: string, filters: ExpenseFilters = {}): Promise<Expense[]> {
    apiLogger.debug(`getSellerExpenses called for seller ${sellerId} - feature not implemented`);
    return [];
  },

  /**
   * Get expense summary
   * Stub: Returns zeroes until SellerExpense model is added to the schema
   */
  async getExpenseSummary(sellerId: string): Promise<ExpenseSummary> {
    apiLogger.debug(`getExpenseSummary called for seller ${sellerId} - feature not implemented`);
    return {
      totalThisMonth: 0,
      totalLastMonth: 0,
      byType: [],
      currency: 'SAR',
    };
  },

  /**
   * Create a new expense
   * Stub: Throws until SellerExpense model is added to the schema
   */
  async createExpense(sellerId: string, input: CreateExpenseInput): Promise<Expense> {
    apiLogger.warn(`createExpense called for seller ${sellerId} - feature not implemented`);
    throw new Error('Expense tracking feature is not yet available');
  },

  /**
   * Delete an expense
   * Stub: No-op until SellerExpense model is added to the schema
   */
  async deleteExpense(sellerId: string, expenseId: string): Promise<boolean> {
    apiLogger.warn(`deleteExpense called for expense ${expenseId} - feature not implemented`);
    return false;
  },
};

export default expenseService;
