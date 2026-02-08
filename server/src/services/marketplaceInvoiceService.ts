// =============================================================================
// Marketplace Invoice Service (Stage 6)
// =============================================================================
// Invoice is an immutable legal document generated from delivered orders.
// Lifecycle: DRAFT -> ISSUED -> PAID | OVERDUE | CANCELLED
// Once ISSUED, content is frozen; only status can change.
// =============================================================================

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
export type PaymentTerms = 'NET_0' | 'NET_7' | 'NET_14' | 'NET_30';

export interface InvoiceLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  overdueOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  issued: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  currency: string;
}

export interface CreateInvoiceInput {
  orderId: string;
  paymentTerms?: PaymentTerms;
  notes?: string;
  termsAndConditions?: string;
}

export interface IssueInvoiceInput {
  invoiceId: string;
  sellerId: string;
}

export interface CancelInvoiceInput {
  invoiceId: string;
  sellerId: string;
  reason: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate sequential invoice number for a seller
 * Format: INV-YYYY-0001
 */
async function generateInvoiceNumber(sellerId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Find the last invoice for this seller in this year
  const lastInvoice = await prisma.marketplaceInvoice.findFirst({
    where: {
      sellerId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Calculate due date based on payment terms
 */
function calculateDueDate(paymentTerms: PaymentTerms): Date {
  const dueDate = new Date();
  switch (paymentTerms) {
    case 'NET_0':
      // Due immediately
      break;
    case 'NET_7':
      dueDate.setDate(dueDate.getDate() + 7);
      break;
    case 'NET_14':
      dueDate.setDate(dueDate.getDate() + 14);
      break;
    case 'NET_30':
    default:
      dueDate.setDate(dueDate.getDate() + 30);
      break;
  }
  return dueDate;
}

/**
 * Log invoice event
 */
async function logInvoiceEvent(
  invoiceId: string,
  actorId: string | null,
  actorType: 'buyer' | 'seller' | 'system',
  eventType: string,
  fromStatus?: string | null,
  toStatus?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.marketplaceInvoiceEvent.create({
    data: {
      invoiceId,
      actorId,
      actorType,
      eventType,
      fromStatus,
      toStatus,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// =============================================================================
// Invoice Service
// =============================================================================

export const marketplaceInvoiceService = {
  /**
   * Create invoice from a delivered order
   * Called automatically when order status changes to 'delivered'
   */
  async createFromDeliveredOrder(orderId: string): Promise<{
    success: boolean;
    invoice?: { id: string; invoiceNumber: string };
    error?: string;
  }> {
    try {
      // 1. Verify order exists and is in 'delivered' status
      const order = await prisma.marketplaceOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'delivered') {
        return { success: false, error: 'Order must be in delivered status' };
      }

      // 2. Check if invoice already exists for this order
      const existingInvoice = await prisma.marketplaceInvoice.findUnique({
        where: { orderId },
      });

      if (existingInvoice) {
        return { success: false, error: 'Invoice already exists for this order' };
      }

      // 3. Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(order.sellerId);

      // 4. Calculate amounts
      const subtotal = order.totalPrice;
      const vatRate = 15; // Saudi Arabia standard
      const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
      const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

      // Platform fee (configurable, default 0 for now)
      const platformFeeRate = 0;
      const platformFeeAmount = Math.round(totalAmount * (platformFeeRate / 100) * 100) / 100;
      const netToSeller = Math.round((totalAmount - platformFeeAmount) * 100) / 100;

      // 5. Build line items from order
      const lineItems: InvoiceLineItem[] = [
        {
          sku: order.itemSku,
          name: order.itemName,
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          total: order.totalPrice,
        },
      ];

      // 6. Default payment terms
      const paymentTerms: PaymentTerms = 'NET_30';
      const dueDate = calculateDueDate(paymentTerms);

      // 7. Create invoice in DRAFT status
      const invoice = await prisma.marketplaceInvoice.create({
        data: {
          invoiceNumber,
          orderId,
          orderNumber: order.orderNumber,
          sellerId: order.sellerId,
          buyerId: order.buyerId,
          // Seller snapshot
          sellerName: 'Seller', // Will be enhanced with seller profile
          sellerCompany: null,
          sellerVatNumber: null,
          sellerAddress: null,
          // Buyer snapshot
          buyerName: order.buyerName || 'Buyer',
          buyerCompany: order.buyerCompany,
          buyerAddress: order.shippingAddress,
          // Line items
          lineItems: JSON.stringify(lineItems),
          // Amounts
          subtotal,
          vatRate,
          vatAmount,
          totalAmount,
          currency: order.currency,
          // Platform fee
          platformFeeRate,
          platformFeeAmount,
          netToSeller,
          // Payment terms
          paymentTerms,
          dueDate,
          // Status
          status: 'draft',
        },
      });

      // 8. Log event
      await logInvoiceEvent(
        invoice.id,
        null,
        'system',
        'INVOICE_CREATED',
        null,
        'draft',
        {
          orderId,
          orderNumber: order.orderNumber,
          totalAmount,
        }
      );

      return {
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      };
    } catch (error) {
      apiLogger.error('Error creating invoice from order:', error);
      return { success: false, error: 'Failed to create invoice' };
    }
  },

  /**
   * Get seller invoices with filters
   */
  async getSellerInvoices(
    sellerId: string,
    filters: InvoiceFilters = {}
  ): Promise<{ invoices: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { sellerId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.overdueOnly) {
      where.status = 'overdue';
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { buyerName: { contains: filters.search, mode: 'insensitive' } },
        { buyerCompany: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.marketplaceInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          payments: {
            where: { status: 'confirmed' },
            select: { amount: true },
          },
        },
      }),
      prisma.marketplaceInvoice.count({ where }),
    ]);

    // Parse line items and calculate paid amount
    const parsedInvoices = invoices.map((inv) => ({
      ...inv,
      lineItems: JSON.parse(inv.lineItems as string),
      paidAmount: inv.payments.reduce((sum, p) => sum + p.amount, 0),
    }));

    return {
      invoices: parsedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get buyer invoices with filters
   */
  async getBuyerInvoices(
    buyerId: string,
    filters: InvoiceFilters = {}
  ): Promise<{ invoices: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { buyerId };

    // Buyers can only see issued invoices or later
    if (filters.status) {
      where.status = filters.status;
    } else {
      where.status = { not: 'draft' };
    }

    if (filters.overdueOnly) {
      where.status = 'overdue';
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { sellerName: { contains: filters.search, mode: 'insensitive' } },
        { sellerCompany: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.marketplaceInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          payments: {
            where: { status: 'confirmed' },
            select: { amount: true },
          },
        },
      }),
      prisma.marketplaceInvoice.count({ where }),
    ]);

    // Parse line items and calculate paid amount
    const parsedInvoices = invoices.map((inv) => ({
      ...inv,
      lineItems: JSON.parse(inv.lineItems as string),
      paidAmount: inv.payments.reduce((sum, p) => sum + p.amount, 0),
    }));

    return {
      invoices: parsedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get single invoice
   */
  async getInvoice(invoiceId: string, userId: string): Promise<unknown | null> {
    const invoice = await prisma.marketplaceInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    // Check authorization
    if (invoice.sellerId !== userId && invoice.buyerId !== userId) {
      return null;
    }

    // Buyers can only see issued invoices or later
    if (invoice.buyerId === userId && invoice.status === 'draft') {
      return null;
    }

    return {
      ...invoice,
      lineItems: JSON.parse(invoice.lineItems as string),
      paidAmount: invoice.payments
        .filter((p) => p.status === 'confirmed')
        .reduce((sum, p) => sum + p.amount, 0),
    };
  },

  /**
   * Get invoice by order ID
   */
  async getInvoiceByOrder(orderId: string, userId: string): Promise<unknown | null> {
    const invoice = await prisma.marketplaceInvoice.findUnique({
      where: { orderId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    // Check authorization
    if (invoice.sellerId !== userId && invoice.buyerId !== userId) {
      return null;
    }

    // Buyers can only see issued invoices or later
    if (invoice.buyerId === userId && invoice.status === 'draft') {
      return null;
    }

    return {
      ...invoice,
      lineItems: JSON.parse(invoice.lineItems as string),
      paidAmount: invoice.payments
        .filter((p) => p.status === 'confirmed')
        .reduce((sum, p) => sum + p.amount, 0),
    };
  },

  /**
   * Issue invoice (freeze content, start payment terms)
   * Only seller can issue
   */
  async issueInvoice(input: IssueInvoiceInput): Promise<{
    success: boolean;
    invoice?: unknown;
    error?: string;
  }> {
    try {
      const invoice = await prisma.marketplaceInvoice.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.sellerId !== input.sellerId) {
        return { success: false, error: 'Not authorized to issue this invoice' };
      }

      if (invoice.status !== 'draft') {
        return { success: false, error: 'Can only issue draft invoices' };
      }

      const now = new Date();
      const dueDate = calculateDueDate(invoice.paymentTerms as PaymentTerms || 'NET_30');

      const updatedInvoice = await prisma.marketplaceInvoice.update({
        where: { id: input.invoiceId },
        data: {
          status: 'issued',
          issuedAt: now,
          issuedBy: input.sellerId,
          dueDate,
        },
      });

      await logInvoiceEvent(
        invoice.id,
        input.sellerId,
        'seller',
        'INVOICE_ISSUED',
        'draft',
        'issued',
        {
          dueDate: dueDate.toISOString(),
        }
      );

      return {
        success: true,
        invoice: {
          ...updatedInvoice,
          lineItems: JSON.parse(updatedInvoice.lineItems as string),
        },
      };
    } catch (error) {
      apiLogger.error('Error issuing invoice:', error);
      return { success: false, error: 'Failed to issue invoice' };
    }
  },

  /**
   * Cancel invoice (only draft invoices)
   */
  async cancelInvoice(input: CancelInvoiceInput): Promise<{
    success: boolean;
    invoice?: unknown;
    error?: string;
  }> {
    try {
      const invoice = await prisma.marketplaceInvoice.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.sellerId !== input.sellerId) {
        return { success: false, error: 'Not authorized to cancel this invoice' };
      }

      if (invoice.status !== 'draft') {
        return { success: false, error: 'Can only cancel draft invoices. Issued invoices cannot be cancelled.' };
      }

      const updatedInvoice = await prisma.marketplaceInvoice.update({
        where: { id: input.invoiceId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: input.reason,
        },
      });

      await logInvoiceEvent(
        invoice.id,
        input.sellerId,
        'seller',
        'INVOICE_CANCELLED',
        'draft',
        'cancelled',
        {
          reason: input.reason,
        }
      );

      return {
        success: true,
        invoice: {
          ...updatedInvoice,
          lineItems: JSON.parse(updatedInvoice.lineItems as string),
        },
      };
    } catch (error) {
      apiLogger.error('Error cancelling invoice:', error);
      return { success: false, error: 'Failed to cancel invoice' };
    }
  },

  /**
   * Mark invoice as paid (called when payments cover full amount)
   */
  async markPaid(invoiceId: string, actorId: string | null = null): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const invoice = await prisma.marketplaceInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: {
            where: { status: 'confirmed' },
          },
        },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        return { success: false, error: 'Invoice is already paid or cancelled' };
      }

      // Calculate total paid
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid < invoice.totalAmount) {
        return { success: false, error: 'Payments do not cover full invoice amount' };
      }

      await prisma.marketplaceInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      await logInvoiceEvent(
        invoiceId,
        actorId,
        actorId ? 'seller' : 'system',
        'INVOICE_PAID',
        invoice.status,
        'paid',
        {
          totalPaid,
          totalAmount: invoice.totalAmount,
        }
      );

      return { success: true };
    } catch (error) {
      apiLogger.error('Error marking invoice as paid:', error);
      return { success: false, error: 'Failed to mark invoice as paid' };
    }
  },

  /**
   * Mark invoice as overdue (called by system job)
   */
  async markOverdue(invoiceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const invoice = await prisma.marketplaceInvoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status !== 'issued') {
        return { success: false, error: 'Can only mark issued invoices as overdue' };
      }

      await prisma.marketplaceInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'overdue',
          overdueAt: new Date(),
        },
      });

      await logInvoiceEvent(
        invoiceId,
        null,
        'system',
        'INVOICE_OVERDUE',
        'issued',
        'overdue',
        {
          dueDate: invoice.dueDate?.toISOString(),
        }
      );

      return { success: true };
    } catch (error) {
      apiLogger.error('Error marking invoice as overdue:', error);
      return { success: false, error: 'Failed to mark invoice as overdue' };
    }
  },

  /**
   * Get seller invoice statistics
   */
  async getSellerInvoiceStats(sellerId: string): Promise<InvoiceStats> {
    const [counts, amounts] = await Promise.all([
      prisma.marketplaceInvoice.groupBy({
        by: ['status'],
        where: { sellerId },
        _count: { status: true },
      }),
      prisma.marketplaceInvoice.aggregate({
        where: { sellerId, status: { not: 'cancelled' } },
        _sum: { totalAmount: true },
      }),
    ]);

    // Get total paid
    const paidInvoices = await prisma.marketplaceInvoice.findMany({
      where: { sellerId, status: 'paid' },
      select: { totalAmount: true },
    });
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Get outstanding (issued + overdue)
    const outstandingInvoices = await prisma.marketplaceInvoice.findMany({
      where: { sellerId, status: { in: ['issued', 'overdue'] } },
      select: { totalAmount: true },
    });
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const countMap: Record<string, number> = {};
    counts.forEach((c) => {
      countMap[c.status] = c._count.status;
    });

    return {
      total: Object.values(countMap).reduce((sum, v) => sum + v, 0),
      draft: countMap['draft'] || 0,
      issued: countMap['issued'] || 0,
      paid: countMap['paid'] || 0,
      overdue: countMap['overdue'] || 0,
      cancelled: countMap['cancelled'] || 0,
      totalAmount: amounts._sum.totalAmount || 0,
      totalPaid,
      totalOutstanding,
      currency: 'SAR',
    };
  },

  /**
   * Get buyer invoice statistics
   */
  async getBuyerInvoiceStats(buyerId: string): Promise<InvoiceStats> {
    const [counts, amounts] = await Promise.all([
      prisma.marketplaceInvoice.groupBy({
        by: ['status'],
        where: { buyerId, status: { not: 'draft' } },
        _count: { status: true },
      }),
      prisma.marketplaceInvoice.aggregate({
        where: { buyerId, status: { notIn: ['draft', 'cancelled'] } },
        _sum: { totalAmount: true },
      }),
    ]);

    // Get total paid
    const paidInvoices = await prisma.marketplaceInvoice.findMany({
      where: { buyerId, status: 'paid' },
      select: { totalAmount: true },
    });
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Get outstanding (issued + overdue)
    const outstandingInvoices = await prisma.marketplaceInvoice.findMany({
      where: { buyerId, status: { in: ['issued', 'overdue'] } },
      select: { totalAmount: true },
    });
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const countMap: Record<string, number> = {};
    counts.forEach((c) => {
      countMap[c.status] = c._count.status;
    });

    return {
      total: Object.values(countMap).reduce((sum, v) => sum + v, 0),
      draft: 0, // Buyers don't see draft
      issued: countMap['issued'] || 0,
      paid: countMap['paid'] || 0,
      overdue: countMap['overdue'] || 0,
      cancelled: countMap['cancelled'] || 0,
      totalAmount: amounts._sum.totalAmount || 0,
      totalPaid,
      totalOutstanding,
      currency: 'SAR',
    };
  },

  /**
   * Process overdue invoices (system job)
   * Call this periodically to mark issued invoices as overdue
   */
  async processOverdueInvoices(): Promise<{ processed: number; marked: number }> {
    const now = new Date();

    // Find all issued invoices past due date
    const overdueInvoices = await prisma.marketplaceInvoice.findMany({
      where: {
        status: 'issued',
        dueDate: { lt: now },
      },
      select: { id: true },
    });

    let marked = 0;
    for (const inv of overdueInvoices) {
      const result = await this.markOverdue(inv.id);
      if (result.success) {
        marked++;
      }
    }

    return {
      processed: overdueInvoices.length,
      marked,
    };
  },

  /**
   * Get invoice history/events
   */
  async getInvoiceHistory(invoiceId: string, userId: string): Promise<unknown[]> {
    const invoice = await prisma.marketplaceInvoice.findUnique({
      where: { id: invoiceId },
      select: { sellerId: true, buyerId: true },
    });

    if (!invoice) {
      return [];
    }

    // Check authorization
    if (invoice.sellerId !== userId && invoice.buyerId !== userId) {
      return [];
    }

    const events = await prisma.marketplaceInvoiceEvent.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });

    return events.map((e) => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    }));
  },
};

export default marketplaceInvoiceService;
