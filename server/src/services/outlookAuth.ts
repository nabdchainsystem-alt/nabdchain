import * as msal from '@azure/msal-node';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import 'isomorphic-fetch'; // Polyfill for Graph Client

const prisma = new PrismaClient();

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

export const getOutlookAuthURL = async () => {
    const client = getPca();
    return await client.getAuthCodeUrl({
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
    });
};

export const handleOutlookCallback = async (code: string) => {
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

    // MSAL doesn't expose refresh token explicitly in response always, but it caches it. 
    // However, for Manual CRUD, we might need to rely on the fact that MSAL manages it. 
    // BUT, since we are doing a simple API integration, we might want to store the raw refresh token if possible?
    // MSAL Node is designed to manage the token cache. 
    // HACK: For this simplified one-off integration, we might act as if we are managing tokens manually 
    // OR we just store the access token and assume user reconnects if expired (MVP).
    // Better: MSAL response usually includes `refresh_token` if we look at the raw network response, 
    // but the library abstracts it. 
    // Let's switch to simple-oauth2 or manual fetch for Outlook if MSAL proves too black-boxy for simple DB storage.
    // Actually, response.fromCache might obscure it. 
    // Let's stick to storing what we have. If token expires, we'll ask user to re-login for this MVP.

    // NOTE: 'offline_access' scope gives a refresh token.
    // We will trust that we can get a new one or just ask user to re-login.

    const data = {
        provider: 'outlook',
        email,
        accessToken: encrypt(accessToken),
        // Storing empty refresh token as MSAL handles it internally or we skip it for MVP
        refreshToken: '',
        tokenExpiry: expiresOn || new Date(Date.now() + 3600 * 1000)
    };

    if (existing) {
        return prisma.emailAccount.update({
            where: { id: existing.id },
            data: {
                accessToken: data.accessToken,
                tokenExpiry: data.tokenExpiry
            }
        });
    } else {
        return prisma.emailAccount.create({
            data
        });
    }
};
