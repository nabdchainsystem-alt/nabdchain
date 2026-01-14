import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all pages for a room (or for the user if we want a global list, but usually scoped to room)
// For now, let's assume `roomId` is passed as query param or we fetch all for user's workspace?
// The current UI seems to imply "Inbox" and "Projects" which might be workspace-level or room-level.
// Given `Room` model exists, let's assume these docs belong to a Room.

// Get all pages for a room or board
router.get('/:containerId', requireAuth, async (req: any, res) => {
    try {
        const { containerId } = req.params;
        // Try to match either roomId or boardId
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
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch docs' });
    }
});

// Get single page
router.get('/page/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        const page = await prisma.docPage.findUnique({ where: { id } });
        if (!page) return res.status(404).json({ error: 'Page not found' });
        res.json(page);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

// Create new page
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const { roomId, boardId, title, parentId, icon } = req.body;

        // Ensure at least one ID is present
        if (!roomId && !boardId) {
            return res.status(400).json({ error: 'roomId or boardId is required' });
        }

        const idFilter = roomId ? { roomId } : { boardId };

        const count = await prisma.docPage.count({
            where: {
                ...idFilter,
                parentId: parentId || null
            }
        });

        const page = await prisma.docPage.create({
            data: {
                roomId: roomId || null,
                boardId: boardId || null, // Handles optional board link
                title: title || 'Untitled',
                parentId: parentId || null,
                icon,
                order: count + 1
            }
        });
        res.json(page);
    } catch (e) {
        console.error('Create Page Error', e);
        res.status(500).json({ error: 'Failed to create page' });
    }
});

// Update page (Auto-save)
router.patch('/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { title, content, icon, coverImage, parentId, order } = req.body;

        const page = await prisma.docPage.update({
            where: { id },
            data: {
                title,
                content,
                icon,
                coverImage,
                parentId,
                order
            }
        });
        res.json(page);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update page' });
    }
});

// Delete page
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        await prisma.docPage.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete page' });
    }
});

export default router;
