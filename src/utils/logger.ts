/**
 * Centralized logging utility
 * Provides structured logging with levels and context
 * Can be configured to disable logs in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LogConfig = {
  enabled: import.meta.env.DEV,
  minLevel: 'debug',
  prefix: '[NABD]',
};

let config: LogConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the logger
 */
export function configureLogger(newConfig: Partial<LogConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Check if a log level should be displayed
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

/**
 * Format the log message with timestamp and context
 */
function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  return `${config.prefix} [${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

/**
 * Create a logger instance for a specific context/module
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        // eslint-disable-next-line no-console
        console.debug(formatMessage('debug', context, message), ...args);
      }
    },

    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        // eslint-disable-next-line no-console
        console.info(formatMessage('info', context, message), ...args);
      }
    },

    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', context, message), ...args);
      }
    },

    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', context, message), ...args);
      }
    },
  };
}

// Pre-configured loggers for common modules
export const appLogger = createLogger('App');
export const boardLogger = createLogger('Board');
export const storageLogger = createLogger('Storage');
export const socketLogger = createLogger('Socket');
export const aiLogger = createLogger('AI');
export const authLogger = createLogger('Auth');
export const serviceLogger = createLogger('Service');
export const videoLogger = createLogger('Video');
export const talkLogger = createLogger('Talk');
export const swLogger = createLogger('SW');
export const errorLogger = createLogger('Error');
export const featureLogger = createLogger('Feature');
export const hookLogger = createLogger('Hook');
export const portalApiLogger = createLogger('PortalAPI');

/**
 * Log an API call with method, URL, and status (DEV only)
 * Usage: logPortalApiCall('GET', '/api/items', 200)
 */
export function logPortalApiCall(method: string, url: string, status: number, error?: string): void {
  if (!shouldLog('debug')) return;

  const statusColor = status >= 400 ? '🔴' : status >= 300 ? '🟡' : '🟢';
  const errorSuffix = error ? ` - ${error}` : '';

  portalApiLogger.debug(`${statusColor} ${method.padEnd(7)} ${url} -> ${status}${errorSuffix}`);
}
