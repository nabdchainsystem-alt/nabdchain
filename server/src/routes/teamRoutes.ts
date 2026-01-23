import express, { Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Input validation schemas
const sendRequestSchema = z.object({
    email: z.string().email(),
});

const respondRequestSchema = z.object({
    connectionId: z.string().uuid(),
    action: z.enum(['accept', 'reject']),
});

// Search for a user by email
router.get('/search', requireAuth, async (req: any, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { email } = req.query;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        const searchEmail = email.toLowerCase().trim();

        // First, find user in our database
        let user = await prisma.user.findFirst({
            where: {
                email: searchEmail,
                NOT: { id: userId }
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true
            }
        });

        // If not in database, search in Clerk and sync
        if (!user) {
            try {
                // Search for user in Clerk by email
                apiLogger.info('[TeamSearch] Searching Clerk for:', searchEmail);
                const clerkUsers = await clerkClient.users.getUserList({
                    emailAddress: [searchEmail]
                });
                apiLogger.info('[TeamSearch] Clerk returned:', clerkUsers.length, 'users');

                const clerkUser = clerkUsers[0];

                if (clerkUser && clerkUser.id !== userId) {
                    apiLogger.info('[TeamSearch] Found user in Clerk:', clerkUser.id);
                    // Found in Clerk - upsert in our database (create or update)
                    const name = clerkUser.firstName
                        ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
                        : null;

                    const upsertedUser = await prisma.user.upsert({
                        where: { id: clerkUser.id },
                        update: {
                            email: searchEmail,
                            name: name || undefined,
                            avatarUrl: clerkUser.imageUrl || undefined
                        },
                        create: {
                            id: clerkUser.id,
                            email: searchEmail,
                            name,
                            avatarUrl: clerkUser.imageUrl || null
                        }
                    });

                    user = {
                        id: upsertedUser.id,
                        email: upsertedUser.email,
                        name: upsertedUser.name,
                        avatarUrl: upsertedUser.avatarUrl
                    };
                }
            } catch (clerkErr) {
                apiLogger.error('[TeamSearch] Clerk search error:', clerkErr);
                // Continue - user not found
            }
        }

        if (!user) {
            apiLogger.info('[TeamSearch] User not found in DB or Clerk:', searchEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if connection already exists
        const existingConnection = await prisma.teamConnection.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: user.id },
                    { senderId: user.id, receiverId: userId }
                ]
            }
        });

        res.json({
            user,
            connectionStatus: existingConnection?.status || null,
            connectionId: existingConnection?.id || null
        });
    } catch (error) {
        apiLogger.error('Search user error:', error);
        res.status(500).json({ error: 'Failed to search user' });
    }
});

// Send a connection request
router.post('/request', requireAuth, async (req: any, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { email } = sendRequestSchema.parse(req.body);

        // Find the receiver by email
        const receiver = await prisma.user.findFirst({
            where: {
                email: email.toLowerCase()
            }
        });

        if (!receiver) {
            return res.status(404).json({ error: 'User not found with this email' });
        }

        if (receiver.id === userId) {
            return res.status(400).json({ error: 'Cannot send request to yourself' });
        }

        // Check for existing connection
        const existing = await prisma.teamConnection.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: receiver.id },
                    { senderId: receiver.id, receiverId: userId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') {
                return res.status(400).json({ error: 'Already connected with this user' });
            }
            if (existing.status === 'PENDING') {
                return res.status(400).json({ error: 'Connection request already pending' });
            }
            // If rejected, allow resending by updating the existing record
            const updated = await prisma.teamConnection.update({
                where: { id: existing.id },
                data: {
                    senderId: userId,
                    receiverId: receiver.id,
                    status: 'PENDING',
                    updatedAt: new Date()
                }
            });
            return res.json({ success: true, connection: updated });
        }

        // Create new connection request
        const connection = await prisma.teamConnection.create({
            data: {
                senderId: userId,
                receiverId: receiver.id,
                status: 'PENDING'
            }
        });

        res.json({ success: true, connection });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Send request error:', error);
        res.status(500).json({ error: 'Failed to send connection request' });
    }
});

// Get pending requests (received)
router.get('/requests/pending', requireAuth, async (req: any, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const requests = await prisma.teamConnection.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get sender details for each request
        const senderIds = requests.map(r => r.senderId);
        const senders = await prisma.user.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, email: true, name: true, avatarUrl: true }
        });

        const sendersMap = new Map(senders.map(s => [s.id, s]));

        const requestsWithSenders = requests.map(r => ({
            ...r,
            sender: sendersMap.get(r.senderId)
        }));

        res.json(requestsWithSenders);
    } catch (error) {
        apiLogger.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Failed to get pending requests' });
    }
});

// Get sent requests (by current user)
router.get('/requests/sent', requireAuth, async (req: any, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const requests = await prisma.teamConnection.findMany({
            where: {
                senderId: userId,
                status: 'PENDING'
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get receiver details
        const receiverIds = requests.map(r => r.receiverId);
        const receivers = await prisma.user.findMany({
            where: { id: { in: receiverIds } },
            select: { id: true, email: true, name: true, avatarUrl: true }
        });

        const receiversMap = new Map(receivers.map(r => [r.id, r]));

        const requestsWithReceivers = requests.map(r => ({
            ...r,
            receiver: receiversMap.get(r.receiverId)
        }));

        res.json(requestsWithReceivers);
    } catch (error) {
        apiLogger.error('Get sent requests error:', error);
        res.status(500).json({ error: 'Failed to get sent requests' });
    }
});

// Accept or reject a connection request
router.post('/request/respond', requireAuth, async (req: any, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { connectionId, action } = respondRequestSchema.parse(req.body);

        // Find the connection request
        const connection = await prisma.teamConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection request not found' });
        }

        // Only the receiver can respond
        if (connection.receiverId !== userId) {
            return res.status(403).json({ error: 'Not authorized to respond to this request' });
        }

        if (connection.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        // Update the connection status
        const updated = await prisma.teamConnection.update({
            where: { id: connectionId },
            data: {
                status: action === 'accept' ? 'ACCEPTED' : 'REJECTED'
            }
        });

        res.json({ success: true, connection: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Respond to request error:', error);
        res.status(500).json({ error: 'Failed to respond to request' });
    }
});

// Get all connected team members
router.get('/members', requireAuth, async (req: any, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        // Find all accepted connections
        const connections = await prisma.teamConnection.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            }
        });

        // Get the IDs of connected users
        const connectedUserIds = connections.map(c =>
            c.senderId === userId ? c.receiverId : c.senderId
        );

        // Get user details
        const members = await prisma.user.findMany({
            where: { id: { in: connectedUserIds } },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
                lastActiveAt: true
            }
        });

        // Add connection info to each member
        const membersWithConnectionInfo = members.map(member => {
            const connection = connections.find(c =>
                c.senderId === member.id || c.receiverId === member.id
            );
            return {
                ...member,
                lastActiveAt: member.lastActiveAt,
                connectionId: connection?.id,
                connectedAt: connection?.updatedAt
            };
        });

        res.json(membersWithConnectionInfo);
    } catch (error) {
        apiLogger.error('Get team members error:', error);
        res.status(500).json({ error: 'Failed to get team members' });
    }
});

// Remove a connection
router.delete('/connection/:id', requireAuth, async (req: any, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { id } = req.params;

        const connection = await prisma.teamConnection.findUnique({
            where: { id }
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        // Only participants can remove the connection
        if (connection.senderId !== userId && connection.receiverId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.teamConnection.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Remove connection error:', error);
        res.status(500).json({ error: 'Failed to remove connection' });
    }
});

export default router;
