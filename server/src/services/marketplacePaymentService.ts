// =============================================================================
// Marketplace Payment Service (Stage 6)
// =============================================================================
// Payment is separate from Invoice to support partial payments and tracking.
// Lifecycle: PENDING -> CONFIRMED | FAILED
// =============================================================================

import { prisma } from '../lib/prisma';
import { marketplaceInvoiceService } from './marketplaceInvoiceService';
import { portalNotificationService } from './portalNotificationService';
import { apiLogger } from '../utils/logger';

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

export interface RecordOrderPaymentInput {
  orderId: string;
  buyerId: string;
  amount?: number;
  paymentMethod: PaymentMethod;
  bankReference: string;
  bankName?: string;
  notes?: string;
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

export interface OrderPaymentSummary {
  paidAmount: number;
  pendingAmount: number;
  remainingAmount: number;
  totalPrice: number;
  paymentCount: number;
  latestPaymentStatus: string;
  lastPaymentAt: string | null;
  lastPaymentReference: string | null;
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
      apiLogger.error('Error recording payment:', error);

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

        // Check if invoice is fully paid (only if invoice exists)
        let isFullyPaid = false;
        if (payment.invoiceId && payment.invoice) {
          const allPayments = await tx.marketplacePayment.findMany({
            where: {
              invoiceId: payment.invoiceId,
              status: 'confirmed',
            },
          });

          const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
          isFullyPaid = totalPaid >= payment.invoice.totalAmount;

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
        }

        // Update order paymentStatus based on confirmed + pending payments
        const orderPayments = await tx.marketplacePayment.findMany({
          where: { orderId: payment.orderId, status: { in: ['confirmed', 'pending'] } },
        });
        const orderConfirmedTotal = orderPayments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
        const orderPendingTotal = orderPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
        const orderAllTotal = orderConfirmedTotal + orderPendingTotal;
        const order = await tx.marketplaceOrder.findUnique({
          where: { id: payment.orderId },
          select: { totalPrice: true, paymentStatus: true, buyerId: true },
        });

        if (order) {
          let newStatus: string;
          if (orderConfirmedTotal >= order.totalPrice) {
            newStatus = 'paid';
          } else if (orderAllTotal >= order.totalPrice) {
            newStatus = 'authorized';
          } else if (orderConfirmedTotal > 0) {
            newStatus = 'partial';
          } else if (orderPendingTotal > 0) {
            newStatus = 'pending_conf';
          } else {
            newStatus = 'unpaid';
          }

          if (newStatus !== order.paymentStatus) {
            await tx.marketplaceOrder.update({
              where: { id: payment.orderId },
              data: { paymentStatus: newStatus },
            });
          }
        }

