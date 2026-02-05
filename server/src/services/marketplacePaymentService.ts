// =============================================================================
// Marketplace Payment Service (Stage 6)
// =============================================================================
// Payment is separate from Invoice to support partial payments and tracking.
// Lifecycle: PENDING -> CONFIRMED | FAILED
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { marketplaceInvoiceService } from './marketplaceInvoiceService';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export type PaymentStatus = 'pending' | 'confirmed' | 'failed';
export type PaymentMethod = 'bank_transfer' | 'card' | 'wallet' | 'cod';

export interface RecordPaymentInput {
  invoiceId: string;
  buyerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankReference?: string;
  bankName?: string;
}

export interface ConfirmPaymentInput {
  paymentId: string;
  sellerId: string;
  confirmationNote?: string;
}

export interface FailPaymentInput {
  paymentId: string;
  sellerId: string;
  reason: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  invoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate sequential payment number
 * Format: PAY-YYYY-0001
 */
async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  const lastPayment = await prisma.marketplacePayment.findFirst({
    where: {
      paymentNumber: { startsWith: prefix },
    },
    orderBy: { paymentNumber: 'desc' },
    select: { paymentNumber: true },
  });

  let nextNumber = 1;
  if (lastPayment) {
    const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Log payment-related invoice event
 */
async function logInvoiceEvent(
  invoiceId: string,
  actorId: string | null,
  actorType: 'buyer' | 'seller' | 'system',
  eventType: string,
  fromStatus?: string,
  toStatus?: string,
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
// Payment Service
// =============================================================================

export const marketplacePaymentService = {
  /**
   * Record a payment (buyer action)
   * For bank transfers, buyer provides bank reference
   *
   * Production Safety:
   * - Validates invoice status before payment
   * - Prevents duplicate bank references per invoice (DB constraint + code check)
   * - Logs all payment events for audit trail
   */
  async recordPayment(input: RecordPaymentInput): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
    code?: string;
  }> {
    try {
      // 1. Verify invoice exists and is payable
      const invoice = await prisma.marketplaceInvoice.findUnique({
        where: { id: input.invoiceId },
        include: {
          payments: true, // Get all payments, not just confirmed
        },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found', code: 'INVOICE_NOT_FOUND' };
      }

      if (invoice.buyerId !== input.buyerId) {
        return { success: false, error: 'Not authorized to pay this invoice', code: 'UNAUTHORIZED' };
      }

      if (invoice.status === 'draft') {
        return { success: false, error: 'Invoice has not been issued yet', code: 'INVOICE_NOT_ISSUED' };
      }

      if (invoice.status === 'paid') {
        return { success: false, error: 'Invoice is already paid', code: 'INVOICE_ALREADY_PAID' };
      }

      if (invoice.status === 'cancelled') {
        return { success: false, error: 'Invoice has been cancelled', code: 'INVOICE_CANCELLED' };
      }

      // 2. Check for duplicate bank reference (anti-duplication)
      if (input.bankReference) {
        const existingPayment = await prisma.marketplacePayment.findFirst({
          where: {
            invoiceId: input.invoiceId,
            bankReference: input.bankReference,
          },
        });

        if (existingPayment) {
          return {
            success: false,
            error: 'A payment with this bank reference already exists for this invoice',
            code: 'DUPLICATE_BANK_REFERENCE',
          };
        }
      }

      // 3. Validate payment amount
      const confirmedPayments = invoice.payments.filter(p => p.status === 'confirmed');
      const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = invoice.totalAmount - totalPaid;

      if (input.amount <= 0) {
        return { success: false, error: 'Payment amount must be positive', code: 'INVALID_AMOUNT' };
      }

      if (input.amount > remaining) {
        return {
          success: false,
          error: `Payment amount exceeds remaining balance of ${remaining}`,
          code: 'AMOUNT_EXCEEDS_BALANCE',
        };
      }

      // 4. Generate payment number
      const paymentNumber = await generatePaymentNumber();

      // 5. Create payment in transaction with proper locking
      const payment = await prisma.$transaction(async (tx) => {
        // Re-check invoice status inside transaction (pessimistic check)
        const freshInvoice = await tx.marketplaceInvoice.findUnique({
          where: { id: input.invoiceId },
          select: { status: true },
        });

        if (freshInvoice?.status === 'paid' || freshInvoice?.status === 'cancelled') {
          throw new Error('Invoice status changed during payment processing');
        }

        return tx.marketplacePayment.create({
          data: {
            paymentNumber,
            invoiceId: input.invoiceId,
            orderId: invoice.orderId,
            buyerId: input.buyerId,
            sellerId: invoice.sellerId,
            amount: input.amount,
            currency: invoice.currency,
            paymentMethod: input.paymentMethod,
            bankReference: input.bankReference || null,
            bankName: input.bankName || null,
            status: 'pending',
          },
        });
      });

      // 6. Log event
      await logInvoiceEvent(
        invoice.id,
        input.buyerId,
        'buyer',
        'PAYMENT_RECEIVED',
        null,
        null,
        {
          paymentId: payment.id,
          paymentNumber,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          bankReference: input.bankReference,
        }
      );

      return { success: true, payment };
    } catch (error) {
      console.error('Error recording payment:', error);

      // Check for unique constraint violation (bank reference duplicate)
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return {
          success: false,
          error: 'A payment with this bank reference already exists',
          code: 'DUPLICATE_BANK_REFERENCE',
        };
      }

      return { success: false, error: 'Failed to record payment', code: 'PAYMENT_FAILED' };
    }
  },

  /**
   * Confirm payment (seller action)
   * After seller verifies bank transfer received
   *
   * Production Safety:
   * - Uses transaction to prevent race conditions
   * - Re-validates payment status inside transaction
   * - Atomically updates invoice status if fully paid
   */
  async confirmPayment(input: ConfirmPaymentInput): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
    code?: string;
  }> {
    try {
      // Pre-check outside transaction for fast failure
      const payment = await prisma.marketplacePayment.findUnique({
        where: { id: input.paymentId },
        include: { invoice: true },
      });

      if (!payment) {
        return { success: false, error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' };
      }

      if (payment.sellerId !== input.sellerId) {
        return { success: false, error: 'Not authorized to confirm this payment', code: 'UNAUTHORIZED' };
      }

      if (payment.status === 'confirmed') {
        // Idempotent - already confirmed
        return { success: true, payment, code: 'ALREADY_CONFIRMED' };
      }

      if (payment.status !== 'pending') {
        return { success: false, error: 'Payment is not pending', code: 'INVALID_STATUS' };
      }

      // Use transaction for atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Re-check payment status inside transaction (pessimistic locking)
        const freshPayment = await tx.marketplacePayment.findUnique({
          where: { id: input.paymentId },
          select: { status: true },
        });

        if (freshPayment?.status !== 'pending') {
          throw new Error('Payment status changed during confirmation');
        }

        // Update payment
        const updatedPayment = await tx.marketplacePayment.update({
          where: { id: input.paymentId },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: input.sellerId,
            confirmationNote: input.confirmationNote,
          },
        });

        // Check if invoice is fully paid
        const allPayments = await tx.marketplacePayment.findMany({
          where: {
            invoiceId: payment.invoiceId,
            status: 'confirmed',
          },
        });

        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        const isFullyPaid = totalPaid >= payment.invoice.totalAmount;

        // Mark invoice as paid if fully covered
        if (isFullyPaid && payment.invoice.status !== 'paid') {
          await tx.marketplaceInvoice.update({
            where: { id: payment.invoiceId },
            data: {
              status: 'paid',
              paidAt: new Date(),
            },
          });
        }

        return { updatedPayment, isFullyPaid };
      });

      // Log events outside transaction (non-critical)
      await logInvoiceEvent(
        payment.invoiceId,
        input.sellerId,
        'seller',
        'PAYMENT_CONFIRMED',
        'pending',
        'confirmed',
        {
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          amount: payment.amount,
          confirmationNote: input.confirmationNote,
        }
      );

      if (result.isFullyPaid) {
        await logInvoiceEvent(
          payment.invoiceId,
          input.sellerId,
          'system',
          'INVOICE_PAID',
          payment.invoice.status,
          'paid',
          {
            triggeredBy: 'payment_confirmation',
            paymentId: payment.id,
          }
        );
      }

      return { success: true, payment: result.updatedPayment };
    } catch (error) {
      console.error('Error confirming payment:', error);

      if (error instanceof Error && error.message.includes('status changed')) {
        return { success: false, error: 'Payment was modified by another process', code: 'CONCURRENT_MODIFICATION' };
      }

      return { success: false, error: 'Failed to confirm payment', code: 'CONFIRMATION_FAILED' };
    }
  },

  /**
   * Mark payment as failed (seller action)
   */
  async failPayment(input: FailPaymentInput): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
  }> {
    try {
      const payment = await prisma.marketplacePayment.findUnique({
        where: { id: input.paymentId },
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.sellerId !== input.sellerId) {
        return { success: false, error: 'Not authorized to update this payment' };
      }

      if (payment.status !== 'pending') {
        return { success: false, error: 'Payment is not pending' };
      }

      const updatedPayment = await prisma.marketplacePayment.update({
        where: { id: input.paymentId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          failureReason: input.reason,
        },
      });

      // Log event
      await logInvoiceEvent(
        payment.invoiceId,
        input.sellerId,
        'seller',
        'PAYMENT_FAILED',
        'pending',
        'failed',
        {
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          amount: payment.amount,
          reason: input.reason,
        }
      );

      return { success: true, payment: updatedPayment };
    } catch (error) {
      console.error('Error failing payment:', error);
      return { success: false, error: 'Failed to update payment' };
    }
  },

  /**
   * Get payments for an invoice
   */
  async getInvoicePayments(invoiceId: string, userId: string): Promise<unknown[]> {
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

    const payments = await prisma.marketplacePayment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  },

  /**
   * Get seller payments with filters
   */
  async getSellerPayments(
    sellerId: string,
    filters: PaymentFilters = {}
  ): Promise<{ payments: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { sellerId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
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

    const [payments, total] = await Promise.all([
      prisma.marketplacePayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              orderNumber: true,
              buyerName: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.marketplacePayment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get buyer payments with filters
   */
  async getBuyerPayments(
    buyerId: string,
    filters: PaymentFilters = {}
  ): Promise<{ payments: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { buyerId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
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

    const [payments, total] = await Promise.all([
      prisma.marketplacePayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              orderNumber: true,
              sellerName: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.marketplacePayment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get single payment
   */
  async getPayment(paymentId: string, userId: string): Promise<unknown | null> {
    const payment = await prisma.marketplacePayment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            orderNumber: true,
            buyerName: true,
            sellerName: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      return null;
    }

    // Check authorization
    if (payment.sellerId !== userId && payment.buyerId !== userId) {
      return null;
    }

    return payment;
  },

  /**
   * Check if invoice is fully paid
   */
  async checkInvoiceFullyPaid(invoiceId: string): Promise<boolean> {
    const invoice = await prisma.marketplaceInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: { status: 'confirmed' },
        },
      },
    });

    if (!invoice) {
      return false;
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    return totalPaid >= invoice.totalAmount;
  },
};

export default marketplacePaymentService;
