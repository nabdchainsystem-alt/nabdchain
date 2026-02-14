import express, { Response } from 'express';
import type { Board } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { cacheService, cacheKeys, TTL } from '../services/cacheService';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Input validation schemas
const createBoardSchema = z.object({
    name: z.string().min(1).max(255),
    icon: z.string().max(50).optional(),
    description: z.string().max(5000).optional(),
    columns: z.array(z.any()).optional(),
    tasks: z.array(z.any()).optional(),
    defaultView: z.string().max(50).optional(),
    availableViews: z.array(z.string()).optional(),
    parentId: z.string().uuid().optional().nullable(),
    type: z.string().max(50).optional(),
    workspaceId: z.string().uuid().optional(),
});

const updateBoardSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    icon: z.string().max(50).optional(),
    description: z.string().max(5000).optional(),
    columns: z.array(z.any()).optional(),
    tasks: z.array(z.any()).optional(),
    defaultView: z.string().max(50).optional(),
    availableViews: z.array(z.string()).optional(),
    parentId: z.string().uuid().optional().nullable(),
    type: z.string().max(50).optional(),
});

// Helper to verify workspace access
async function verifyWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
    const workspace = await prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            OR: [
                { ownerId: userId },
                { users: { some: { id: userId } } }
            ]
        }
    });
    return !!workspace;
}

// Helper to verify board access
async function verifyBoardAccess(userId: string, boardId: string): Promise<{ hasAccess: boolean; board: Board | null }> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });

    if (!board) {
        return { hasAccess: false, board: null };
    }

    if (!board.workspaceId) {
        return { hasAccess: false, board };
    }

    const hasWorkspaceAccess = await verifyWorkspaceAccess(userId, board.workspaceId);
    return { hasAccess: hasWorkspaceAccess, board };
}

// GET /: Fetch all boards for user's workspace
router.get('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { workspaceId } = req.query;

        let targetWorkspaceId = workspaceId as string;

        if (!targetWorkspaceId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { workspace: true }
            });
            targetWorkspaceId = user?.workspaceId || '';
        }

        if (!targetWorkspaceId) {
            return res.json([]);
        }

        // Verify user has access to this workspace
        const hasAccess = await verifyWorkspaceAccess(userId, targetWorkspaceId);
        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied to this workspace" });
        }

        // Try cache first
        const cacheKey = cacheKeys.boards(targetWorkspaceId);
        const parsedBoards = await cacheService.getOrSet(
            cacheKey,
            async () => {
                const boards = await prisma.board.findMany({
                    where: { workspaceId: targetWorkspaceId },
                    orderBy: { updatedAt: 'desc' }
                });

                return boards.map(b => ({
                    ...b,
                    columns: b.columns ? JSON.parse(b.columns) : [],
                    tasks: b.tasks ? JSON.parse(b.tasks) : [],
                    availableViews: b.availableViews ? JSON.parse(b.availableViews) : [],
                }));
            },
            TTL.SHORT // 1 minute cache for board lists
        );

        res.json(parsedBoards);
    } catch (error) {
        apiLogger.error('Get Boards Error:', error);
        res.status(500).json({ error: "Failed to fetch boards" });
    }
});

// GET /:id : Fetch single board
router.get('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        const { hasAccess, board } = await verifyBoardAccess(userId, id);

        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Try cache first for parsed board
        const cacheKey = cacheKeys.board(id);
        const parsedBoard = await cacheService.getOrSet(
            cacheKey,
            async () => ({
                ...board,
                columns: board.columns ? JSON.parse(board.columns) : [],
                tasks: board.tasks ? JSON.parse(board.tasks) : [],
                availableViews: board.availableViews ? JSON.parse(board.availableViews) : [],
            }),
            TTL.SHORT
        );

        res.json(parsedBoard);
    } catch (error) {
        apiLogger.error('Get Board Error:', error);
        res.status(500).json({ error: "Failed to fetch board" });
    }
});

