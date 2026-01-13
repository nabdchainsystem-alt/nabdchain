import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /: Fetch all boards for user's workspace
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { workspaceId } = req.query;

        // If workspaceId is provided, verify access
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
        const hasAccess = await prisma.workspace.findFirst({
            where: {
                id: targetWorkspaceId,
                OR: [
                    { ownerId: userId },
                    { users: { some: { id: userId } } }
                ]
            }
        });

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied to this workspace" });
        }

        const boards = await prisma.board.findMany({
            where: { workspaceId: targetWorkspaceId },
            orderBy: { updatedAt: 'desc' }
        });

        // Parse JSON fields
        const parsedBoards = boards.map(b => ({
            ...b,
            columns: b.columns ? JSON.parse(b.columns) : [],
            tasks: b.tasks ? JSON.parse(b.tasks) : [],
            availableViews: b.availableViews ? JSON.parse(b.availableViews) : [],
            // Ensure pinnedViews is handled if needed
        }));

        res.json(parsedBoards);
    } catch (error) {
        console.error("Get Boards Error:", error);
        res.status(500).json({ error: "Failed to fetch boards" });
    }
});

// GET /:id : Fetch single board
router.get('/:id', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;

        const board = await prisma.board.findUnique({ where: { id } });

        if (!board) return res.status(404).json({ error: "Board not found" });

        // Ideally verify workspace access here
        // const user = await prisma.user.findUnique({ where: { id: userId } });
        // if (board.workspaceId !== user?.workspaceId) return res.status(403).json({ error: "Access denied" });

        const parsedBoard = {
            ...board,
            columns: board.columns ? JSON.parse(board.columns) : [],
            tasks: board.tasks ? JSON.parse(board.tasks) : [],
            availableViews: board.availableViews ? JSON.parse(board.availableViews) : [],
        };

        res.json(parsedBoard);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch board" });
    }
});

// POST /: Create Board
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { name, icon, description, columns, tasks, defaultView, availableViews, parentId, type } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.workspaceId) return res.status(400).json({ error: "No workspace found" });

        const board = await prisma.board.create({
            data: {
                name,
                icon,
                description,
                userId,
                workspaceId: req.body.workspaceId || user.workspaceId, // Use provided ID or fallback to user default
                columns: columns ? JSON.stringify(columns) : null,
                tasks: tasks ? JSON.stringify(tasks) : "[]",
                defaultView: defaultView || 'table',
                availableViews: availableViews ? JSON.stringify(availableViews) : '["table"]',
                type: type || 'project'
            }
        });

        // Log Activity
        await prisma.activity.create({
            data: {
                userId,
                workspaceId: user.workspaceId,
                boardId: board.id,
                type: 'BOARD_CREATED',
                content: `Created board: ${board.name}`,
            }
        });

        // Return parsed object
        res.json({
            ...board,
            columns: columns || [],
            tasks: tasks || [],
            availableViews: availableViews || ['table']
        });
    } catch (error) {
        console.error("Create Board Error:", error);
        res.status(500).json({ error: "Failed to create board" });
    }
});

// PUT /:id : Update Board
router.put('/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { name, tasks, columns, availableViews, ...updates } = req.body;

        console.log(`[Board Update] Updating board ${id}. availableViews present?`, !!availableViews);
        if (availableViews) {
            console.log(`[Board Update] New availableViews:`, availableViews);
        }

        const data: any = { ...updates };
        if (name) data.name = name;
        if (req.body.type) data.type = req.body.type;
        if (tasks) data.tasks = JSON.stringify(tasks);
        if (columns) data.columns = JSON.stringify(columns);
        if (availableViews) data.availableViews = JSON.stringify(availableViews);

        const board = await prisma.board.update({
            where: { id },
            data
        });

        res.json({
            ...board,
            columns: board.columns ? JSON.parse(board.columns) : [],
            tasks: board.tasks ? JSON.parse(board.tasks) : [],
            availableViews: board.availableViews ? JSON.parse(board.availableViews) : []
        });
    } catch (error) {
        console.error("Update Board Error:", error);
        res.status(500).json({ error: "Failed to update board" });
    }
});

// DELETE /:id
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.auth.userId;

        console.log(`[Board Delete] Attempting to delete board ${id} by user ${userId}`);

        // Get board details before deleting for logging
        const board = await prisma.board.findUnique({ where: { id } });

        if (!board) {
            console.log(`[Board Delete] Board ${id} not found`);
            return res.status(404).json({ error: "Board not found" });
        }

        // Store values before deletion
        const boardName = board.name;
        const workspaceId = board.workspaceId;

        // Delete the board
        await prisma.board.delete({ where: { id } });
        console.log(`[Board Delete] Successfully deleted board ${id}`);

        // Log Activity - Note: boardId is null since the board is deleted
        await prisma.activity.create({
            data: {
                userId,
                workspaceId: workspaceId,
                boardId: null, // Board is deleted, so we can't reference it
                type: 'BOARD_DELETED',
                content: `Deleted board: ${boardName}`,
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("[Board Delete] Error:", error);
        res.status(500).json({ error: "Failed to delete board" });
    }
});

export default router;
