// =============================================================================
// Quote Service (Stage 3)
// =============================================================================
// Handles quotation lifecycle: DRAFT → SENT → REVISED | EXPIRED
// Every update creates a new version; old versions are immutable.
// =============================================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export type QuoteStatus = 'draft' | 'sent' | 'revised' | 'expired' | 'accepted' | 'rejected';

export interface CreateQuoteInput {
  rfqId: string;
  sellerId: string;
  buyerId: string;
  unitPrice: number;
  quantity: number;
  currency?: string;
  discount?: number;
  discountPercent?: number;
  deliveryDays: number;
  deliveryTerms?: string;
  validUntil: Date;
  notes?: string;
  internalNotes?: string;
}

export interface UpdateQuoteInput {
  unitPrice?: number;
  quantity?: number;
  currency?: string;
  discount?: number;
  discountPercent?: number;
  deliveryDays?: number;
  deliveryTerms?: string;
  validUntil?: Date;
  notes?: string;
  internalNotes?: string;
  changeReason?: string;
}

// =============================================================================
// Quote Number Generation
// =============================================================================

async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;

  // Find the highest quote number for this year
  const lastQuote = await prisma.quote.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: 'desc',
    },
    select: {
      quoteNumber: true,
    },
  });

  let nextNumber = 1;
  if (lastQuote?.quoteNumber) {
    const lastNum = parseInt(lastQuote.quoteNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// =============================================================================
// Event Logging
// =============================================================================

async function logQuoteEvent(
  quoteId: string,
  actorId: string,
  actorType: 'seller' | 'buyer' | 'system',
  eventType: string,
  fromStatus?: string,
  toStatus?: string,
  version?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.quoteEvent.create({
    data: {
      quoteId,
      actorId,
      actorType,
      eventType,
      fromStatus,
      toStatus,
      version,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// =============================================================================
// Version Management
// =============================================================================

async function createVersionSnapshot(
  quote: {
    id: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    currency: string;
    discount: number | null;
    discountPercent: number | null;
    deliveryDays: number;
    deliveryTerms: string | null;
    validUntil: Date;
    notes: string | null;
    status: string;
    version: number;
  },
  createdBy: string,
  changeReason?: string
): Promise<void> {
  await prisma.quoteVersion.create({
    data: {
      quoteId: quote.id,
      version: quote.version,
      unitPrice: quote.unitPrice,
      quantity: quote.quantity,
      totalPrice: quote.totalPrice,
      currency: quote.currency,
      discount: quote.discount,
      discountPercent: quote.discountPercent,
      deliveryDays: quote.deliveryDays,
      deliveryTerms: quote.deliveryTerms,
      validUntil: quote.validUntil,
      notes: quote.notes,
      status: quote.status,
      createdBy,
      changeReason,
    },
  });
}

// =============================================================================
// Core Quote Operations
// =============================================================================

/**
 * Create a new draft quote for an RFQ
 * Entry condition: RFQ must be in UNDER_REVIEW status
 */
export async function createDraft(input: CreateQuoteInput): Promise<{
  success: boolean;
  quote?: Prisma.QuoteGetPayload<{ include: { rfq: true } }>;
  error?: string;
}> {
  try {
    // Verify RFQ exists and is in UNDER_REVIEW status
    const rfq = await prisma.itemRFQ.findUnique({
      where: { id: input.rfqId },
    });

    if (!rfq) {
      return { success: false, error: 'RFQ not found' };
    }

    if (rfq.status !== 'under_review') {
      return {
        success: false,
        error: `Cannot create quote for RFQ in "${rfq.status}" status. RFQ must be "under_review".`,
      };
    }

    // Verify seller owns this RFQ
    if (rfq.sellerId !== input.sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this RFQ' };
    }

    // Check for existing draft quote on this RFQ
    const existingDraft = await prisma.quote.findFirst({
      where: {
        rfqId: input.rfqId,
        sellerId: input.sellerId,
        status: 'draft',
        isLatest: true,
      },
    });

    if (existingDraft) {
      return {
        success: false,
        error: 'A draft quote already exists for this RFQ. Please update the existing draft.',
      };
    }

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Calculate total price
    const totalPrice = input.unitPrice * input.quantity - (input.discount || 0);

    // Create the quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        rfqId: input.rfqId,
        sellerId: input.sellerId,
        buyerId: input.buyerId,
        unitPrice: input.unitPrice,
        quantity: input.quantity,
        totalPrice,
        currency: input.currency || 'SAR',
        discount: input.discount,
        discountPercent: input.discountPercent,
        deliveryDays: input.deliveryDays,
        deliveryTerms: input.deliveryTerms,
        validUntil: input.validUntil,
        notes: input.notes,
        internalNotes: input.internalNotes,
        version: 1,
        isLatest: true,
        status: 'draft',
      },
      include: {
        rfq: true,
      },
    });

    // Create initial version snapshot
    await createVersionSnapshot(quote, input.sellerId, 'Initial draft created');

    // Log the event
    await logQuoteEvent(
      quote.id,
      input.sellerId,
      'seller',
      'QUOTE_CREATED',
      undefined,
      'draft',
      1,
      { quoteNumber, rfqNumber: rfq.rfqNumber }
    );

    return { success: true, quote };
  } catch (error) {
    console.error('Error creating draft quote:', error);
    return { success: false, error: 'Failed to create quote' };
  }
}

/**
 * Update an existing draft quote
 * If quote is SENT, this creates a REVISED version
 */
export async function updateQuote(
  quoteId: string,
  sellerId: string,
  input: UpdateQuoteInput
): Promise<{
  success: boolean;
  quote?: Prisma.QuoteGetPayload<{ include: { rfq: true } }>;
  error?: string;
}> {
  try {
    // Get existing quote
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true },
    });

    if (!existingQuote) {
      return { success: false, error: 'Quote not found' };
    }

    // Verify seller owns this quote
    if (existingQuote.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this quote' };
    }

    // Handle based on current status
    if (existingQuote.status === 'draft') {
      // Direct update for drafts (increment version but stay in draft)
      const newVersion = existingQuote.version + 1;
      const totalPrice =
        (input.unitPrice ?? existingQuote.unitPrice) *
          (input.quantity ?? existingQuote.quantity) -
        (input.discount ?? existingQuote.discount ?? 0);

      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          unitPrice: input.unitPrice ?? existingQuote.unitPrice,
          quantity: input.quantity ?? existingQuote.quantity,
          totalPrice,
          currency: input.currency ?? existingQuote.currency,
          discount: input.discount ?? existingQuote.discount,
          discountPercent: input.discountPercent ?? existingQuote.discountPercent,
          deliveryDays: input.deliveryDays ?? existingQuote.deliveryDays,
          deliveryTerms: input.deliveryTerms ?? existingQuote.deliveryTerms,
          validUntil: input.validUntil ?? existingQuote.validUntil,
          notes: input.notes ?? existingQuote.notes,
          internalNotes: input.internalNotes ?? existingQuote.internalNotes,
          version: newVersion,
        },
        include: { rfq: true },
      });

      // Create version snapshot
      await createVersionSnapshot(updatedQuote, sellerId, input.changeReason || 'Draft updated');

      // Log the event
      await logQuoteEvent(
        quoteId,
        sellerId,
        'seller',
        'QUOTE_UPDATED',
        'draft',
        'draft',
        newVersion,
        { changeReason: input.changeReason }
      );

      return { success: true, quote: updatedQuote };
    } else if (existingQuote.status === 'sent') {
      // For sent quotes, create a REVISED version
      const newVersion = existingQuote.version + 1;
      const totalPrice =
        (input.unitPrice ?? existingQuote.unitPrice) *
          (input.quantity ?? existingQuote.quantity) -
        (input.discount ?? existingQuote.discount ?? 0);

      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          unitPrice: input.unitPrice ?? existingQuote.unitPrice,
          quantity: input.quantity ?? existingQuote.quantity,
          totalPrice,
          currency: input.currency ?? existingQuote.currency,
          discount: input.discount ?? existingQuote.discount,
          discountPercent: input.discountPercent ?? existingQuote.discountPercent,
          deliveryDays: input.deliveryDays ?? existingQuote.deliveryDays,
          deliveryTerms: input.deliveryTerms ?? existingQuote.deliveryTerms,
          validUntil: input.validUntil ?? existingQuote.validUntil,
          notes: input.notes ?? existingQuote.notes,
          internalNotes: input.internalNotes ?? existingQuote.internalNotes,
          version: newVersion,
          status: 'revised',
        },
        include: { rfq: true },
      });

      // Create version snapshot
      await createVersionSnapshot(
        updatedQuote,
        sellerId,
        input.changeReason || 'Quote revised after sending'
      );

      // Log the event
      await logQuoteEvent(
        quoteId,
        sellerId,
        'seller',
        'QUOTE_REVISED',
        'sent',
        'revised',
        newVersion,
        { changeReason: input.changeReason }
      );

      return { success: true, quote: updatedQuote };
    } else {
      return {
        success: false,
        error: `Cannot update quote in "${existingQuote.status}" status`,
      };
    }
  } catch (error) {
    console.error('Error updating quote:', error);
    return { success: false, error: 'Failed to update quote' };
  }
}

