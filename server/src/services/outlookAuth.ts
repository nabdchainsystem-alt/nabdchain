import * as msal from '@azure/msal-node';
import { encrypt, decrypt } from '../utils/encryption';
import 'isomorphic-fetch'; // Polyfill for Graph Client
import { prisma } from '../lib/prisma';

const CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || '';
const CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/auth/outlook/callback';
const TENANT_ID = 'common'; // Supports personal and work

const msalConfig = {
    auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        clientSecret: CLIENT_SECRET,
    }
};

const SCOPES = ['User.Read', 'Mail.Read', 'Mail.ReadWrite', 'Mail.Send', 'offline_access'];


let pca: msal.ConfidentialClientApplication | null = null;

const getPca = () => {
    if (pca) return pca;

    // safe check for keys
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error("Outlook credentials not configured in .env");
    }

    pca = new msal.ConfidentialClientApplication(msalConfig);
    return pca;
};

export const getOutlookAuthURL = async (userId: string) => {
    const client = getPca();
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    return await client.getAuthCodeUrl({
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
        state
    });
};

export const handleOutlookCallback = async (code: string, userId: string) => {
    const client = getPca();
    const tokenRequest = {
        code,
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
    };

    const response = await client.acquireTokenByCode(tokenRequest);
    if (!response) throw new Error("Failed to acquire token");

    const { accessToken, account, expiresOn } = response;
    const email = account?.username;

    if (!email) throw new Error("No email found in account info");

    // Save to DB
    const existing = await prisma.emailAccount.findFirst({
        where: { email, provider: 'outlook' }
    });

    // NOTE: MSAL manages refresh tokens internally. For MVP, we store access token
    // and ask user to re-login if token expires.

    const data = {
        provider: 'outlook',
        email,
        accessToken: encrypt(accessToken),
        refreshToken: '',
        tokenExpiry: expiresOn || new Date(Date.now() + 3600 * 1000)
    };

    if (existing) {
        // Verify ownership
        if (existing.userId !== userId) {
            throw new Error('This email is already connected to another user.');
        }
        return prisma.emailAccount.update({
            where: { id: existing.id },
            data: {
                accessToken: data.accessToken,
                tokenExpiry: data.tokenExpiry
            }
        });
    } else {
        return prisma.emailAccount.create({
            data: {
                ...data,
                userId
            }
        });
    }
};
