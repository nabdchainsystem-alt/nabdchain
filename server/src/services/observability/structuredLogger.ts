/**
 * Structured Logger Service
 * JSON-formatted logging with correlation IDs and rich context
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  service?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  version: string;
  hostname: string;
  pid: number;
  correlationId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metrics?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

interface LoggerConfig {
  service: string;
  minLevel?: LogLevel;
  prettyPrint?: boolean;
  redactFields?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const REDACT_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
  'encryptionKey',
];

const isProduction = process.env.NODE_ENV === 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const appVersion = process.env.APP_VERSION || '1.0.0';

// ============================================================================
// Correlation ID Management
// ============================================================================

// AsyncLocalStorage for request-scoped correlation IDs
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  workspaceId?: string;
  startTime: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function generateCorrelationId(): string {
  return randomUUID();
}

export function getCurrentCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

export function getCurrentRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

// ============================================================================
// Structured Logger Class
// ============================================================================

class StructuredLogger {
  private service: string;
  private minLevel: number;
  private prettyPrint: boolean;
  private redactFields: Set<string>;

  constructor(config: LoggerConfig) {
    this.service = config.service;
    this.minLevel = LOG_LEVELS[config.minLevel || (isProduction ? 'info' : 'debug')];
    this.prettyPrint = config.prettyPrint ?? !isProduction;
    this.redactFields = new Set([...REDACT_FIELDS, ...(config.redactFields || [])]);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private redact(obj: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.redactFields.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        redacted[key] = this.redact(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const store = requestContext.getStore();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      environment: process.env.NODE_ENV || 'development',
      version: appVersion,
      hostname,
      pid: process.pid,
      correlationId: context?.correlationId || store?.correlationId,
    };

    if (context) {
      const { correlationId, ...rest } = context;
      if (Object.keys(rest).length > 0) {
        entry.context = this.redact(rest);
      }
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: isProduction ? undefined : error.stack,
        code: (error as NodeJS.ErrnoException).code,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const outputFn = entry.level === 'error' || entry.level === 'fatal'
      ? console.error
      : entry.level === 'warn'
        ? console.warn
        : console.log;

    if (this.prettyPrint) {
      const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
        fatal: '\x1b[35m', // magenta
      };
      const reset = '\x1b[0m';
      const color = levelColors[entry.level];

      const prefix = `${entry.timestamp} ${color}${entry.level.toUpperCase().padEnd(5)}${reset} [${entry.service}]`;
      const corrId = entry.correlationId ? ` (${entry.correlationId.slice(0, 8)})` : '';

      outputFn(`${prefix}${corrId} ${entry.message}`);

      if (entry.context && Object.keys(entry.context).length > 0) {
        outputFn('  Context:', JSON.stringify(entry.context, null, 2));
      }
      if (entry.error) {
        outputFn('  Error:', entry.error.name, '-', entry.error.message);
        if (entry.error.stack) {
          outputFn('  Stack:', entry.error.stack);
        }
      }
    } else {
      outputFn(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
      this.output(this.formatEntry('error', message, context, err));
    }
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('fatal')) {
      const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
      this.output(this.formatEntry('fatal', message, context, err));
    }
  }

  // Child logger with additional context
  child(additionalContext: Partial<LogContext>): ChildLogger {
    return new ChildLogger(this, additionalContext);
  }

  // Timed operation logging
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info(`${operation} completed`, { operation, duration });
    };
  }
}

class ChildLogger {
  constructor(
    private parent: StructuredLogger,
    private additionalContext: Partial<LogContext>
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.additionalContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.fatal(message, error, this.mergeContext(context));
  }
}

// ============================================================================
// Pre-configured Loggers
// ============================================================================

export const appLogger = new StructuredLogger({ service: 'nabd-api' });
export const authLog = new StructuredLogger({ service: 'nabd-auth' });
export const dbLog = new StructuredLogger({ service: 'nabd-database' });
export const socketLog = new StructuredLogger({ service: 'nabd-socket' });
export const jobLog = new StructuredLogger({ service: 'nabd-jobs' });
export const paymentLog = new StructuredLogger({ service: 'nabd-payments' });

export { StructuredLogger };
export default appLogger;
