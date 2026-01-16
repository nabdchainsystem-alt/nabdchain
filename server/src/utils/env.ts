/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

interface EnvConfig {
    // Required in all environments
    required: string[];
    // Required only in production
    requiredInProduction: string[];
    // Optional with defaults
    optional: Record<string, string>;
}

const envConfig: EnvConfig = {
    required: [
        // Database is always required
        'DATABASE_URL',
    ],
    requiredInProduction: [
        // Auth - required in production
        'CLERK_SECRET_KEY',
        // Encryption - MUST be set in production
        'ENCRYPTION_KEY',
        // OAuth providers (if email features are used)
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI',
        'OUTLOOK_CLIENT_ID',
        'OUTLOOK_CLIENT_SECRET',
        'OUTLOOK_REDIRECT_URI',
    ],
    optional: {
        'NODE_ENV': 'development',
        'PORT': '3001',
        'CORS_ORIGIN': 'http://localhost:5173',
        'FRONTEND_URL': 'http://localhost:3000',
    }
};

export function validateEnv(): void {
    const missing: string[] = [];
    const warnings: string[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // Check required variables
    for (const key of envConfig.required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    // Check production-required variables
    if (isProduction) {
        for (const key of envConfig.requiredInProduction) {
            if (!process.env[key]) {
                missing.push(key);
            }
        }
    } else {
        // Warn about missing production vars in development
        for (const key of envConfig.requiredInProduction) {
            if (!process.env[key]) {
                warnings.push(key);
            }
        }
    }

    // Set defaults for optional variables
    for (const [key, defaultValue] of Object.entries(envConfig.optional)) {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
        }
    }

    // Report results
    if (warnings.length > 0 && !isProduction) {
        console.warn('[ENV] Warning: Missing variables (required in production):');
        warnings.forEach(key => console.warn(`  - ${key}`));
    }

    if (missing.length > 0) {
        console.error('[ENV] Error: Missing required environment variables:');
        missing.forEach(key => console.error(`  - ${key}`));

        if (isProduction) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    // Security warnings
    if (isProduction) {
        if (process.env.CORS_ORIGIN === '*') {
            console.warn('[ENV] Security Warning: CORS_ORIGIN is set to "*" in production');
        }
    }

    console.log(`[ENV] Environment validated (${isProduction ? 'production' : 'development'} mode)`);
}

export function getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}

export function getEnvOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
}

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV !== 'production';
