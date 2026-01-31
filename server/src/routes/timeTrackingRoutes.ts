import express, { Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Input validation schemas
const createEntrySchema = z.object({
    boardId: z.string().min(1, 'Board ID required'),
    taskId: z.string().optional(),
    rowId: z.string().optional(),
    description: z.string().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    duration: z.number().int().min(0).optional(),
    billable: z.boolean().optional(),
    hourlyRate: z.number().positive().optional(),
    tags: z.array(z.string()).optional(),
    source: z.enum(['manual', 'timer', 'import']).optional(),
});

const updateEntrySchema = z.object({
    description: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional().nullable(),
    duration: z.number().int().min(0).optional(),
    billable: z.boolean().optional(),
    hourlyRate: z.number().positive().optional().nullable(),
    tags: z.array(z.string()).optional(),
});

const listEntriesSchema = z.object({
    boardId: z.string().optional(),
    taskId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.string().transform(Number).optional(),
    offset: z.string().transform(Number).optional(),
});

// GET /time-entries - List time entries with filters
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const query = listEntriesSchema.parse(req.query);

        const where: {
            userId: string;
            boardId?: string;
            taskId?: string;
            startTime?: { gte?: Date; lte?: Date };
        } = { userId };

        if (query.boardId) {
            where.boardId = query.boardId;
        }

        if (query.taskId) {
            where.taskId = query.taskId;
        }

        if (query.startDate || query.endDate) {
            where.startTime = {};
            if (query.startDate) {
                where.startTime.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.startTime.lte = new Date(query.endDate);
            }
        }

        const entries = await prisma.timeEntry.findMany({
            where,
            orderBy: { startTime: 'desc' },
            take: query.limit || 100,
            skip: query.offset || 0,
        });

        // Transform tags from JSON string
        const transformed = entries.map(entry => ({
            ...entry,
            tags: entry.tags ? JSON.parse(entry.tags) : [],
        }));

        apiLogger.debug('[TimeTracking] Fetched entries', { userId, count: entries.length });
        return res.json(transformed);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
        }
        apiLogger.error('[TimeTracking] Error fetching entries', error);
        return res.status(500).json({ error: 'Failed to fetch time entries' });
    }
});

// GET /time-entries/summary - Get summary statistics
router.get('/summary', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { boardId, startDate, endDate } = req.query;

        const where: {
            userId: string;
            boardId?: string;
            startTime?: { gte?: Date; lte?: Date };
        } = { userId };

        if (boardId) {
            where.boardId = boardId as string;
        }

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) {
                where.startTime.gte = new Date(startDate as string);
            }
            if (endDate) {
                where.startTime.lte = new Date(endDate as string);
            }
        }

        const entries = await prisma.timeEntry.findMany({ where });

        const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0);
        const billableSeconds = entries
            .filter(e => e.billable)
            .reduce((sum, e) => sum + e.duration, 0);
        const totalAmount = entries
            .filter(e => e.billable && e.hourlyRate)
            .reduce((sum, e) => sum + (e.duration / 3600) * (e.hourlyRate || 0), 0);

        return res.json({
            totalSeconds,
            totalHours: totalSeconds / 3600,
            billableSeconds,
            billableHours: billableSeconds / 3600,
            nonBillableHours: (totalSeconds - billableSeconds) / 3600,
            totalAmount,
            entriesCount: entries.length,
        });
    } catch (error) {
        apiLogger.error('[TimeTracking] Error fetching summary', error);
        return res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// POST /time-entries - Create a new time entry
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const validatedData = createEntrySchema.parse(req.body);

        // Calculate duration if endTime provided but no duration
        let duration = validatedData.duration || 0;
        if (!validatedData.duration && validatedData.endTime) {
            const start = new Date(validatedData.startTime).getTime();
            const end = new Date(validatedData.endTime).getTime();
            duration = Math.floor((end - start) / 1000);
        }

        const entry = await prisma.timeEntry.create({
            data: {
                userId,
                boardId: validatedData.boardId,
                taskId: validatedData.taskId,
                rowId: validatedData.rowId,
                description: validatedData.description,
                startTime: new Date(validatedData.startTime),
                endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
                duration,
                billable: validatedData.billable ?? false,
                hourlyRate: validatedData.hourlyRate,
                tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
                source: validatedData.source || 'manual',
            },
        });

        apiLogger.info('[TimeTracking] Created entry', { entryId: entry.id, userId });
        return res.status(201).json({
            ...entry,
            tags: entry.tags ? JSON.parse(entry.tags) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[TimeTracking] Error creating entry', error);
        return res.status(500).json({ error: 'Failed to create time entry' });
    }
});