// POST /: Create Board
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createBoardSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.workspaceId) {
            return res.status(400).json({ error: "No workspace found" });
        }

        const targetWorkspaceId = data.workspaceId || user.workspaceId;

        // Verify user has access to target workspace
        const hasAccess = await verifyWorkspaceAccess(userId, targetWorkspaceId);
        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied to this workspace" });
        }

        const board = await prisma.board.create({
            data: {
                name: data.name,
                icon: data.icon,
                description: data.description,
                userId,
                workspaceId: targetWorkspaceId,
                parentId: data.parentId || null,
                columns: data.columns ? JSON.stringify(data.columns) : null,
                tasks: data.tasks ? JSON.stringify(data.tasks) : "[]",
                defaultView: data.defaultView || 'table',
                availableViews: data.availableViews ? JSON.stringify(data.availableViews) : '["table"]',
                type: data.type || 'project'
            }
        });

        // Log Activity
        await prisma.activity.create({
            data: {
                userId,
                workspaceId: targetWorkspaceId,
                boardId: board.id,
                type: 'BOARD_CREATED',
                content: `Created board: ${board.name}`,
                metadata: JSON.stringify({ boardName: board.name }),
            }
        });

        // Invalidate boards list cache
        await cacheService.delete(cacheKeys.boards(targetWorkspaceId));

        res.json({
            ...board,
            columns: data.columns || [],
            tasks: data.tasks || [],
            availableViews: data.availableViews || ['table']
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Create Board Error:', error);
        res.status(500).json({ error: "Failed to create board" });
    }
});

// PUT /:id : Update Board
router.put('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;
        const data = updateBoardSchema.parse(req.body);

        // Verify access
        const { hasAccess, board: existingBoard } = await verifyBoardAccess(userId, id);

        if (!existingBoard) {
            return res.status(404).json({ error: "Board not found" });
        }

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        const updateData: Record<string, unknown> = {};
        if (data.name) updateData.name = data.name;
        if (data.icon !== undefined) updateData.icon = data.icon;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type) updateData.type = data.type;
        if (data.defaultView) updateData.defaultView = data.defaultView;
        if (data.tasks) updateData.tasks = JSON.stringify(data.tasks);
        if (data.columns) updateData.columns = JSON.stringify(data.columns);
        if (data.availableViews) updateData.availableViews = JSON.stringify(data.availableViews);
        if (data.parentId !== undefined) updateData.parentId = data.parentId;

        const board = await prisma.board.update({
            where: { id },
            data: updateData
        });

        // Invalidate caches
        await cacheService.invalidateBoard(id);
        if (board.workspaceId) {
            await cacheService.delete(cacheKeys.boards(board.workspaceId));
        }

        res.json({
            ...board,
            columns: board.columns ? JSON.parse(board.columns) : [],
            tasks: board.tasks ? JSON.parse(board.tasks) : [],
            availableViews: board.availableViews ? JSON.parse(board.availableViews) : []
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error('Update Board Error:', error);
        res.status(500).json({ error: "Failed to update board" });
    }
});

// DELETE /:id
router.delete('/:id', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify access
        const { hasAccess, board } = await verifyBoardAccess(userId, id);

        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Store values before deletion
        const boardName = board.name;
        const workspaceId = board.workspaceId;

        // Delete the board
        await prisma.board.delete({ where: { id } });

        // Invalidate caches
        await cacheService.invalidateBoard(id);
        if (workspaceId) {
            await cacheService.delete(cacheKeys.boards(workspaceId));
        }

        // Log Activity
        await prisma.activity.create({
            data: {
                userId,
                workspaceId: workspaceId,
                boardId: null,
                type: 'BOARD_DELETED',
                content: `Deleted board: ${boardName}`,
                metadata: JSON.stringify({ boardName }),
            }
        });

        res.json({ success: true });
    } catch (error) {
        apiLogger.error('Delete Board Error:', error);
        res.status(500).json({ error: "Failed to delete board" });
    }
});

export default router;
