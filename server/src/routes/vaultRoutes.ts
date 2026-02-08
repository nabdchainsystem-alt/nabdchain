import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = Router();

// Schema for creating/updating vault items
const vaultItemSchema = z.object({
    title: z.string().min(1).max(255),
    type: z.enum(['folder', 'file', 'image', 'note', 'weblink', 'document']),
    subtitle: z.string().max(500).optional(),
    content: z.string().max(10000000).optional(), // 10MB limit for content
    metadata: z.string().max(10000).optional(),
    isFavorite: z.boolean().optional(),
    folderId: z.string().uuid().optional().nullable(),
    color: z.string().max(50).optional(),
});

// GET all items for the user
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const items = await prisma.vaultItem.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(items);
    } catch (error) {
        apiLogger.error('Error fetching vault items:', error);
        res.status(500).json({ error: 'Failed to fetch vault items' });
    }
});

// CREATE a new item
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = vaultItemSchema.parse(req.body);

        const newItem = await prisma.vaultItem.create({
            data: {
                ...data,
                userId,
                folderId: data.folderId || null,
            },
        });
        res.json(newItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Error creating vault item:', error);
        res.status(500).json({ error: 'Failed to create vault item' });
    }
});

// UPDATE an item
router.put('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const data = vaultItemSchema.partial().parse(req.body);

        // Verify ownership before update
        const existing = await prisma.vaultItem.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const updatedItem = await prisma.vaultItem.update({
            where: { id },
            data: {
                ...data,
                folderId: data.folderId === undefined ? undefined : (data.folderId || null),
            },
        });
        res.json(updatedItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Error updating vault item:', error);
        res.status(500).json({ error: 'Failed to update vault item' });
    }
});

// DELETE an item
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify ownership before delete
        const existing = await prisma.vaultItem.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await prisma.vaultItem.delete({
            where: { id },
        });
        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Error deleting vault item:', error);
        res.status(500).json({ error: 'Failed to delete vault item' });
    }
});

export default router;
