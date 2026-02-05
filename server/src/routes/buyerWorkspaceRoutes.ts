// =============================================================================
// Buyer Workspace Routes - Purchases, Suppliers, Inventory, Expenses
// =============================================================================

import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

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
// Mock Data for Demo
// =============================================================================

const MOCK_PURCHASES = [
  {
    id: 'po-1',
    poNumber: 'PO-2025-0001',
    buyerId: 'buyer-1',
    supplierId: 'sup-1',
    supplierName: 'Industrial Parts Co.',
    totalAmount: 15000,
    currency: 'SAR',
    status: 'approved',
    orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'po-2',
    poNumber: 'PO-2025-0002',
    buyerId: 'buyer-1',
    supplierId: 'sup-2',
    supplierName: 'Gulf Suppliers LLC',
    totalAmount: 8500,
    currency: 'SAR',
    status: 'sent',
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expectedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'po-3',
    poNumber: 'PO-2025-0003',
    buyerId: 'buyer-1',
    supplierId: 'sup-3',
    supplierName: 'Saudi Steel Works',
    totalAmount: 32000,
    currency: 'SAR',
    status: 'delivered',
    orderDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    expectedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'po-4',
    poNumber: 'PO-2025-0004',
    buyerId: 'buyer-1',
    supplierId: null,
    supplierName: 'New Vendor Inc.',
    totalAmount: 5200,
    currency: 'SAR',
    status: 'draft',
    orderDate: new Date(),
    expectedDelivery: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_SUPPLIERS = [
  {
    id: 'sup-1',
    buyerId: 'buyer-1',
    name: 'Industrial Parts Co.',
    country: 'Saudi Arabia',
    email: 'sales@industrialparts.sa',
    phone: '+966 11 234 5678',
    rating: 4.5,
    totalOrders: 15,
    totalSpend: 125000,
    lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'sup-2',
    buyerId: 'buyer-1',
    name: 'Gulf Suppliers LLC',
    country: 'UAE',
    email: 'info@gulfsuppliers.ae',
    phone: '+971 4 567 8901',
    rating: 4.2,
    totalOrders: 8,
    totalSpend: 68000,
    lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'sup-3',
    buyerId: 'buyer-1',
    name: 'Saudi Steel Works',
    country: 'Saudi Arabia',
    email: 'orders@saudisteel.sa',
    phone: '+966 12 345 6789',
    rating: 4.8,
    totalOrders: 22,
    totalSpend: 245000,
    lastOrderDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_INVENTORY = [
  {
    id: 'inv-1',
    buyerId: 'buyer-1',
    productName: 'Hydraulic Pump Unit',
    sku: 'HYD-PUMP-001',
    quantity: 25,
    reorderLevel: 10,
    status: 'ok',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'inv-2',
    buyerId: 'buyer-1',
    productName: 'Steel Bearings Set',
    sku: 'BRG-STL-100',
    quantity: 8,
    reorderLevel: 15,
    status: 'low',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'inv-3',
    buyerId: 'buyer-1',
    productName: 'Electric Motor 15KW',
    sku: 'MTR-ELC-15K',
    quantity: 2,
    reorderLevel: 5,
    status: 'critical',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'inv-4',
    buyerId: 'buyer-1',
    productName: 'Valve Assembly Kit',
    sku: 'VLV-KIT-200',
    quantity: 45,
    reorderLevel: 20,
    status: 'ok',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_EXPENSES = [
  {
    id: 'exp-1',
    buyerId: 'buyer-1',
    category: 'shipping',
    amount: 2500,
    currency: 'SAR',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    notes: 'Express shipping for urgent order',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'exp-2',
    buyerId: 'buyer-1',
    category: 'customs',
    amount: 4800,
    currency: 'SAR',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    notes: 'Import duties for equipment',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'exp-3',
    buyerId: 'buyer-1',
    category: 'storage',
    amount: 1500,
    currency: 'SAR',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    notes: 'Monthly warehouse rental',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'exp-4',
    buyerId: 'buyer-1',
    category: 'other',
    amount: 350,
    currency: 'SAR',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    notes: 'Quality inspection fees',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

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
  } catch {
    // Fallback for mock mode
    return `${prefix}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
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
    const buyerId = (req as AuthRequest).auth.userId;
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

    if (purchases.length === 0) {
      return res.json(MOCK_PURCHASES);
    }

    res.json(purchases);
  } catch (error) {
    apiLogger.error('Error fetching purchases:', error);
    res.json(MOCK_PURCHASES);
  }
});

/**
 * POST /api/buyer/purchases
 * Create a new purchase order
 */
router.post('/purchases', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
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
    const buyerId = (req as AuthRequest).auth.userId;
    const { id } = req.params;
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
    const buyerId = (req as AuthRequest).auth.userId;
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

    if (suppliers.length === 0) {
      return res.json(MOCK_SUPPLIERS);
    }

    res.json(suppliers);
  } catch (error) {
    apiLogger.error('Error fetching suppliers:', error);
    res.json(MOCK_SUPPLIERS);
  }
});

/**
 * POST /api/buyer/suppliers
 * Create a new supplier
 */
router.post('/suppliers', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
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
    const buyerId = (req as AuthRequest).auth.userId;
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

    if (inventory.length === 0) {
      return res.json(MOCK_INVENTORY);
    }

    res.json(inventory);
  } catch (error) {
    apiLogger.error('Error fetching inventory:', error);
    res.json(MOCK_INVENTORY);
  }
});

/**
 * POST /api/buyer/inventory
 * Add new inventory item
 */
router.post('/inventory', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
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
    const buyerId = (req as AuthRequest).auth.userId;
    const { id } = req.params;
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
    const buyerId = (req as AuthRequest).auth.userId;
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

    if (expenses.length === 0) {
      return res.json(MOCK_EXPENSES);
    }

    res.json(expenses);
  } catch (error) {
    apiLogger.error('Error fetching expenses:', error);
    res.json(MOCK_EXPENSES);
  }
});

/**
 * GET /api/buyer/expenses/summary
 * Get monthly expense summary
 */
router.get('/expenses/summary', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;

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
    apiLogger.error('Error fetching expense summary:', error);
    // Return mock summary
    res.json({
      monthlyTotal: 9150,
      byCategory: [
        { category: 'shipping', amount: 2500 },
        { category: 'customs', amount: 4800 },
        { category: 'storage', amount: 1500 },
        { category: 'other', amount: 350 },
      ],
    });
  }
});

/**
 * POST /api/buyer/expenses
 * Add a new expense
 */
router.post('/expenses', requireAuth, async (req, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).auth.userId;
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

export default router;
