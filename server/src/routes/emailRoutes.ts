import express, { Response } from 'express';
import { decrypt } from '../utils/encryption';
import { google } from 'googleapis';
import { googleOAuth2Client } from '../services/googleAuth';
import 'isomorphic-fetch';
import { Client } from '@microsoft/microsoft-graph-client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Input validation schemas
const sendEmailSchema = z.object({
    to: z.string().min(1).max(1000),
    subject: z.string().max(500),
    body: z.string().max(500000), // 500KB limit
    provider: z.enum(['google', 'outlook']),
    cc: z.string().max(1000).optional(),
    bcc: z.string().max(1000).optional(),
});

const emailActionSchema = z.object({
    id: z.string().min(1).max(500),
    provider: z.enum(['google', 'outlook']),
});

// Helper to get Google Client
const getGoogleClient = (accessToken: string, refreshToken: string) => {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });
    return client;
};

// Helper to get Graph Client
const getGraphClient = (accessToken: string) => {
    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
};

// --- Folder Routes ---
router.get('/folders', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;

        // Only fetch THIS user's accounts
        const accounts = await prisma.emailAccount.findMany({
            where: { userId }
        });
        let allFolders: any[] = [];

        for (const account of accounts) {
            const accessToken = decrypt(account.accessToken);
            if (account.provider === 'google') {
                try {
                    const auth = getGoogleClient(accessToken, decrypt(account.refreshToken));
                    const gmail = google.gmail({ version: 'v1', auth });
                    const response = await gmail.users.labels.list({ userId: 'me' });
                    const labels = response.data.labels || [];

                    const relevantLabels = labels.filter(l =>
                        l.type === 'user' ||
                        ['INBOX', 'SENT', 'TRASH', 'DRAFT', 'IMPORTANT', 'STARRED'].includes(l.id || '')
                    ).map(l => ({
                        id: l.id,
                        name: l.name,
                        type: l.type,
                        provider: 'google',
                        accountEmail: account.email
                    }));
                    allFolders = [...allFolders, ...relevantLabels];

                } catch (e) {
                    console.error(`Error fetching google folders for ${account.email}`, e);
                }
            } else if (account.provider === 'outlook') {
                try {
                    const client = getGraphClient(accessToken);
                    const response = await client.api('/me/mailFolders').top(50).get();
                    const folders = response.value.map((f: any) => ({
                        id: f.id,
                        name: f.displayName,
                        type: 'system',
                        provider: 'outlook',
                        accountEmail: account.email
                    }));
                    allFolders = [...allFolders, ...folders];
                } catch (e) {
                    console.error(`Error fetching outlook folders for ${account.email}`, e);
                }
            }
        }
        res.json(allFolders);
    } catch (e) {
        console.error("Folder List Error", e);
        res.status(500).json({ error: "Failed to fetch folders" });
    }
});

router.get('/list', requireAuth, async (req, res: Response) => {
    const userId = (req as AuthRequest).auth.userId;
    const { folderId, provider } = req.query;

    try {
        // Only fetch THIS user's accounts
        const accounts = await prisma.emailAccount.findMany({
            where: { userId }
        });
        let allEmails: any[] = [];

        for (const account of accounts) {
            if (provider && account.provider !== provider) continue;

            const accessToken = decrypt(account.accessToken);

            if (account.provider === 'google') {
                try {
                    const auth = getGoogleClient(accessToken, decrypt(account.refreshToken));
                    const gmail = google.gmail({ version: 'v1', auth });

                    const response = await gmail.users.messages.list({
                        userId: 'me',
                        maxResults: 10,
                        labelIds: folderId ? [folderId as string] : ['INBOX']
                    });

                    const messages = response.data.messages || [];

                    const details = await Promise.all(messages.map(async (msg) => {
                        const content = await gmail.users.messages.get({
                            userId: 'me',
                            id: msg.id!
                        });
                        const headers = content.data.payload?.headers;
                        const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
                        const from = headers?.find(h => h.name === 'From')?.value || 'Unknown';
                        const date = headers?.find(h => h.name === 'Date')?.value || '';

                        const findHtmlBody = (payload: any): string | null => {
                            if (!payload) return null;
                            if (payload.mimeType === 'text/html' && payload.body?.data) {
                                return Buffer.from(payload.body.data, 'base64').toString('utf-8');
                            }
                            if (payload.parts) {
                                for (const part of payload.parts) {
                                    const body = findHtmlBody(part);
                                    if (body) return body;
                                }
                            }
                            return null;
                        };

                        const findTextBody = (payload: any): string | null => {
                            if (!payload) return null;
                            if (payload.mimeType === 'text/plain' && payload.body?.data) {
                                return Buffer.from(payload.body.data, 'base64').toString('utf-8');
                            }
                            if (payload.parts) {
                                for (const part of payload.parts) {
                                    const body = findTextBody(part);
                                    if (body) return body;
                                }
                            }
                            return null;
                        };

                        let body = findHtmlBody(content.data.payload) || findTextBody(content.data.payload) || '';
                        if (!body && content.data.snippet) {
                            body = `<p>${content.data.snippet}</p>`;
                        }

                        return {
                            id: msg.id,
                            provider: 'google',
                            accountEmail: account.email,
                            subject,
                            sender: from,
                            preview: content.data.snippet,
                            body,
                            time: date,
                            initial: from.charAt(0).toUpperCase(),
                            color: 'bg-blue-500',
                            isUnread: content.data.labelIds?.includes('UNREAD')
                        };
                    }));

                    allEmails = [...allEmails, ...details];
                } catch (e) {
                    console.error(`Error fetching google for ${account.email}`, e);
                }
            } else if (account.provider === 'outlook') {
                try {
                    const client = getGraphClient(accessToken);
                    const endpoint = folderId
                        ? `/me/mailFolders/${encodeURIComponent(folderId as string)}/messages`
                        : '/me/mailFolders/inbox/messages';

                    const response = await client.api(endpoint)
                        .top(10)
                        .select('id,subject,from,bodyPreview,body,receivedDateTime,isRead')
                        .get();

                    const msgs = response.value.map((msg: any) => ({
                        id: msg.id,
                        provider: 'outlook',
                        accountEmail: account.email,
                        subject: msg.subject,
                        sender: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address,
                        preview: msg.bodyPreview,
                        body: msg.body?.content,
                        time: msg.receivedDateTime,
                        initial: (msg.from?.emailAddress?.name || 'O').charAt(0),
                        color: 'bg-blue-600',
                        isUnread: !msg.isRead
                    }));

                    allEmails = [...allEmails, ...msgs];
                } catch (e) {
                    console.error(`Error fetching outlook for ${account.email}`, e);
                }
            }
        }

        allEmails.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        res.json(allEmails);
    } catch (error) {
        console.error("List Error", error);
        res.status(500).json({ error: "Failed to fetch emails" });
    }
});