/**
 * Send a quote to the buyer
 * Transitions: Quote DRAFT → SENT, RFQ → QUOTED
 */
export async function sendQuote(
  quoteId: string,
  sellerId: string
): Promise<{
  success: boolean;
  quote?: Prisma.QuoteGetPayload<{ include: { rfq: true } }>;
  error?: string;
}> {
  try {
    // Get existing quote
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true },
    });

    if (!existingQuote) {
      return { success: false, error: 'Quote not found' };
    }

    // Verify seller owns this quote
    if (existingQuote.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this quote' };
    }

    // Can only send draft or revised quotes
    if (existingQuote.status !== 'draft' && existingQuote.status !== 'revised') {
      return {
        success: false,
        error: `Cannot send quote in "${existingQuote.status}" status. Only draft or revised quotes can be sent.`,
      };
    }

    // Check if quote has expired
    if (new Date(existingQuote.validUntil) < new Date()) {
      return {
        success: false,
        error: 'Cannot send expired quote. Please update the validity date.',
      };
    }

    const fromStatus = existingQuote.status;

    // Update quote status to SENT
    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
      include: { rfq: true },
    });

    // Update RFQ status to QUOTED
    await prisma.itemRFQ.update({
      where: { id: existingQuote.rfqId },
      data: {
        status: 'quoted',
        quotedPrice: updatedQuote.totalPrice,
        quotedLeadTime: updatedQuote.deliveryDays,
        respondedAt: new Date(),
      },
    });

    // Log RFQ event
    await prisma.itemRFQEvent.create({
      data: {
        rfqId: existingQuote.rfqId,
        actorId: sellerId,
        actorType: 'seller',
        eventType: 'RFQ_QUOTED',
        fromStatus: existingQuote.rfq.status,
        toStatus: 'quoted',
        metadata: JSON.stringify({ quoteId, quoteNumber: updatedQuote.quoteNumber }),
      },
    });

    // Create version snapshot for the send action
    await createVersionSnapshot(updatedQuote, sellerId, 'Quote sent to buyer');

    // Log the quote event
    await logQuoteEvent(
      quoteId,
      sellerId,
      'seller',
      'QUOTE_SENT',
      fromStatus,
      'sent',
      updatedQuote.version,
      { sentAt: new Date().toISOString() }
    );

    return { success: true, quote: updatedQuote };
  } catch (error) {
    console.error('Error sending quote:', error);
    return { success: false, error: 'Failed to send quote' };
  }
}

