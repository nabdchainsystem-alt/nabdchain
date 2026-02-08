// =============================================================================
// Buyer Workspace Routes - Purchases, Suppliers, Inventory, Expenses
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';
import { resolveBuyerId } from '../utils/resolveBuyerId';

const router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const purchaseOrderSchema = z.object({
  supplierName: z.string().min(1),
  supplierId: z.string().uuid().optional(),
  totalAmount: z.number().min(0),
  currency: z.string().default('SAR'),
  expectedDelivery: z.string().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    productName: z.string().min(1),
    sku: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).optional(),
});

const supplierSchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  rating: z.number().min(0).max(5).optional(),
});

const inventorySchema = z.object({
  productName: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  quantity: z.number().int().min(0),
  reorderLevel: z.number().int().min(0).default(10),
});

const expenseSchema = z.object({
  category: z.enum(['shipping', 'customs', 'storage', 'other']),
  amount: z.number().min(0),
  currency: z.string().default('SAR'),
  date: z.string().optional(),
  notes: z.string().max(1000).optional(),
  purchaseOrderId: z.string().uuid().optional(),
});

// =============================================================================
// Empty State Constants (No mock data - production mode)
// =============================================================================
// NOTE: Mock data removed - see MOCK_REMOVAL_REPORT.md
// All data must come from database. Frontend handles empty states gracefully.

// =============================================================================
// PO Number Generator
// =============================================================================

