import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// @ts-ignore missing type declarations on production builds
import cookieParser from 'cookie-parser';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { requireAuth, AuthRequest } from './middleware/auth';
import { verifyAccessToken, extractTokenFromHeader } from './auth/portalToken';
import { isProduction, getEnv } from './utils/env';
import { prisma } from './lib/prisma';
import { serverLogger, authLogger, dbLogger } from './utils/logger';
import { rateLimiters, securityHeaders, sanitizeRequest, ipBlocker } from './middleware/security';
import { apiVersionMiddleware, getApiVersionInfo } from './middleware/apiVersion';
import { observabilityMiddleware, errorTrackingMiddleware } from './middleware/observabilityMiddleware';
import { initSentry, sentryErrorHandler } from './lib/sentry';
import { mountSwagger } from './lib/swagger';
import { metricsMiddleware as prometheusMetrics } from './lib/metrics';

// Route imports
import v1Routes from './routes/v1';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import inviteRoutes from './routes/inviteRoutes';
import teamRoutes from './routes/teamRoutes';
import boardRoutes from './routes/boardRoutes';
import roomRoutes from './routes/roomRoutes';
import vaultRoutes from './routes/vaultRoutes';
import docRoutes from './routes/docRoutes';
import talkRoutes from './routes/talkRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';
import aiRoutes from './routes/aiRoutes';
import aiGatewayRoutes from './routes/aiGatewayRoutes';
import gtdRoutes from './routes/gtdRoutes';
import notesRoutes from './routes/notesRoutes';
import mobileRoutes from './routes/mobileRoutes';
import commentsRoutes from './routes/commentsRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import timeTrackingRoutes from './routes/timeTrackingRoutes';
import templatesRoutes from './routes/templatesRoutes';
import portalRoutes from './routes/portalRoutes';
import consolidatedPortalRoutes from './routes/portal';
import itemRoutes from './routes/itemRoutes';
import orderRoutes from './routes/orderRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import customerRoutes from './routes/customerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import expenseRoutes from './routes/expenseRoutes';
import buyerWorkspaceRoutes from './routes/buyerWorkspaceRoutes';
import sellerSettingsRoutes from './routes/sellerSettingsRoutes';
import publicSellerRoutes from './routes/publicSellerRoutes';
import sellerWorkspaceRoutes from './routes/sellerWorkspaceRoutes';
import buyerPurchasesRoutes from './routes/buyerPurchasesRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import disputeRoutes from './routes/disputeRoutes';
import returnRoutes from './routes/returnRoutes';
import payoutRoutes from './routes/payoutRoutes';
import automationRoutes from './routes/automationRoutes';
import trustRoutes from './routes/trustRoutes';
import portalAuthRoutes from './routes/portalAuthRoutes';
import portalAdminRoutes from './routes/portalAdminRoutes';
import featureGatingRoutes from './routes/featureGatingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import sellerHomeRoutes from './routes/sellerHomeRoutes';
import buyerCartRoutes from './routes/buyerCartRoutes';
import orderTimelineRoutes from './routes/orderTimelineRoutes';
import permissionRoutes from './routes/permissionRoutes';
import monitoringRoutes from './routes/monitoringRoutes';
import workspaceIntelligenceRoutes from './routes/workspaceIntelligenceRoutes';
import ratingRoutes from './routes/ratingRoutes';

