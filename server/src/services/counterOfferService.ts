// =============================================================================
// Counter-Offer Service
// =============================================================================
// Handles buyer counter-offers on quotes for negotiation flow
// Counter-offer lifecycle: PENDING → ACCEPTED | REJECTED | EXPIRED
// =============================================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export type CounterOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface CreateCounterOfferInput {
  quoteId: string;
  buyerId: string;
  proposedPrice: number;
  proposedQuantity?: number;
  proposedDeliveryDays?: number;
  message?: string;
}

export interface RespondToCounterOfferInput {
  counterOfferId: string;
  sellerId: string;
  accept: boolean;
  response?: string;
}

// =============================================================================
// Event Logging
// =============================================================================

async function logCounterOfferEvent(
  counterOfferId: string,
  actorId: string,
  actorType: 'buyer' | 'seller' | 'system',
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.counterOfferEvent.create({
    data: {
      counterOfferId,
      actorId,
      actorType,
      eventType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// =============================================================================
// Core Counter-Offer Operations
// =============================================================================

/**
 * Create a counter-offer on a quote
 * Buyer proposes different terms
 */
export async function createCounterOffer(input: CreateCounterOfferInput): Promise<{
  success: boolean;
  counterOffer?: Prisma.CounterOfferGetPayload<{ include: { quote: true } }>;
  error?: string;
}> {
  try {
    // Get the quote
    const quote = await prisma.quote.findUnique({
      where: { id: input.quoteId },
      include: { rfq: true },
    });

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Verify buyer owns this quote (as the recipient)
    if (quote.buyerId !== input.buyerId) {
      return { success: false, error: 'Unauthorized: You are not the buyer for this quote' };
    }

    // Can only counter-offer on SENT or REVISED quotes
    if (quote.status !== 'sent' && quote.status !== 'revised') {
      return {
        success: false,
        error: `Cannot counter-offer a quote in "${quote.status}" status. Quote must be "sent" or "revised".`,
      };
    }

    // Check if quote has expired
    if (new Date(quote.validUntil) < new Date()) {
      return {
        success: false,
        error: 'Cannot counter-offer an expired quote. Please request a new quote.',
      };
    }

    // Check for existing pending counter-offer
    const existingPending = await prisma.counterOffer.findFirst({
      where: {
        quoteId: input.quoteId,
        buyerId: input.buyerId,
        status: 'pending',
      },
    });

    if (existingPending) {
      return {
        success: false,
        error: 'You already have a pending counter-offer for this quote. Please wait for the seller to respond.',
      };
    }

    // Validate proposed price is reasonable (must be positive, less than or equal to original)
    if (input.proposedPrice <= 0) {
      return { success: false, error: 'Proposed price must be greater than 0' };
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the counter-offer
    const counterOffer = await prisma.counterOffer.create({
      data: {
        quoteId: input.quoteId,
        buyerId: input.buyerId,
        proposedPrice: input.proposedPrice,
        proposedQuantity: input.proposedQuantity,
        proposedDeliveryDays: input.proposedDeliveryDays,
        message: input.message,
        status: 'pending',
        expiresAt,
      },
      include: {
        quote: true,
      },
    });

    // Log the event
    await logCounterOfferEvent(
      counterOffer.id,
      input.buyerId,
      'buyer',
      'COUNTER_CREATED',
      {
        originalPrice: quote.totalPrice,
        proposedPrice: input.proposedPrice,
        priceDifference: quote.totalPrice - input.proposedPrice,
        quoteNumber: quote.quoteNumber,
      }
    );

    // Log quote event for the counter-offer
    await prisma.quoteEvent.create({
      data: {
        quoteId: quote.id,
        actorId: input.buyerId,
        actorType: 'buyer',
        eventType: 'COUNTER_OFFER_RECEIVED',
        version: quote.version,
        metadata: JSON.stringify({
          counterOfferId: counterOffer.id,
          proposedPrice: input.proposedPrice,
        }),
      },
    });

    return { success: true, counterOffer };
  } catch (error) {
    console.error('Error creating counter-offer:', error);
    return { success: false, error: 'Failed to create counter-offer' };
  }
}

/**
 * Seller accepts a counter-offer
 * Creates a revised quote with the buyer's proposed terms
 */
export async function acceptCounterOffer(
  counterOfferId: string,
  sellerId: string,
  response?: string
): Promise<{
  success: boolean;
  counterOffer?: Prisma.CounterOfferGetPayload<{}>;
  revisedQuote?: Prisma.QuoteGetPayload<{ include: { rfq: true } }>;
  error?: string;
}> {
  try {
    // Get the counter-offer
    const counterOffer = await prisma.counterOffer.findUnique({
      where: { id: counterOfferId },
      include: {
        quote: {
          include: { rfq: true },
        },
      },
    });

    if (!counterOffer) {
      return { success: false, error: 'Counter-offer not found' };
    }

    // Verify seller owns the quote
    if (counterOffer.quote.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this quote' };
    }

    // Can only respond to pending counter-offers
    if (counterOffer.status !== 'pending') {
      return {
        success: false,
        error: `Cannot respond to counter-offer in "${counterOffer.status}" status`,
      };
    }

    // Check if counter-offer has expired
    if (counterOffer.expiresAt && new Date(counterOffer.expiresAt) < new Date()) {
      // Auto-expire it
      await prisma.counterOffer.update({
        where: { id: counterOfferId },
        data: { status: 'expired' },
      });
      return { success: false, error: 'Counter-offer has expired' };
    }

    // Start transaction to update counter-offer and create revised quote
    const result = await prisma.$transaction(async (tx) => {
      // Update counter-offer status
      const updatedCounterOffer = await tx.counterOffer.update({
        where: { id: counterOfferId },
        data: {
          status: 'accepted',
          sellerResponse: response,
          respondedBy: sellerId,
          respondedAt: new Date(),
        },
      });

      // Create revised quote with accepted terms
      const quote = counterOffer.quote;
      const newVersion = quote.version + 1;
      const newPrice = counterOffer.proposedPrice;
      const newQuantity = counterOffer.proposedQuantity || quote.quantity;
      const newDeliveryDays = counterOffer.proposedDeliveryDays || quote.deliveryDays;

      // Calculate new total (price is total, not unit price from counter-offer)
      // Counter-offer proposedPrice is total proposed amount
      const totalPrice = newPrice;

      const revisedQuote = await tx.quote.update({
        where: { id: quote.id },
        data: {
          totalPrice,
          unitPrice: totalPrice / newQuantity,
          quantity: newQuantity,
          deliveryDays: newDeliveryDays,
          version: newVersion,
          status: 'revised',
        },
        include: { rfq: true },
      });

      // Link revised quote to counter-offer
      await tx.counterOffer.update({
        where: { id: counterOfferId },
        data: { revisedQuoteId: revisedQuote.id },
      });

      // Create version snapshot
      await tx.quoteVersion.create({
        data: {
          quoteId: quote.id,
          version: newVersion,
          unitPrice: revisedQuote.unitPrice,
          quantity: newQuantity,
          totalPrice,
          currency: quote.currency,
          discount: quote.discount,
          discountPercent: quote.discountPercent,
          deliveryDays: newDeliveryDays,
          deliveryTerms: quote.deliveryTerms,
          validUntil: quote.validUntil,
          notes: quote.notes,
          status: 'revised',
          createdBy: sellerId,
          changeReason: `Counter-offer accepted: ${response || 'No message'}`,
        },
      });

      return { updatedCounterOffer, revisedQuote };
    });

    // Log the counter-offer event
    await logCounterOfferEvent(
      counterOfferId,
      sellerId,
      'seller',
      'COUNTER_ACCEPTED',
      {
        response,
        revisedQuoteId: result.revisedQuote.id,
        newPrice: counterOffer.proposedPrice,
      }
    );

    // Log quote event
    await prisma.quoteEvent.create({
      data: {
        quoteId: counterOffer.quote.id,
        actorId: sellerId,
        actorType: 'seller',
        eventType: 'QUOTE_REVISED',
        fromStatus: counterOffer.quote.status,
        toStatus: 'revised',
        version: result.revisedQuote.version,
        metadata: JSON.stringify({
          reason: 'Counter-offer accepted',
          counterOfferId,
        }),
      },
    });

    return {
      success: true,
      counterOffer: result.updatedCounterOffer,
      revisedQuote: result.revisedQuote,
    };
  } catch (error) {
    console.error('Error accepting counter-offer:', error);
    return { success: false, error: 'Failed to accept counter-offer' };
  }
}

/**
 * Seller rejects a counter-offer
 */
export async function rejectCounterOffer(
  counterOfferId: string,
  sellerId: string,
  response: string
): Promise<{
  success: boolean;
  counterOffer?: Prisma.CounterOfferGetPayload<{}>;
  error?: string;
}> {
  try {
    // Get the counter-offer
    const counterOffer = await prisma.counterOffer.findUnique({
      where: { id: counterOfferId },
      include: {
        quote: true,
      },
    });

    if (!counterOffer) {
      return { success: false, error: 'Counter-offer not found' };
    }

    // Verify seller owns the quote
    if (counterOffer.quote.sellerId !== sellerId) {
      return { success: false, error: 'Unauthorized: You do not own this quote' };
    }

    // Can only respond to pending counter-offers
    if (counterOffer.status !== 'pending') {
      return {
        success: false,
        error: `Cannot respond to counter-offer in "${counterOffer.status}" status`,
      };
    }

    // Update counter-offer status
    const updatedCounterOffer = await prisma.counterOffer.update({
      where: { id: counterOfferId },
      data: {
        status: 'rejected',
        sellerResponse: response,
        respondedBy: sellerId,
        respondedAt: new Date(),
      },
    });

    // Log the event
    await logCounterOfferEvent(
      counterOfferId,
      sellerId,
      'seller',
      'COUNTER_REJECTED',
      { response }
    );

    // Log quote event
    await prisma.quoteEvent.create({
      data: {
        quoteId: counterOffer.quote.id,
        actorId: sellerId,
        actorType: 'seller',
        eventType: 'COUNTER_OFFER_REJECTED',
        version: counterOffer.quote.version,
        metadata: JSON.stringify({
          counterOfferId,
          response,
        }),
      },
    });

    return { success: true, counterOffer: updatedCounterOffer };
  } catch (error) {
    console.error('Error rejecting counter-offer:', error);
    return { success: false, error: 'Failed to reject counter-offer' };
  }
}

/**
 * Get all counter-offers for a quote
 */
export async function getCounterOffers(
  quoteId: string,
  userId: string
): Promise<{
  success: boolean;
  counterOffers?: Prisma.CounterOfferGetPayload<{}>[];
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

    // User must be seller or buyer
    if (quote.sellerId !== userId && quote.buyerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this quote' };
    }

    const counterOffers = await prisma.counterOffer.findMany({
      where: { quoteId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, counterOffers };
  } catch (error) {
    console.error('Error getting counter-offers:', error);
    return { success: false, error: 'Failed to get counter-offers' };
  }
}

/**
 * Get a single counter-offer by ID
 */
export async function getCounterOffer(
  counterOfferId: string,
  userId: string
): Promise<{
  success: boolean;
  counterOffer?: Prisma.CounterOfferGetPayload<{ include: { quote: true } }>;
  error?: string;
}> {
  try {
    const counterOffer = await prisma.counterOffer.findUnique({
      where: { id: counterOfferId },
      include: { quote: true },
    });

    if (!counterOffer) {
      return { success: false, error: 'Counter-offer not found' };
    }

    // User must be seller or buyer
    if (counterOffer.quote.sellerId !== userId && counterOffer.buyerId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have access to this counter-offer' };
    }

    return { success: true, counterOffer };
  } catch (error) {
    console.error('Error getting counter-offer:', error);
    return { success: false, error: 'Failed to get counter-offer' };
  }
}

/**
 * Get pending counter-offers for a seller (notifications)
 */
export async function getSellerPendingCounterOffers(
  sellerId: string
): Promise<{
  success: boolean;
  counterOffers?: Prisma.CounterOfferGetPayload<{ include: { quote: { include: { rfq: { include: { item: true } } } } } }>[];
  count?: number;
  error?: string;
}> {
  try {
    const counterOffers = await prisma.counterOffer.findMany({
      where: {
        status: 'pending',
        quote: {
          sellerId,
        },
      },
      include: {
        quote: {
          include: {
            rfq: {
              include: {
                item: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      counterOffers,
      count: counterOffers.length,
    };
  } catch (error) {
    console.error('Error getting seller pending counter-offers:', error);
    return { success: false, error: 'Failed to get pending counter-offers' };
  }
}

/**
 * Expire counter-offers past their expiration date
 * Should be called periodically (e.g., via cron job)
 */
export async function expireCounterOffers(): Promise<{
  success: boolean;
  expiredCount: number;
  error?: string;
}> {
  try {
    const now = new Date();

    // Find all pending counter-offers that have expired
    const toExpire = await prisma.counterOffer.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: now },
      },
    });

    // Expire each one
    for (const co of toExpire) {
      await prisma.counterOffer.update({
        where: { id: co.id },
        data: { status: 'expired' },
      });

      await logCounterOfferEvent(
        co.id,
        'system',
        'system',
        'COUNTER_EXPIRED',
        { reason: 'Counter-offer validity period passed' }
      );
    }

    return { success: true, expiredCount: toExpire.length };
  } catch (error) {
    console.error('Error expiring counter-offers:', error);
    return { success: false, expiredCount: 0, error: 'Failed to expire counter-offers' };
  }
}

export const counterOfferService = {
  createCounterOffer,
  acceptCounterOffer,
  rejectCounterOffer,
  getCounterOffers,
  getCounterOffer,
  getSellerPendingCounterOffers,
  expireCounterOffers,
};

export default counterOfferService;
