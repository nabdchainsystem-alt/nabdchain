import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /: Fetch all boards for user's workspace
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { workspace: true }
        });

        if (!user || !user.workspaceId) {
            return res.json([]);
        }

        const boards = await prisma.board.findMany({
            where: { workspaceId: user.workspaceId },
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
                workspaceId: user.workspaceId, // Link to workspace!
                columns: columns ? JSON.stringify(columns) : null,
                tasks: tasks ? JSON.stringify(tasks) : "[]",
                defaultView: defaultView || 'table',
                availableViews: availableViews ? JSON.stringify(availableViews) : '["table"]',
                type: type || 'project'
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
        await prisma.board.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete board" });
    }
});

export default router;
