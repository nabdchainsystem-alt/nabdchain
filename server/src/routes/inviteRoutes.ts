import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { getEnv, isProduction } from '../utils/env';
import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

const router = express.Router();

// Input validation
const createInviteSchema = z.object({
    email: z.string().email().optional(),
});

const acceptInviteSchema = z.object({
    token: z.string().uuid(),
});

// Create an Invitation Link
router.post('/create', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = createInviteSchema.parse(req.body);
        const { email } = data;

        // 1. Get or Create Workspace for current user
        let user = await prisma.user.findUnique({ where: { id: userId }, include: { workspace: true } });

        if (!user) {
            // Should exist if auth passed, but create if missing (lazy sync)
            const newUser = await prisma.user.create({
                data: { id: userId, email: "unknown@placeholder.com" },
                include: { workspace: true }
            });
            user = newUser;
        }

        let workspaceId = user?.workspaceId;

        if (!workspaceId && user) {
            // Create a default workspace for this user
            const workspace = await prisma.workspace.create({
                data: {
                    name: `${user.email}'s Team`,
                    ownerId: userId,
                    users: { connect: { id: userId } }
                }
            });
            workspaceId = workspace.id;
        }

        // 2. Create Invitation
        const token = uuidv4();
        const invitation = await prisma.invitation.create({
            data: {
                email: email || "link_only", // Optional email
                token,
                workspaceId: workspaceId!,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        // 3. Return Link
        const baseUrl = getEnv('FRONTEND_URL', isProduction ? 'https://your-domain.com' : 'http://localhost:5173');
        const inviteLink = `${baseUrl}/invite/accept?token=${token}`;
        res.json({ link: inviteLink, token });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error("Invite Error:", error);
        res.status(500).json({ error: "Failed to create invitation" });
    }
});

// Accept Invitation
router.post('/accept', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = acceptInviteSchema.parse(req.body);
        const { token } = data;

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { workspace: true }
        });

        if (!invitation || invitation.status !== 'PENDING') {
            return res.status(400).json({ error: "Invalid or expired invitation" });
        }

        if (new Date() > invitation.expiresAt) {
            return res.status(400).json({ error: "Invitation expired" });
        }

        // Add user to workspace
        await prisma.workspace.update({
            where: { id: invitation.workspaceId },
            data: {
                users: { connect: { id: userId } }
            }
        });

        // Update invitation status
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' }
        });

        res.json({ success: true, workspaceName: invitation.workspace.name });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        apiLogger.error("Accept Invite Error:", error);
        res.status(500).json({ error: "Failed to accept invitation" });
    }
});

export default router;