        return { updatedPayment, isFullyPaid, order };
      });

      // Log events outside transaction (non-critical)
      if (payment.invoiceId) {
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

        if (result.isFullyPaid && payment.invoice) {
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
      }

      // Notify seller: payment confirmed (invoice_paid)
      portalNotificationService.create({
        userId: payment.sellerId,
        portalType: 'seller',
        type: 'invoice_paid',
        entityType: 'invoice',
        entityId: payment.invoiceId || payment.orderId,
        entityName: `Payment ${payment.paymentNumber} confirmed`,
        actorId: payment.buyerId,
        metadata: { paymentNumber: payment.paymentNumber, amount: payment.amount, isFullyPaid: result.isFullyPaid },
      }).catch(() => {});

      // Create buyer expense when fully paid
      if (result.isFullyPaid && result.order) {
        prisma.buyerExpense.create({
          data: {
            buyerId: result.order.buyerId,
            category: 'purchase',
            amount: result.order.totalPrice,
            currency: 'SAR',
            date: new Date(),
            notes: `Auto-created from payment confirmation (${payment.paymentNumber})`,
            purchaseOrderId: payment.orderId,
          },
        }).catch((err) => {
          apiLogger.error('Failed to create buyer expense on payment confirmation:', err);
        });
      }

      return { success: true, payment: result.updatedPayment };
    } catch (error) {
      apiLogger.error('Error confirming payment:', error);

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

      // Log event (only if invoice exists)
      if (payment.invoiceId) {
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
      }

      return { success: true, payment: updatedPayment };
    } catch (error) {
      apiLogger.error('Error failing payment:', error);
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

  /**
   * Record a payment directly against an order (before invoice exists)
   * Buyer records bank transfer reference; when invoice is generated, it auto-links.
   */
  async recordOrderPayment(input: RecordOrderPaymentInput): Promise<{
    success: boolean;
    payment?: unknown;
    error?: string;
    code?: string;
  }> {
    try {
      // 1. Verify order exists and belongs to buyer
      const order = await prisma.marketplaceOrder.findUnique({
        where: { id: input.orderId },
      });

      if (!order) {
        return { success: false, error: 'Order not found', code: 'ORDER_NOT_FOUND' };
      }

      if (order.buyerId !== input.buyerId) {
        return { success: false, error: 'Not authorized to pay this order', code: 'UNAUTHORIZED' };
      }

      // Guardrail: COD orders cannot have bank transfer payments recorded
      if ((order.paymentMethod || 'bank_transfer') === 'cod') {
        return { success: false, error: 'COD orders use the cash confirmation flow, not bank transfer payments', code: 'INVALID_PAYMENT_METHOD' };
      }

      if (order.status === 'cancelled' || order.status === 'refunded') {
        return { success: false, error: 'Cannot pay a cancelled or refunded order', code: 'ORDER_NOT_PAYABLE' };
      }

      if (order.paymentStatus === 'paid' || order.paymentStatus === 'paid_cash') {
        return { success: false, error: 'Order is already fully paid', code: 'ALREADY_PAID' };
      }

      // 2. Check for duplicate bank reference on same order
      if (input.bankReference) {
        const existingPayment = await prisma.marketplacePayment.findFirst({
          where: {
            orderId: input.orderId,
            bankReference: input.bankReference,
          },
        });

        if (existingPayment) {
          return {
            success: false,
            error: 'A payment with this bank reference already exists for this order',
            code: 'DUPLICATE_BANK_REFERENCE',
          };
        }
      }

      // 3. Determine amount (default to order total)
      const amount = input.amount ?? order.totalPrice;
      if (amount <= 0) {
        return { success: false, error: 'Payment amount must be positive', code: 'INVALID_AMOUNT' };
      }

      // Check existing confirmed payments
      const confirmedPayments = await prisma.marketplacePayment.findMany({
        where: { orderId: input.orderId, status: 'confirmed' },
      });
      const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = order.totalPrice - totalPaid;

      if (amount > remaining * 1.001) { // small tolerance for floating point
        return {
          success: false,
          error: `Payment amount exceeds remaining balance of ${remaining.toFixed(2)}`,
          code: 'AMOUNT_EXCEEDS_BALANCE',
        };
      }

      // 4. Check if an invoice already exists for this order
      const invoice = await prisma.marketplaceInvoice.findUnique({
        where: { orderId: input.orderId },
      });

      // 5. Generate payment number
      const paymentNumber = await generatePaymentNumber();

      // 6. Create payment — auto-confirmed (no seller verification step needed)
      const now = new Date();
      const payment = await prisma.marketplacePayment.create({
        data: {
          paymentNumber,
          invoiceId: invoice?.id || null,
          orderId: input.orderId,
          buyerId: input.buyerId,
          sellerId: order.sellerId,
          amount,
          currency: order.currency,
          paymentMethod: input.paymentMethod,
          bankReference: input.bankReference,
          bankName: input.bankName || null,
          notes: input.notes || null,
          status: 'confirmed',
          confirmedAt: now,
          confirmedBy: 'auto',
        },
      });

      // 7. Update order paymentStatus deterministically
      const allPayments = await prisma.marketplacePayment.findMany({
        where: { orderId: input.orderId, status: 'confirmed' },
      });
      const confirmedTotal = allPayments.reduce((sum, p) => sum + p.amount, 0);

      let newPaymentStatus: string;
      if (confirmedTotal >= order.totalPrice) {
        newPaymentStatus = 'paid';
      } else if (confirmedTotal > 0) {
        newPaymentStatus = 'partial';
      } else {
        newPaymentStatus = 'unpaid';
      }

      if (newPaymentStatus !== order.paymentStatus) {
        await prisma.marketplaceOrder.update({
          where: { id: input.orderId },
          data: { paymentStatus: newPaymentStatus },
        });
      }

      // 7b. If invoice exists and fully paid, mark invoice as paid too
      if (invoice && confirmedTotal >= order.totalPrice && invoice.status !== 'paid') {
        await prisma.marketplaceInvoice.update({
          where: { id: invoice.id },
          data: { status: 'paid', paidAt: now },
        });
      }

      // 8. Log audit trail
      await prisma.marketplaceOrderAudit.create({
        data: {
          orderId: input.orderId,
          action: 'payment_updated',
          actor: 'buyer',
          actorId: input.buyerId,
          metadata: JSON.stringify({
            paymentId: payment.id,
            paymentNumber,
            amount,
            paymentMethod: input.paymentMethod,
            bankReference: input.bankReference,
            hasInvoice: !!invoice,
          }),
        },
      });

      // 9. If invoice exists, log invoice event too
      if (invoice) {
        await logInvoiceEvent(
          invoice.id,
          input.buyerId,
          'buyer',
          'PAYMENT_CONFIRMED',
          null,
          null,
          {
            paymentId: payment.id,
            paymentNumber,
            amount,
            paymentMethod: input.paymentMethod,
            bankReference: input.bankReference,
            autoConfirmed: true,
          }
        );

        // If invoice is now fully paid, log that too
        if (confirmedTotal >= order.totalPrice && invoice.status !== 'paid') {
          await logInvoiceEvent(
            invoice.id,
            input.buyerId,
            'system',
            'INVOICE_PAID',
            invoice.status,
            'paid',
            { triggeredBy: 'auto_confirmed_payment', paymentId: payment.id }
          );
        }
      }

      // 10. Create buyer expense when fully paid
      if (newPaymentStatus === 'paid') {
        prisma.buyerExpense.create({
          data: {
            buyerId: input.buyerId,
            category: 'purchase',
            amount: order.totalPrice,
            currency: order.currency,
            date: now,
            notes: `Auto-created from payment (${paymentNumber})`,
            purchaseOrderId: input.orderId,
          },
        }).catch((err) => {
          apiLogger.error('Failed to create buyer expense on order payment:', err);
        });
      }

      return { success: true, payment };
    } catch (error) {
      apiLogger.error('Error recording order payment:', error);

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
   * Associate orphan payments (no invoiceId) with a newly created invoice.
   * Called when an invoice is generated for an order.
   */
  async associatePaymentsWithInvoice(orderId: string, invoiceId: string): Promise<number> {
    const result = await prisma.marketplacePayment.updateMany({
      where: {
        orderId,
        invoiceId: null,
      },
      data: {
        invoiceId,
      },
    });
    if (result.count > 0) {
      apiLogger.info(`Associated ${result.count} orphan payment(s) with invoice ${invoiceId} for order ${orderId}`);
    }
    return result.count;
  },

  /**
   * Confirm COD payment — called after delivery when cash is received
   */
  async confirmCODPayment(input: {
    orderId: string;
    actorId: string;
    actorRole: 'buyer' | 'seller';
    notes?: string;
  }): Promise<{ success: boolean; error?: string; code?: string }> {
    try {
      const order = await prisma.marketplaceOrder.findUnique({
        where: { id: input.orderId },
      });

      if (!order) {
        return { success: false, error: 'Order not found', code: 'ORDER_NOT_FOUND' };
      }

      if ((order.paymentMethod || 'bank_transfer') !== 'cod') {
        return { success: false, error: 'This order is not a COD order', code: 'NOT_COD' };
      }

      if (order.status !== 'delivered') {
        return { success: false, error: 'COD can only be confirmed after delivery', code: 'NOT_DELIVERED' };
      }

      if (order.paymentStatus === 'paid_cash' || order.paymentStatus === 'paid') {
        return { success: false, error: 'COD payment already confirmed', code: 'ALREADY_PAID' };
      }

      // Verify actor is buyer or seller of this order
      if (input.actorRole === 'buyer' && order.buyerId !== input.actorId) {
        return { success: false, error: 'Not authorized', code: 'UNAUTHORIZED' };
      }
      if (input.actorRole === 'seller' && order.sellerId !== input.actorId) {
        return { success: false, error: 'Not authorized', code: 'UNAUTHORIZED' };
      }

      // Generate payment number
      const lastPayment = await prisma.marketplacePayment.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { paymentNumber: true },
      });
      let nextNum = 1;
      if (lastPayment?.paymentNumber) {
        const match = lastPayment.paymentNumber.match(/PAY-\d{4}-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(nextNum).padStart(5, '0')}`;

      // Create confirmed payment record
      await prisma.marketplacePayment.create({
        data: {
          paymentNumber,
          orderId: input.orderId,
          invoiceId: null,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          amount: order.totalPrice,
          currency: order.currency,
          paymentMethod: 'cod',
          bankReference: `COD-${input.orderId.slice(0, 8).toUpperCase()}`,
          status: 'confirmed',
          confirmedAt: new Date(),
          confirmedBy: input.actorId,
          confirmationNote: input.notes || `Cash confirmed by ${input.actorRole}`,
        },
      });

      // Update order paymentStatus
      await prisma.marketplaceOrder.update({
        where: { id: input.orderId },
        data: { paymentStatus: 'paid_cash' },
      });

      // If invoice exists, mark it paid too
      const invoice = await prisma.marketplaceInvoice.findUnique({
        where: { orderId: input.orderId },
      });
      if (invoice && invoice.status !== 'paid') {
        await prisma.marketplaceInvoice.update({
          where: { id: invoice.id },
          data: { status: 'paid', paidAt: new Date() },
        });
      }

      apiLogger.info(`COD payment confirmed for order ${order.orderNumber} by ${input.actorRole} ${input.actorId}`);

      // Create buyer expense for COD
      prisma.buyerExpense.create({
        data: {
          buyerId: order.buyerId,
          category: 'purchase',
          amount: order.totalPrice,
          currency: order.currency,
          date: new Date(),
          notes: `Auto-created from COD confirmation`,
          purchaseOrderId: order.id,
        },
      }).catch((err) => {
        apiLogger.error('Failed to create buyer expense from COD:', err);
      });

      return { success: true };
    } catch (error) {
      apiLogger.error('Error confirming COD payment:', error);
      return { success: false, error: 'Failed to confirm COD payment' };
    }
  },

  /**
   * Get payment summary for an order (aggregated data)
   */
  async getOrderPaymentSummary(orderId: string): Promise<OrderPaymentSummary | null> {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      select: { totalPrice: true, paymentStatus: true },
    });
    if (!order) return null;

    const payments = await prisma.marketplacePayment.findMany({
      where: { orderId, status: { in: ['pending', 'confirmed'] } },
      orderBy: { createdAt: 'desc' },
    });

    const confirmedTotal = payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
    const pendingTotal = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const lastPayment = payments[0] || null;

    return {
      paidAmount: confirmedTotal,
      pendingAmount: pendingTotal,
      remainingAmount: Math.max(0, order.totalPrice - confirmedTotal),
      totalPrice: order.totalPrice,
      paymentCount: payments.length,
      latestPaymentStatus: order.paymentStatus,
      lastPaymentAt: lastPayment?.createdAt?.toISOString() || null,
      lastPaymentReference: lastPayment?.bankReference || null,
    };
  },
};

export default marketplacePaymentService;
