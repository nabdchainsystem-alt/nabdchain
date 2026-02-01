// =============================================================================
// Expense Service - Expense Tracking for Sellers
// =============================================================================

import { prisma } from '../lib/prisma';

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
// Mock Data for Demo
// =============================================================================

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    type: 'shipping',
    amount: 1250,
    currency: 'SAR',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Aramex shipping for bulk order',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_2',
    type: 'ads',
    amount: 2500,
    currency: 'SAR',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Google Ads campaign - January',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_3',
    type: 'platform_fee',
    amount: 850,
    currency: 'SAR',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Monthly platform subscription',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_4',
    type: 'supplies',
    amount: 450,
    currency: 'SAR',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Packaging materials',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_5',
    type: 'shipping',
    amount: 780,
    currency: 'SAR',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'SMSA express delivery',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_6',
    type: 'other',
    amount: 320,
    currency: 'SAR',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Equipment maintenance',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_7',
    type: 'ads',
    amount: 1800,
    currency: 'SAR',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Social media promotion',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_8',
    type: 'shipping',
    amount: 560,
    currency: 'SAR',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'International shipping',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_9',
    type: 'platform_fee',
    amount: 850,
    currency: 'SAR',
    date: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Monthly platform subscription',
    createdAt: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp_10',
    type: 'supplies',
    amount: 680,
    currency: 'SAR',
    date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Labels and stickers',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// In-memory storage for demo (simulates database)
let mockExpenses = [...MOCK_EXPENSES];

// =============================================================================
// Helper Functions
// =============================================================================

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

// =============================================================================
// Expense Service
// =============================================================================

export const expenseService = {
  /**
   * Get all expenses for a seller
   */
  async getSellerExpenses(sellerId: string, filters: ExpenseFilters = {}): Promise<Expense[]> {
    try {
      // In production, query from database
      // For now, return mock data
      let expenses = [...mockExpenses];

      // Apply filters
      if (filters.type) {
        expenses = expenses.filter((e) => e.type === filters.type);
      }

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        expenses = expenses.filter((e) => new Date(e.date) >= from);
      }

      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        expenses = expenses.filter((e) => new Date(e.date) <= to);
      }

      // Sort by date descending
      expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return expenses;
    } catch (error) {
      console.log('Error fetching expenses:', error);
      return mockExpenses;
    }
  },

  /**
   * Get expense summary
   */
  async getExpenseSummary(sellerId: string): Promise<ExpenseSummary> {
    try {
      const now = new Date();
      const thisMonth = getMonthRange(now);
      const lastMonth = getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));

      const expenses = mockExpenses;

      // Calculate this month total
      const totalThisMonth = expenses
        .filter((e) => {
          const date = new Date(e.date);
          return date >= thisMonth.start && date <= thisMonth.end;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      // Calculate last month total
      const totalLastMonth = expenses
        .filter((e) => {
          const date = new Date(e.date);
          return date >= lastMonth.start && date <= lastMonth.end;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      // Group by type
      const byType: { type: ExpenseType; total: number }[] = [];
      const types: ExpenseType[] = ['shipping', 'ads', 'platform_fee', 'supplies', 'other'];

      for (const type of types) {
        const total = expenses
          .filter((e) => {
            const date = new Date(e.date);
            return e.type === type && date >= thisMonth.start && date <= thisMonth.end;
          })
          .reduce((sum, e) => sum + e.amount, 0);

        if (total > 0) {
          byType.push({ type, total });
        }
      }

      return {
        totalThisMonth,
        totalLastMonth,
        byType,
        currency: 'SAR',
      };
    } catch (error) {
      console.log('Error fetching expense summary:', error);
      return {
        totalThisMonth: 0,
        totalLastMonth: 0,
        byType: [],
        currency: 'SAR',
      };
    }
  },

  /**
   * Create a new expense
   */
  async createExpense(sellerId: string, input: CreateExpenseInput): Promise<Expense> {
    try {
      const newExpense: Expense = {
        id: `exp_${Date.now()}`,
        type: input.type,
        amount: input.amount,
        currency: 'SAR',
        date: input.date,
        notes: input.notes || null,
        createdAt: new Date().toISOString(),
      };

      // Add to mock storage
      mockExpenses = [newExpense, ...mockExpenses];

      return newExpense;
    } catch (error) {
      console.log('Error creating expense:', error);
      throw new Error('Failed to create expense');
    }
  },

  /**
   * Delete an expense
   */
  async deleteExpense(sellerId: string, expenseId: string): Promise<boolean> {
    try {
      const index = mockExpenses.findIndex((e) => e.id === expenseId);
      if (index === -1) return false;

      mockExpenses.splice(index, 1);
      return true;
    } catch (error) {
      console.log('Error deleting expense:', error);
      return false;
    }
  },
};

export default expenseService;