// GET /time-entries/:id - Get a specific entry
router.get('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const entry = await prisma.timeEntry.findFirst({
            where: { id, userId },
        });

        if (!entry) {
            return res.status(404).json({ error: 'Time entry not found' });
        }

        return res.json({
            ...entry,
            tags: entry.tags ? JSON.parse(entry.tags) : [],
        });
    } catch (error) {
        apiLogger.error('[TimeTracking] Error fetching entry', error);
        return res.status(500).json({ error: 'Failed to fetch time entry' });
    }
});

// PATCH /time-entries/:id - Update a time entry
router.patch('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const validatedData = updateEntrySchema.parse(req.body);

        // Verify ownership
        const existing = await prisma.timeEntry.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Time entry not found' });
        }

        // Prepare update data
        const updateData: {
            description?: string;
            startTime?: Date;
            endTime?: Date | null;
            duration?: number;
            billable?: boolean;
            hourlyRate?: number | null;
            tags?: string;
        } = {};

        if (validatedData.description !== undefined) {
            updateData.description = validatedData.description;
        }
        if (validatedData.startTime !== undefined) {
            updateData.startTime = new Date(validatedData.startTime);
        }
        if (validatedData.endTime !== undefined) {
            updateData.endTime = validatedData.endTime ? new Date(validatedData.endTime) : null;
        }
        if (validatedData.duration !== undefined) {
            updateData.duration = validatedData.duration;
        }
        if (validatedData.billable !== undefined) {
            updateData.billable = validatedData.billable;
        }
        if (validatedData.hourlyRate !== undefined) {
            updateData.hourlyRate = validatedData.hourlyRate;
        }
        if (validatedData.tags !== undefined) {
            updateData.tags = JSON.stringify(validatedData.tags);
        }

        // Recalculate duration if times changed but duration wasn't explicitly set
        if ((updateData.startTime || updateData.endTime) && validatedData.duration === undefined) {
            const start = updateData.startTime || existing.startTime;
            const end = updateData.endTime !== undefined ? updateData.endTime : existing.endTime;
            if (end) {
                updateData.duration = Math.floor((end.getTime() - start.getTime()) / 1000);
            }
        }

        const updated = await prisma.timeEntry.update({
            where: { id },
            data: updateData,
        });

        apiLogger.debug('[TimeTracking] Updated entry', { entryId: id });
        return res.json({
            ...updated,
            tags: updated.tags ? JSON.parse(updated.tags) : [],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[TimeTracking] Error updating entry', error);
        return res.status(500).json({ error: 'Failed to update time entry' });
    }
});

// PATCH /time-entries/:id/stop - Stop a running timer
router.patch('/:id/stop', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify ownership
        const existing = await prisma.timeEntry.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Time entry not found' });
        }

        if (existing.endTime) {
            return res.status(400).json({ error: 'Timer already stopped' });
        }

        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - existing.startTime.getTime()) / 1000);

        const updated = await prisma.timeEntry.update({
            where: { id },
            data: { endTime, duration },
        });

        apiLogger.info('[TimeTracking] Stopped timer', { entryId: id, duration });
        return res.json({
            ...updated,
            tags: updated.tags ? JSON.parse(updated.tags) : [],
        });
    } catch (error) {
        apiLogger.error('[TimeTracking] Error stopping timer', error);
        return res.status(500).json({ error: 'Failed to stop timer' });
    }
});

// DELETE /time-entries/:id - Delete a time entry
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify ownership
        const existing = await prisma.timeEntry.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Time entry not found' });
        }

        await prisma.timeEntry.delete({
            where: { id },
        });

        apiLogger.debug('[TimeTracking] Deleted entry', { entryId: id });
        return res.status(204).send();
    } catch (error) {
        apiLogger.error('[TimeTracking] Error deleting entry', error);
        return res.status(500).json({ error: 'Failed to delete time entry' });
    }
});

// GET /time-entries/active - Get the user's active timer (if any)
router.get('/active/current', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const activeEntry = await prisma.timeEntry.findFirst({
            where: {
                userId,
                endTime: null,
            },
            orderBy: { startTime: 'desc' },
        });

        if (!activeEntry) {
            return res.json(null);
        }

        // Calculate current elapsed time
        const elapsed = Math.floor((Date.now() - activeEntry.startTime.getTime()) / 1000);

        return res.json({
            ...activeEntry,
            tags: activeEntry.tags ? JSON.parse(activeEntry.tags) : [],
            elapsedSeconds: elapsed,
        });
    } catch (error) {
        apiLogger.error('[TimeTracking] Error fetching active timer', error);
        return res.status(500).json({ error: 'Failed to fetch active timer' });
    }
});

export default router;
