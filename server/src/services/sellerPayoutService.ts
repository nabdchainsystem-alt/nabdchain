// =============================================================================
// Seller Payout Service - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

type PayoutStatus = 'pending' | 'processing' | 'settled' | 'on_hold' | 'failed';

interface PayoutFilters {
  status?: PayoutStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface EligibleInvoice {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  platformFeeAmount: number;
  netToSeller: number;
  paidAt: Date;
  currency: string;
}

interface PayoutEligibility {
  eligible: boolean;
  invoices: EligibleInvoice[];
  totalGross: number;
  totalPlatformFee: number;
  totalNet: number;
  currency: string;
  reason?: string;
}

interface CreatePayoutInput {
  sellerId: string;
  periodStart: Date;
  periodEnd: Date;
}

interface UpdatePayoutSettingsInput {
  payoutFrequency?: string;
  payoutDay?: number;
  minPayoutAmount?: number;
  disputeHoldEnabled?: boolean;
  holdPeriodDays?: number;
  autoPayoutEnabled?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const VALID_PAYOUT_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  pending: ['processing', 'on_hold', 'failed'],
  processing: ['settled', 'failed', 'on_hold'],
  settled: [],
  on_hold: ['pending', 'processing', 'failed'],
  failed: ['pending'],
};

const DEFAULT_PLATFORM_FEE_RATE = 0.025; // 2.5%
const DEFAULT_HOLD_PERIOD_DAYS = 7;
const DEFAULT_MIN_PAYOUT_AMOUNT = 100;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate sequential payout number: PAY-OUT-YYYY-0001
 */
async function generatePayoutNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-OUT-${year}-`;

  const lastPayout = await prisma.sellerPayout.findFirst({
    where: { payoutNumber: { startsWith: prefix } },
    orderBy: { payoutNumber: 'desc' },
    select: { payoutNumber: true },
  });

  let nextNumber = 1;
  if (lastPayout?.payoutNumber) {
    const lastNum = parseInt(lastPayout.payoutNumber.split('-').pop() || '0', 10);
    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Log payout event for audit trail
 */
async function logPayoutEvent(
  payoutId: string,
  eventType: string,
  actorId: string | null,
  actorType: 'seller' | 'system' | 'admin',
  fromStatus?: string,
  toStatus?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.payoutEvent.create({
    data: {
      payoutId,
      eventType,
      actorId,
      actorType,
      fromStatus,
      toStatus,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Check if status transition is valid
 */
function isValidTransition(currentStatus: PayoutStatus, newStatus: PayoutStatus): boolean {
  return VALID_PAYOUT_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Mask IBAN for display (show last 4 digits)
 */
function maskIban(iban: string): string {
  if (iban.length <= 4) return iban;
  return '*'.repeat(iban.length - 4) + iban.slice(-4);
}

// =============================================================================
// Service Methods
// =============================================================================

/**
 * Calculate eligible payouts for a seller
 */
async function calculateEligiblePayouts(sellerId: string): Promise<PayoutEligibility> {
  // Get seller's payout settings
  const settings = await getPayoutSettings(sellerId);
  const holdPeriodDays = settings?.holdPeriodDays ?? DEFAULT_HOLD_PERIOD_DAYS;

  // Calculate cutoff date (orders must be closed for holdPeriodDays)
  const holdCutoff = new Date();
  holdCutoff.setDate(holdCutoff.getDate() - holdPeriodDays);

  // Find paid invoices that are eligible for payout
  // Criteria: Invoice PAID, Order CLOSED, No open disputes, Hold period elapsed
  const eligibleInvoices = await prisma.marketplaceInvoice.findMany({
    where: {
      sellerId,
      status: 'paid',
      paidAt: { not: null, lte: holdCutoff },
      // Exclude invoices already in a payout
      NOT: {
        id: {
          in: await prisma.payoutLineItem.findMany({
            select: { invoiceId: true },
          }).then(items => items.map(i => i.invoiceId)),
        },
      },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      },
    },
  });

  // Filter out invoices with open disputes
  const invoicesWithNoDisputes: EligibleInvoice[] = [];

  for (const invoice of eligibleInvoices) {
    // Check if order is closed
    if (invoice.order?.status !== 'closed') continue;

    // Check for open disputes on the order
    const openDispute = await prisma.marketplaceDispute.findFirst({
      where: {
        orderId: invoice.orderId,
        status: { notIn: ['resolved', 'closed', 'rejected'] },
      },
    });

    if (openDispute) continue;

    invoicesWithNoDisputes.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      orderNumber: invoice.order?.orderNumber || '',
      totalAmount: invoice.totalAmount,
      platformFeeAmount: invoice.platformFeeAmount || 0,
      netToSeller: invoice.netToSeller || invoice.totalAmount,
      paidAt: invoice.paidAt!,
      currency: invoice.currency,
    });
  }

  // Calculate totals
  const totalGross = invoicesWithNoDisputes.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPlatformFee = invoicesWithNoDisputes.reduce((sum, inv) => sum + inv.platformFeeAmount, 0);
  const totalNet = invoicesWithNoDisputes.reduce((sum, inv) => sum + inv.netToSeller, 0);

  // Check minimum payout amount
  const minAmount = settings?.minPayoutAmount ?? DEFAULT_MIN_PAYOUT_AMOUNT;
  if (totalNet < minAmount) {
    return {
      eligible: false,
      invoices: invoicesWithNoDisputes,
      totalGross,
      totalPlatformFee,
      totalNet,
      currency: 'SAR',
      reason: `Total amount (${totalNet.toFixed(2)} SAR) is below minimum payout threshold (${minAmount} SAR)`,
    };
  }

  return {
    eligible: invoicesWithNoDisputes.length > 0,
    invoices: invoicesWithNoDisputes,
    totalGross,
    totalPlatformFee,
    totalNet,
    currency: 'SAR',
  };
}

/**
 * Create a payout for a seller
 */
async function createPayout(
  input: CreatePayoutInput
): Promise<{ success: boolean; payout?: any; error?: string }> {
  const { sellerId, periodStart, periodEnd } = input;

  // Verify seller has verified bank account
  const sellerBank = await prisma.sellerBank.findFirst({
    where: { sellerId, verificationStatus: 'approved' },
  });

  if (!sellerBank) {
    return { success: false, error: 'Seller must have a verified bank account' };
  }

  // Calculate eligible payouts
  const eligibility = await calculateEligiblePayouts(sellerId);

  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason || 'No eligible invoices for payout' };
  }

  // Generate payout number
  const payoutNumber = await generatePayoutNumber();

  // Create payout with transaction
  const payout = await prisma.$transaction(async (tx) => {
    // Create payout record
    const newPayout = await tx.sellerPayout.create({
      data: {
        payoutNumber,
        sellerId,
        periodStart,
        periodEnd,
        grossAmount: eligibility.totalGross,
        platformFeeTotal: eligibility.totalPlatformFee,
        netAmount: eligibility.totalNet,
        currency: eligibility.currency,
        status: 'pending',
        bankName: sellerBank.bankName || '',
        accountHolder: sellerBank.accountHolderName || '',
        ibanMasked: maskIban(sellerBank.iban || ''),
      },
    });

    // Create line items
    for (const invoice of eligibility.invoices) {
      await tx.payoutLineItem.create({
        data: {
          payoutId: newPayout.id,
          invoiceId: invoice.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          orderNumber: invoice.orderNumber,
          invoiceTotal: invoice.totalAmount,
          platformFee: invoice.platformFeeAmount,
          netAmount: invoice.netToSeller,
          currency: invoice.currency,
          invoiceStatus: 'paid',
          paidAt: invoice.paidAt,
        },
      });
    }

    // Log event
    await tx.payoutEvent.create({
      data: {
        payoutId: newPayout.id,
        actorId: null,
        actorType: 'system',
        eventType: 'PAYOUT_CREATED',
        toStatus: 'pending',
        metadata: JSON.stringify({
          invoiceCount: eligibility.invoices.length,
          totalNet: eligibility.totalNet,
        }),
      },
    });

    return newPayout;
  });

  return { success: true, payout };
}

/**
 * Create batch payouts for all eligible sellers
 */
async function createBatchPayouts(
  payoutDate: Date
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const result = { created: 0, skipped: 0, errors: [] as string[] };

  // Get all sellers with verified banks and auto-payout enabled
  const sellers = await prisma.sellerPayoutSettings.findMany({
    where: { autoPayoutEnabled: true },
    select: { sellerId: true },
  });

  // Also get sellers with verified banks who haven't set up settings yet
  const sellersWithBanks = await prisma.sellerBank.findMany({
    where: { verificationStatus: 'approved' },
    select: { sellerId: true },
  });

  const allSellerIds = new Set([
    ...sellers.map(s => s.sellerId),
    ...sellersWithBanks.map(s => s.sellerId),
  ]);

  for (const sellerId of allSellerIds) {
    try {
      const eligibility = await calculateEligiblePayouts(sellerId);

      if (!eligibility.eligible) {
        result.skipped++;
        continue;
      }

      // Get seller's settings
      const settings = await getPayoutSettings(sellerId);

      // Skip if auto-payout is disabled
      if (!settings?.autoPayoutEnabled) {
        result.skipped++;
        continue;
      }

      const periodEnd = payoutDate;
      const periodStart = new Date(payoutDate);
      periodStart.setDate(periodStart.getDate() - 7); // Weekly period

      const createResult = await createPayout({
        sellerId,
        periodStart,
        periodEnd,
      });

      if (createResult.success) {
        result.created++;
      } else {
        result.errors.push(`Seller ${sellerId}: ${createResult.error}`);
      }
    } catch (error) {
      result.errors.push(`Seller ${sellerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Approve a pending payout (admin action)
 */
async function approvePayout(
  payoutId: string,
  adminId: string
): Promise<{ success: boolean; payout?: any; error?: string }> {
  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  if (payout.status !== 'pending') {
    return { success: false, error: `Cannot approve payout with status: ${payout.status}` };
  }

  const updatedPayout = await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'processing',
        initiatedAt: new Date(),
        initiatedBy: adminId,
      },
    });

    await tx.payoutEvent.create({
      data: {
        payoutId,
        actorId: adminId,
        actorType: 'admin',
        eventType: 'PAYOUT_APPROVED',
        fromStatus: 'pending',
        toStatus: 'processing',
      },
    });

    return updated;
  });

  return { success: true, payout: updatedPayout };
}

