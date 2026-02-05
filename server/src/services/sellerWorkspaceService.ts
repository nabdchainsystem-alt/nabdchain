// =============================================================================
// Seller Workspace Service - Execution Layer Operations
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
export type StockAdjustmentReason =
  | 'received'
  | 'sold'
  | 'damaged'
  | 'returned'
  | 'correction'
  | 'reserved'
  | 'released'
  | 'other';
export type CostType =
  | 'purchase'
  | 'shipping'
  | 'customs'
  | 'storage'
  | 'marketing'
  | 'platform_fee'
  | 'other';

export interface InvoiceLineItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceInput {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  lineItems: InvoiceLineItem[];
  vatRate?: number;
  currency?: string;
  dueDate?: Date;
  notes?: string;
  termsAndConditions?: string;
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {
  status?: InvoiceStatus;
}

export interface StockAdjustmentInput {
  itemId: string;
  adjustmentQty: number; // Positive to add, negative to subtract
  reason: StockAdjustmentReason;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface CostTagInput {
  itemId: string;
  costType: CostType;
  amount: number;
  currency?: string;
  date?: Date;
  vendor?: string;
  invoiceRef?: string;
  notes?: string;
  quantityAffected?: number;
}

export interface BuyerProfileInput {
  buyerId?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  tags?: string[];
  notes?: string;
  rating?: number;
  paymentRating?: number;
}

// =============================================================================
// Invoice Functions
// =============================================================================

/**
 * Generate next invoice number for a seller
 */
async function generateInvoiceNumber(sellerId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastInvoice = await prisma.sellerInvoice.findFirst({
    where: {
      sellerId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0', 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Create a new invoice
 */
export async function createInvoice(sellerId: string, data: CreateInvoiceInput) {
  const invoiceNumber = await generateInvoiceNumber(sellerId);

  // Calculate totals
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatRate = data.vatRate ?? 15;
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = subtotal + vatAmount;

  const invoice = await prisma.sellerInvoice.create({
    data: {
      sellerId,
      invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerCompany: data.customerCompany,
      lineItems: JSON.stringify(data.lineItems),
      subtotal,
      vatRate,
      vatAmount,
      total,
      currency: data.currency || 'SAR',
      status: 'draft',
      dueDate: data.dueDate,
      notes: data.notes,
      termsAndConditions: data.termsAndConditions,
    },
  });

  return invoice;
}

/**
 * Get invoices for a seller
 */
export async function getInvoices(
  sellerId: string,
  filters?: {
    status?: InvoiceStatus;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  const where: Record<string, unknown> = { sellerId };

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
      { customerName: { contains: filters.search, mode: 'insensitive' } },
      { customerCompany: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.issueDate = {};
    if (filters.dateFrom) {
      (where.issueDate as Record<string, Date>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.issueDate as Record<string, Date>).lte = filters.dateTo;
    }
  }

  const invoices = await prisma.sellerInvoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Parse line items
  return invoices.map((inv) => ({
    ...inv,
    lineItems: JSON.parse(inv.lineItems) as InvoiceLineItem[],
  }));
}

/**
 * Get a single invoice
 */
export async function getInvoice(sellerId: string, invoiceId: string) {
  const invoice = await prisma.sellerInvoice.findFirst({
    where: { id: invoiceId, sellerId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return {
    ...invoice,
    lineItems: JSON.parse(invoice.lineItems) as InvoiceLineItem[],
  };
}

/**
 * Update an invoice
 */
export async function updateInvoice(
  sellerId: string,
  invoiceId: string,
  data: UpdateInvoiceInput
) {
  const existing = await prisma.sellerInvoice.findFirst({
    where: { id: invoiceId, sellerId },
  });

  if (!existing) {
    throw new Error('Invoice not found');
  }

  // Only allow editing draft invoices
  if (existing.status !== 'draft' && data.lineItems) {
    throw new Error('Cannot modify line items of non-draft invoice');
  }

  const updateData: Record<string, unknown> = {};

  if (data.customerName) updateData.customerName = data.customerName;
  if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
  if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
  if (data.customerCompany !== undefined) updateData.customerCompany = data.customerCompany;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.termsAndConditions !== undefined) updateData.termsAndConditions = data.termsAndConditions;
  if (data.status) updateData.status = data.status;

  // Recalculate totals if line items changed
  if (data.lineItems) {
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
    const vatRate = data.vatRate ?? existing.vatRate;
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;

    updateData.lineItems = JSON.stringify(data.lineItems);
    updateData.subtotal = subtotal;
    updateData.vatRate = vatRate;
    updateData.vatAmount = vatAmount;
    updateData.total = subtotal + vatAmount;
  }

  // Handle status changes
  if (data.status === 'paid') {
    updateData.paidAt = new Date();
  }

  const invoice = await prisma.sellerInvoice.update({
    where: { id: invoiceId },
    data: updateData,
  });

  return {
    ...invoice,
    lineItems: JSON.parse(invoice.lineItems) as InvoiceLineItem[],
  };
}

/**
 * Delete an invoice (only drafts)
 */
export async function deleteInvoice(sellerId: string, invoiceId: string) {
  const existing = await prisma.sellerInvoice.findFirst({
    where: { id: invoiceId, sellerId },
  });

  if (!existing) {
    throw new Error('Invoice not found');
  }

  if (existing.status !== 'draft') {
    throw new Error('Can only delete draft invoices');
  }

  await prisma.sellerInvoice.delete({
    where: { id: invoiceId },
  });

  return { success: true };
}

// =============================================================================
// Stock Adjustment Functions
// =============================================================================

/**
 * Adjust stock for an item
 */
export async function adjustStock(sellerId: string, data: StockAdjustmentInput) {
  // Verify item belongs to seller
  const item = await prisma.item.findFirst({
    where: { id: data.itemId, userId: sellerId },
  });

  if (!item) {
    throw new Error('Item not found');
  }

  const previousQty = item.stock;
  const newQty = Math.max(0, previousQty + data.adjustmentQty);

  // Create adjustment log
  const adjustment = await prisma.stockAdjustment.create({
    data: {
      sellerId,
      itemId: data.itemId,
      previousQty,
      newQty,
      adjustmentQty: data.adjustmentQty,
      reason: data.reason,
      notes: data.notes,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      createdBy: sellerId,
    },
  });

  // Update item stock
  const updatedItem = await prisma.item.update({
    where: { id: data.itemId },
    data: {
      stock: newQty,
      status: newQty === 0 ? 'out_of_stock' : item.status === 'out_of_stock' ? 'active' : item.status,
    },
  });

  return {
    adjustment,
    item: updatedItem,
  };
}

/**
 * Get stock adjustments
 */
export async function getStockAdjustments(
  sellerId: string,
  filters?: {
    itemId?: string;
    reason?: StockAdjustmentReason;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  const where: Record<string, unknown> = { sellerId };

  if (filters?.itemId) {
    where.itemId = filters.itemId;
  }
  if (filters?.reason) {
    where.reason = filters.reason;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, Date>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, Date>).lte = filters.dateTo;
    }
  }

  const adjustments = await prisma.stockAdjustment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return adjustments;
}

/**
 * Get inventory with stock status
 */
export async function getInventoryWithStatus(sellerId: string) {
  const items = await prisma.item.findMany({
    where: { userId: sellerId },
    select: {
      id: true,
      name: true,
      nameAr: true,
      sku: true,
      stock: true,
      minOrderQty: true,
      status: true,
      price: true,
    },
    orderBy: { name: 'asc' },
  });

  // Calculate status based on stock
  return items.map((item) => ({
    ...item,
    stockStatus:
      item.stock === 0
        ? 'out_of_stock'
        : item.stock <= (item.minOrderQty || 10)
        ? 'low_stock'
        : 'in_stock',
  }));
}

// =============================================================================
// Cost Tag Functions
// =============================================================================

/**
 * Add a cost tag to an item
 */
export async function addCostTag(sellerId: string, data: CostTagInput) {
  // Verify item belongs to seller
  const item = await prisma.item.findFirst({
    where: { id: data.itemId, userId: sellerId },
  });

  if (!item) {
    throw new Error('Item not found');
  }

  const costTag = await prisma.itemCostTag.create({
    data: {
      sellerId,
      itemId: data.itemId,
      costType: data.costType,
      amount: data.amount,
      currency: data.currency || 'SAR',
      date: data.date || new Date(),
      vendor: data.vendor,
      invoiceRef: data.invoiceRef,
      notes: data.notes,
      quantityAffected: data.quantityAffected,
    },
  });

  return costTag;
}

/**
 * Get cost tags
 */
export async function getCostTags(
  sellerId: string,
  filters?: {
    itemId?: string;
    costType?: CostType;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  const where: Record<string, unknown> = { sellerId };

  if (filters?.itemId) {
    where.itemId = filters.itemId;
  }
  if (filters?.costType) {
    where.costType = filters.costType;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {};
    if (filters.dateFrom) {
      (where.date as Record<string, Date>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.date as Record<string, Date>).lte = filters.dateTo;
    }
  }

  const costTags = await prisma.itemCostTag.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return costTags;
}

/**
 * Get cost summary by type
 */
export async function getCostSummary(sellerId: string, itemId?: string) {
  const where: Record<string, unknown> = { sellerId };
  if (itemId) where.itemId = itemId;

  const costTags = await prisma.itemCostTag.findMany({
    where,
    select: { costType: true, amount: true },
  });

  const summary: Record<string, number> = {};
  let total = 0;

  for (const tag of costTags) {
    summary[tag.costType] = (summary[tag.costType] || 0) + tag.amount;
    total += tag.amount;
  }

  return { byType: summary, total };
}

/**
 * Delete a cost tag
 */
export async function deleteCostTag(sellerId: string, costTagId: string) {
  const existing = await prisma.itemCostTag.findFirst({
    where: { id: costTagId, sellerId },
  });

  if (!existing) {
    throw new Error('Cost tag not found');
  }

  await prisma.itemCostTag.delete({
    where: { id: costTagId },
  });

  return { success: true };
}

// =============================================================================
// Buyer Profile Functions
// =============================================================================

/**
 * Create or update a buyer profile
 */
export async function upsertBuyerProfile(sellerId: string, data: BuyerProfileInput) {
  // Check if profile exists
  const existing = data.buyerId
    ? await prisma.sellerBuyerProfile.findFirst({
        where: { sellerId, buyerId: data.buyerId },
      })
    : null;

  if (existing) {
    // Update
    return prisma.sellerBuyerProfile.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        address: data.address,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        notes: data.notes,
        rating: data.rating,
        paymentRating: data.paymentRating,
      },
    });
  }

  // Create new
  return prisma.sellerBuyerProfile.create({
    data: {
      sellerId,
      buyerId: data.buyerId,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      address: data.address,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      notes: data.notes,
      rating: data.rating,
      paymentRating: data.paymentRating,
    },
  });
}

/**
 * Get buyer profiles
 */
export async function getBuyerProfiles(
  sellerId: string,
  filters?: {
    search?: string;
    rating?: number;
  }
) {
  const where: Record<string, unknown> = { sellerId };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { company: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.rating) {
    where.rating = { gte: filters.rating };
  }

  const profiles = await prisma.sellerBuyerProfile.findMany({
    where,
    orderBy: [{ totalSpend: 'desc' }, { name: 'asc' }],
  });

  return profiles.map((p) => ({
    ...p,
    tags: p.tags ? JSON.parse(p.tags) : [],
  }));
}

/**
 * Get a single buyer profile
 */
export async function getBuyerProfile(sellerId: string, profileId: string) {
  const profile = await prisma.sellerBuyerProfile.findFirst({
    where: { id: profileId, sellerId },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  // Get order history if buyerId exists
  let orders: unknown[] = [];
  if (profile.buyerId) {
    orders = await prisma.marketplaceOrder.findMany({
      where: {
        sellerId,
        buyerId: profile.buyerId,
      },
      select: {
        id: true,
        orderNumber: true,
        itemName: true,
        quantity: true,
        totalPrice: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  return {
    ...profile,
    tags: profile.tags ? JSON.parse(profile.tags) : [],
    orders,
  };
}

/**
 * Update buyer profile stats from orders
 */
export async function updateBuyerProfileStats(sellerId: string, buyerId: string) {
  const profile = await prisma.sellerBuyerProfile.findFirst({
    where: { sellerId, buyerId },
  });

  if (!profile) {
    return null;
  }

  const orders = await prisma.marketplaceOrder.aggregate({
    where: { sellerId, buyerId },
    _count: true,
    _sum: { totalPrice: true },
  });

  const lastOrder = await prisma.marketplaceOrder.findFirst({
    where: { sellerId, buyerId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const totalOrders = orders._count;
  const totalSpend = orders._sum.totalPrice || 0;
  const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

  return prisma.sellerBuyerProfile.update({
    where: { id: profile.id },
    data: {
      totalOrders,
      totalSpend,
      avgOrderValue,
      lastOrderDate: lastOrder?.createdAt,
    },
  });
}

/**
 * Delete a buyer profile
 */
export async function deleteBuyerProfile(sellerId: string, profileId: string) {
  const existing = await prisma.sellerBuyerProfile.findFirst({
    where: { id: profileId, sellerId },
  });

  if (!existing) {
    throw new Error('Profile not found');
  }

  await prisma.sellerBuyerProfile.delete({
    where: { id: profileId },
  });

  return { success: true };
}

// =============================================================================
// Margin Calculation
// =============================================================================

/**
 * Calculate margin for an item based on costs
 */
export async function calculateItemMargin(sellerId: string, itemId: string) {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: sellerId },
  });

  if (!item) {
    throw new Error('Item not found');
  }

  const costSummary = await getCostSummary(sellerId, itemId);
  const totalCost = costSummary.total;

  // Get total quantity sold
  const salesData = await prisma.marketplaceOrder.aggregate({
    where: {
      sellerId,
      itemId,
      status: 'delivered',
    },
    _sum: { quantity: true, totalPrice: true },
  });

  const totalSold = salesData._sum.quantity || 0;
  const totalRevenue = salesData._sum.totalPrice || 0;

  const avgCostPerUnit = totalSold > 0 ? totalCost / totalSold : totalCost;
  const avgRevenuePerUnit = totalSold > 0 ? totalRevenue / totalSold : item.price;
  const marginPerUnit = avgRevenuePerUnit - avgCostPerUnit;
  const marginPercent = avgRevenuePerUnit > 0 ? (marginPerUnit / avgRevenuePerUnit) * 100 : 0;

  return {
    itemId,
    itemName: item.name,
    listPrice: item.price,
    totalCost,
    totalRevenue,
    totalSold,
    avgCostPerUnit: Math.round(avgCostPerUnit * 100) / 100,
    avgRevenuePerUnit: Math.round(avgRevenuePerUnit * 100) / 100,
    marginPerUnit: Math.round(marginPerUnit * 100) / 100,
    marginPercent: Math.round(marginPercent * 100) / 100,
    costBreakdown: costSummary.byType,
  };
}

export default {
  // Invoices
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  // Stock
  adjustStock,
  getStockAdjustments,
  getInventoryWithStatus,
  // Costs
  addCostTag,
  getCostTags,
  getCostSummary,
  deleteCostTag,
  // Buyers
  upsertBuyerProfile,
  getBuyerProfiles,
  getBuyerProfile,
  updateBuyerProfileStats,
  deleteBuyerProfile,
  // Margin
  calculateItemMargin,
};