async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;

  try {
    const lastPO = await prisma.buyerPurchaseOrder.findFirst({
      where: { poNumber: { startsWith: prefix } },
      orderBy: { poNumber: 'desc' },
      select: { poNumber: true },
    });

    let nextNumber = 1;
    if (lastPO) {
      const lastNumber = parseInt(lastPO.poNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    // Fallback using timestamp for uniqueness (no random)
    apiLogger.error('[BuyerWorkspace] Error generating PO number:', error);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}`;
  }
}

// =============================================================================
// Purchase Orders Routes
// =============================================================================

/**
 * GET /api/buyer/purchases
 * Get all purchase orders for the buyer
 */
router.get('/purchases', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const { status, supplierId, search, dateFrom, dateTo } = req.query;

    const where: any = { buyerId };
    if (status) where.status = status as string;
    if (supplierId) where.supplierId = supplierId as string;
    if (search) {
      where.OR = [
        { poNumber: { contains: search as string, mode: 'insensitive' } },
        { supplierName: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom as string);
      if (dateTo) where.orderDate.lte = new Date(dateTo as string);
    }

    const purchases = await prisma.buyerPurchaseOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: { items: true },
    });

    // Return actual data - frontend handles empty states
    res.json(purchases);
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching purchases:', error);
    res.json([]); // Empty array, not mock data
  }
});

/**
 * POST /api/buyer/purchases
 * Create a new purchase order
 */
router.post('/purchases', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const data = purchaseOrderSchema.parse(req.body);

    const poNumber = await generatePONumber();

    const purchase = await prisma.buyerPurchaseOrder.create({
      data: {
        poNumber,
        buyerId,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        totalAmount: data.totalAmount,
        currency: data.currency,
        expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
        notes: data.notes,
        items: data.items ? {
          create: data.items.map(item => ({
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        } : undefined,
      },
      include: { items: true },
    });

    res.status(201).json(purchase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

/**
 * PATCH /api/buyer/purchases/:id/status
 * Update purchase order status
 */
router.patch('/purchases/:id/status', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['draft', 'sent', 'approved', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.buyerPurchaseOrder.findFirst({
      where: { id, buyerId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const updateData: any = { status };
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const updated = await prisma.buyerPurchaseOrder.update({
      where: { id },
      data: updateData,
    });

    // Update supplier stats if delivered
    if (status === 'delivered' && existing.supplierId) {
      await prisma.buyerSupplier.update({
        where: { id: existing.supplierId },
        data: {
          totalOrders: { increment: 1 },
          totalSpend: { increment: existing.totalAmount },
          lastOrderDate: new Date(),
        },
      });
    }

    res.json(updated);
  } catch (error) {
    apiLogger.error('Error updating purchase order status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// =============================================================================
// Suppliers Routes
// =============================================================================

/**
 * GET /api/buyer/suppliers
 * Get all suppliers for the buyer
 */
router.get('/suppliers', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const { search, country } = req.query;

    const where: any = { buyerId };
    if (country) where.country = country as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.buyerSupplier.findMany({
      where,
      orderBy: { totalSpend: 'desc' },
    });

    // Return actual data - frontend handles empty states
    res.json(suppliers);
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching suppliers:', error);
    res.json([]); // Empty array, not mock data
  }
});

/**
 * POST /api/buyer/suppliers
 * Create a new supplier
 */
router.post('/suppliers', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const data = supplierSchema.parse(req.body);

    const supplier = await prisma.buyerSupplier.create({
      data: {
        buyerId,
        ...data,
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// =============================================================================
// Inventory Routes
// =============================================================================

/**
 * GET /api/buyer/inventory
 * Get buyer's internal inventory
 */
router.get('/inventory', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const { status, search } = req.query;

    const where: any = { buyerId };
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { productName: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const inventory = await prisma.buyerInventory.findMany({
      where,
      orderBy: { productName: 'asc' },
    });

    // Return actual data - frontend handles empty states
    res.json(inventory);
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching inventory:', error);
    res.json([]); // Empty array, not mock data
  }
});

/**
 * POST /api/buyer/inventory
 * Add new inventory item
 */
router.post('/inventory', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const data = inventorySchema.parse(req.body);

    // Calculate status based on quantity vs reorder level
    let status = 'ok';
    if (data.quantity <= data.reorderLevel * 0.3) {
      status = 'critical';
    } else if (data.quantity <= data.reorderLevel) {
      status = 'low';
    }

    const inventory = await prisma.buyerInventory.create({
      data: {
        buyerId,
        ...data,
        status,
      },
    });

    res.status(201).json(inventory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

/**
 * PATCH /api/buyer/inventory/:id
 * Update inventory quantity
 */
router.patch('/inventory/:id', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const id = req.params.id as string;
    const { quantity, reorderLevel } = req.body;

    const existing = await prisma.buyerInventory.findFirst({
      where: { id, buyerId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const newQuantity = quantity !== undefined ? quantity : existing.quantity;
    const newReorderLevel = reorderLevel !== undefined ? reorderLevel : existing.reorderLevel;

    // Calculate new status
    let status = 'ok';
    if (newQuantity <= newReorderLevel * 0.3) {
      status = 'critical';
    } else if (newQuantity <= newReorderLevel) {
      status = 'low';
    }

    const updated = await prisma.buyerInventory.update({
      where: { id },
      data: { quantity: newQuantity, reorderLevel: newReorderLevel, status },
    });

    res.json(updated);
  } catch (error) {
    apiLogger.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// =============================================================================
// Expenses Routes
// =============================================================================

/**
 * GET /api/buyer/expenses
 * Get buyer's expenses
 */
router.get('/expenses', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const { category, dateFrom, dateTo } = req.query;

    const where: any = { buyerId };
    if (category) where.category = category as string;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    const expenses = await prisma.buyerExpense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Return actual data - frontend handles empty states
    res.json(expenses);
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching expenses:', error);
    res.json([]); // Empty array, not mock data
  }
});

/**
 * GET /api/buyer/expenses/summary
 * Get monthly expense summary
 */
router.get('/expenses/summary', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyTotal, byCategory] = await Promise.all([
      prisma.buyerExpense.aggregate({
        where: { buyerId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.buyerExpense.groupBy({
        by: ['category'],
        where: { buyerId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      monthlyTotal: monthlyTotal._sum.amount || 0,
      byCategory: byCategory.map(c => ({
        category: c.category,
        amount: c._sum.amount || 0,
      })),
    });
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching expense summary:', error);
    // Return empty summary - frontend handles empty states
    res.json({
      monthlyTotal: 0,
      byCategory: [],
    });
  }
});

/**
 * POST /api/buyer/expenses
 * Add a new expense
 */
router.post('/expenses', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const data = expenseSchema.parse(req.body);

    const expense = await prisma.buyerExpense.create({
      data: {
        buyerId,
        category: data.category,
        amount: data.amount,
        currency: data.currency,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
        purchaseOrderId: data.purchaseOrderId,
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// =============================================================================
// Predictive Intelligence - Stub Endpoints (Feature pending implementation)
// These endpoints prevent 404 errors and return empty data structures
// =============================================================================

/**
 * GET /api/buyer/inventory/forecast
 * Get inventory with forecast data (stub - returns basic inventory)
 */
router.get('/inventory/forecast', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }
    const { status, search } = req.query;

    const where: any = { buyerId };
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { productName: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const inventory = await prisma.buyerInventory.findMany({
      where,
      orderBy: { productName: 'asc' },
    });

    // Return inventory with empty forecast data - feature pending
    const withForecast = inventory.map(item => ({
      ...item,
      forecast: {
        daysUntilStockout: null,
        depletionRatePerDay: 0,
        suggestedReorderDate: null,
        confidenceLevel: 'low' as const,
        basedOnDays: 0,
      },
      supplierOptions: [],
      costSimulation: null,
      avgDailyUsage: 0,
      lastRestockDate: null,
      pendingOrderQty: 0,
    }));

    res.json(withForecast);
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching inventory forecast:', error);
    res.json([]);
  }
});

/**
 * GET /api/buyer/inventory/alerts
 * Get inventory alerts (stub - returns empty array)
 */
router.get('/inventory/alerts', requireAuth, async (req, res: Response) => {
  // Feature pending implementation - return empty array
  res.json([]);
});

/**
 * POST /api/buyer/inventory/:id/simulate
 * Simulate cost impact for reorder (stub)
 */
router.post('/inventory/:id/simulate', requireAuth, async (req, res: Response) => {
  // Feature pending implementation - return empty simulation
  res.json({
    currentUnitCost: 0,
    projectedUnitCost: 0,
    recommendedQty: 0,
    totalCost: 0,
    potentialSavings: 0,
    savingsPercent: 0,
    bestSupplier: null,
  });
});

/**
 * GET /api/buyer/expenses/enhanced-summary
 * Get enhanced expense summary with analytics (stub - returns basic summary)
 */
router.get('/expenses/enhanced-summary', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyTotal, byCategory] = await Promise.all([
      prisma.buyerExpense.aggregate({
        where: { buyerId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.buyerExpense.groupBy({
        by: ['category'],
        where: { buyerId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    // Return basic summary with empty analytics - feature pending
    res.json({
      monthlyTotal: monthlyTotal._sum.amount || 0,
      byCategory: byCategory.map(c => ({
        category: c.category,
        amount: c._sum.amount || 0,
      })),
      leakages: [],
      priceDriftAlerts: [],
      budgetComparison: [],
      categoryInefficiencies: [],
      totalPotentialSavings: 0,
      healthScore: 100,
    });
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching enhanced summary:', error);
    res.json({
      monthlyTotal: 0,
      byCategory: [],
      leakages: [],
      priceDriftAlerts: [],
      budgetComparison: [],
      categoryInefficiencies: [],
      totalPotentialSavings: 0,
      healthScore: 100,
    });
  }
});

/**
 * GET /api/buyer/expenses/analytics/dashboard
 * Get complete expense analytics dashboard (aggregates summary, leakages, price drifts)
 */
router.get('/expenses/analytics/dashboard', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = await resolveBuyerId(req);
    if (!buyerId) {
      return res.status(401).json({ error: 'Unauthorized - no buyer profile found' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyTotal, byCategory, recentExpenses] = await Promise.all([
      prisma.buyerExpense.aggregate({
        where: { buyerId, date: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.buyerExpense.groupBy({
        by: ['category'],
        where: { buyerId, date: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.buyerExpense.findMany({
        where: { buyerId },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ]);

    const totalSpend = monthlyTotal._sum.amount || 0;
    const transactionCount = monthlyTotal._count || 0;

    res.json({
      summary: {
        totalSpend,
        totalBudget: 0,
        budgetUtilization: 0,
        avgTransactionSize: transactionCount > 0 ? totalSpend / transactionCount : 0,
        transactionCount,
        suppliersUsed: 0,
        leakageAmount: 0,
        leakageCount: 0,
        priceDriftImpact: 0,
        currency: 'SAR',
        periodComparison: {
          previousPeriod: 0,
          change: 0,
          changePercent: 0,
        },
      },
      budgetTrend: [],
      categoryBreakdown: byCategory.map(c => ({
        id: c.category,
        name: c.category,
        budget: 0,
        actual: c._sum.amount || 0,
        variance: c._sum.amount || 0,
        variancePercent: 0,
        trend: 'stable' as const,
        itemCount: c._count || 0,
      })),
      leakages: [],
      priceDrifts: [],
      inefficiencies: [],
      recentTransactions: recentExpenses.map(e => ({
        id: e.id,
        date: e.date.toISOString(),
        category: e.category,
        supplierId: '',
        supplierName: '',
        description: e.notes || e.category,
        amount: e.amount,
        currency: e.currency,
        paymentStatus: 'paid' as const,
      })),
    });
  } catch (error) {
    apiLogger.error('[BuyerWorkspace] Error fetching expense analytics dashboard:', error);
    res.json({
      summary: {
        totalSpend: 0, totalBudget: 0, budgetUtilization: 0,
        avgTransactionSize: 0, transactionCount: 0, suppliersUsed: 0,
        leakageAmount: 0, leakageCount: 0, priceDriftImpact: 0,
        currency: 'SAR',
        periodComparison: { previousPeriod: 0, change: 0, changePercent: 0 },
      },
      budgetTrend: [],
      categoryBreakdown: [],
      leakages: [],
      priceDrifts: [],
      inefficiencies: [],
      recentTransactions: [],
    });
  }
});

/**
 * GET /api/buyer/expenses/leakages
 * Get spend leakages (stub - returns empty array)
 */
router.get('/expenses/leakages', requireAuth, async (req, res: Response) => {
  // Feature pending implementation - return empty array
  res.json([]);
});

/**
 * GET /api/buyer/expenses/price-drift (or /price-drifts)
 * Get price drift alerts (stub - returns empty array)
 */
router.get(['/expenses/price-drift', '/expenses/price-drifts'], requireAuth, async (req, res: Response) => {
  // Feature pending implementation - return empty array
  res.json([]);
});

export default router;
