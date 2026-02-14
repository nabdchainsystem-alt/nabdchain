/**
 * Tests for Workspace Intelligence Service
 * - createInsightEvent
 * - getInsightFeed (pagination, filters)
 * - getInsightEvent
 * - resolveInsightEvent
 * - dismissInsightEvent
 * - countActiveInsights
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../setup';

vi.mock('../../lib/prisma', () => ({
    prisma: prismaMock,
    default: prismaMock,
}));

vi.mock('../../utils/logger', () => ({
    aiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
    createInsightEvent,
    getInsightFeed,
    getInsightEvent,
    resolveInsightEvent,
    dismissInsightEvent,
    countActiveInsights,
} from '../../services/workspaceIntelligenceService';

// ============================================================================
// Test Data
// ============================================================================

const MOCK_EVENT = {
    id: 'evt-1',
    userId: 'user-1',
    role: 'buyer',
    entityType: 'order',
    entityId: 'order-1',
    insightType: 'order_summary',
    title: 'Order ORD-001 Summary',
    summary: 'This order is progressing well.',
    severity: 'info',
    confidence: 0.85,
    payload: JSON.stringify({ summary: 'test' }),
    status: 'active',
    resolvedAt: null,
    resolvedBy: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
};

// ============================================================================
// createInsightEvent
// ============================================================================

describe('createInsightEvent', () => {
    beforeEach(() => resetMocks());

    it('should create an event with all fields', async () => {
        prismaMock.workspaceInsightEvent.create.mockResolvedValue(MOCK_EVENT);

        const result = await createInsightEvent('user-1', {
            role: 'buyer',
            entityType: 'order',
            entityId: 'order-1',
            insightType: 'order_summary',
            title: 'Order ORD-001 Summary',
            summary: 'This order is progressing well.',
            severity: 'info',
            confidence: 0.85,
            payload: JSON.stringify({ summary: 'test' }),
        });

        expect(result).toEqual(MOCK_EVENT);
        expect(prismaMock.workspaceInsightEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-1',
                role: 'buyer',
                entityType: 'order',
                entityId: 'order-1',
                insightType: 'order_summary',
                title: 'Order ORD-001 Summary',
            }),
        });
    });

    it('should use default severity and confidence when not provided', async () => {
        prismaMock.workspaceInsightEvent.create.mockResolvedValue(MOCK_EVENT);

        await createInsightEvent('user-1', {
            role: 'seller',
            entityType: 'workspace',
            insightType: 'workspace_summary',
            title: 'Summary',
            summary: 'Test summary',
        });

        expect(prismaMock.workspaceInsightEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                severity: 'info',
                confidence: 0.5,
            }),
        });
    });
});

// ============================================================================
// getInsightFeed
// ============================================================================

describe('getInsightFeed', () => {
    beforeEach(() => resetMocks());

    it('should return paginated feed with hasMore=false when under limit', async () => {
        prismaMock.workspaceInsightEvent.findMany.mockResolvedValue([MOCK_EVENT]);

        const result = await getInsightFeed('user-1', { role: 'buyer' });

        expect(result.items).toHaveLength(1);
        expect(result.hasMore).toBe(false);
        expect(result.nextCursor).toBeNull();
    });

    it('should return hasMore=true when more items exist', async () => {
        // Return limit+1 items (default limit is 20)
        const items = Array.from({ length: 21 }, (_, i) => ({
            ...MOCK_EVENT,
            id: `evt-${i}`,
            createdAt: new Date(Date.now() - i * 3600000),
        }));
        prismaMock.workspaceInsightEvent.findMany.mockResolvedValue(items);

        const result = await getInsightFeed('user-1', { role: 'buyer' });

        expect(result.items).toHaveLength(20);
        expect(result.hasMore).toBe(true);
        expect(result.nextCursor).toBeDefined();
    });

    it('should filter by status', async () => {
        prismaMock.workspaceInsightEvent.findMany.mockResolvedValue([]);

        await getInsightFeed('user-1', { role: 'buyer', status: 'resolved' });

        expect(prismaMock.workspaceInsightEvent.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: 'resolved' }),
            }),
        );
    });

    it('should filter by entityType', async () => {
        prismaMock.workspaceInsightEvent.findMany.mockResolvedValue([]);

        await getInsightFeed('user-1', { role: 'seller', entityType: 'invoice' });

        expect(prismaMock.workspaceInsightEvent.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ entityType: 'invoice' }),
            }),
        );
    });

    it('should filter by insightType', async () => {
        prismaMock.workspaceInsightEvent.findMany.mockResolvedValue([]);

        await getInsightFeed('user-1', { role: 'buyer', insightType: 'invoice_risk' });

        expect(prismaMock.workspaceInsightEvent.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ insightType: 'invoice_risk' }),
            }),
        );
    });

    it('should apply cursor-based pagination', async () => {
        prismaMock.workspaceInsightEvent.findMany.mockResolvedValue([]);
        const cursor = '2024-01-10T10:00:00.000Z';

        await getInsightFeed('user-1', { role: 'buyer', cursor });

        expect(prismaMock.workspaceInsightEvent.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    createdAt: { lt: new Date(cursor) },
                }),
            }),
        );
    });

    it('should respect custom limit', async () => {
        prismaMock.workspaceInsightEvent.findMany.mockResolvedValue([]);

        await getInsightFeed('user-1', { role: 'buyer', limit: 5 });

        expect(prismaMock.workspaceInsightEvent.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 6 }), // limit + 1 for cursor
        );
    });
});

// ============================================================================
// getInsightEvent
// ============================================================================

describe('getInsightEvent', () => {
    beforeEach(() => resetMocks());

    it('should return event when found', async () => {
        prismaMock.workspaceInsightEvent.findFirst.mockResolvedValue(MOCK_EVENT);

        const result = await getInsightEvent('evt-1', 'user-1');

        expect(result).toEqual(MOCK_EVENT);
        expect(prismaMock.workspaceInsightEvent.findFirst).toHaveBeenCalledWith({
            where: { id: 'evt-1', userId: 'user-1' },
        });
    });

    it('should return null when not found', async () => {
        prismaMock.workspaceInsightEvent.findFirst.mockResolvedValue(null);

        const result = await getInsightEvent('nonexistent', 'user-1');

        expect(result).toBeNull();
    });
});

// ============================================================================
// resolveInsightEvent
// ============================================================================

describe('resolveInsightEvent', () => {
    beforeEach(() => resetMocks());

    it('should resolve an existing event', async () => {
        prismaMock.workspaceInsightEvent.findFirst.mockResolvedValue(MOCK_EVENT);
        prismaMock.workspaceInsightEvent.update.mockResolvedValue({
            ...MOCK_EVENT,
            status: 'resolved',
            resolvedAt: new Date(),
            resolvedBy: 'user-1',
        });

        const result = await resolveInsightEvent('evt-1', 'user-1');

        expect(result?.status).toBe('resolved');
        expect(result?.resolvedBy).toBe('user-1');
        expect(prismaMock.workspaceInsightEvent.update).toHaveBeenCalledWith({
            where: { id: 'evt-1' },
            data: expect.objectContaining({
                status: 'resolved',
                resolvedBy: 'user-1',
            }),
        });
    });

    it('should return null for non-existent event', async () => {
        prismaMock.workspaceInsightEvent.findFirst.mockResolvedValue(null);

        const result = await resolveInsightEvent('nonexistent', 'user-1');

        expect(result).toBeNull();
        expect(prismaMock.workspaceInsightEvent.update).not.toHaveBeenCalled();
    });
});

// ============================================================================
// dismissInsightEvent
// ============================================================================

describe('dismissInsightEvent', () => {
    beforeEach(() => resetMocks());

    it('should dismiss an existing event', async () => {
        prismaMock.workspaceInsightEvent.findFirst.mockResolvedValue(MOCK_EVENT);
        prismaMock.workspaceInsightEvent.update.mockResolvedValue({
            ...MOCK_EVENT,
            status: 'dismissed',
        });

        const result = await dismissInsightEvent('evt-1', 'user-1');

        expect(result?.status).toBe('dismissed');
        expect(prismaMock.workspaceInsightEvent.update).toHaveBeenCalledWith({
            where: { id: 'evt-1' },
            data: { status: 'dismissed' },
        });
    });

    it('should return null for non-existent event', async () => {
        prismaMock.workspaceInsightEvent.findFirst.mockResolvedValue(null);

        const result = await dismissInsightEvent('nonexistent', 'user-1');

        expect(result).toBeNull();
    });
});

// ============================================================================
// countActiveInsights
// ============================================================================

describe('countActiveInsights', () => {
    beforeEach(() => resetMocks());

    it('should count active events for user+role', async () => {
        prismaMock.workspaceInsightEvent.count.mockResolvedValue(5);

        const result = await countActiveInsights('user-1', 'buyer');

        expect(result).toBe(5);
        expect(prismaMock.workspaceInsightEvent.count).toHaveBeenCalledWith({
            where: { userId: 'user-1', role: 'buyer', status: 'active' },
        });
    });

    it('should return 0 when no events', async () => {
        prismaMock.workspaceInsightEvent.count.mockResolvedValue(0);

        const result = await countActiveInsights('user-1', 'seller');

        expect(result).toBe(0);
    });
});