function handleError(res: express.Response, error: unknown) {
    serverLogger.error('Request error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
}

export function createApp() {
    const app = express();

    // Initialize Sentry early (before routes)
    initSentry(app);

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: isProduction ? {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                connectSrc: ["'self'", "https://api.clerk.dev", "wss:", "https:"],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                upgradeInsecureRequests: [],
            },
        } : false,
        hsts: isProduction ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        } : false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 60 * 1000,
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
            if (!origin) return callback(null, true);
            if (!isProduction) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'X-User-Id', 'Idempotency-Key', 'x-csrf-token'],
    };
    app.use(cors(corsOptions));

    // Observability middleware
    app.use(observabilityMiddleware({
        excludePaths: ['/health', '/health/live', '/health/ready', '/metrics'],
        slowRequestThresholdMs: 1000,
    }));

    // Monitoring routes (no auth required)
    app.use('/', monitoringRoutes);

    // OpenAPI documentation (no auth required)
    mountSwagger(app);

    app.use(cookieParser());
    app.use(express.json({ limit: '10mb' }));

    // Security middleware — sanitize inputs, block bad IPs, add security headers
    app.use(securityHeaders);
    app.use(sanitizeRequest);
    app.use(ipBlocker);

    // Prometheus metrics middleware (records request duration, count, active connections)
    app.use(prometheusMetrics);

    // Auth Middleware & User Sync
    app.use(async (req: any, res, next) => {
        if (req.method === 'OPTIONS') return next();

        if (req.path === '/health' ||
            req.path === '/api/portal' ||
            req.path.startsWith('/api/auth/google/callback') ||
            req.path.startsWith('/api/auth/outlook/callback') ||
            req.path.startsWith('/api/auth/portal/') ||
            req.path.startsWith('/api/portal/auth/') ||
            req.path.startsWith('/api/portal/buyer/marketplace') ||
            req.path.startsWith('/api/items/marketplace') ||
            req.path.startsWith('/api/portal-admin/') ||
            req.path.startsWith('/api/gating/') ||
            req.path.startsWith('/api/public/')) {
            return next();
        }

        // Check for Portal JWT token first
        const authHeader = req.headers['authorization'] as string | undefined;
        const portalToken = extractTokenFromHeader(authHeader);

        if (portalToken) {
            const portalResult = verifyAccessToken(portalToken);
            if (portalResult.valid && portalResult.payload) {
                req.portalAuth = portalResult.payload;
                req.auth = { userId: portalResult.payload.userId };
                if (req.path.includes('rfq-marketplace')) {
                    authLogger.info('[Auth] Portal token validated for rfq-marketplace:', {
                        path: req.path,
                        userId: portalResult.payload.userId,
                        portalRole: portalResult.payload.portalRole,
                        sellerId: portalResult.payload.sellerId,
                        buyerId: portalResult.payload.buyerId,
                    });
                }
                return next();
            } else if (req.path.includes('rfq-marketplace')) {
                authLogger.warn('[Auth] Portal token invalid for rfq-marketplace:', {
                    path: req.path,
                    error: portalResult.error,
                });
            }
        } else if (req.path.includes('rfq-marketplace')) {
            authLogger.warn('[Auth] No portal token for rfq-marketplace request:', {
                path: req.path,
                hasAuthHeader: !!authHeader,
            });
        }

        // Run Clerk Auth (for main app users)
        requireAuth(req, res as any, async (err: any) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthenticated' });
            }

            // Sync User to DB
            if (req.auth?.userId) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { id: req.auth.userId }
                    });

                    if (!existingUser) {
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
                            authLogger.warn(`Clerk user fetch failed for ${req.auth.userId}, creating placeholder:`, clerkErr);
                            await prisma.user.create({
                                data: {
                                    id: req.auth.userId,
                                    email: `${req.auth.userId}@placeholder.com`,
                                    lastActiveAt: new Date()
                                }
                            });
                        }
                    } else if (existingUser.email.includes('@placeholder.com')) {
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
                            authLogger.debug(`Clerk update failed for ${req.auth.userId}, keeping placeholder:`, clerkErr);
                        }
                    } else {
                        await prisma.user.update({
                            where: { id: req.auth.userId },
                            data: { lastActiveAt: new Date() }
                        });
                    }
                } catch (e) {
                    dbLogger.error('User Sync Error', e);
                }
            }
            next();
        });
    });

    // --- API Versioning ---
    app.use('/api', apiVersionMiddleware());
    app.get('/api/version', getApiVersionInfo);
    app.use('/api/v1', v1Routes);

    // --- Route mounting ---
    app.use('/api/auth', rateLimiters.auth, authRoutes);
    app.use('/api/auth/portal', rateLimiters.auth, portalAuthRoutes);
    app.use('/api/email', emailRoutes);
    app.use('/api/invite', inviteRoutes);
    app.use('/api/team', teamRoutes);
    app.use('/api/boards', boardRoutes);
    app.use('/api', roomRoutes);
    app.use('/api/vault', vaultRoutes);
    app.use('/api/docs', docRoutes);
    app.use('/api/talk', talkRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/admin', rateLimiters.strict, adminRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/upload', rateLimiters.upload, uploadRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/ai', aiGatewayRoutes);
    app.use('/api/workspace/intelligence', workspaceIntelligenceRoutes);
    app.use('/api/gtd', gtdRoutes);
    app.use('/api/notes', notesRoutes);
    app.use('/api/mobile', mobileRoutes);
    app.use('/api/comments', commentsRoutes);
    app.use('/api/notifications', notificationsRoutes);
    app.use('/api/time-entries', timeTrackingRoutes);
    app.use('/api/templates', templatesRoutes);

    // Consolidated portal API
    app.use('/api/portal', consolidatedPortalRoutes);

    // Legacy portal routes
    app.use('/api/portal-legacy', portalRoutes);

    // Items/marketplace
    app.use('/api/items', itemRoutes);

    // Orders
    app.use('/api/orders', orderRoutes);
    app.use('/api/orders', orderTimelineRoutes);

    // Dashboard and analytics
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/expenses', expenseRoutes);
    app.use('/api/analytics', analyticsRoutes);

    // Legacy buyer routes
    app.use('/api/buyer', buyerWorkspaceRoutes);
    app.use('/api/purchases', buyerPurchasesRoutes);
    app.use('/api/buyer-cart', buyerCartRoutes);

    // Legacy seller routes
    app.use('/api/seller', sellerSettingsRoutes);
    app.use('/api/seller', sellerWorkspaceRoutes);
    app.use('/api/seller', sellerHomeRoutes);

    // Public seller routes (no auth)
    app.use('/api/public', publicSellerRoutes);

    // Invoices, payments, disputes, returns, payouts
    app.use('/api/invoices', rateLimiters.standard, invoiceRoutes);
    app.use('/api/payments', rateLimiters.strict, paymentRoutes);
    app.use('/api/disputes', rateLimiters.standard, disputeRoutes);
    app.use('/api/returns', rateLimiters.standard, returnRoutes);
    app.use('/api/payouts', rateLimiters.strict, payoutRoutes);

    // Ratings
    app.use('/api/ratings', ratingRoutes);

    // Automation, trust, feature gating
    app.use('/api/automation', automationRoutes);
    app.use('/api/trust', trustRoutes);
    app.use('/api/gating', featureGatingRoutes);

    // Legacy admin routes
    app.use('/api/portal-admin', portalAdminRoutes);

    // --- Workspace Routes (inline) ---
    app.get('/api/workspaces', requireAuth, async (req: any, res) => {
        try {
            const userId = req.auth.userId;
            const workspaces = await prisma.workspace.findMany({
                where: {
                    OR: [
                        { ownerId: userId },
                        { users: { some: { id: userId } } }
                    ]
                }
            });

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
            serverLogger.info(`Creating workspace for user: ${userId}`, { name, icon, color });

            const userExists = await prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                dbLogger.error(`User ${userId} not found in DB!`);
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

            await prisma.activity.create({
                data: {
                    userId,
                    workspaceId: newWorkspace.id,
                    type: 'WORKSPACE_CREATED',
                    content: `Created workspace: ${newWorkspace.name}`,
                }
            });

            serverLogger.info(`Workspace created: ${newWorkspace.id}`);

            await prisma.user.update({
                where: { id: userId },
                data: { workspaceId: newWorkspace.id }
            });

            res.json(newWorkspace);
        } catch (e) {
            serverLogger.error('Workspace creation failed:', e);
            handleError(res, e);
        }
    });

    app.patch('/api/workspaces/:id', requireAuth, async (req: any, res) => {
        try {
            const userId = req.auth.userId;
            const { id } = req.params;
            const { name, icon } = req.body;

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

            const workspace = await prisma.workspace.findUnique({ where: { id } });
            if (!workspace || workspace.ownerId !== userId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            await prisma.activity.create({
                data: {
                    userId,
                    workspaceId: id,
                    type: 'WORKSPACE_DELETED',
                    content: `Deleted workspace: ${workspace.name}`,
                }
            });

            await prisma.workspace.delete({ where: { id } });

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

    // --- Activity Routes (inline) ---
    app.get('/api/activities', requireAuth, async (req: any, res) => {
        try {
            const userId = req.auth.userId;
            const { workspaceId } = req.query;

            let where: Record<string, unknown> = { userId };
            if (workspaceId) {
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

    // Sentry error handler (must be after all routes)
    app.use(sentryErrorHandler());

    // Error tracking middleware (must be after all routes)
    app.use(errorTrackingMiddleware());

    return app;
}
