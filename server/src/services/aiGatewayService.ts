/**
 * AI Gateway Service — Power Features Layer
 *
 * Wraps Gemini calls for portal-specific structured insights.
 * Features: structured JSON output, sensitive data redaction,
 * per-user rate limiting, correlationId logging.
 */
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { routeRequest, AIRequest } from './aiRouterService';
import { createInsightEvent } from './workspaceIntelligenceService';
import { aiLogger } from '../utils/logger';
import crypto from 'crypto';

// ============================================================================
// Output Schema (enforced via system prompt + zod validation)
// ============================================================================

export const AIInsightSchema = z.object({
    summary: z.string(),
    insights: z.array(z.object({
        title: z.string(),
        description: z.string(),
        severity: z.enum(['info', 'warning', 'critical']).optional(),
    })),
    risks: z.array(z.object({
        title: z.string(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
    })),
    recommendedActions: z.array(z.object({
        title: z.string(),
        description: z.string(),
        deepLink: z.string().optional(),
    })),
    confidence: z.number().min(0).max(1),
    dataUsed: z.array(z.string()),
});

export type AIInsightOutput = z.infer<typeof AIInsightSchema>;

// ============================================================================
// Input Schemas (zod validated)
// ============================================================================

export const InsightsInputSchema = z.object({
    role: z.enum(['buyer', 'seller']),
    focusArea: z.string().max(200).optional(),
    language: z.enum(['en', 'ar']).optional(),
});

export const RFQDraftInputSchema = z.object({
    itemName: z.string().min(1).max(500),
    quantity: z.number().int().positive(),
    requirements: z.string().max(2000).optional(),
    deliveryTimeline: z.string().max(200).optional(),
    budget: z.string().max(200).optional(),
    language: z.enum(['en', 'ar']).optional(),
});

export const QuoteCompareInputSchema = z.object({
    rfqId: z.string().min(1),
    language: z.enum(['en', 'ar']).optional(),
});

export const WorkspaceSummaryInputSchema = z.object({
    role: z.enum(['buyer', 'seller']),
    period: z.enum(['7d', '30d', '90d']).optional(),
    language: z.enum(['en', 'ar']).optional(),
});

export const OrderSummaryInputSchema = z.object({
    orderId: z.string().min(1),
    language: z.enum(['en', 'ar']).optional(),
});

export const InvoiceRiskInputSchema = z.object({
    invoiceId: z.string().min(1),
    language: z.enum(['en', 'ar']).optional(),
});

// ============================================================================
// Rate Limiter (in-memory, per-user; pluggable for Redis later)
// ============================================================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 AI requests per minute per user

export function checkAIRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(userId);

    if (!entry || now >= entry.resetAt) {
        rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: entry.resetAt - now };
}

// Cleanup stale entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now >= entry.resetAt) rateLimitStore.delete(key);
    }
}, 5 * 60 * 1000);

// ============================================================================
// Sensitive Data Redaction
// ============================================================================

const REDACT_PATTERNS: [RegExp, string][] = [
    // Bank account numbers
    [/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, '[IBAN_REDACTED]'],
    // Credit card numbers
    [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]'],
    // API keys / tokens (common patterns)
    [/\b(sk|pk|api|key|token|secret|password)[_\-][a-zA-Z0-9_\-]{12,}\b/gi, '[TOKEN_REDACTED]'],
    // Email addresses in sensitive contexts
    [/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, '[EMAIL_REDACTED]'],
    // Phone numbers
    [/\b\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g, '[PHONE_REDACTED]'],
];

export function redactSensitiveData(text: string): string {
    let redacted = text;
    for (const [pattern, replacement] of REDACT_PATTERNS) {
        redacted = redacted.replace(pattern, replacement);
    }
    return redacted;
}

// ============================================================================
// Structured System Prompt (forces JSON output)
// ============================================================================

