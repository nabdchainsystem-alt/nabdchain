import express, { Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Input validation schemas
const createCommentSchema = z.object({
    entityType: z.enum(['row', 'board', 'doc', 'task']),
    entityId: z.string().min(1),
    content: z.string().min(1).max(10000),
    parentId: z.string().uuid().optional().nullable(),
    mentions: z.array(z.string()).optional(),
    attachments: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number().optional(),
    })).optional(),
});

const updateCommentSchema = z.object({
    content: z.string().min(1).max(10000),
});

const reactionSchema = z.object({
    emoji: z.string().min(1).max(10),
});

// GET /comments - Fetch comments for an entity
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { entityType, entityId, parentId } = req.query;

        if (!entityType || !entityId) {
            return res.status(400).json({ error: 'entityType and entityId are required' });
        }

        const comments = await prisma.comment.findMany({
            where: {
                entityType: entityType as string,
                entityId: entityId as string,
                parentId: parentId ? (parentId as string) : null,
            },
            include: {
                reactions: true,
                replies: {
                    include: {
                        reactions: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Get author information for each comment
        const authorIds = new Set<string>();
        comments.forEach(c => {
            authorIds.add(c.authorId);
            c.replies.forEach(r => authorIds.add(r.authorId));
        });

        const users = await prisma.user.findMany({
            where: { id: { in: Array.from(authorIds) } },
            select: { id: true, name: true, avatarUrl: true, email: true },
        });

        type UserInfo = { id: string; name: string | null; avatarUrl: string | null; email: string };
        const userMap = new Map<string, UserInfo>(users.map(u => [u.id, u]));

        // Transform comments to include author info
        const transformedComments = comments.map(comment => ({
            ...comment,
            authorName: userMap.get(comment.authorId)?.name || 'Unknown',
            authorAvatar: userMap.get(comment.authorId)?.avatarUrl,
            mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
            attachments: comment.attachments ? JSON.parse(comment.attachments) : [],
            replies: comment.replies.map(reply => ({
                ...reply,
                authorName: userMap.get(reply.authorId)?.name || 'Unknown',
                authorAvatar: userMap.get(reply.authorId)?.avatarUrl,
                mentions: reply.mentions ? JSON.parse(reply.mentions) : [],
                attachments: reply.attachments ? JSON.parse(reply.attachments) : [],
            })),
        }));

        apiLogger.debug('[Comments] Fetched comments', { entityType, entityId, count: comments.length });
        return res.json(transformedComments);
    } catch (error) {
        apiLogger.error('[Comments] Error fetching comments', error);
        return res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /comments - Create a new comment
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const validatedData = createCommentSchema.parse(req.body);

        const comment = await prisma.comment.create({
            data: {
                authorId: userId,
                entityType: validatedData.entityType,
                entityId: validatedData.entityId,
                content: validatedData.content,
                parentId: validatedData.parentId || null,
                mentions: validatedData.mentions ? JSON.stringify(validatedData.mentions) : null,
                attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
            },
            include: {
                reactions: true,
            },
        });

        // Get author info
        const author = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, avatarUrl: true },
        });

        const transformedComment = {
            ...comment,
            authorName: author?.name || 'Unknown',
            authorAvatar: author?.avatarUrl,
            mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
            attachments: comment.attachments ? JSON.parse(comment.attachments) : [],
        };

        apiLogger.info('[Comments] Created comment', { commentId: comment.id, entityType: validatedData.entityType });
        return res.status(201).json(transformedComment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[Comments] Error creating comment', error);
        return res.status(500).json({ error: 'Failed to create comment' });
    }
});

// PATCH /comments/:id - Update a comment
router.patch('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const validatedData = updateCommentSchema.parse(req.body);

        // Verify ownership
        const existingComment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (existingComment.authorId !== userId) {
            return res.status(403).json({ error: 'Not authorized to edit this comment' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id },
            data: {
                content: validatedData.content,
                edited: true,
                editedAt: new Date(),
            },
            include: {
                reactions: true,
            },
        });

        // Get author info
        const author = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, avatarUrl: true },
        });

        const transformedComment = {
            ...updatedComment,
            authorName: author?.name || 'Unknown',
            authorAvatar: author?.avatarUrl,
            mentions: updatedComment.mentions ? JSON.parse(updatedComment.mentions) : [],
            attachments: updatedComment.attachments ? JSON.parse(updatedComment.attachments) : [],
        };

        apiLogger.info('[Comments] Updated comment', { commentId: id });
        return res.json(transformedComment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[Comments] Error updating comment', error);
        return res.status(500).json({ error: 'Failed to update comment' });
    }
});

// DELETE /comments/:id - Delete a comment
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify ownership
        const existingComment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (existingComment.authorId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        await prisma.comment.delete({
            where: { id },
        });

        apiLogger.info('[Comments] Deleted comment', { commentId: id });
        return res.status(204).send();
    } catch (error) {
        apiLogger.error('[Comments] Error deleting comment', error);
        return res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// POST /comments/:id/reactions - Add a reaction
router.post('/:id/reactions', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const { emoji } = reactionSchema.parse(req.body);

        // Verify comment exists
        const comment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if reaction already exists
        const existingReaction = await prisma.commentReaction.findUnique({
            where: {
                commentId_userId_emoji: {
                    commentId: id,
                    userId,
                    emoji,
                },
            },
        });

        if (existingReaction) {
            return res.status(400).json({ error: 'Reaction already exists' });
        }

        const reaction = await prisma.commentReaction.create({
            data: {
                commentId: id,
                userId,
                emoji,
            },
        });

        apiLogger.debug('[Comments] Added reaction', { commentId: id, emoji });
        return res.status(201).json(reaction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('[Comments] Error adding reaction', error);
        return res.status(500).json({ error: 'Failed to add reaction' });
    }
});

// DELETE /comments/:id/reactions/:emoji - Remove a reaction
router.delete('/:id/reactions/:emoji', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const emoji = req.params.emoji as string;

        const decodedEmoji = decodeURIComponent(emoji as string);

        const reaction = await prisma.commentReaction.findUnique({
            where: {
                commentId_userId_emoji: {
                    commentId: id,
                    userId,
                    emoji: decodedEmoji,
                },
            },
        });

        if (!reaction) {
            return res.status(404).json({ error: 'Reaction not found' });
        }

        await prisma.commentReaction.delete({
            where: { id: reaction.id },
        });

        apiLogger.debug('[Comments] Removed reaction', { commentId: id, emoji: decodedEmoji });
        return res.status(204).send();
    } catch (error) {
        apiLogger.error('[Comments] Error removing reaction', error);
        return res.status(500).json({ error: 'Failed to remove reaction' });
    }
});

export default router;
