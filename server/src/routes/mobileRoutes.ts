import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

/** Represents a task parsed from Board.tasks JSON with board metadata */
interface BoardTask {
    id?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    boardId: string;
    boardName: string;
    [key: string]: unknown;
}

const router = Router();

// GET dashboard summary - aggregates tasks across all boards
router.get('/dashboard', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { workspaceId } = req.query;

        // Get all boards for the user
        const where: Prisma.BoardWhereInput = { userId };
        if (workspaceId) where.workspaceId = workspaceId as string;

        const boards = await prisma.board.findMany({
            where,
            select: { id: true, name: true, tasks: true },
        });

        // Parse tasks from all boards
        const allTasks: BoardTask[] = [];
        for (const board of boards) {
            try {
                const tasks = JSON.parse(board.tasks || '[]') as Record<string, unknown>[];
                tasks.forEach((task) => {
                    allTasks.push({
                        ...task,
                        boardId: board.id,
                        boardName: board.name,
                    } as BoardTask);
                });
            } catch {
                // Skip boards with invalid task data
            }
        }

        // Calculate date boundaries
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Categorize tasks
        const overdue = allTasks.filter((task) => {
            if (!task.dueDate || task.status === 'Done') return false;
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
        });

        const dueToday = allTasks.filter((task) => {
            if (!task.dueDate || task.status === 'Done') return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
        });

        const dueTomorrow = allTasks.filter((task) => {
            if (!task.dueDate || task.status === 'Done') return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === tomorrow.getTime();
        });

        const dueThisWeek = allTasks.filter((task) => {
            if (!task.dueDate || task.status === 'Done') return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate < nextWeek;
        });

        const inProgress = allTasks.filter((task) =>
            task.status && ['Working on it', 'In Progress', 'Almost Done'].includes(task.status)
        );

        const pending = allTasks.filter((task) =>
            task.status && ['To Do', 'Not Started', 'Pending'].includes(task.status)
        );

        const completed = allTasks.filter((task) => task.status === 'Done');

        const highPriority = allTasks.filter((task) =>
            task.priority && ['Urgent', 'High'].includes(task.priority) && task.status !== 'Done'
        );

        // Get GTD inbox count
        const gtdInboxCount = await prisma.gTDItem.count({
            where: { userId, category: 'inbox', isDeleted: false },
        });

        // Get recent notes count
        const notesCount = await prisma.quickNote.count({
            where: { userId, isDeleted: false },
        });

        res.json({
            summary: {
                total: allTasks.length,
                completed: completed.length,
                inProgress: inProgress.length,
                pending: pending.length,
                overdue: overdue.length,
                dueToday: dueToday.length,
                dueTomorrow: dueTomorrow.length,
                dueThisWeek: dueThisWeek.length,
                highPriority: highPriority.length,
                gtdInbox: gtdInboxCount,
                notes: notesCount,
            },
            overdue: overdue.slice(0, 10), // Limit to 10 items
            dueToday: dueToday.slice(0, 10),
            highPriority: highPriority.slice(0, 10),
            inProgress: inProgress.slice(0, 10),
            serverTime: Date.now(),
        });
    } catch (error) {
        apiLogger.error('Error fetching mobile dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// GET all tasks flattened from boards
router.get('/tasks', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { workspaceId, status, priority, limit = '50', offset = '0' } = req.query;

        const where2: Prisma.BoardWhereInput = { userId };
        if (workspaceId) where2.workspaceId = workspaceId as string;

        const boards = await prisma.board.findMany({
            where: where2,
            select: { id: true, name: true, tasks: true },
        });

        // Parse and flatten all tasks
        let allTasks: BoardTask[] = [];
        for (const board of boards) {
            try {
                const tasks = JSON.parse(board.tasks || '[]') as Record<string, unknown>[];
                tasks.forEach((task) => {
                    allTasks.push({
                        ...task,
                        boardId: board.id,
                        boardName: board.name,
                    } as BoardTask);
                });
            } catch {
                // Skip boards with invalid task data
            }
        }

        // Apply filters
        if (status) {
            allTasks = allTasks.filter((t) => t.status === status);
        }
        if (priority) {
            allTasks = allTasks.filter((t) => t.priority === priority);
        }

        // Sort by due date (nulls last), then by priority
        const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Normal: 3, Low: 4 };
        allTasks.sort((a, b) => {
            // Completed tasks go to the end
            if (a.status === 'Done' && b.status !== 'Done') return 1;
            if (a.status !== 'Done' && b.status === 'Done') return -1;

            // Sort by due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            // Sort by priority
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
            return aPriority - bPriority;
        });

        // Paginate
        const limitNum = parseInt(limit as string, 10);
        const offsetNum = parseInt(offset as string, 10);
        const paginated = allTasks.slice(offsetNum, offsetNum + limitNum);

        res.json({
            tasks: paginated,
            total: allTasks.length,
            limit: limitNum,
            offset: offsetNum,
        });
    } catch (error) {
        apiLogger.error('Error fetching mobile tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// PATCH update task status (quick action)
router.patch('/tasks/:boardId/:taskId', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const boardId = req.params.boardId as string;
        const taskId = req.params.taskId as string;
        const { status, priority } = req.body;

        // Get the board
        const board = await prisma.board.findFirst({
            where: { id: boardId, userId },
        });

        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        // Parse and update tasks
        const tasks = JSON.parse(board.tasks || '[]') as Record<string, unknown>[];
        const taskIndex = tasks.findIndex((t) => t.id === taskId);

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update task fields
        if (status !== undefined) tasks[taskIndex].status = status;
        if (priority !== undefined) tasks[taskIndex].priority = priority;

        // Save back to board
        await prisma.board.update({
            where: { id: boardId },
            data: { tasks: JSON.stringify(tasks) },
        });

        res.json({
            success: true,
            task: { ...tasks[taskIndex], boardId, boardName: board.name },
        });
    } catch (error) {
        apiLogger.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

export default router;
