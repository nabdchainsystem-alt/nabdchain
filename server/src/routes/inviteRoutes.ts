import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create an Invitation Link
router.post('/create', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { email } = req.body;

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
        const inviteLink = `http://localhost:3000/invite/accept?token=${token}`;
        res.json({ link: inviteLink, token });

    } catch (error) {
        console.error("Invite Error:", error);
        res.status(500).json({ error: "Failed to create invitation" });
    }
});

// Accept Invitation
router.post('/accept', requireAuth, async (req: any, res) => {
    try {
        const userId = req.auth.userId;
        const { token } = req.body;

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
        console.error("Accept Invite Error:", error);
        res.status(500).json({ error: "Failed to accept invitation" });
    }
});

export default router;