/**
 * Get a quote by ID
 */
export async function getQuote(
  quoteId: string,
  userId: string
): Promise<{
  success: boolean;
  quote?: Prisma.QuoteGetPayload<{
    include: { rfq: { include: { item: true } }; versions: true; events: true };
  }>;
  error?: string;
}> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        rfq: {
          include: {
            item: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Verify user has access (seller or buyer)
    if (quote.sellerId !== userId && quote.buyerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this quote' };
    }

    return { success: true, quote };
  } catch (error) {
    console.error('Error getting quote:', error);
    return { success: false, error: 'Failed to get quote' };
  }
}

/**
 * Get all quotes for an RFQ
 */
export async function getQuotesByRFQ(
  rfqId: string,
  userId: string
): Promise<{
  success: boolean;
  quotes?: Prisma.QuoteGetPayload<{ include: { versions: true } }>[];
  error?: string;
}> {
  try {
    // Verify RFQ exists and user has access
    const rfq = await prisma.itemRFQ.findUnique({
      where: { id: rfqId },
    });

    if (!rfq) {
      return { success: false, error: 'RFQ not found' };
    }

    // User must be the seller or buyer
    if (rfq.sellerId !== userId && rfq.buyerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this RFQ' };
    }

    const quotes = await prisma.quote.findMany({
      where: { rfqId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, quotes };
  } catch (error) {
    console.error('Error getting quotes for RFQ:', error);
    return { success: false, error: 'Failed to get quotes' };
  }
}

/**
 * Get all quotes for a seller (with optional filters)
 */
export async function getSellerQuotes(
  sellerId: string,
  filters?: {
    status?: QuoteStatus;
    page?: number;
    limit?: number;
  }
): Promise<{
  success: boolean;
  quotes?: Prisma.QuoteGetPayload<{ include: { rfq: { include: { item: true } } } }>[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: string;
}> {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.QuoteWhereInput = {
      sellerId,
      isLatest: true,
      ...(filters?.status && { status: filters.status }),
    };

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          rfq: {
            include: {
              item: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return {
      success: true,
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting seller quotes:', error);
    return { success: false, error: 'Failed to get quotes' };
  }
}

/**
 * Get quote version history
 */
export async function getQuoteVersions(
  quoteId: string,
  userId: string
): Promise<{
  success: boolean;
  versions?: Prisma.QuoteVersionGetPayload<{}>[];
  error?: string;
}> {
  try {
    // Verify quote exists and user has access
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (quote.sellerId !== userId && quote.buyerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this quote' };
    }

    const versions = await prisma.quoteVersion.findMany({
      where: { quoteId },
      orderBy: { version: 'desc' },
    });

    return { success: true, versions };
  } catch (error) {
    console.error('Error getting quote versions:', error);
    return { success: false, error: 'Failed to get quote versions' };
  }
}

/**
 * Get quote event history
 */
export async function getQuoteHistory(
  quoteId: string,
  userId: string
): Promise<{
  success: boolean;
  events?: Prisma.QuoteEventGetPayload<{}>[];
  error?: string;
}> {
  try {
    // Verify quote exists and user has access
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (quote.sellerId !== userId && quote.buyerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this quote' };
    }

    const events = await prisma.quoteEvent.findMany({
      where: { quoteId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, events };
  } catch (error) {
    console.error('Error getting quote history:', error);
    return { success: false, error: 'Failed to get quote history' };
  }
}

/**
 * Check and expire quotes past their validUntil date
 * This should be called periodically (e.g., via cron job)
 */
export async function expireQuotes(): Promise<{
  success: boolean;
  expiredCount: number;
  error?: string;
}> {
  try {
    const now = new Date();

    // Find all quotes that should be expired
    const quotesToExpire = await prisma.quote.findMany({
      where: {
        status: { in: ['draft', 'sent'] },
        validUntil: { lt: now },
        isLatest: true,
      },
    });

    // Expire each quote
    for (const quote of quotesToExpire) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          status: 'expired',
          expiredAt: now,
        },
      });

      // Log the event
      await logQuoteEvent(
        quote.id,
        'system',
        'system',
        'QUOTE_EXPIRED',
        quote.status,
        'expired',
        quote.version,
        { reason: 'Quote validity date passed' }
      );
    }

    return { success: true, expiredCount: quotesToExpire.length };
  } catch (error) {
    console.error('Error expiring quotes:', error);
    return { success: false, expiredCount: 0, error: 'Failed to expire quotes' };
  }
}

/**
 * Delete a draft quote (only drafts can be deleted)
 */
export async function deleteDraft(
  quoteId: string,
  sellerId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (quote.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this quote' };
    }

    if (quote.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft quotes can be deleted. Sent quotes must be kept for audit purposes.',
      };
    }

    // Delete the quote (cascades to versions and events)
    await prisma.quote.delete({
      where: { id: quoteId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting quote:', error);
    return { success: false, error: 'Failed to delete quote' };
  }
}

export const quoteService = {
  createDraft,
  updateQuote,
  sendQuote,
  getQuote,
  getQuotesByRFQ,
  getSellerQuotes,
  getQuoteVersions,
  getQuoteHistory,
  expireQuotes,
  deleteDraft,
};

export default quoteService;
