import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /?boardId=...
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const { boardId } = req.query;
        const userId = req.auth.userId;

        const where: any = {};
        if (boardId) {
            where.boardId = String(boardId);
        } else {
            // For safety, only show threads from boards the user owns
            where.board = { userId };
        }

        const threads = await prisma.thread.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                board: true
            }
        });

        const parsedThreads = threads.map(t => ({
            ...t,
            messages: t.messages ? JSON.parse(t.messages) : []
        }));

        res.json(parsedThreads);
    } catch (error) {
        console.error("Get Threads Error:", error);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

// POST /
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const { boardId, title, preview, messages } = req.body;

        const thread = await prisma.thread.create({
            data: {
                boardId,
                title,
                preview,
                messages: JSON.stringify(messages || []),
                // Ensure we handle updated details
                updatedAt: new Date()
            }
        });
        res.json({ ...thread, messages: messages || [] });
    } catch (error) {
        console.error("Create Thread Error:", error);
        res.status(500).json({ error: "Failed to create thread" });
    }
});

// PUT /:id
router.put('/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { title, preview, messages } = req.body;
        const data: any = {};
        if (title) data.title = title;
        if (preview) data.preview = preview;
        if (messages) data.messages = JSON.stringify(messages);

        data.updatedAt = new Date();

        const thread = await prisma.thread.update({
            where: { id },
            data
        });
        res.json({ ...thread, messages: JSON.parse(thread.messages) });
    } catch (error) {
        console.error("Update Thread Error:", error);
        res.status(500).json({ error: "Failed to update thread" });
    }
});

// DELETE /:id
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        await prisma.thread.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

export default router;
