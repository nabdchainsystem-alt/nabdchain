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
        console.debug(formatMessage('debug', context, message), ...args);
      }
    },

    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
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
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const storageLogger = createLogger('Storage');
