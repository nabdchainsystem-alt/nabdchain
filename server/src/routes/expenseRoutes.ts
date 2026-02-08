// =============================================================================
// Expense Routes - Expense Tracking API
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { expenseService, ExpenseType } from '../services/expenseService';
import { apiLogger } from '../utils/logger';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const expenseTypeEnum = z.enum(['shipping', 'ads', 'platform_fee', 'supplies', 'other']);

const createExpenseSchema = z.object({
  type: expenseTypeEnum,
  amount: z.number().positive(),
  date: z.string(),
  notes: z.string().max(500).optional(),
});

// =============================================================================
// Seller Expense Routes
// =============================================================================

/**
 * GET /api/expenses/seller
 * Get all expenses for the authenticated seller
 */
router.get('/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const { type, dateFrom, dateTo } = req.query;

    const expenses = await expenseService.getSellerExpenses(sellerId, {
      type: type as ExpenseType | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
    });

    res.json(expenses);
  } catch (error) {
    apiLogger.error('Error fetching seller expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * GET /api/expenses/seller/summary
 * Get expense summary for the authenticated seller
 */
router.get('/seller/summary', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const summary = await expenseService.getExpenseSummary(sellerId);
    res.json(summary);
  } catch (error) {
    apiLogger.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
});

/**
 * POST /api/expenses/seller
 * Create a new expense
 */
router.post('/seller', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const data = createExpenseSchema.parse(req.body);

    const expense = await expenseService.createExpense(sellerId, data);
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

/**
 * DELETE /api/expenses/seller/:expenseId
 * Delete an expense
 */
router.delete('/seller/:expenseId', requireAuth, async (req, res: Response) => {
  try {
    const sellerId = (req as AuthRequest).auth.userId;
    const expenseId = req.params.expenseId as string;

    const deleted = await expenseService.deleteExpense(sellerId, expenseId);

    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
