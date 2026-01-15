import express from 'express';
import { getGoogleAuthURL, saveGoogleToken, googleOAuth2Client } from '../services/googleAuth';
import { getOutlookAuthURL, handleOutlookCallback } from '../services/outlookAuth';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const router = express.Router();
const prisma = new PrismaClient();

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
        console.error("Google Auth Callback missing state");
        return res.redirect('http://localhost:3000/inbox?status=error&message=missing_state');
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

        res.redirect('http://localhost:3000/inbox?status=success&provider=google');
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.redirect('http://localhost:3000/inbox?status=error');
    }
});

// Outlook Auth
router.get('/outlook', async (req: any, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).send("Unauthorized: User ID required to connect Outlook Account");
        }
        const url = await getOutlookAuthURL(userId);
        res.json({ url });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error initiating Outlook auth");
    }
});

router.get('/outlook/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!state) {
        console.error("Outlook Auth Callback missing state");
        return res.redirect('http://localhost:3000/inbox?status=error&message=missing_state');
    }

    try {
        const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        const userId = decodedState.userId;

        await handleOutlookCallback(code as string, userId);
        res.redirect('http://localhost:3000/inbox?status=success&provider=outlook');
    } catch (error) {
        console.error('Outlook Auth Error:', error);
        res.redirect('http://localhost:3000/inbox?status=error');
    }
});

// List accounts
router.get('/accounts', async (req, res) => {
    try {
        const accounts = await prisma.emailAccount.findMany({
            select: { id: true, provider: true, email: true }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch accounts" });
    }
});

// Disconnect account
router.delete('/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.emailAccount.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to disconnect account" });
    }
});

export default router;