const STRUCTURED_SYSTEM_PROMPT = `You are NABD AI Copilot — a business intelligence assistant for the NABD B2B marketplace.

CRITICAL RULES:
1. You MUST output ONLY valid JSON. No markdown, no text before/after.
2. Never include personal data, bank details, or secrets in your response.
3. If you lack sufficient data, say so in the summary and set confidence to a low value.
4. Base all insights on the provided data ONLY — never hallucinate numbers.

Your JSON output MUST follow this exact schema:
{
  "summary": "Brief 1-2 sentence overview",
  "insights": [{ "title": "...", "description": "...", "severity": "info|warning|critical" }],
  "risks": [{ "title": "...", "description": "...", "severity": "low|medium|high|critical" }],
  "recommendedActions": [{ "title": "...", "description": "...", "deepLink": "optional_page_path" }],
  "confidence": 0.0-1.0,
  "dataUsed": ["list", "of", "data", "sources", "used"]
}`;

// ============================================================================
// Data Fetching — Minimal Summaries
// ============================================================================

interface BuyerDataSummary {
    recentOrders: { id: string; orderNumber: string; status: string; totalPrice: number; itemName: string; createdAt: Date }[];
    rfqsSummary: { total: number; byStatus: Record<string, number> };
    quotesSummary: { total: number; avgPrice: number; byStatus: Record<string, number> };
    invoicesSummary: { total: number; totalAmount: number; byStatus: Record<string, number> };
    expensesSummary: { totalAmount: number; byCategory: Record<string, number> };
}

interface SellerDataSummary {
    recentOrders: { id: string; orderNumber: string; status: string; totalPrice: number; itemName: string; createdAt: Date }[];
    rfqsSummary: { total: number; byStatus: Record<string, number> };
    quotesSummary: { total: number; avgPrice: number; byStatus: Record<string, number> };
    inventorySummary: { totalItems: number; lowStock: number; outOfStock: number };
    invoicesSummary: { total: number; totalAmount: number; unpaidAmount: number };
}

async function fetchBuyerData(buyerId: string, period: string): Promise<BuyerDataSummary> {
    const since = getPeriodDate(period);

    const [orders, rfqs, quotes, invoices, expenses] = await Promise.all([
        prisma.marketplaceOrder.findMany({
            where: { buyerId, createdAt: { gte: since } },
            select: { id: true, orderNumber: true, status: true, totalPrice: true, itemName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        }),
        prisma.marketplaceRFQ.findMany({
            where: { buyerId, createdAt: { gte: since } },
            select: { id: true, status: true },
        }),
        prisma.quote.findMany({
            where: { buyerId, createdAt: { gte: since } },
            select: { id: true, status: true, totalPrice: true },
        }),
        prisma.marketplaceInvoice.findMany({
            where: { buyerId, createdAt: { gte: since } },
            select: { id: true, status: true, totalAmount: true },
        }),
        prisma.buyerExpense.findMany({
            where: { buyerId, date: { gte: since } },
            select: { category: true, amount: true },
        }),
    ]);

    return {
        recentOrders: orders,
        rfqsSummary: {
            total: rfqs.length,
            byStatus: groupByField(rfqs, 'status'),
        },
        quotesSummary: {
            total: quotes.length,
            avgPrice: quotes.length ? quotes.reduce((s, q) => s + (q.totalPrice ?? 0), 0) / quotes.length : 0,
            byStatus: groupByField(quotes, 'status'),
        },
        invoicesSummary: {
            total: invoices.length,
            totalAmount: invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0),
            byStatus: groupByField(invoices, 'status'),
        },
        expensesSummary: {
            totalAmount: expenses.reduce((s, e) => s + (e.amount ?? 0), 0),
            byCategory: groupByFieldSum(expenses, 'category', 'amount'),
        },
    };
}

