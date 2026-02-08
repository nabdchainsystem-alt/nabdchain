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
        // Portal JWT - MUST be set in production
        'PORTAL_JWT_SECRET',
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
        // Background job flags - defaults differ by environment
        'ENABLE_WORKERS': '', // Will be set based on environment
        'ENABLE_SCHEDULER': '', // Will be set based on environment
        'ENABLE_OUTBOX': '', // Will be set based on environment
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

    // Security checks and warnings
    if (isProduction) {
        if (process.env.CORS_ORIGIN === '*') {
            console.warn('[ENV] Security Warning: CORS_ORIGIN is set to "*" in production');
        }

        // CRITICAL: Block dangerous flags in production
        if (process.env.ALLOW_DEV_TOKENS === 'true') {
            throw new Error(
                'SECURITY VIOLATION: ALLOW_DEV_TOKENS=true is not allowed in production. ' +
                'This would enable authentication bypass. Remove this setting immediately.'
            );
        }

        if (process.env.PORTAL_ALLOW_SEED_ENDPOINT === 'true') {
            throw new Error(
                'SECURITY VIOLATION: PORTAL_ALLOW_SEED_ENDPOINT=true is not allowed in production. ' +
                'This would expose admin creation endpoint. Remove this setting immediately.'
            );
        }

        if (process.env.ALLOW_LEGACY_PORTAL_AUTH === 'true') {
            console.warn(
                '[ENV] Security Warning: ALLOW_LEGACY_PORTAL_AUTH=true is set in production. ' +
                'This allows deprecated x-user-id header authentication. Plan migration to JWT.'
            );
        }

        // Require PORTAL_JWT_SECRET in production
        if (!process.env.PORTAL_JWT_SECRET) {
            console.warn(
                '[ENV] Security Warning: PORTAL_JWT_SECRET is not set. ' +
                'Portal authentication will use a fallback secret which is insecure.'
            );
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

// =============================================================================
// Background Job Flags
// =============================================================================
// In production, default to enabled; in development, default to disabled
// This prevents noisy logs and DB spam when DB is down in local dev

/**
 * Check if a feature flag is enabled.
 * Supports 'true', '1', 'yes' as truthy values.
 * In development, defaults to false unless explicitly set.
 * In production, defaults to true unless explicitly disabled.
 */
function isFeatureEnabled(key: string): boolean {
    const value = process.env[key]?.toLowerCase();

    // Explicit true
    if (value === 'true' || value === '1' || value === 'yes') {
        return true;
    }

    // Explicit false
    if (value === 'false' || value === '0' || value === 'no') {
        return false;
    }

    // Default behavior: production = enabled, development = disabled
    return isProduction;
}

/** Whether background workers (job queue, event outbox) should run */
export const isWorkersEnabled = (): boolean => isFeatureEnabled('ENABLE_WORKERS');

/** Whether the cron scheduler should run */
export const isSchedulerEnabled = (): boolean => isFeatureEnabled('ENABLE_SCHEDULER');

/** Whether the event outbox worker should run */
export const isOutboxEnabled = (): boolean => isFeatureEnabled('ENABLE_OUTBOX');

/** Get a summary of enabled features for logging */
export function getFeatureFlags(): Record<string, boolean> {
    return {
        workers: isWorkersEnabled(),
        scheduler: isSchedulerEnabled(),
        outbox: isOutboxEnabled(),
    };
}
