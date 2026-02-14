/**
 * Workspace Intelligence Service
 *
 * CRUD + feed queries for WorkspaceInsightEvent.
 * Each event captures an AI analysis result surfaced in workspace feeds.
 */
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { aiLogger } from '../utils/logger';

// ============================================================================
// Input Schemas
// ============================================================================

export const CreateEventSchema = z.object({
    role: z.enum(['buyer', 'seller']),
    entityType: z.enum(['order', 'invoice', 'rfq', 'workspace']),
    entityId: z.string().optional(),
    insightType: z.enum(['order_summary', 'invoice_risk', 'general_insight', 'workspace_summary']),
    title: z.string().min(1).max(500),
    summary: z.string().min(1).max(5000),
    severity: z.enum(['info', 'warning', 'critical']).optional(),
    confidence: z.number().min(0).max(1).optional(),
    payload: z.string().optional(),
});

export const FeedQuerySchema = z.object({
    role: z.enum(['buyer', 'seller']),
    status: z.enum(['active', 'resolved', 'dismissed']).optional(),
    entityType: z.enum(['order', 'invoice', 'rfq', 'workspace']).optional(),
    insightType: z.enum(['order_summary', 'invoice_risk', 'general_insight', 'workspace_summary']).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().datetime({ offset: true }).optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type FeedQueryInput = z.infer<typeof FeedQuerySchema>;

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Create a new workspace insight event
 */
export async function createInsightEvent(
    userId: string,
    input: CreateEventInput,
) {
    aiLogger.info('[Intelligence] Creating insight event', {
        userId,
        insightType: input.insightType,
        entityType: input.entityType,
    });

    return prisma.workspaceInsightEvent.create({
        data: {
            userId,
            role: input.role,
            entityType: input.entityType,
            entityId: input.entityId,
            insightType: input.insightType,
            title: input.title,
            summary: input.summary,
            severity: input.severity || 'info',
            confidence: input.confidence ?? 0.5,
            payload: input.payload,
        },
    });
}

/**
 * Get paginated feed of insight events for a user
 */
export async function getInsightFeed(
    userId: string,
    input: FeedQueryInput,
) {
    const limit = input.limit || 20;

    const where: Record<string, unknown> = {
        userId,
        role: input.role,
    };

    if (input.status) {
        where.status = input.status;
    }
    if (input.entityType) {
        where.entityType = input.entityType;
    }
    if (input.insightType) {
        where.insightType = input.insightType;
    }
    if (input.cursor) {
        where.createdAt = { lt: new Date(input.cursor) };
    }

    const events = await prisma.workspaceInsightEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Fetch one extra for cursor
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return { items, nextCursor, hasMore };
}

/**
 * Get a single insight event by ID
 */
export async function getInsightEvent(eventId: string, userId: string) {
    return prisma.workspaceInsightEvent.findFirst({
        where: { id: eventId, userId },
    });
}

/**
 * Resolve an insight event (mark as handled)
 */
export async function resolveInsightEvent(eventId: string, userId: string) {
    const event = await prisma.workspaceInsightEvent.findFirst({
        where: { id: eventId, userId },
    });

    if (!event) return null;

    return prisma.workspaceInsightEvent.update({
        where: { id: eventId },
        data: {
            status: 'resolved',
            resolvedAt: new Date(),
            resolvedBy: userId,
        },
    });
}

/**
 * Dismiss an insight event (hide from feed)
 */
export async function dismissInsightEvent(eventId: string, userId: string) {
    const event = await prisma.workspaceInsightEvent.findFirst({
        where: { id: eventId, userId },
    });

    if (!event) return null;

    return prisma.workspaceInsightEvent.update({
        where: { id: eventId },
        data: { status: 'dismissed' },
    });
}

/**
 * Count active insight events for a user (for badge counts)
 */
export async function countActiveInsights(userId: string, role: string) {
    return prisma.workspaceInsightEvent.count({
        where: { userId, role, status: 'active' },
    });
}
