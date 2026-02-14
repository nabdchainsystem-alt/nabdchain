import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, GTDItem } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = Router();

// GTD Categories
const gtdCategoryEnum = z.enum([
    'inbox', 'projects', 'nextActions', 'waitingFor',
    'scheduled', 'someday', 'reference', 'completed'
]);

// Schema for creating GTD items
const createGTDItemSchema = z.object({
    title: z.string().min(1).max(500),
    category: gtdCategoryEnum,
    boardId: z.string().optional(),
    scheduledAt: z.number().optional(), // Unix timestamp
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string()).optional(),
    clientId: z.string().uuid().optional(),
});

// Schema for updating GTD items
const updateGTDItemSchema = createGTDItemSchema.partial().extend({
    version: z.number().int().optional(),
    completedAt: z.number().optional(),
});

// Schema for sync push
const syncPushSchema = z.object({
    items: z.array(z.object({
        clientId: z.string(),
        title: z.string().min(1).max(500),
        category: gtdCategoryEnum,
        scheduledAt: z.number().optional(),
        notes: z.string().max(5000).optional(),
        tags: z.array(z.string()).optional(),
        isDeleted: z.boolean().optional(),
        version: z.number().int().optional(),
        updatedAt: z.number(),
    })),
    boardId: z.string().optional(),
    lastSyncedAt: z.number().optional(),
});

// Helper to serialize GTD item for response
function serializeGTDItem(item: GTDItem) {
    return {
        ...item,
        scheduledAt: item.scheduledAt?.getTime() || null,
        completedAt: item.completedAt?.getTime() || null,
        deletedAt: item.deletedAt?.getTime() || null,
        createdAt: item.createdAt.getTime(),
        updatedAt: item.updatedAt.getTime(),
        tags: item.tags ? JSON.parse(item.tags) : [],
    };
}

// GET all GTD items for the user
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { boardId, category, includeDeleted } = req.query;

        const where: Prisma.GTDItemWhereInput = { userId };
        if (boardId) where.boardId = boardId as string;
        if (category) where.category = category as string;
        if (includeDeleted !== 'true') where.isDeleted = false;

        const items = await prisma.gTDItem.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json(items.map(serializeGTDItem));
    } catch (error) {
        apiLogger.error('Error fetching GTD items:', error);
        res.status(500).json({ error: 'Failed to fetch GTD items' });
    }
});

// GET single GTD item
router.get('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const item = await prisma.gTDItem.findFirst({
            where: { id, userId },
        });

        if (!item) {
            return res.status(404).json({ error: 'GTD item not found' });
        }

        res.json(serializeGTDItem(item));
    } catch (error) {
        apiLogger.error('Error fetching GTD item:', error);
        res.status(500).json({ error: 'Failed to fetch GTD item' });
    }
});

// CREATE a new GTD item
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createGTDItemSchema.parse(req.body);

        const item = await prisma.gTDItem.create({
            data: {
                userId,
                boardId: data.boardId || 'default',
                title: data.title,
                category: data.category,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                notes: data.notes,
                tags: data.tags ? JSON.stringify(data.tags) : null,
                clientId: data.clientId,
            },
        });

        res.status(201).json(serializeGTDItem(item));
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Error creating GTD item:', error);
        res.status(500).json({ error: 'Failed to create GTD item' });
    }
});

// UPDATE a GTD item
router.put('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const data = updateGTDItemSchema.parse(req.body);

        // Verify ownership
        const existing = await prisma.gTDItem.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'GTD item not found' });
        }

        // Optimistic locking: check version if provided
        if (data.version !== undefined && existing.version !== data.version) {
            return res.status(409).json({
                error: 'Conflict: item has been modified',
                serverVersion: existing.version,
                serverItem: serializeGTDItem(existing),
            });
        }

        const updateData: Prisma.GTDItemUpdateInput = { version: existing.version + 1 };
        if (data.title !== undefined) updateData.title = data.title;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
        if (data.completedAt !== undefined) updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

        const item = await prisma.gTDItem.update({
            where: { id },
            data: updateData,
        });

        res.json(serializeGTDItem(item));
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Error updating GTD item:', error);
        res.status(500).json({ error: 'Failed to update GTD item' });
    }
});

// DELETE (soft delete) a GTD item
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { hard } = req.query;

        const existing = await prisma.gTDItem.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'GTD item not found' });
        }

        if (hard === 'true') {
            await prisma.gTDItem.delete({ where: { id } });
        } else {
            await prisma.gTDItem.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    version: existing.version + 1,
                },
            });
        }

        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Error deleting GTD item:', error);
        res.status(500).json({ error: 'Failed to delete GTD item' });
    }
});

