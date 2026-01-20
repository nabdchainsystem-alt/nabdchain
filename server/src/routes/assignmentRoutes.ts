import express, { Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Input validation schemas
const createAssignmentSchema = z.object({
    sourceBoardId: z.string().min(1),
    sourceRowId: z.string().min(1),
    sourceTaskData: z.any(), // JSON object of task data
    assignedToUserId: z.string().min(1),
});

// Helper to get or create "Assigned to me" board
async function getOrCreateAssignedBoard(userId: string): Promise<string> {
    // Check if user already has an "Assigned to me" board
    const existingBoard = await prisma.board.findFirst({
        where: {
            userId,
            type: 'assigned'
        }
    });

    if (existingBoard) {
        return existingBoard.id;
    }

    // Create new "Assigned to me" board
    const board = await prisma.board.create({
        data: {
            name: 'Assigned to me',
            userId,
            type: 'assigned',
            icon: 'UserCheck',
            defaultView: 'table',
            availableViews: JSON.stringify(['table', 'kanban', 'calendar']),
            columns: JSON.stringify([
                { id: 'name', name: 'Task', type: 'text', width: 250 },
                { id: 'status', name: 'Status', type: 'status', width: 130 },
                { id: 'priority', name: 'Priority', type: 'priority', width: 130 },
                { id: 'dueDate', name: 'Due Date', type: 'date', width: 130 },
                { id: 'assignedBy', name: 'Assigned By', type: 'person', width: 150 },
                { id: 'sourceBoard', name: 'Source Board', type: 'text', width: 150 },
            ]),
            tasks: '[]'
        }
    });

    return board.id;
}

// POST /: Create Assignment (assign task to user)
router.post('/', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createAssignmentSchema.parse(req.body);

        // Verify the assignee exists and is connected
        const connection = await prisma.teamConnection.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: data.assignedToUserId, status: 'ACCEPTED' },
                    { senderId: data.assignedToUserId, receiverId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        if (!connection) {
            return res.status(403).json({ error: "You can only assign tasks to connected team members" });
        }

        // Get assigner info
        const assigner = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, avatarUrl: true }
        });

        // Get source board info
        const sourceBoard = await prisma.board.findUnique({
            where: { id: data.sourceBoardId },
            select: { name: true }
        });

        // Get or create "Assigned to me" board for assignee
        const assignedBoardId = await getOrCreateAssignedBoard(data.assignedToUserId);

        // Get current tasks from the assigned board
        const assignedBoard = await prisma.board.findUnique({
            where: { id: assignedBoardId }
        });

        const currentTasks = assignedBoard?.tasks ? JSON.parse(assignedBoard.tasks) : [];

        // Create copied task with metadata
        const copiedRowId = crypto.randomUUID();
        const taskData = typeof data.sourceTaskData === 'string'
            ? JSON.parse(data.sourceTaskData)
            : data.sourceTaskData;

        const copiedTask = {
            ...taskData,
            id: copiedRowId,
            _originalTaskId: data.sourceRowId,
            _sourceBoardId: data.sourceBoardId,
            _sourceBoardName: sourceBoard?.name || 'Unknown Board',
            assignedBy: assigner?.name || assigner?.email || 'Unknown',
            assignedById: userId,
            assignedAt: new Date().toISOString(),
        };

        // Add task to board
        currentTasks.push(copiedTask);
        await prisma.board.update({
            where: { id: assignedBoardId },
            data: { tasks: JSON.stringify(currentTasks) }
        });

        // Create assignment record
        const assignment = await prisma.assignment.create({
            data: {
                sourceBoardId: data.sourceBoardId,
                sourceRowId: data.sourceRowId,
                sourceTaskData: JSON.stringify(data.sourceTaskData),
                assignedFromUserId: userId,
                assignedToUserId: data.assignedToUserId,
                copiedBoardId: assignedBoardId,
                copiedRowId: copiedRowId,
            },
            include: {
                assignedFromUser: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                }
            }
        });

        res.json(assignment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        console.error("Create Assignment Error:", error);
        res.status(500).json({ error: "Failed to create assignment" });
    }
});

// GET /pending: Get unread assignments for current user
router.get('/pending', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const assignments = await prisma.assignment.findMany({
            where: {
                assignedToUserId: userId,
                isViewed: false
            },
            include: {
                assignedFromUser: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse sourceTaskData for each assignment
        const parsedAssignments = assignments.map(a => ({
            ...a,
            sourceTaskData: a.sourceTaskData ? JSON.parse(a.sourceTaskData) : {}
        }));

        res.json(parsedAssignments);
    } catch (error) {
        console.error("Get Pending Assignments Error:", error);
        res.status(500).json({ error: "Failed to fetch pending assignments" });
    }
});

// GET /count: Get unread assignment count
router.get('/count', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const count = await prisma.assignment.count({
            where: {
                assignedToUserId: userId,
                isViewed: false
            }
        });

        res.json({ count });
    } catch (error) {
        console.error("Get Assignment Count Error:", error);
        res.status(500).json({ error: "Failed to fetch assignment count" });
    }
});

// PUT /:id/viewed: Mark assignment as viewed
router.put('/:id/viewed', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { id } = req.params;

        // Verify assignment belongs to user
        const assignment = await prisma.assignment.findFirst({
            where: {
                id,
                assignedToUserId: userId
            }
        });

        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        const updated = await prisma.assignment.update({
            where: { id },
            data: {
                isViewed: true,
                viewedAt: new Date()
            }
        });

        res.json(updated);
    } catch (error) {
        console.error("Mark Assignment Viewed Error:", error);
        res.status(500).json({ error: "Failed to mark assignment as viewed" });
    }
});

// GET /all: Get all assignments (both viewed and unviewed)
router.get('/all', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        const assignments = await prisma.assignment.findMany({
            where: {
                assignedToUserId: userId
            },
            include: {
                assignedFromUser: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50
        });

        const parsedAssignments = assignments.map(a => ({
            ...a,
            sourceTaskData: a.sourceTaskData ? JSON.parse(a.sourceTaskData) : {}
        }));

        res.json(parsedAssignments);
    } catch (error) {
        console.error("Get All Assignments Error:", error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
});

export default router;