/**
 * Process a payout (start bank transfer)
 */
async function processPayout(
  payoutId: string,
  adminId: string
): Promise<{ success: boolean; payout?: any; error?: string }> {
  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  if (!isValidTransition(payout.status as PayoutStatus, 'processing')) {
    return { success: false, error: `Cannot process payout with status: ${payout.status}` };
  }

  const updatedPayout = await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'processing',
        initiatedAt: payout.initiatedAt || new Date(),
        initiatedBy: payout.initiatedBy || adminId,
      },
    });

    await tx.payoutEvent.create({
      data: {
        payoutId,
        actorId: adminId,
        actorType: 'admin',
        eventType: 'PAYOUT_PROCESSING',
        fromStatus: payout.status,
        toStatus: 'processing',
      },
    });

    return updated;
  });

  return { success: true, payout: updatedPayout };
}

/**
 * Mark payout as settled
 */
async function settlePayout(
  payoutId: string,
  bankReference: string,
  adminId?: string
): Promise<{ success: boolean; payout?: any; error?: string }> {
  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  if (payout.status !== 'processing') {
    return { success: false, error: `Cannot settle payout with status: ${payout.status}` };
  }

  const updatedPayout = await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'settled',
        settledAt: new Date(),
        bankReference,
        bankConfirmationDate: new Date(),
      },
    });

    await tx.payoutEvent.create({
      data: {
        payoutId,
        actorId: adminId || null,
        actorType: adminId ? 'admin' : 'system',
        eventType: 'PAYOUT_SETTLED',
        fromStatus: 'processing',
        toStatus: 'settled',
        metadata: JSON.stringify({ bankReference }),
      },
    });

    return updated;
  });

  return { success: true, payout: updatedPayout };
}