async function fetchSellerData(sellerId: string, period: string): Promise<SellerDataSummary> {
    const since = getPeriodDate(period);

    const [orders, rfqs, quotes, items, invoices] = await Promise.all([
        prisma.marketplaceOrder.findMany({
            where: { sellerId, createdAt: { gte: since } },
            select: { id: true, orderNumber: true, status: true, totalPrice: true, itemName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        }),
        prisma.marketplaceRFQ.findMany({
            where: { sellerId, createdAt: { gte: since } },
            select: { id: true, status: true },
        }),
        prisma.quote.findMany({
            where: { sellerId, createdAt: { gte: since } },
            select: { id: true, status: true, totalPrice: true },
        }),
        prisma.item.findMany({
            where: { userId: sellerId },
            select: { id: true, stock: true, status: true },
        }),
        prisma.marketplaceInvoice.findMany({
            where: { sellerId, createdAt: { gte: since } },
            select: { id: true, status: true, totalAmount: true },
        }),
    ]);

    const unpaidInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');

    return {
        recentOrders: orders,
        rfqsSummary: {
            total: rfqs.length,
            byStatus: groupByField(rfqs, 'status'),
        },
        quotesSummary: {
            total: quotes.length,
            avgPrice: quotes.length ? quotes.reduce((s, q) => s + (q.totalPrice ?? 0), 0) / quotes.length : 0,
            byStatus: groupByField(quotes, 'status'),
        },
        inventorySummary: {
            totalItems: items.length,
            lowStock: items.filter(i => (i.stock ?? 0) > 0 && (i.stock ?? 0) <= 5).length,
            outOfStock: items.filter(i => (i.stock ?? 0) === 0 && i.status === 'active').length,
        },
        invoicesSummary: {
            total: invoices.length,
            totalAmount: invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0),
            unpaidAmount: unpaidInvoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0),
        },
    };
}

async function fetchQuotesForRFQ(rfqId: string): Promise<{
    rfq: { id: string; rfqNumber: string | null; quantity: number; itemName: string; status: string } | null;
    quotes: { id: string; quoteNumber: string | null; unitPrice: number; totalPrice: number; deliveryDays: number; status: string; sellerId: string; discount: number | null }[];
}> {
    // Quote.rfqId points to ItemRFQ (not MarketplaceRFQ)
    const rfq = await prisma.itemRFQ.findUnique({
        where: { id: rfqId },
        select: {
            id: true,
            rfqNumber: true,
            quantity: true,
            status: true,
            item: { select: { name: true } },
        },
    });

    if (!rfq) return { rfq: null, quotes: [] };

    const quotes = await prisma.quote.findMany({
        where: { rfqId, isLatest: true },
        select: {
            id: true,
            quoteNumber: true,
            unitPrice: true,
            totalPrice: true,
            deliveryDays: true,
            status: true,
            discount: true,
            sellerId: true,
        },
    });

    return {
        rfq: {
            id: rfq.id,
            rfqNumber: rfq.rfqNumber,
            quantity: rfq.quantity,
            itemName: rfq.item?.name ?? 'Unknown Item',
            status: rfq.status,
        },
        quotes: quotes.map(q => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            unitPrice: q.unitPrice,
            totalPrice: q.totalPrice,
            deliveryDays: q.deliveryDays,
            status: q.status,
            sellerId: q.sellerId,
            discount: q.discount,
        })),
    };
}

// ============================================================================
// Helper Utilities
// ============================================================================

function getPeriodDate(period: string): Date {
    const now = new Date();
    switch (period) {
        case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
}

function groupByField<T extends Record<string, unknown>>(items: T[], field: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of items) {
        const key = String(item[field] ?? 'unknown');
        result[key] = (result[key] || 0) + 1;
    }
    return result;
}

function groupByFieldSum<T extends Record<string, unknown>>(items: T[], groupField: string, sumField: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of items) {
        const key = String(item[groupField] ?? 'other');
        result[key] = (result[key] || 0) + (Number(item[sumField]) || 0);
    }
    return result;
}

function parseAIResponse(content: string): AIInsightOutput {
    const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return AIInsightSchema.parse(parsed);
}

// ============================================================================
// Gateway Endpoints
// ============================================================================

