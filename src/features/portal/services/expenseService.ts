// =============================================================================
// Expense Service - Frontend API Client for Expense Tracking
// =============================================================================

import { portalApiClient } from './portalApiClient';

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
   * Get all expenses for the authenticated seller
   */
  async getSellerExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', filters.type);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const qs = params.toString();
    return portalApiClient.get<Expense[]>(`/api/expenses/seller${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get expense summary
   */
  async getExpenseSummary(): Promise<ExpenseSummary> {
    return portalApiClient.get<ExpenseSummary>('/api/expenses/seller/summary');
  },

  /**
   * Create a new expense
   */
  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    return portalApiClient.post<Expense>('/api/expenses/seller', input);
  },

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    return portalApiClient.delete<void>(`/api/expenses/seller/${expenseId}`);
  },
};

export default expenseService;