/**
 * Mark payout as failed
 */
async function failPayout(
  payoutId: string,
  reason: string,
  adminId?: string
): Promise<{ success: boolean; payout?: any; error?: string }> {
  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  if (payout.status === 'settled') {
    return { success: false, error: 'Cannot fail a settled payout' };
  }

  const updatedPayout = await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    await tx.payoutEvent.create({
      data: {
        payoutId,
        actorId: adminId || null,
        actorType: adminId ? 'admin' : 'system',
        eventType: 'PAYOUT_FAILED',
        fromStatus: payout.status,
        toStatus: 'failed',
        metadata: JSON.stringify({ reason }),
      },
    });

    return updated;
  });

  return { success: true, payout: updatedPayout };
}

/**
 * Put payout on hold
 */
async function holdPayout(
  payoutId: string,
  reason: string,
  holdUntil?: Date,
  adminId?: string
): Promise<{ success: boolean; payout?: any; error?: string }> {
  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  if (payout.status === 'settled') {
    return { success: false, error: 'Cannot hold a settled payout' };
  }

  const updatedPayout = await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'on_hold',
        holdReason: reason,
        holdUntil,
      },
    });

    await tx.payoutEvent.create({
      data: {
        payoutId,
        actorId: adminId || null,
        actorType: adminId ? 'admin' : 'system',
        eventType: 'PAYOUT_ON_HOLD',
        fromStatus: payout.status,
        toStatus: 'on_hold',
        metadata: JSON.stringify({ reason, holdUntil }),
      },
    });

    return updated;
  });

  return { success: true, payout: updatedPayout };
}

