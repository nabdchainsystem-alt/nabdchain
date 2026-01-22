import 'dotenv/config'; // Must be first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { clerkClient } from '@clerk/clerk-sdk-node';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import inviteRoutes from './routes/inviteRoutes';
import teamRoutes from './routes/teamRoutes';
import boardRoutes from './routes/boardRoutes';
import vaultRoutes from './routes/vaultRoutes';
import docRoutes from './routes/docRoutes';
import talkRoutes from './routes/talkRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { requireAuth } from './middleware/auth';
import { validateEnv, isProduction, getEnv } from './utils/env';
import { prisma } from './lib/prisma';

// Validate environment variables at startup
validateEnv();

const app = express();
const PORT = parseInt(getEnv('PORT', '3001'), 10);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in dev for easier debugging
}));

// Rate limiting - 100 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
const allowedOrigins = isProduction
    ? [
        getEnv('CORS_ORIGIN', 'https://nabdchain.com'),
        'https://nabdchain.com',
        'https://www.nabdchain.com',
        'https://app.nabdchain.com',
        'https://mobile.nabdchain.com',
        'https://nabdchain.vercel.app'
    ]
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const corsOptions: cors.CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
            return callback(null, true);
        }
        // In development, also allow localhost
        if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Reduced from 50mb for security

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
        if (err) {
            // console.error('[AuthMiddleware] Error:', err.message);
            return res.status(401).json({ error: 'Unauthenticated' });
        }

        // Sync User to DB with real email from Clerk
        if (req.auth?.userId) {
            try {
                // Check if user exists with placeholder email and needs update
                const existingUser = await prisma.user.findUnique({
                    where: { id: req.auth.userId }
                });

                if (!existingUser) {
                    // New user - fetch email from Clerk
                    try {
                        const clerkUser = await clerkClient.users.getUser(req.auth.userId);
                        const email = clerkUser.emailAddresses?.[0]?.emailAddress || `${req.auth.userId}@placeholder.com`;
                        const name = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null;

                        await prisma.user.create({
                            data: {
                                id: req.auth.userId,
                                email: email.toLowerCase(),
                                name,
                                avatarUrl: clerkUser.imageUrl || null,
                                lastActiveAt: new Date()
                            }
                        });
                    } catch (clerkErr) {
                        // Fallback if Clerk fetch fails
                        await prisma.user.create({
                            data: {
                                id: req.auth.userId,
                                email: `${req.auth.userId}@placeholder.com`,
                                lastActiveAt: new Date()
                            }
                        });
                    }
                } else if (existingUser.email.includes('@placeholder.com')) {
                    // User exists with placeholder - update with real email
                    try {
                        const clerkUser = await clerkClient.users.getUser(req.auth.userId);
                        const email = clerkUser.emailAddresses?.[0]?.emailAddress;
                        if (email) {
                            await prisma.user.update({
                                where: { id: req.auth.userId },
                                data: {
                                    email: email.toLowerCase(),
                                    name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : existingUser.name,
                                    avatarUrl: clerkUser.imageUrl || existingUser.avatarUrl
                                }
                            });
                        }
                    } catch (clerkErr) {
                        // Ignore - keep placeholder for now
                    }
                } else {
                    // Update lastActiveAt for existing users (track online status)
                    await prisma.user.update({
                        where: { id: req.auth.userId },
                        data: { lastActiveAt: new Date() }
                    });
                }
            } catch (e) {
                console.error("User Sync Error", e);
            }
        }
        next();
    });
});

// --- HELPERS ---

function handleError(res: express.Response, error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
}

app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/talk', talkRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);

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
        console.log(`[Workspaces] Creating workspace for user: ${userId}`, { name, icon, color });

        // Ensure user exists first (redundant check but good for debug)
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            console.error(`[Workspaces] User ${userId} not found in DB!`);
            // Auto-create if missing (failsafe for dev mode inconsistencies)
            await prisma.user.create({
                data: {
                    id: userId,
                    email: userId === 'user_developer_admin' ? 'master@nabdchain.com' : `${userId}@placeholder.com`,
                    name: 'Recovered User'
                }
            });
        }

        const newWorkspace = await prisma.workspace.create({
            data: {
                name: name || 'New Workspace',
                icon: icon || 'Briefcase',
                color: color || 'from-blue-500 to-indigo-600',
                ownerId: userId,
                users: { connect: { id: userId } }
            }
        });

        // Log Activity
        await prisma.activity.create({
            data: {
                userId,
                workspaceId: newWorkspace.id,
                type: 'WORKSPACE_CREATED',
                content: `Created workspace: ${newWorkspace.name}`,
            }
        });

        console.log(`[Workspaces] Workspace created: ${newWorkspace.id}`);

        // Update user's active workspace
        await prisma.user.update({
            where: { id: userId },
            data: { workspaceId: newWorkspace.id }
        });

        res.json(newWorkspace);
    } catch (e) {
        console.error('[Workspaces] Creation Failed:', e);
        handleError(res, e);
    }
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

        // Log Activity
        await prisma.activity.create({
            data: {
                userId,
                workspaceId: id, // Will be SetNull on delete, preserving the log properly
                type: 'WORKSPACE_DELETED',
                content: `Deleted workspace: ${workspace.name}`,
            }
        });

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

        let where: any = { userId };
        if (workspaceId) {
            // Include activities for this workspace OR activities without a workspace (legacy data)
            where = {
                userId,
                OR: [
                    { workspaceId: workspaceId as string },
                    { workspaceId: null }
                ]
            };
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
    console.log(`[Server] NABD API running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});