export async function generateInsights(
    userId: string,
    input: z.infer<typeof InsightsInputSchema>,
    portalAuth: { buyerId?: string; sellerId?: string },
): Promise<AIInsightOutput> {
    const correlationId = crypto.randomUUID();
    aiLogger.info(`[${correlationId}] generateInsights for ${input.role}`, { userId });

    const dataSummary = input.role === 'buyer'
        ? await fetchBuyerData(portalAuth.buyerId || userId, '30d')
        : await fetchSellerData(portalAuth.sellerId || userId, '30d');

    const redactedData = redactSensitiveData(JSON.stringify(dataSummary));

    const prompt = `Analyze this ${input.role} workspace data and provide actionable business insights.
${input.focusArea ? `Focus area: ${input.focusArea}` : ''}

Data:
${redactedData}

Provide insights about trends, risks, and recommended actions.`;

    const request: AIRequest = {
        prompt,
        userId,
        promptType: 'analysis',
        language: input.language || 'en',
    };

    const response = await routeRequest(request);

    if (!response.success || !response.content) {
        throw new Error(response.error || 'AI processing failed');
    }

    try {
        return parseAIResponse(response.content);
    } catch {
        aiLogger.warn(`[${correlationId}] Failed to parse structured response, wrapping raw content`);
        return {
            summary: response.content.slice(0, 500),
            insights: [],
            risks: [],
            recommendedActions: [],
            confidence: 0.3,
            dataUsed: ['raw_response'],
        };
    }
}

export async function generateRFQDraft(
    userId: string,
    input: z.infer<typeof RFQDraftInputSchema>,
): Promise<AIInsightOutput> {
    const correlationId = crypto.randomUUID();
    aiLogger.info(`[${correlationId}] generateRFQDraft`, { userId, item: input.itemName });

    const prompt = `Draft a professional RFQ (Request for Quotation) message for the following:

Item: ${input.itemName}
Quantity: ${input.quantity}
${input.requirements ? `Requirements: ${input.requirements}` : ''}
${input.deliveryTimeline ? `Delivery Timeline: ${input.deliveryTimeline}` : ''}
${input.budget ? `Budget Range: ${input.budget}` : ''}

Generate:
- A professional summary of the RFQ
- Key insights about what makes a good RFQ for this type of item
- Potential risks (supply chain, pricing, quality)
- Recommended actions before sending the RFQ

In the summary field, include the full draft RFQ message text that the buyer can send to suppliers.`;

    const request: AIRequest = {
        prompt,
        userId,
        promptType: 'general',
        language: input.language || 'en',
    };

    const response = await routeRequest(request);

    if (!response.success || !response.content) {
        throw new Error(response.error || 'AI processing failed');
    }

    try {
        return parseAIResponse(response.content);
    } catch {
        aiLogger.warn(`[${correlationId}] Failed to parse structured response for RFQ draft`);
        return {
            summary: response.content.slice(0, 1000),
            insights: [],
            risks: [],
            recommendedActions: [],
            confidence: 0.3,
            dataUsed: ['raw_response'],
        };
    }
}

export async function generateQuoteComparison(
    userId: string,
    input: z.infer<typeof QuoteCompareInputSchema>,
): Promise<AIInsightOutput> {
    const correlationId = crypto.randomUUID();
    aiLogger.info(`[${correlationId}] generateQuoteComparison`, { userId, rfqId: input.rfqId });

    const { rfq, quotes } = await fetchQuotesForRFQ(input.rfqId);

    if (!rfq) throw new Error('RFQ not found');
    if (quotes.length === 0) throw new Error('No quotes found for this RFQ');

    const redactedData = redactSensitiveData(JSON.stringify({ rfq, quotes }));

    const prompt = `Compare these quotes for an RFQ and help the buyer make the best decision.

${redactedData}

Analyze:
- Price competitiveness (unit price, total, discounts)
- Delivery timelines
- Overall value proposition per supplier
- Identify the best value quote and explain why

Provide clear recommendations on which quote to accept, risks of each option, and negotiation strategies.`;

    const request: AIRequest = {
        prompt,
        userId,
        promptType: 'analysis',
        language: input.language || 'en',
    };

    const response = await routeRequest(request);

    if (!response.success || !response.content) {
        throw new Error(response.error || 'AI processing failed');
    }

    try {
        return parseAIResponse(response.content);
    } catch {
        aiLogger.warn(`[${correlationId}] Failed to parse structured response for quote comparison`);
        return {
            summary: response.content.slice(0, 500),
            insights: [],
            risks: [],
            recommendedActions: [],
            confidence: 0.3,
            dataUsed: ['raw_response'],
        };
    }
}