/**
 * Get seller's payouts with pagination
 */
async function getSellerPayouts(
  sellerId: string,
  filters: PayoutFilters = {}
): Promise<{ payouts: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const { status, dateFrom, dateTo, page = 1, limit = 20 } = filters;

  const where: any = { sellerId };

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [payouts, total] = await Promise.all([
    prisma.sellerPayout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lineItems: {
          select: {
            invoiceNumber: true,
            orderNumber: true,
            netAmount: true,
          },
        },
        _count: {
          select: { lineItems: true },
        },
      },
    }),
    prisma.sellerPayout.count({ where }),
  ]);

  return {
    payouts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get payout details
 */
async function getPayoutDetails(
  payoutId: string,
  sellerId: string
): Promise<any | null> {
  const payout = await prisma.sellerPayout.findFirst({
    where: { id: payoutId, sellerId },
    include: {
      lineItems: true,
      events: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return payout;
}

/**
 * Get payout statistics for a seller
 */
async function getPayoutStats(sellerId: string): Promise<{
  totalPaid: number;
  pendingAmount: number;
  nextPayout: { amount: number; date: Date | null } | null;
  payoutCount: { pending: number; processing: number; settled: number; on_hold: number; failed: number };
}> {
  const payouts = await prisma.sellerPayout.groupBy({
    by: ['status'],
    where: { sellerId },
    _sum: { netAmount: true },
    _count: { id: true },
  });

  const stats = {
    totalPaid: 0,
    pendingAmount: 0,
    payoutCount: {
      pending: 0,
      processing: 0,
      settled: 0,
      on_hold: 0,
      failed: 0,
    },
  };

  for (const p of payouts) {
    const status = p.status as PayoutStatus;
    stats.payoutCount[status] = p._count.id;

    if (status === 'settled') {
      stats.totalPaid += p._sum.netAmount || 0;
    }
    if (status === 'pending' || status === 'processing') {
      stats.pendingAmount += p._sum.netAmount || 0;
    }
  }

  // Calculate next eligible payout
  const eligibility = await calculateEligiblePayouts(sellerId);

  return {
    ...stats,
    nextPayout: eligibility.eligible
      ? { amount: eligibility.totalNet, date: null }
      : null,
  };
}

/**
 * Get all pending payouts (admin)
 */
async function getPendingPayouts(): Promise<any[]> {
  return prisma.sellerPayout.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { lineItems: true } },
    },
  });
}

/**
 * Get payouts by status (admin)
 */
async function getPayoutsByStatus(status: PayoutStatus): Promise<any[]> {
  return prisma.sellerPayout.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { lineItems: true } },
    },
  });
}

/**
 * Get or create payout settings for a seller
 */
