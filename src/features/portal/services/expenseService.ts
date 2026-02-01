// =============================================================================
// Expense Service - Frontend API Client for Expense Tracking
// =============================================================================

import { API_URL } from '../../../config/api';

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
  async getSellerExpenses(token: string, filters: ExpenseFilters = {}): Promise<Expense[]> {
    const url = new URL(`${API_URL}/expenses/seller`);

    if (filters.type) url.searchParams.append('type', filters.type);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }

    return response.json();
  },

  /**
   * Get expense summary
   */
  async getExpenseSummary(token: string): Promise<ExpenseSummary> {
    const response = await fetch(`${API_URL}/expenses/seller/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expense summary');
    }

    return response.json();
  },

  /**
   * Create a new expense
   */
  async createExpense(token: string, input: CreateExpenseInput): Promise<Expense> {
    const response = await fetch(`${API_URL}/expenses/seller`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Failed to create expense');
    }

    return response.json();
  },

  /**
   * Delete an expense
   */
  async deleteExpense(token: string, expenseId: string): Promise<void> {
    const response = await fetch(`${API_URL}/expenses/seller/${expenseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
  },
};

export default expenseService;