export async function generateWorkspaceSummary(
    userId: string,
    input: z.infer<typeof WorkspaceSummaryInputSchema>,
    portalAuth: { buyerId?: string; sellerId?: string },
): Promise<AIInsightOutput> {
    const correlationId = crypto.randomUUID();
    const period = input.period || '30d';
    aiLogger.info(`[${correlationId}] generateWorkspaceSummary for ${input.role} (${period})`, { userId });

    const dataSummary = input.role === 'buyer'
        ? await fetchBuyerData(portalAuth.buyerId || userId, period)
        : await fetchSellerData(portalAuth.sellerId || userId, period);

    const redactedData = redactSensitiveData(JSON.stringify(dataSummary));

    const prompt = `Generate a concise workspace summary for this ${input.role} over the last ${period}.

${redactedData}

Create a comprehensive summary including:
- Key metrics and their trends
- Notable insights (what's going well, what needs attention)
- Any risks or issues requiring immediate action
- Recommended next steps to improve business performance`;

    const request: AIRequest = {
        prompt,
        userId,
        promptType: 'analysis',
        language: input.language || 'en',
    };

    const response = await routeRequest(request);

    if (!response.success || !response.content) {
        throw new Error(response.error || 'AI processing failed');
    }

    try {
        return parseAIResponse(response.content);
    } catch {
        aiLogger.warn(`[${correlationId}] Failed to parse structured response for workspace summary`);
        return {
            summary: response.content.slice(0, 500),
            insights: [],
            risks: [],
            recommendedActions: [],
            confidence: 0.3,
            dataUsed: ['raw_response'],
        };
    }
}

// ============================================================================
// Order Summary — AI analysis of a single order
// ============================================================================

export async function generateOrderSummary(
    userId: string,
    input: z.infer<typeof OrderSummaryInputSchema>,
    portalAuth: { buyerId?: string; sellerId?: string; portalRole?: string },
): Promise<AIInsightOutput> {
    const correlationId = crypto.randomUUID();
    aiLogger.info(`[${correlationId}] generateOrderSummary`, { userId, orderId: input.orderId });

    const order = await prisma.marketplaceOrder.findFirst({
        where: {
            id: input.orderId,
            ...(portalAuth.buyerId ? { buyerId: portalAuth.buyerId } : {}),
            ...(portalAuth.sellerId ? { sellerId: portalAuth.sellerId } : {}),
        },
        select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            fulfillmentStatus: true,
            totalPrice: true,
            unitPrice: true,
            quantity: true,
            itemName: true,
            itemSku: true,
            buyerName: true,
            currency: true,
            source: true,
            createdAt: true,
            confirmedAt: true,
            shippedAt: true,
            deliveredAt: true,
            cancelledAt: true,
            trackingNumber: true,
            carrier: true,
            buyerNotes: true,
            sellerNotes: true,
        },
    });

    if (!order) throw new Error('Order not found');

    const redactedData = redactSensitiveData(JSON.stringify(order));
    const role = portalAuth.portalRole || (portalAuth.buyerId ? 'buyer' : 'seller');

    const prompt = `Analyze this marketplace order from a ${role} perspective and provide actionable insights.

Order Data:
${redactedData}

Provide:
- A concise summary of the order status and key facts
- Insights about timing, pricing, and fulfillment
- Any risks (delays, payment issues, fulfillment gaps)
- Recommended next actions for the ${role}`;

    const request: AIRequest = {
        prompt,
        userId,
        promptType: 'analysis',
        language: input.language || 'en',
    };

    const response = await routeRequest(request);

    if (!response.success || !response.content) {
        throw new Error(response.error || 'AI processing failed');
    }

    let result: AIInsightOutput;
    try {
        result = parseAIResponse(response.content);
    } catch {
        aiLogger.warn(`[${correlationId}] Failed to parse order summary response`);
        result = {
            summary: response.content.slice(0, 500),
            insights: [],
            risks: [],
            recommendedActions: [],
            confidence: 0.3,
            dataUsed: ['raw_response'],
        };
    }

    // Auto-emit insight event
    try {
        await createInsightEvent(userId, {
            role: role as 'buyer' | 'seller',
            entityType: 'order',
            entityId: input.orderId,
            insightType: 'order_summary',
            title: `Order ${order.orderNumber} Summary`,
            summary: result.summary,
            severity: result.risks.length > 0 ? 'warning' : 'info',
            confidence: result.confidence,
            payload: JSON.stringify(result),
        });
    } catch (err) {
        aiLogger.warn(`[${correlationId}] Failed to emit insight event`, err);
    }

    return result;
}

