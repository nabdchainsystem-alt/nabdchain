import express from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Get current user preferences
router.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        apiLogger.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user preferences (display name, etc.)
router.patch('/me', requireAuth, async (req, res) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { name, avatarUrl } = req.body;

        // Build update data object with only provided fields
        const updateData: { name?: string; avatarUrl?: string } = {};
        if (name !== undefined) updateData.name = name;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true
            }
        });

        res.json(user);
    } catch (error) {
        apiLogger.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
