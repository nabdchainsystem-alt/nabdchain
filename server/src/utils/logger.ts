/**
 * Server Logger Utility
 * Centralized logging with levels and context prefixes
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    prefix: string;
    enabled?: boolean;
}

const isProduction = process.env.NODE_ENV === 'production';

function createLogger(options: LoggerOptions) {
    const { prefix, enabled = true } = options;

    const formatMessage = (level: LogLevel, message: string): string => {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] [${prefix}] ${message}`;
    };

    return {
        debug: (message: string, ...args: unknown[]) => {
            if (enabled && !isProduction) {
                console.debug(formatMessage('debug', message), ...args);
            }
        },
        info: (message: string, ...args: unknown[]) => {
            if (enabled) {
                console.info(formatMessage('info', message), ...args);
            }
        },
        warn: (message: string, ...args: unknown[]) => {
            if (enabled) {
                console.warn(formatMessage('warn', message), ...args);
            }
        },
        error: (message: string, ...args: unknown[]) => {
            if (enabled) {
                console.error(formatMessage('error', message), ...args);
            }
        },
    };
}

// Pre-configured loggers for different server modules
export const serverLogger = createLogger({ prefix: 'Server' });
export const authLogger = createLogger({ prefix: 'Auth' });
export const dbLogger = createLogger({ prefix: 'Database' });
export const apiLogger = createLogger({ prefix: 'API' });
export const socketLogger = createLogger({ prefix: 'Socket' });
export const emailLogger = createLogger({ prefix: 'Email' });
export const aiLogger = createLogger({ prefix: 'AI' });
export const uploadLogger = createLogger({ prefix: 'Upload' });
export const cacheLogger = createLogger({ prefix: 'Cache' });

// Export createLogger for custom loggers
export { createLogger };
