import 'dotenv/config'; // Must be first
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import inviteRoutes from './routes/inviteRoutes';
import boardRoutes from './routes/boardRoutes';
import discussionRoutes from './routes/discussionRoutes';
import vaultRoutes from './routes/vaultRoutes';
import { requireAuth } from './middleware/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Auth Middleware & User Sync
app.use(async (req: any, res, next) => {
    // Skip auth for public routes if any (none for now)
    if (req.method === 'OPTIONS') return next();

    if (req.path === '/health' ||
        req.path.startsWith('/api/auth/google/callback') ||
        req.path.startsWith('/api/auth/outlook/callback')) {
        return next();
    }

    // Run Clerk Auth
    requireAuth(req, res as any, async (err: any) => {
        if (err) return next(err);

        // Sync User to DB
        if (req.auth?.userId) {
            try {
                await prisma.user.upsert({
                    where: { id: req.auth.userId },
                    update: {},
                    create: {
                        id: req.auth.userId,
                        email: `${req.auth.userId}@placeholder.com`
                    }
                });
            } catch (e) {
                console.error("User Sync Error", e);
            }
        }
        next();
    });
});

// --- HELPERS ---

function safeJSONParse<T>(jsonString: string | null | undefined, fallback: T): T {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        return fallback;
    }
}

function handleError(res: express.Response, error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
}

app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/threads', discussionRoutes);

// --- Workspace Routes ---
app.get('/api/workspaces', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;

        // Find all workspaces where user is owner or member
        const workspaces = await prisma.workspace.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { users: { some: { id: userId } } }
                ]
            }
        });

        // If user has no workspace, create one automatically
        if (workspaces.length === 0) {
            const newWorkspace = await prisma.workspace.create({
                data: {
                    name: `Main Workspace`,
                    icon: 'Briefcase',
                    color: 'from-blue-500 to-indigo-600',
                    ownerId: userId,
                    users: { connect: { id: userId } }
                }
            });

            // Maintain legacy workspaceId on User for now as "current"
            await prisma.user.update({
                where: { id: userId },
                data: { workspaceId: newWorkspace.id }
            });

            return res.json([newWorkspace]);
        }

        res.json(workspaces);
    } catch (e) { handleError(res, e); }
});

app.post('/api/workspaces', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { name, icon, color } = req.body;

        const newWorkspace = await prisma.workspace.create({
            data: {
                name: name || 'New Workspace',
                icon: icon || 'Briefcase',
                color: color || 'from-blue-500 to-indigo-600',
                ownerId: userId,
                users: { connect: { id: userId } }
            }
        });

        // Update user's active workspace
        await prisma.user.update({
            where: { id: userId },
            data: { workspaceId: newWorkspace.id }
        });

        res.json(newWorkspace);
    } catch (e) { handleError(res, e); }
});

app.patch('/api/workspaces/:id', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;
        const { name, icon } = req.body;

        // Check ownership or membership? For now, only owner can edit
        const workspace = await prisma.workspace.findUnique({ where: { id } });
        if (!workspace || workspace.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const updated = await prisma.workspace.update({
            where: { id },
            data: { name, icon }
        });

        res.json(updated);
    } catch (e) { handleError(res, e); }
});

app.delete('/api/workspaces/:id', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;

        // Only owner can delete
        const workspace = await prisma.workspace.findUnique({ where: { id } });
        if (!workspace || workspace.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await prisma.workspace.delete({ where: { id } });

        // If this was the user's active workspace, clear it or pick another
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.workspaceId === id) {
            const nextWorkspace = await prisma.workspace.findFirst({
                where: { OR: [{ ownerId: userId }, { users: { some: { id: userId } } }] }
            });
            await prisma.user.update({
                where: { id: userId },
                data: { workspaceId: nextWorkspace?.id || null }
            });
        }

        res.json({ success: true });
    } catch (e) { handleError(res, e); }
});
// --- Activity Routes ---
app.get('/api/activities', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { workspaceId } = req.query;

        const where: any = { userId };
        if (workspaceId) {
            where.workspaceId = workspaceId;
        }

        const activities = await prisma.activity.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(activities);
    } catch (e) { handleError(res, e); }
});

app.post('/api/activities', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { type, content, metadata, workspaceId, boardId } = req.body;
        const activity = await prisma.activity.create({
            data: {
                userId,
                workspaceId,
                boardId,
                type,
                content,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });
        res.json(activity);
    } catch (e) { handleError(res, e); }
});

// Prefixed routes above replace these legacy ones.
// All board/card/thread/room logic should stay in routes/*.ts files going forward.

app.listen(PORT, () => {
    console.log(`SQL Server running on http://localhost:${PORT}`);
});

