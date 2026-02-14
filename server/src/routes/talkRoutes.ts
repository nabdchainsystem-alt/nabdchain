import express, { Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Route params helper type
type IdParams = { id: string };
type TaskParams = { taskId: string };
type ReminderParams = { reminderId: string };

// Input validation schemas
const createConversationSchema = z.object({
    type: z.enum(['dm', 'channel']),
    participantId: z.string().optional(), // For DM
    name: z.string().optional(), // For channel
});

const sendMessageSchema = z.object({
    content: z.string().min(1).max(10000),
});

// Get all conversations for current user
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        // Find all conversations where user is a participant
        const participations = await prisma.conversationParticipant.findMany({
            where: { userId },
            include: {
                conversation: {
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        name: true,
                                        avatarUrl: true,
                                        lastActiveAt: true
                                    }
                                }
                            }
                        },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1 // Get latest message for preview
                        }
                    }
                }
            },
            orderBy: {
                conversation: {
                    updatedAt: 'desc'
                }
            }
        });

        // Format response
        const conversations = participations.map((p) => {
            const conv = p.conversation;
            const otherParticipants = (conv.participants || [])
                .filter((part) => part.userId !== userId)
                .map((part) => part.user);

            // Count unread messages
            const lastReadAt = p.lastReadAt;
            const unreadCount = lastReadAt
                ? (conv.messages || []).filter((m) => new Date(m.createdAt) > new Date(lastReadAt)).length
                : (conv.messages || []).length;

            return {
                id: conv.id,
                type: conv.type,
                name: conv.type === 'channel' ? conv.name : null,
                status: conv.status || 'active',
                creatorId: conv.creatorId,
                participants: otherParticipants,
                lastMessage: conv.messages[0] || null,
                unreadCount,
                updatedAt: conv.updatedAt
            };
        });

        res.json(conversations);
    } catch (error) {
        apiLogger.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

// Update conversation status (Close/Delete)
router.patch('/conversations/:id/status', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { status } = z.object({ status: z.enum(['active', 'closed', 'deleted']) }).parse(req.body);

        const conv = await prisma.conversation.findUnique({ where: { id } });
        if (!conv) return res.status(404).json({ error: 'Conversation not found' });

        // Only creator can change status
        if (conv.creatorId && conv.creatorId !== userId) {
            return res.status(403).json({ error: 'Only the creator can manage this chat' });
        }

        const updated = await prisma.conversation.update({
            where: { id },
            data: { status }
        });

        // If closed or deleted, add a system message
        const statusText = status === 'closed' ? 'closed' : 'deleted';
        await prisma.message.create({
            data: {
                conversationId: id,
                senderId: userId, // Creator is the sender of the system alert for now
                content: `SYSTEM_ALERT:status_${statusText}`
            }
        });

        res.json(updated);
    } catch (error) {
        apiLogger.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update conversation status' });
    }
});

// Delete a conversation (hard delete for creator)
router.delete('/conversations/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const conv = await prisma.conversation.findUnique({ where: { id } });
        if (!conv) return res.status(404).json({ error: 'Conversation not found' });

        if (conv.creatorId && conv.creatorId !== userId) {
            return res.status(403).json({ error: 'Only the creator can delete this chat' });
        }

        await prisma.conversation.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

// Get or create a DM conversation with a user
router.post('/conversations/dm', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { participantId } = z.object({ participantId: z.string() }).parse(req.body);

        if (participantId === userId) {
            return res.status(400).json({ error: 'Cannot create DM with yourself' });
        }

        // Check if other user exists
        const otherUser = await prisma.user.findUnique({
            where: { id: participantId }
        });

        if (!otherUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if DM already exists between these users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                type: 'dm',
                AND: [
                    { participants: { some: { userId } } },
                    { participants: { some: { userId: participantId } } }
                ]
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                avatarUrl: true,
                                lastActiveAt: true
                            }
                        }
                    }
                }
            }
        });

        if (existingConversation) {
            const existingOtherParticipants = existingConversation.participants
                .filter((p) => p.userId !== userId)
                .map((p) => p.user);

            return res.json({
                id: existingConversation.id,
                type: existingConversation.type,
                name: null,
                participants: existingOtherParticipants,
                isNew: false
            });
        }

        // Create new DM conversation
        const newDMConversation = await prisma.conversation.create({
            data: {
                type: 'dm',
                creatorId: userId, // Track creator
                participants: {
                    create: [
                        { userId },
                        { userId: participantId }
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                avatarUrl: true,
                                lastActiveAt: true
                            }
                        }
                    }
                }
            }
        });

        const newDMOtherParticipants = newDMConversation.participants
            .filter((p) => p.userId !== userId)
            .map((p) => p.user);

        res.json({
            id: newDMConversation.id,
            type: newDMConversation.type,
            name: null,
            participants: newDMOtherParticipants,
            isNew: true
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Create DM error:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Create a new channel (public group talk)
router.post('/conversations/channel', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { name } = z.object({ name: z.string().min(1) }).parse(req.body);

        // Create new channel conversation
        const newChannelConversation = await prisma.conversation.create({
            data: {
                type: 'channel',
                name,
                creatorId: userId, // Track creator
                participants: {
                    create: [
                        { userId }
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                avatarUrl: true,
                                lastActiveAt: true
                            }
                        }
                    }
                }
            }
        });

        const newChannelOtherParticipants = newChannelConversation.participants
            .filter((p) => p.userId !== userId)
            .map((p) => p.user);

        res.json({
            id: newChannelConversation.id,
            type: newChannelConversation.type,
            name: newChannelConversation.name,
            participants: newChannelOtherParticipants,
            unreadCount: 0,
            updatedAt: newChannelConversation.updatedAt
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Create channel error:', error);
        res.status(500).json({ error: 'Failed to create channel' });
    }
});