router.post('/send', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const data = sendEmailSchema.parse(req.body);
        const { to, subject, body, provider, cc, bcc } = data;

        // Only use THIS user's account
        const account = await prisma.emailAccount.findFirst({
            where: { userId, provider }
        });

        if (!account) {
            return res.status(404).json({ error: "No connected account found for this provider" });
        }

        const accessToken = decrypt(account.accessToken);

        if (account.provider === 'google') {
            const auth = getGoogleClient(accessToken, decrypt(account.refreshToken));
            const gmail = google.gmail({ version: 'v1', auth });

            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

            let messageParts = [
                `To: ${to}`,
                `Subject: ${utf8Subject}`,
                `Content-Type: text/html; charset=utf-8`,
                `MIME-Version: 1.0`
            ];

            if (cc) messageParts.push(`Cc: ${cc}`);
            if (bcc) messageParts.push(`Bcc: ${bcc}`);

            const message = [
                ...messageParts,
                ``,
                body
            ].join('\n');

            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw: encodedMessage }
            });
        } else if (account.provider === 'outlook') {
            const client = getGraphClient(accessToken);

            const sendPayload: any = {
                message: {
                    subject: subject,
                    body: {
                        contentType: "HTML",
                        content: body
                    },
                    toRecipients: to.split(',').map((email: string) => ({
                        emailAddress: { address: email.trim() }
                    }))
                }
            };

            if (cc) {
                sendPayload.message.ccRecipients = cc.split(',').map((email: string) => ({
                    emailAddress: { address: email.trim() }
                }));
            }
            if (bcc) {
                sendPayload.message.bccRecipients = bcc.split(',').map((email: string) => ({
                    emailAddress: { address: email.trim() }
                }));
            }

            await client.api('/me/sendMail').post(sendPayload);
        }

        res.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        console.error("Send Error", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

// --- Action Routes ---

router.post('/trash', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { id, provider } = emailActionSchema.parse(req.body);

        const account = await prisma.emailAccount.findFirst({
            where: { userId, provider }
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const accessToken = decrypt(account.accessToken);

        if (provider === 'google') {
            const auth = getGoogleClient(accessToken, decrypt(account.refreshToken));
            const gmail = google.gmail({ version: 'v1', auth });
            await gmail.users.messages.trash({ userId: 'me', id });
        } else {
            const client = getGraphClient(accessToken);
            await client.api(`/me/messages/${encodeURIComponent(id)}/move`).post({
                destinationId: 'deleteditems'
            });
        }
        res.json({ success: true });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        console.error(e);
        res.status(500).json({ error: 'Failed to trash' });
    }
});

router.post('/archive', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { id, provider } = emailActionSchema.parse(req.body);

        const account = await prisma.emailAccount.findFirst({
            where: { userId, provider }
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const accessToken = decrypt(account.accessToken);

        if (provider === 'google') {
            const auth = getGoogleClient(accessToken, decrypt(account.refreshToken));
            const gmail = google.gmail({ version: 'v1', auth });
            await gmail.users.messages.modify({
                userId: 'me',
                id,
                requestBody: { removeLabelIds: ['INBOX'] }
            });
        } else {
            const client = getGraphClient(accessToken);
            await client.api(`/me/messages/${encodeURIComponent(id)}/move`).post({
                destinationId: 'archive'
            });
        }
        res.json({ success: true });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        console.error(e);
        res.status(500).json({ error: 'Failed to archive' });
    }
});

router.post('/read', requireAuth, async (req, res: Response) => {
    try {
        const userId = (req as AuthRequest).auth.userId;
        const { id, provider } = emailActionSchema.parse(req.body);

        const account = await prisma.emailAccount.findFirst({
            where: { userId, provider }
        });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const accessToken = decrypt(account.accessToken);

        if (provider === 'google') {
            const auth = getGoogleClient(accessToken, decrypt(account.refreshToken));
            const gmail = google.gmail({ version: 'v1', auth });
            await gmail.users.messages.modify({
                userId: 'me',
                id,
                requestBody: { removeLabelIds: ['UNREAD'] }
            });
        } else {
            const client = getGraphClient(accessToken);
            await client.api(`/me/messages/${encodeURIComponent(id)}`).patch({ isRead: true });
        }
        res.json({ success: true });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        console.error(e);
        res.status(500).json({ error: 'Failed to mark read' });
    }
});

export default router;
