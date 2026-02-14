import express, { Response } from 'express';
import { DocPage } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Input validation schemas
const createPageSchema = z.object({
    roomId: z.string().uuid().optional().nullable(),
    boardId: z.string().uuid().optional().nullable(),
    title: z.string().max(500).optional(),
    parentId: z.string().uuid().optional().nullable(),
    icon: z.string().max(100).optional(),
}).refine(data => data.roomId || data.boardId, {
    message: 'Either roomId or boardId is required',
});

const updatePageSchema = z.object({
    title: z.string().max(500).optional(),
    content: z.string().max(500000).optional(), // 500KB limit
    icon: z.string().max(100).optional(),
    coverImage: z.string().max(2000).optional(),
    parentId: z.string().uuid().optional().nullable(),
    order: z.number().int().min(0).optional(),
});

// Helper to verify user has access to board's workspace
async function verifyBoardAccess(userId: string, boardId: string): Promise<boolean> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board || !board.workspaceId) return false;

    const workspace = await prisma.workspace.findFirst({
        where: {
            id: board.workspaceId,
            OR: [
                { ownerId: userId },
                { users: { some: { id: userId } } }
            ]
        }
    });
    return !!workspace;
}

// Helper to verify user owns the room
async function verifyRoomAccess(userId: string, roomId: string): Promise<boolean> {
    const room = await prisma.room.findUnique({
        where: { id: roomId }
    });
    if (!room) return false;

    // Room is owned by user directly
    return room.userId === userId;
}

// Helper to verify page access via its container (room or board)
async function verifyPageAccess(userId: string, pageId: string): Promise<{ hasAccess: boolean; page: DocPage | null }> {
    const page = await prisma.docPage.findUnique({ where: { id: pageId } });
    if (!page) return { hasAccess: false, page: null };

    let hasAccess = false;
    if (page.roomId) {
        hasAccess = await verifyRoomAccess(userId, page.roomId);
    } else if (page.boardId) {
        hasAccess = await verifyBoardAccess(userId, page.boardId);
    }

    return { hasAccess, page };
}

// Get all pages for a room or board
router.get('/:containerId', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const containerId = req.params.containerId as string;

        // Check access to the container (try board first, then room)
        let hasAccess = await verifyBoardAccess(userId, containerId);
        if (!hasAccess) {
            hasAccess = await verifyRoomAccess(userId, containerId);
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const pages = await prisma.docPage.findMany({
            where: {
                OR: [
                    { roomId: containerId },
                    { boardId: containerId }
                ]
            },
            orderBy: { order: 'asc' }
        });
        res.json(pages);
    } catch (e) {
        apiLogger.error('Failed to fetch docs', e);
        res.status(500).json({ error: 'Failed to fetch docs' });
    }
});

// Get single page
router.get('/page/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const { hasAccess, page } = await verifyPageAccess(userId, id);

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(page);
    } catch (e) {
        apiLogger.error('Failed to fetch page', e);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

// Create new page
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createPageSchema.parse(req.body);

        // Verify access to the container
        let hasAccess = false;
        if (data.boardId) {
            hasAccess = await verifyBoardAccess(userId, data.boardId);
        } else if (data.roomId) {
            hasAccess = await verifyRoomAccess(userId, data.roomId);
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const idFilter = data.roomId ? { roomId: data.roomId } : { boardId: data.boardId };

        const count = await prisma.docPage.count({
            where: {
                ...idFilter,
                parentId: data.parentId || null
            }
        });

        const page = await prisma.docPage.create({
            data: {
                roomId: data.roomId || null,
                boardId: data.boardId || null,
                title: data.title || 'Untitled',
                parentId: data.parentId || null,
                icon: data.icon,
                order: count + 1
            }
        });
        res.json(page);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: e.issues });
        }
        apiLogger.error('Create Page Error', e);
        res.status(500).json({ error: 'Failed to create page' });
    }
});

// Update page (Auto-save)
router.patch('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const data = updatePageSchema.parse(req.body);

        const { hasAccess, page: existingPage } = await verifyPageAccess(userId, id);

        if (!existingPage) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const page = await prisma.docPage.update({
            where: { id },
            data: {
                title: data.title,
                content: data.content,
                icon: data.icon,
                coverImage: data.coverImage,
                parentId: data.parentId,
                order: data.order
            }
        });
        res.json(page);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: e.issues });
        }
        apiLogger.error('Failed to update page', e);
        res.status(500).json({ error: 'Failed to update page' });
    }
});

// Delete page
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const { hasAccess, page } = await verifyPageAccess(userId, id);

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.docPage.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        apiLogger.error('Failed to delete page', e);
        res.status(500).json({ error: 'Failed to delete page' });
    }
});

export default router;
