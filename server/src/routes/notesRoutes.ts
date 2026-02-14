import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { Prisma, QuickNote } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = Router();

// Schema for creating/updating notes
const createNoteSchema = z.object({
    content: z.string().min(1).max(10000),
    tags: z.array(z.string()).optional(),
    pinned: z.boolean().optional(),
    clientId: z.string().uuid().optional(),
});

const updateNoteSchema = createNoteSchema.partial().extend({
    version: z.number().int().optional(),
});

// Helper to serialize note for response
function serializeNote(note: QuickNote) {
    return {
        ...note,
        deletedAt: note.deletedAt?.getTime() || null,
        createdAt: note.createdAt.getTime(),
        updatedAt: note.updatedAt.getTime(),
        tags: note.tags ? JSON.parse(note.tags) : [],
    };
}

// GET all notes for the user
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { includeDeleted } = req.query;

        const where: Prisma.QuickNoteWhereInput = { userId };
        if (includeDeleted !== 'true') where.isDeleted = false;

        const notes = await prisma.quickNote.findMany({
            where,
            orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        });

        res.json(notes.map(serializeNote));
    } catch (error) {
        apiLogger.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// GET single note
router.get('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const note = await prisma.quickNote.findFirst({
            where: { id, userId },
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json(serializeNote(note));
    } catch (error) {
        apiLogger.error('Error fetching note:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
});

// CREATE a new note
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createNoteSchema.parse(req.body);

        const note = await prisma.quickNote.create({
            data: {
                userId,
                content: data.content,
                tags: data.tags ? JSON.stringify(data.tags) : null,
                pinned: data.pinned || false,
                clientId: data.clientId,
            },
        });

        res.status(201).json(serializeNote(note));
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// UPDATE a note
router.put('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const data = updateNoteSchema.parse(req.body);

        // Verify ownership
        const existing = await prisma.quickNote.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Optimistic locking
        if (data.version !== undefined && existing.version !== data.version) {
            return res.status(409).json({
                error: 'Conflict: note has been modified',
                serverVersion: existing.version,
                serverNote: serializeNote(existing),
            });
        }

        const updateData: Prisma.QuickNoteUpdateInput = { version: existing.version + 1 };
        if (data.content !== undefined) updateData.content = data.content;
        if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
        if (data.pinned !== undefined) updateData.pinned = data.pinned;

        const note = await prisma.quickNote.update({
            where: { id },
            data: updateData,
        });

        res.json(serializeNote(note));
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// DELETE (soft delete) a note
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { hard } = req.query;

        const existing = await prisma.quickNote.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (hard === 'true') {
            await prisma.quickNote.delete({ where: { id } });
        } else {
            await prisma.quickNote.update({
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
        apiLogger.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// Toggle pin status
router.patch('/:id/pin', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const existing = await prisma.quickNote.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const note = await prisma.quickNote.update({
            where: { id },
            data: {
                pinned: !existing.pinned,
                version: existing.version + 1,
            },
        });

        res.json(serializeNote(note));
    } catch (error) {
        apiLogger.error('Error toggling pin:', error);
        res.status(500).json({ error: 'Failed to toggle pin' });
    }
});

// GET changes since last sync
router.get('/sync/changes', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { since } = req.query;

        const sinceDate = since ? new Date(parseInt(since as string)) : new Date(0);

        const notes = await prisma.quickNote.findMany({
            where: {
                userId,
                updatedAt: { gt: sinceDate },
            },
            orderBy: { updatedAt: 'asc' },
        });

        res.json({
            items: notes.map(serializeNote),
            serverTime: Date.now(),
        });
    } catch (error) {
        apiLogger.error('Error fetching note sync changes:', error);
        res.status(500).json({ error: 'Failed to fetch sync changes' });
    }
});

export default router;