async function getPayoutSettings(sellerId: string): Promise<any> {
  let settings = await prisma.sellerPayoutSettings.findUnique({
    where: { sellerId },
  });

  if (!settings) {
    settings = await prisma.sellerPayoutSettings.create({
      data: {
        sellerId,
        payoutFrequency: 'weekly',
        minPayoutAmount: DEFAULT_MIN_PAYOUT_AMOUNT,
        disputeHoldEnabled: true,
        holdPeriodDays: DEFAULT_HOLD_PERIOD_DAYS,
        autoPayoutEnabled: false,
      },
    });
  }

  return settings;
}

/**
 * Update payout settings
 */
async function updatePayoutSettings(
  sellerId: string,
  input: UpdatePayoutSettingsInput
): Promise<any> {
  // Ensure settings exist first
  await getPayoutSettings(sellerId);

  return prisma.sellerPayoutSettings.update({
    where: { sellerId },
    data: input,
  });
}

/**
 * Get payout history (events)
 */
async function getPayoutHistory(
  payoutId: string,
  sellerId: string
): Promise<any[]> {
  // Verify payout belongs to seller
  const payout = await prisma.sellerPayout.findFirst({
    where: { id: payoutId, sellerId },
  });

  if (!payout) return [];

  return prisma.payoutEvent.findMany({
    where: { payoutId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get funds timeline showing the lifecycle of funds from order to payout
 * Returns recent orders and their payout status for timeline visualization
 */
async function getFundsTimeline(
  sellerId: string,
  limit: number = 10
): Promise<{
  entries: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    status: 'order_completed' | 'funds_held' | 'eligible' | 'paid';
    date: string;
    holdEndDate: string | null;
    payoutId: string | null;
    payoutNumber: string | null;
  }>;
}> {
  // Get seller's settings for hold period
  const settings = await getPayoutSettings(sellerId);
  const holdPeriodDays = settings?.holdPeriodDays ?? DEFAULT_HOLD_PERIOD_DAYS;

  // Get recent closed orders with invoices
  const recentInvoices = await prisma.marketplaceInvoice.findMany({
    where: {
      sellerId,
      status: 'paid',
    },
    orderBy: { paidAt: 'desc' },
    take: limit,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          closedAt: true,
        },
      },
    },
  });

  const now = new Date();
  const entries = [];

  for (const invoice of recentInvoices) {
    if (!invoice.order || !invoice.paidAt) continue;

    const paidAt = new Date(invoice.paidAt);
    const holdEndDate = new Date(paidAt);
    holdEndDate.setDate(holdEndDate.getDate() + holdPeriodDays);

    // Check if this invoice is already in a payout
    const payoutLineItem = await prisma.payoutLineItem.findFirst({
      where: { invoiceId: invoice.id },
      include: {
        payout: {
          select: {
            id: true,
            payoutNumber: true,
            status: true,
            settledAt: true,
          },
        },
      },
    });

    let status: 'order_completed' | 'funds_held' | 'eligible' | 'paid' = 'order_completed';
    let payoutId: string | null = null;
    let payoutNumber: string | null = null;

    if (payoutLineItem?.payout) {
      if (payoutLineItem.payout.status === 'settled') {
        status = 'paid';
      } else {
        status = 'eligible';
      }
      payoutId = payoutLineItem.payout.id;
      payoutNumber = payoutLineItem.payout.payoutNumber;
    } else if (invoice.order.status !== 'closed') {
      status = 'order_completed';
    } else if (now < holdEndDate) {
      status = 'funds_held';
    } else {
      // Check for open disputes
      const openDispute = await prisma.marketplaceDispute.findFirst({
        where: {
          orderId: invoice.orderId,
          status: { notIn: ['resolved', 'closed', 'rejected'] },
        },
      });
      if (openDispute) {
        status = 'funds_held';
      } else {
        status = 'eligible';
      }
    }

    entries.push({
      id: invoice.id,
      orderId: invoice.orderId,
      orderNumber: invoice.order.orderNumber,
      amount: invoice.netToSeller || invoice.totalAmount,
      currency: invoice.currency,
      status,
      date: invoice.paidAt.toISOString(),
      holdEndDate: holdEndDate.toISOString(),
      payoutId,
      payoutNumber,
    });
  }

  return { entries };
}

/**
 * Get enhanced eligibility info with withdrawal logic
 */
