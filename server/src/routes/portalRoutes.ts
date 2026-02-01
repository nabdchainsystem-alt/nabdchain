import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = Router();

// Schema for creating/updating products
const productSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  partNumber: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().min(0),
  currency: z.string().default('SAR'),
  stock: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().min(1).default(1),
  category: z.string().min(1),
  manufacturer: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  weight: z.string().max(50).optional(),
  weightUnit: z.string().max(10).default('kg'),
  dimensions: z.string().max(100).optional(),
  material: z.string().max(100).optional(),
  status: z.enum(['active', 'draft', 'out_of_stock']).default('draft'),
  image: z.string().max(500).optional().nullable(),
});

// GET all products for the seller
router.get('/products', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { status, category, search } = req.query;

    const where: any = { userId };
    if (status) where.status = status as string;
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { manufacturer: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.portalProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (error) {
    apiLogger.error('Error fetching portal products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product
router.get('/products/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const id = req.params.id as string;

    const product = await prisma.portalProduct.findFirst({
      where: { id, userId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    apiLogger.error('Error fetching portal product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// CREATE a new product
router.post('/products', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const data = productSchema.parse(req.body);

    const product = await prisma.portalProduct.create({
      data: {
        userId,
        ...data,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error creating portal product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE a product
router.put('/products/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const id = req.params.id as string;
    const data = productSchema.partial().parse(req.body);

    // Verify ownership
    const existing = await prisma.portalProduct.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.portalProduct.update({
      where: { id },
      data,
    });

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    apiLogger.error('Error updating portal product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE a product
router.delete('/products/:id', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const id = req.params.id as string;

    const existing = await prisma.portalProduct.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.portalProduct.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    apiLogger.error('Error deleting portal product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST bulk create - for migration from localStorage
router.post('/products/bulk', requireAuth, async (req, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    if (products.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 products per batch' });
    }

    const created = await prisma.portalProduct.createMany({
      data: products.map((p: any) => ({
        userId,
        name: p.name,
        sku: p.sku,
        partNumber: p.partNumber || null,
        description: p.description || null,
        price: parseFloat(p.price) || 0,
        currency: p.currency || 'SAR',
        stock: parseInt(p.stock) || 0,
        minOrderQty: parseInt(p.minOrderQty) || 1,
        category: p.category,
        manufacturer: p.manufacturer || null,
        brand: p.brand || null,
        weight: p.weight || null,
        weightUnit: p.weightUnit || 'kg',
        dimensions: p.dimensions || null,
        material: p.material || null,
        status: p.status || 'draft',
        image: p.image || null,
      })),
      skipDuplicates: true,
    });

    res.json({
      success: true,
      count: created.count,
      message: `Created ${created.count} products`,
    });
  } catch (error) {
    apiLogger.error('Error bulk creating portal products:', error);
    res.status(500).json({ error: 'Failed to bulk create products' });
  }
});

export default router;
