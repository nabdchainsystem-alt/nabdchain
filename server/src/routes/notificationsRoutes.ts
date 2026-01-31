import express, { Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Input validation schemas
const updatePreferencesSchema = z.object({
    emailEnabled: z.boolean().optional(),
    emailMentions: z.boolean().optional(),
    emailAssignments: z.boolean().optional(),
    emailComments: z.boolean().optional(),
    emailDueDates: z.boolean().optional(),
    emailStatusChanges: z.boolean().optional(),
    emailDigest: z.enum(['none', 'daily', 'weekly']).optional(),
    pushEnabled: z.boolean().optional(),
    pushMentions: z.boolean().optional(),
    pushAssignments: z.boolean().optional(),
    pushComments: z.boolean().optional(),
    pushDueDates: z.boolean().optional(),
    quietHoursEnabled: z.boolean().optional(),
    quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    quietHoursTimezone: z.string().optional(),
});

// GET /notifications - Fetch user's notifications
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { limit = '50', offset = '0', unreadOnly = 'false' } = req.query;

        const where: { userId: string; read?: boolean } = { userId };
        if (unreadOnly === 'true') {
            where.read = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(parseInt(limit as string), 100),
            skip: parseInt(offset as string),
        });

        // Transform metadata from JSON string
        const transformed = notifications.map(n => ({
            ...n,
            metadata: n.metadata ? JSON.parse(n.metadata) : null,
        }));

        apiLogger.debug('[Notifications] Fetched notifications', { userId, count: notifications.length });
        return res.json(transformed);
    } catch (error) {
        apiLogger.error('[Notifications] Error fetching notifications', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /notifications/count - Get unread count
router.get('/count', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const count = await prisma.notification.count({
            where: { userId, read: false },
        });

        return res.json({ unreadCount: count });
    } catch (error) {
        apiLogger.error('[Notifications] Error fetching unread count', error);
        return res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// PATCH /notifications/:id/read - Mark notification as read
router.patch('/:id/read', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { id } = req.params;

        // Verify ownership
        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true },
        });

        apiLogger.debug('[Notifications] Marked as read', { notificationId: id });
        return res.json({
            ...updated,
            metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
        });
    } catch (error) {
        apiLogger.error('[Notifications] Error marking as read', error);
        return res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// PATCH /notifications/read-all - Mark all notifications as read
router.patch('/read-all', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const result = await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });

        apiLogger.info('[Notifications] Marked all as read', { userId, count: result.count });
        return res.json({ updatedCount: result.count });
    } catch (error) {
        apiLogger.error('[Notifications] Error marking all as read', error);
        return res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// DELETE /notifications/:id - Delete a notification
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { id } = req.params;

        // Verify ownership
        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.delete({
            where: { id },
        });

        apiLogger.debug('[Notifications] Deleted notification', { notificationId: id });
        return res.status(204).send();
    } catch (error) {
        apiLogger.error('[Notifications] Error deleting notification', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// GET /notifications/preferences - Get notification preferences
router.get('/preferences', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        let preferences = await prisma.notificationPreference.findUnique({
            where: { userId },
        });

        // Create default preferences if they don't exist
        if (!preferences) {
            preferences = await prisma.notificationPreference.create({
                data: { userId },
            });
        }

        return res.json(preferences);
    } catch (error) {
        apiLogger.error('[Notifications] Error fetching preferences', error);
        return res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

// PATCH /notifications/preferences - Update notification preferences
router.patch('/preferences', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const validatedData = updatePreferencesSchema.parse(req.body);

        const preferences = await prisma.notificationPreference.upsert({
            where: { userId },
            update: validatedData,
            create: { userId, ...validatedData },
        });

        apiLogger.info('[Notifications] Updated preferences', { userId });
        return res.json(preferences);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[Notifications] Error updating preferences', error);
        return res.status(500).json({ error: 'Failed to update preferences' });
    }
});

export default router;