// Get messages for a conversation (paginated)
router.get('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const before = req.query.before as string | undefined;

        // Verify user is participant
        const participation = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId
                }
            }
        });

        if (!participation) {
            return res.status(403).json({ error: 'Not a participant of this conversation' });
        }

        // Build query
        const whereClause: { conversationId: string; createdAt?: { lt: Date } } = { conversationId: id };
        if (before) {
            whereClause.createdAt = { lt: new Date(before) };
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Update last read
        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId
                }
            },
            data: { lastReadAt: new Date() }
        });

        // Return in chronological order (oldest first)
        res.json(messages.reverse());
    } catch (error) {
        apiLogger.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Send a message
router.post('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { content } = sendMessageSchema.parse(req.body);

        // Verify user is participant
        const participation = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId
                }
            }
        });

        if (!participation) {
            return res.status(403).json({ error: 'Not a participant of this conversation' });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                senderId: userId,
                content
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        // Update sender's lastReadAt
        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId
                }
            },
            data: { lastReadAt: new Date() }
        });

        res.json(message);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark conversation as read
router.post('/conversations/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId
                }
            },
            data: { lastReadAt: new Date() }
        });

        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// --- Talk Sidebar Data Routes ---

// Get all tasks, reminders, and files for a conversation
router.get('/conversations/:id/data', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify participant
        const participation = await prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId: id, userId } }
        });
        if (!participation) return res.status(403).json({ error: 'Not a participant' });

        const [tasks, reminders, files] = await Promise.all([
            prisma.talkTask.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, include: { files: true } }),
            prisma.talkReminder.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' } }),
            prisma.talkFile.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' } })
        ]);

        res.json({ tasks, reminders, files });
    } catch (error) {
        apiLogger.error('Get talk data error:', error);
        res.status(500).json({ error: 'Failed to get talk data' });
    }
});

// Create a task
router.post('/conversations/:id/tasks', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { name } = z.object({ name: z.string() }).parse(req.body);

        const task = await prisma.talkTask.create({
            data: { conversationId: id, creatorId: userId, name }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Create a reminder
router.post('/conversations/:id/reminders', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { text, dueDate } = z.object({ text: z.string(), dueDate: z.string() }).parse(req.body);

        const reminder = await prisma.talkReminder.create({
            data: { conversationId: id, creatorId: userId, text, dueDate: new Date(dueDate) }
        });
        res.json(reminder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

// Create/Upload a file
router.post('/conversations/:id/files', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { name, type, url, size, taskId } = z.object({
            name: z.string(),
            type: z.string(),
            url: z.string().optional(),
            size: z.number().optional(),
            taskId: z.string().optional()
        }).parse(req.body);

        const talkFile = await prisma.talkFile.create({
            data: { conversationId: id, uploaderId: userId, name, type, url, size, taskId }
        });
        res.json(talkFile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save file' });
    }
});

// Update objects (generic toggle/update)
router.patch('/tasks/:taskId', requireAuth, async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId as string;
        const data = req.body;
        const task = await prisma.talkTask.update({ where: { id: taskId }, data });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.patch('/reminders/:reminderId', requireAuth, async (req: Request, res: Response) => {
    try {
        const reminderId = req.params.reminderId as string;
        const data = req.body;
        const reminder = await prisma.talkReminder.update({ where: { id: reminderId }, data });
        res.json(reminder);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Delete objects
router.delete('/tasks/:taskId', requireAuth, async (req: Request, res: Response) => {
    try {
        await prisma.talkTask.delete({ where: { id: req.params.taskId as string } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.delete('/reminders/:reminderId', requireAuth, async (req: Request, res: Response) => {
    try {
        await prisma.talkReminder.delete({ where: { id: req.params.reminderId as string } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- End Talk Sidebar Data Routes ---

// Delete a message (only sender can delete)
router.delete('/messages/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const message = await prisma.message.findUnique({
            where: { id }
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.senderId !== userId) {
            return res.status(403).json({ error: 'Can only delete your own messages' });
        }

        await prisma.message.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

export default router;