async function getEnhancedEligibility(sellerId: string): Promise<{
  eligibleAmount: number;
  eligibleInvoices: number;
  pendingAmount: number;
  onHoldAmount: number;
  nextPayoutDate: string | null;
  bankVerified: boolean;
  currency: string;
  holdPeriodDays: number;
  minPayoutAmount: number;
  payoutSchedule: string;
  withdrawalDisabledReason: string | null;
}> {
  const settings = await getPayoutSettings(sellerId);
  const eligibility = await calculateEligiblePayouts(sellerId);

  // Check bank verification
  const sellerBank = await prisma.sellerBank.findFirst({
    where: { sellerId, verificationStatus: 'approved' },
  });
  const bankVerified = !!sellerBank;

  // Calculate next payout date based on schedule
  const frequency = settings?.payoutFrequency || 'weekly';
  const payoutDay = settings?.payoutDay || 1;
  let nextPayoutDate: Date | null = null;

  const today = new Date();
  if (frequency === 'daily') {
    nextPayoutDate = new Date(today);
    nextPayoutDate.setDate(nextPayoutDate.getDate() + 1);
  } else if (frequency === 'weekly' || frequency === 'biweekly') {
    const currentDay = today.getDay();
    const daysUntilPayout = (payoutDay - currentDay + 7) % 7 || 7;
    nextPayoutDate = new Date(today);
    nextPayoutDate.setDate(nextPayoutDate.getDate() + daysUntilPayout);
    if (frequency === 'biweekly') {
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 7);
    }
  } else if (frequency === 'monthly') {
    nextPayoutDate = new Date(today.getFullYear(), today.getMonth() + 1, payoutDay);
  }

  // Determine withdrawal disabled reason
  let withdrawalDisabledReason: string | null = null;
  if (!bankVerified) {
    withdrawalDisabledReason = 'Bank account not verified';
  } else if (!eligibility.eligible) {
    withdrawalDisabledReason = eligibility.reason || 'No eligible funds';
  } else if (eligibility.totalNet < (settings?.minPayoutAmount ?? DEFAULT_MIN_PAYOUT_AMOUNT)) {
    withdrawalDisabledReason = `Below minimum payout (${settings?.minPayoutAmount ?? DEFAULT_MIN_PAYOUT_AMOUNT} SAR)`;
  }

  // Calculate pending and on-hold amounts
  const payoutStats = await prisma.sellerPayout.groupBy({
    by: ['status'],
    where: { sellerId },
    _sum: { netAmount: true },
  });

  let pendingAmount = 0;
  let onHoldAmount = 0;
  for (const stat of payoutStats) {
    if (stat.status === 'pending' || stat.status === 'processing') {
      pendingAmount += stat._sum.netAmount || 0;
    }
    if (stat.status === 'on_hold') {
      onHoldAmount += stat._sum.netAmount || 0;
    }
  }

  return {
    eligibleAmount: eligibility.totalNet,
    eligibleInvoices: eligibility.invoices.length,
    pendingAmount,
    onHoldAmount,
    nextPayoutDate: nextPayoutDate?.toISOString() ?? null,
    bankVerified,
    currency: eligibility.currency,
    holdPeriodDays: settings?.holdPeriodDays ?? DEFAULT_HOLD_PERIOD_DAYS,
    minPayoutAmount: settings?.minPayoutAmount ?? DEFAULT_MIN_PAYOUT_AMOUNT,
    payoutSchedule: `${PAYOUT_FREQUENCY_MAP[frequency]} payouts`,
    withdrawalDisabledReason,
  };
}

const PAYOUT_FREQUENCY_MAP: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
};

// =============================================================================
// Export Service
// =============================================================================

export const sellerPayoutService = {
  // Payout generation
  generatePayoutNumber,
  calculateEligiblePayouts,
  createPayout,
  createBatchPayouts,

  // Lifecycle
  approvePayout,
  processPayout,
  settlePayout,
  failPayout,
  holdPayout,

  // Queries
  getSellerPayouts,
  getPayoutDetails,
  getPayoutStats,
  getPendingPayouts,
  getPayoutsByStatus,
  getPayoutHistory,
  getFundsTimeline,
  getEnhancedEligibility,

  // Settings
  getPayoutSettings,
  updatePayoutSettings,
};

export default sellerPayoutService;
