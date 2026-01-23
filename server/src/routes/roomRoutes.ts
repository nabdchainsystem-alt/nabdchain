import express, { Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const router = express.Router();

// Input validation schemas
const createRoomSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.string().max(50).optional(),
});

const createRowSchema = z.object({
    roomId: z.string().uuid(),
    content: z.record(z.string(), z.unknown()).optional(),
});

const updateRowSchema = z.object({
    content: z.record(z.string(), z.unknown()).optional(),
});

const columnStoreSchema = z.object({
    roomId: z.string().uuid(),
    columns: z.array(z.object({
        id: z.string(),
        title: z.string(),
        type: z.string(),
        width: z.number().optional(),
        options: z.array(z.any()).optional(),
    })),
});

// ============== ROOM ROUTES ==============

// GET /rooms - Get all rooms for user
router.get('/rooms', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const rooms = await prisma.room.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: { select: { rows: true } }
            }
        });

        res.json(rooms);
    } catch (error) {
        logger.error('Get Rooms Error:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// GET /rooms/:id - Get single room
router.get('/rooms/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const room = await prisma.room.findFirst({
            where: { id, userId },
            include: {
                rows: true,
                columnStores: true
            }
        });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        logger.error('Get Room Error:', error);
        res.status(500).json({ error: 'Failed to fetch room' });
    }
});

// POST /rooms - Create room
router.post('/rooms', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createRoomSchema.parse(req.body);

        const room = await prisma.room.create({
            data: {
                name: data.name,
                type: data.type || 'table',
                userId,
            }
        });

        res.json(room);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Create Room Error:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// PATCH /rooms/:id - Update room
router.patch('/rooms/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { name, type } = req.body;

        // Verify ownership
        const existing = await prisma.room.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const room = await prisma.room.update({
            where: { id },
            data: { name, type }
        });

        res.json(room);
    } catch (error) {
        logger.error('Update Room Error:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
});

// DELETE /rooms/:id - Delete room
router.delete('/rooms/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify ownership
        const existing = await prisma.room.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Room not found' });
        }

        await prisma.room.delete({ where: { id } });

        res.json({ success: true });
    } catch (error) {
        logger.error('Delete Room Error:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

// ============== ROW ROUTES ==============

// GET /rows - Get rows (with roomId query param)
router.get('/rows', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const roomIdParam = req.query.roomId;

        if (!roomIdParam || typeof roomIdParam !== 'string') {
            return res.status(400).json({ error: 'roomId query parameter is required' });
        }

        const roomId = roomIdParam as string;

        // Verify room ownership
        const room = await prisma.room.findFirst({ where: { id: roomId, userId } });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const rows = await prisma.row.findMany({
            where: { roomId },
            orderBy: { id: 'asc' }
        });

        // Parse content JSON
        const parsedRows = rows.map(row => ({
            ...row,
            content: row.content ? JSON.parse(row.content) : {}
        }));

        res.json(parsedRows);
    } catch (error) {
        logger.error('Get Rows Error:', error);
        res.status(500).json({ error: 'Failed to fetch rows' });
    }
});

// POST /rows - Create row
router.post('/rows', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createRowSchema.parse(req.body);

        // Verify room ownership
        const room = await prisma.room.findFirst({ where: { id: data.roomId, userId } });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const row = await prisma.row.create({
            data: {
                roomId: data.roomId,
                content: data.content ? JSON.stringify(data.content) : '{}'
            }
        });

        res.json({
            ...row,
            content: data.content || {}
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Create Row Error:', error);
        res.status(500).json({ error: 'Failed to create row' });
    }
});

// PATCH /rows/:id - Update row
router.patch('/rows/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const data = updateRowSchema.parse(req.body);

        // Find row and verify ownership through room
        const existing = await prisma.row.findUnique({
            where: { id },
            include: { room: true }
        });

        if (!existing || !existing.room || existing.room.userId !== userId) {
            return res.status(404).json({ error: 'Row not found' });
        }

        const row = await prisma.row.update({
            where: { id },
            data: {
                content: data.content ? JSON.stringify(data.content) : existing.content
            }
        });

        res.json({
            ...row,
            content: row.content ? JSON.parse(row.content) : {}
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Update Row Error:', error);
        res.status(500).json({ error: 'Failed to update row' });
    }
});

// DELETE /rows/:id - Delete row
router.delete('/rows/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Find row and verify ownership through room
        const existing = await prisma.row.findUnique({
            where: { id },
            include: { room: true }
        });

        if (!existing || !existing.room || existing.room.userId !== userId) {
            return res.status(404).json({ error: 'Row not found' });
        }

        await prisma.row.delete({ where: { id } });

        res.json({ success: true });
    } catch (error) {
        logger.error('Delete Row Error:', error);
        res.status(500).json({ error: 'Failed to delete row' });
    }
});

// ============== COLUMN STORE ROUTES ==============

// GET /columns - Get columns (with roomId query param)
router.get('/columns', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const roomIdParam = req.query.roomId;

        if (!roomIdParam || typeof roomIdParam !== 'string') {
            return res.status(400).json({ error: 'roomId query parameter is required' });
        }

        const roomId = roomIdParam as string;

        // Verify room ownership
        const room = await prisma.room.findFirst({ where: { id: roomId, userId } });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const columnStores = await prisma.columnStore.findMany({
            where: { roomId }
        });

        // Parse columns JSON
        const parsed = columnStores.map(store => ({
            ...store,
            columns: store.columns ? JSON.parse(store.columns) : []
        }));

        res.json(parsed);
    } catch (error) {
        logger.error('Get Columns Error:', error);
        res.status(500).json({ error: 'Failed to fetch columns' });
    }
});

// POST /columns - Create column store
router.post('/columns', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = columnStoreSchema.parse(req.body);

        // Verify room ownership
        const room = await prisma.room.findFirst({ where: { id: data.roomId, userId } });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const columnStore = await prisma.columnStore.create({
            data: {
                roomId: data.roomId,
                columns: JSON.stringify(data.columns)
            }
        });

        res.json({
            ...columnStore,
            columns: data.columns
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Create Columns Error:', error);
        res.status(500).json({ error: 'Failed to create columns' });
    }
});

// PATCH /columns/:id - Update column store
router.patch('/columns/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { columns } = req.body;

        // Find column store and verify ownership through room
        const existing = await prisma.columnStore.findUnique({
            where: { id },
            include: { room: true }
        });

        if (!existing || !existing.room || existing.room.userId !== userId) {
            return res.status(404).json({ error: 'Column store not found' });
        }

        const columnStore = await prisma.columnStore.update({
            where: { id },
            data: {
                columns: JSON.stringify(columns)
            }
        });

        res.json({
            ...columnStore,
            columns
        });
    } catch (error) {
        logger.error('Update Columns Error:', error);
        res.status(500).json({ error: 'Failed to update columns' });
    }
});

export default router;
