import { google } from 'googleapis';
import { encrypt, decrypt } from '../utils/encryption';
import { prisma } from '../lib/prisma';
import { authLogger } from '../utils/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

export const googleOAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

export const getGoogleAuthURL = (userId: string) => {
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    return googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force refresh token
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
        ],
        state
    });
};

export const handleGoogleCallback = async (code: string, userId: string) => {
    const { tokens } = await googleOAuth2Client.getToken(code);
    googleOAuth2Client.setCredentials(tokens);

    // Get user profile to identify the account
    const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
        throw new Error('Could not retrieve email from Google');
    }

    const email = userInfo.data.email;

    // Check if this email is already connected
    const existing = await prisma.emailAccount.findFirst({
        where: { email, provider: 'google' }
    });

    const data = {
        provider: 'google',
        email,
        accessToken: encrypt(tokens.access_token!),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : '',
        tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
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
                tokenExpiry: data.tokenExpiry,
                ...(tokens.refresh_token ? { refreshToken: data.refreshToken } : {})
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

export const saveGoogleToken = async (email: string, tokens: any, userId: string) => {
    // Check if this email is already connected by ANY user
    const existing = await prisma.emailAccount.findFirst({
        where: { email }
    });

    const data = {
        provider: 'google',
        email,
        accessToken: encrypt(tokens.access_token!),
        // Only update refresh token if provided
        ...(tokens.refresh_token ? { refreshToken: encrypt(tokens.refresh_token) } : {}),
        tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
    };

    if (existing) {
        // If it exists, verify ownership
        if (existing.userId !== userId) {
            throw new Error(`This email is already connected to another workspace.`);
        }

        return prisma.emailAccount.update({
            where: { id: existing.id },
            data: {
                accessToken: data.accessToken,
                tokenExpiry: data.tokenExpiry,
                ...(tokens.refresh_token ? { refreshToken: data.refreshToken } : {})
            }
        });
    } else {
        if (!tokens.refresh_token) {
            authLogger.warn("Verify Warning: No refresh token received for new connect. User needs to revoke access to get it again.");
        }
        return prisma.emailAccount.create({
            data: {
                userId, // Link to the SaaS user
                provider: 'google',
                email,
                accessToken: data.accessToken,
                refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : '',
                tokenExpiry: data.tokenExpiry
            }
        });
    }
};