// ============================================================================
// Invoice Risk — AI risk assessment of a single invoice
// ============================================================================

export async function generateInvoiceRisk(
    userId: string,
    input: z.infer<typeof InvoiceRiskInputSchema>,
    portalAuth: { buyerId?: string; sellerId?: string; portalRole?: string },
): Promise<AIInsightOutput> {
    const correlationId = crypto.randomUUID();
    aiLogger.info(`[${correlationId}] generateInvoiceRisk`, { userId, invoiceId: input.invoiceId });

    const invoice = await prisma.marketplaceInvoice.findFirst({
        where: {
            id: input.invoiceId,
            ...(portalAuth.buyerId ? { buyerId: portalAuth.buyerId } : {}),
            ...(portalAuth.sellerId ? { sellerId: portalAuth.sellerId } : {}),
        },
        select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
            dueDate: true,
            issuedAt: true,
            paidAt: true,
            buyerId: true,
            sellerId: true,
            createdAt: true,
        },
    });

    if (!invoice) throw new Error('Invoice not found');

    const redactedData = redactSensitiveData(JSON.stringify(invoice));
    const role = portalAuth.portalRole || (portalAuth.buyerId ? 'buyer' : 'seller');

    const now = new Date();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const isOverdue = dueDate && dueDate < now && invoice.status !== 'paid';
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const prompt = `Analyze this invoice from a ${role} perspective and assess payment risks.

Invoice Data:
${redactedData}

Additional context:
- Current date: ${now.toISOString().split('T')[0]}
${dueDate ? `- Due date: ${dueDate.toISOString().split('T')[0]}` : '- No due date set'}
${isOverdue ? `- OVERDUE by ${Math.abs(daysUntilDue || 0)} days` : ''}
${daysUntilDue !== null && daysUntilDue > 0 ? `- ${daysUntilDue} days until due` : ''}

Provide:
- Summary of invoice status and payment risk level
- Insights about timing and payment patterns
- Risks (overdue, approaching due date, large amount)
- Recommended actions (follow up, schedule payment, etc.)`;

    const request: AIRequest = {
        prompt,
        userId,
        promptType: 'analysis',
        language: input.language || 'en',
    };

    const response = await routeRequest(request);

    if (!response.success || !response.content) {
        throw new Error(response.error || 'AI processing failed');
    }

    let result: AIInsightOutput;
    try {
        result = parseAIResponse(response.content);
    } catch {
        aiLogger.warn(`[${correlationId}] Failed to parse invoice risk response`);
        result = {
            summary: response.content.slice(0, 500),
            insights: [],
            risks: [],
            recommendedActions: [],
            confidence: 0.3,
            dataUsed: ['raw_response'],
        };
    }

    // Determine severity based on risks
    let severity: 'info' | 'warning' | 'critical' = 'info';
    if (isOverdue) severity = 'critical';
    else if (result.risks.length > 0) severity = 'warning';

    // Auto-emit insight event
    try {
        await createInsightEvent(userId, {
            role: role as 'buyer' | 'seller',
            entityType: 'invoice',
            entityId: input.invoiceId,
            insightType: 'invoice_risk',
            title: `Invoice ${invoice.invoiceNumber} Risk Assessment`,
            summary: result.summary,
            severity,
            confidence: result.confidence,
            payload: JSON.stringify(result),
        });
    } catch (err) {
        aiLogger.warn(`[${correlationId}] Failed to emit insight event`, err);
    }

    return result;
}
