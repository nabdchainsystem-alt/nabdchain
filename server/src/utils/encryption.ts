import crypto from 'crypto';
import { apiLogger } from './logger';

const isProduction = process.env.NODE_ENV === 'production';
const DEV_KEY = 'dev_only_key_not_for_production!!';

// In production, ENCRYPTION_KEY is mandatory
if (isProduction && !process.env.ENCRYPTION_KEY) {
    throw new Error(
        'CRITICAL: ENCRYPTION_KEY environment variable is required in production. ' +
        'Generate a secure key with: openssl rand -base64 32'
    );
}

const RAW_KEY = process.env.ENCRYPTION_KEY || DEV_KEY;

// Warn once in development if using default key
if (!isProduction && !process.env.ENCRYPTION_KEY) {
    apiLogger.warn('[Encryption] Using development key. Set ENCRYPTION_KEY in production.');
}

// Ensure key is exactly 32 bytes by hashing it
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();
const IV_LENGTH = 16; // AES block size

export function encrypt(text: string): string {
    if (!text) return '';

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!text) return '';

    try {
        const textParts = text.split(':');
        if (textParts.length < 2) {
            apiLogger.error('[Encryption] Invalid encrypted text format');
            return '';
        }

        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        apiLogger.error('[Encryption] Decryption failed:', error);
        return '';
    }
}