// GET changes since last sync
router.get('/sync/changes', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { since, boardId } = req.query;

        const sinceDate = since ? new Date(parseInt(since as string)) : new Date(0);

        const where: Prisma.GTDItemWhereInput = {
            userId,
            updatedAt: { gt: sinceDate },
        };
        if (boardId) where.boardId = boardId as string;

        const items = await prisma.gTDItem.findMany({
            where,
            orderBy: { updatedAt: 'asc' },
        });

        res.json({
            items: items.map(serializeGTDItem),
            serverTime: Date.now(),
        });
    } catch (error) {
        apiLogger.error('Error fetching GTD sync changes:', error);
        res.status(500).json({ error: 'Failed to fetch sync changes' });
    }
});

// POST sync - push local changes and get server changes
router.post('/sync', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = syncPushSchema.parse(req.body);

        const results: {
            created: ReturnType<typeof serializeGTDItem>[];
            updated: ReturnType<typeof serializeGTDItem>[];
            conflicts: { clientItem: typeof data.items[number]; serverItem: ReturnType<typeof serializeGTDItem>; resolution: string }[];
            deleted: string[];
        } = {
            created: [],
            updated: [],
            conflicts: [],
            deleted: [],
        };

        // Process each item
        for (const clientItem of data.items) {
            // Check if item exists by clientId
            const existing = await prisma.gTDItem.findFirst({
                where: { userId, clientId: clientItem.clientId },
            });

            if (!existing) {
                // Create new item
                if (!clientItem.isDeleted) {
                    const newItem = await prisma.gTDItem.create({
                        data: {
                            userId,
                            boardId: data.boardId || 'default',
                            clientId: clientItem.clientId,
                            title: clientItem.title,
                            category: clientItem.category,
                            scheduledAt: clientItem.scheduledAt ? new Date(clientItem.scheduledAt) : null,
                            notes: clientItem.notes,
                            tags: clientItem.tags ? JSON.stringify(clientItem.tags) : null,
                        },
                    });
                    results.created.push(serializeGTDItem(newItem));
                }
            } else {
                // Update existing item - check for conflicts
                const clientVersion = clientItem.version || 0;

                if (clientVersion < existing.version) {
                    // Conflict: server has newer version
                    results.conflicts.push({
                        clientItem,
                        serverItem: serializeGTDItem(existing),
                        resolution: 'server_wins',
                    });
                } else {
                    // Client is up-to-date or newer
                    if (clientItem.isDeleted) {
                        await prisma.gTDItem.update({
                            where: { id: existing.id },
                            data: {
                                isDeleted: true,
                                deletedAt: new Date(),
                                version: existing.version + 1,
                            },
                        });
                        results.deleted.push(existing.id);
                    } else {
                        const updated = await prisma.gTDItem.update({
                            where: { id: existing.id },
                            data: {
                                title: clientItem.title,
                                category: clientItem.category,
                                scheduledAt: clientItem.scheduledAt ? new Date(clientItem.scheduledAt) : null,
                                notes: clientItem.notes,
                                tags: clientItem.tags ? JSON.stringify(clientItem.tags) : null,
                                version: existing.version + 1,
                            },
                        });
                        results.updated.push(serializeGTDItem(updated));
                    }
                }
            }
        }

        // Get any server changes since client's last sync
        const sinceDate = data.lastSyncedAt ? new Date(data.lastSyncedAt) : new Date(0);
        const clientIds = data.items.map(i => i.clientId);

        const serverChanges = await prisma.gTDItem.findMany({
            where: {
                userId,
                boardId: data.boardId || undefined,
                updatedAt: { gt: sinceDate },
                OR: [
                    { clientId: null },
                    { clientId: { notIn: clientIds } },
                ],
            },
        });

        res.json({
            ...results,
            serverChanges: serverChanges.map(serializeGTDItem),
            serverTime: Date.now(),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Error syncing GTD items:', error);
        res.status(500).json({ error: 'Failed to sync GTD items' });
    }
});

// POST bulk create - for migration from localStorage
router.post('/bulk', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { items, boardId } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required' });
        }

        if (items.length > 1000) {
            return res.status(400).json({ error: 'Maximum 1000 items per batch' });
        }

        const created = await prisma.gTDItem.createMany({
            data: items.map((item: { id?: string; clientId?: string; title: string; category?: string; scheduledAt?: number | string; notes?: string; tags?: string[]; createdAt?: number | string }) => ({
                userId,
                boardId: boardId || 'default',
                clientId: item.id || item.clientId,
                title: item.title,
                category: item.category || 'inbox',
                scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
                notes: item.notes,
                tags: item.tags ? JSON.stringify(item.tags) : null,
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            })),
            skipDuplicates: true,
        });

        res.json({
            success: true,
            count: created.count,
            message: `Migrated ${created.count} items`,
        });
    } catch (error) {
        apiLogger.error('Error bulk creating GTD items:', error);
        res.status(500).json({ error: 'Failed to bulk create GTD items' });
    }
});

export default router;
