import express from 'express';
import { getGoogleAuthURL, saveGoogleToken, googleOAuth2Client } from '../services/googleAuth';
import { getOutlookAuthURL, handleOutlookCallback } from '../services/outlookAuth';
import { google } from 'googleapis';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getEnv } from '../utils/env';
import { authLogger } from '../utils/logger';

const FRONTEND_URL = getEnv('FRONTEND_URL', 'http://localhost:3000');

const router = express.Router();

// Google Auth
router.get('/google', (req: any, res) => {
    const userId = req.auth.userId;
    if (!userId) {
        return res.status(401).send("Unauthorized: User ID required to connect Google Account");
    }
    const url = getGoogleAuthURL(userId);
    res.json({ url });
});

router.get('/google/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!state) {
        // Fallback or error? For now, if no state, we can't link to user securely.
        authLogger.error("Google Auth Callback missing state");
        return res.redirect(`${FRONTEND_URL}/inbox?status=error&message=missing_state`);
    }

    try {
        const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        const userId = decodedState.userId;

        const { tokens } = await googleOAuth2Client.getToken(code as string);
        googleOAuth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (userInfo.data.email) {
            await saveGoogleToken(userInfo.data.email, tokens, userId);
        }

        res.redirect(`${FRONTEND_URL}/inbox?status=success&provider=google`);
    } catch (error) {
        authLogger.error('Google Auth Error:', error);
        res.redirect(`${FRONTEND_URL}/inbox?status=error`);
    }
});

// Outlook Auth
router.get('/outlook', async (req: any, res) => {
    try {
        const userId = (req as AuthRequest).auth?.userId;
        if (!userId) {
            return res.status(401).send("Unauthorized: User ID required to connect Outlook Account");
        }
        const url = await getOutlookAuthURL(userId);
        res.json({ url });
    } catch (err) {
        authLogger.error('Error initiating Outlook auth', err);
        res.status(500).send("Error initiating Outlook auth");
    }
});

router.get('/outlook/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!state) {
        authLogger.error("Outlook Auth Callback missing state");
        return res.redirect(`${FRONTEND_URL}/inbox?status=error&message=missing_state`);
    }

    try {
        const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        const userId = decodedState.userId;

        await handleOutlookCallback(code as string, userId);
        res.redirect(`${FRONTEND_URL}/inbox?status=success&provider=outlook`);
    } catch (error) {
        authLogger.error('Outlook Auth Error:', error);
        res.redirect(`${FRONTEND_URL}/inbox?status=error`);
    }
});

// List accounts - filtered by authenticated user
router.get('/accounts', requireAuth, async (req, res) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const accounts = await prisma.emailAccount.findMany({
            where: { userId },
            select: { id: true, provider: true, email: true }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch accounts" });
    }
});

// Disconnect account - verify ownership before delete
router.delete('/accounts/:id', requireAuth, async (req, res) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const id = req.params.id as string;

        // Verify the account belongs to the authenticated user
        const account = await prisma.emailAccount.findFirst({
            where: { id, userId }
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        await prisma.emailAccount.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to disconnect account" });
    }
});

export default router;
