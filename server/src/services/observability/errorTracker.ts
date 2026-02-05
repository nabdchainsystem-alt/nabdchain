/**
 * Error Tracking Service
 * Centralized error collection, categorization, and alerting
 */

import { appLogger, LogContext } from './structuredLogger';
import { incrementCounter } from './metricsService';

// ============================================================================
// Types
// ============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  RATE_LIMIT = 'rate_limit',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

export interface TrackedError {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  stack?: string;
  context: LogContext;
  fingerprint: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

export interface ErrorStats {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  recentErrors: TrackedError[];
  topErrors: { fingerprint: string; count: number; message: string }[];
}

interface AlertThreshold {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  countPerMinute: number;
  action: (errors: TrackedError[]) => void;
}

// ============================================================================
// Error Storage
// ============================================================================

const MAX_STORED_ERRORS = 1000;
const ERROR_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

const errors = new Map<string, TrackedError>();
const errorCounts = new Map<string, { count: number; window: number[] }>();
const alertThresholds: AlertThreshold[] = [];

// ============================================================================
// Error Categorization
// ============================================================================

function categorizeError(error: Error | unknown, context?: LogContext): ErrorCategory {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const name = error instanceof Error ? error.name : '';
  const code = (error as NodeJS.ErrnoException)?.code;

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('unauthenticated') ||
    message.includes('invalid token') ||
    message.includes('token expired') ||
    message.includes('authentication failed')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }

  // Authorization errors
  if (
    message.includes('forbidden') ||
    message.includes('permission denied') ||
    message.includes('access denied') ||
    message.includes('not allowed')
  ) {
    return ErrorCategory.AUTHORIZATION;
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    name === 'ValidationError' ||
    name === 'ZodError'
  ) {
    return ErrorCategory.VALIDATION;
  }

  // Database errors
  if (
    message.includes('prisma') ||
    message.includes('database') ||
    message.includes('sql') ||
    message.includes('connection') ||
    message.includes('constraint') ||
    message.includes('unique') ||
    code === 'P2002' || // Prisma unique constraint
    code === 'P2025' // Prisma record not found
  ) {
    return ErrorCategory.DATABASE;
  }

  // Rate limit errors
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('throttle')
  ) {
    return ErrorCategory.RATE_LIMIT;
  }

  // External service errors
  if (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('external') ||
    message.includes('api call failed') ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND'
  ) {
    return ErrorCategory.EXTERNAL_SERVICE;
  }

  // System errors
  if (
    message.includes('memory') ||
    message.includes('oom') ||
    message.includes('stack overflow') ||
    code === 'ENOMEM' ||
    code === 'ENOSPC'
  ) {
    return ErrorCategory.SYSTEM;
  }

  return ErrorCategory.UNKNOWN;
}

function determineSeverity(category: ErrorCategory, statusCode?: number): ErrorSeverity {
  // Critical: System errors, database connection failures
  if (category === ErrorCategory.SYSTEM) {
    return ErrorSeverity.CRITICAL;
  }

  // High: Database errors, external service failures
  if (category === ErrorCategory.DATABASE || category === ErrorCategory.EXTERNAL_SERVICE) {
    return ErrorSeverity.HIGH;
  }

  // Medium: Auth errors, business logic errors
  if (
    category === ErrorCategory.AUTHENTICATION ||
    category === ErrorCategory.AUTHORIZATION ||
    category === ErrorCategory.BUSINESS_LOGIC
  ) {
    return ErrorSeverity.MEDIUM;
  }

  // Low: Validation, rate limits
  if (category === ErrorCategory.VALIDATION || category === ErrorCategory.RATE_LIMIT) {
    return ErrorSeverity.LOW;
  }

  // Default based on status code
  if (statusCode) {
    if (statusCode >= 500) return ErrorSeverity.HIGH;
    if (statusCode >= 400) return ErrorSeverity.MEDIUM;
  }

  return ErrorSeverity.MEDIUM;
}

function generateFingerprint(error: Error | unknown, context?: LogContext): string {
  const parts: string[] = [];

  if (error instanceof Error) {
    parts.push(error.name);
    parts.push(error.message.slice(0, 100));
    // Include first line of stack trace for better grouping
    if (error.stack) {
      const stackLine = error.stack.split('\n')[1]?.trim() || '';
      parts.push(stackLine);
    }
  } else {
    parts.push(String(error).slice(0, 100));
  }

  if (context?.path) {
    parts.push(context.path);
  }

  // Simple hash
  const str = parts.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Error Tracking
// ============================================================================

export function trackError(
  error: Error | unknown,
  context?: LogContext,
  metadata?: Record<string, unknown>
): TrackedError {
  const category = categorizeError(error, context);
  const severity = determineSeverity(category, context?.statusCode);
  const fingerprint = generateFingerprint(error, context);
  const now = new Date().toISOString();

  // Check if we've seen this error before
  const existing = errors.get(fingerprint);

  if (existing) {
    existing.occurrences += 1;
    existing.lastSeen = now;
    if (metadata) {
      existing.metadata = { ...existing.metadata, ...metadata };
    }
    updateErrorCounts(fingerprint);
    return existing;
  }

  // Create new tracked error
  const trackedError: TrackedError = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    category,
    severity,
    message: error instanceof Error ? error.message : String(error),
    code: (error as NodeJS.ErrnoException)?.code,
    stack: error instanceof Error ? error.stack : undefined,
    context: context || {},
    fingerprint,
    occurrences: 1,
    firstSeen: now,
    lastSeen: now,
    resolved: false,
    metadata,
  };

  // Store error
  errors.set(fingerprint, trackedError);
  updateErrorCounts(fingerprint);

  // Enforce max stored errors
  if (errors.size > MAX_STORED_ERRORS) {
    pruneOldErrors();
  }

  // Log the error
  appLogger.error(`[${category}] ${trackedError.message}`, error, {
    ...context,
    errorId: trackedError.id,
    fingerprint,
    severity,
    category,
  });

  // Update metrics
  incrementCounter('errors_total', 'Total errors tracked', 1, {
    category,
    severity,
  });

  // Check alert thresholds
  checkAlertThresholds(trackedError);

  return trackedError;
}

function updateErrorCounts(fingerprint: string): void {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  let entry = errorCounts.get(fingerprint);
  if (!entry) {
    entry = { count: 0, window: [] };
    errorCounts.set(fingerprint, entry);
  }

  // Remove old entries from sliding window
  entry.window = entry.window.filter((ts) => now - ts < windowMs);
  entry.window.push(now);
  entry.count = entry.window.length;
}

function pruneOldErrors(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const [fingerprint, error] of errors.entries()) {
    const lastSeenTime = new Date(error.lastSeen).getTime();
    if (now - lastSeenTime > ERROR_RETENTION_MS) {
      toDelete.push(fingerprint);
    }
  }

  // Delete oldest errors first if still over limit
  if (errors.size - toDelete.length > MAX_STORED_ERRORS) {
    const sorted = Array.from(errors.entries())
      .filter(([fp]) => !toDelete.includes(fp))
      .sort((a, b) => new Date(a[1].lastSeen).getTime() - new Date(b[1].lastSeen).getTime());

    const deleteCount = errors.size - MAX_STORED_ERRORS + 100; // Delete 100 extra for buffer
    for (let i = 0; i < deleteCount && i < sorted.length; i++) {
      toDelete.push(sorted[i][0]);
    }
  }

  for (const fp of toDelete) {
    errors.delete(fp);
    errorCounts.delete(fp);
  }
}

// ============================================================================
// Alert Thresholds
// ============================================================================

export function registerAlertThreshold(threshold: AlertThreshold): void {
  alertThresholds.push(threshold);
}

function checkAlertThresholds(error: TrackedError): void {
  const counts = errorCounts.get(error.fingerprint);
  if (!counts) return;

  for (const threshold of alertThresholds) {
    // Check category match
    if (threshold.category && threshold.category !== error.category) {
      continue;
    }

    // Check severity match
    if (threshold.severity && threshold.severity !== error.severity) {
      continue;
    }

    // Check count threshold
    if (counts.count >= threshold.countPerMinute) {
      const recentErrors = getRecentErrorsByFingerprint(error.fingerprint);
      threshold.action(recentErrors);
    }
  }
}

function getRecentErrorsByFingerprint(fingerprint: string): TrackedError[] {
  const error = errors.get(fingerprint);
  return error ? [error] : [];
}

// ============================================================================
// Error Retrieval
// ============================================================================

export function getError(fingerprint: string): TrackedError | undefined {
  return errors.get(fingerprint);
}

export function getRecentErrors(limit = 50): TrackedError[] {
  return Array.from(errors.values())
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, limit);
}

export function getErrorsByCategory(category: ErrorCategory): TrackedError[] {
  return Array.from(errors.values())
    .filter((e) => e.category === category)
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
}

export function getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
  return Array.from(errors.values())
    .filter((e) => e.severity === severity)
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
}

export function getErrorStats(): ErrorStats {
  const allErrors = Array.from(errors.values());

  const bySeverity: Record<ErrorSeverity, number> = {
    [ErrorSeverity.LOW]: 0,
    [ErrorSeverity.MEDIUM]: 0,
    [ErrorSeverity.HIGH]: 0,
    [ErrorSeverity.CRITICAL]: 0,
  };

  const byCategory: Record<ErrorCategory, number> = {
    [ErrorCategory.VALIDATION]: 0,
    [ErrorCategory.AUTHENTICATION]: 0,
    [ErrorCategory.AUTHORIZATION]: 0,
    [ErrorCategory.DATABASE]: 0,
    [ErrorCategory.EXTERNAL_SERVICE]: 0,
    [ErrorCategory.RATE_LIMIT]: 0,
    [ErrorCategory.BUSINESS_LOGIC]: 0,
    [ErrorCategory.SYSTEM]: 0,
    [ErrorCategory.UNKNOWN]: 0,
  };

  let total = 0;

  for (const error of allErrors) {
    total += error.occurrences;
    bySeverity[error.severity] += error.occurrences;
    byCategory[error.category] += error.occurrences;
  }

  const recentErrors = allErrors
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 10);

  const topErrors = allErrors
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10)
    .map((e) => ({
      fingerprint: e.fingerprint,
      count: e.occurrences,
      message: e.message,
    }));

  return {
    total,
    bySeverity,
    byCategory,
    recentErrors,
    topErrors,
  };
}

// ============================================================================
// Error Resolution
// ============================================================================

export function resolveError(fingerprint: string): boolean {
  const error = errors.get(fingerprint);
  if (error) {
    error.resolved = true;
    return true;
  }
  return false;
}

export function unresolveError(fingerprint: string): boolean {
  const error = errors.get(fingerprint);
  if (error) {
    error.resolved = false;
    return true;
  }
  return false;
}

// ============================================================================
// Express Error Handler
// ============================================================================

import { Request, Response, NextFunction } from 'express';

export function errorTrackingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const context: LogContext = {
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    correlationId: req.headers['x-correlation-id'] as string,
    userId: (req as unknown as { userId?: string }).userId,
  };

  const trackedError = trackError(error, context);

  // Determine status code
  let statusCode = 500;
  if (trackedError.category === ErrorCategory.VALIDATION) {
    statusCode = 400;
  } else if (trackedError.category === ErrorCategory.AUTHENTICATION) {
    statusCode = 401;
  } else if (trackedError.category === ErrorCategory.AUTHORIZATION) {
    statusCode = 403;
  } else if (trackedError.category === ErrorCategory.RATE_LIMIT) {
    statusCode = 429;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    error: {
      message: isProduction && statusCode === 500
        ? 'An internal error occurred'
        : trackedError.message,
      code: trackedError.code,
      category: trackedError.category,
      errorId: trackedError.id,
      ...(isProduction ? {} : { stack: trackedError.stack }),
    },
  });
}

// ============================================================================
// Default Alert Actions
// ============================================================================

// Register default alert thresholds
registerAlertThreshold({
  severity: ErrorSeverity.CRITICAL,
  countPerMinute: 1,
  action: (errors) => {
    appLogger.fatal('CRITICAL ERROR ALERT', undefined, {
      errorCount: errors.length,
      errors: errors.map((e) => ({ id: e.id, message: e.message })),
    });
    // In production, this would trigger PagerDuty, Slack, etc.
  },
});

registerAlertThreshold({
  severity: ErrorSeverity.HIGH,
  countPerMinute: 5,
  action: (errors) => {
    appLogger.error('HIGH SEVERITY ERROR SPIKE', undefined, {
      errorCount: errors.length,
      errors: errors.map((e) => ({ id: e.id, message: e.message })),
    });
  },
});

registerAlertThreshold({
  category: ErrorCategory.DATABASE,
  countPerMinute: 10,
  action: (errors) => {
    appLogger.error('DATABASE ERROR SPIKE', undefined, {
      errorCount: errors.length,
      errors: errors.map((e) => ({ id: e.id, message: e.message })),
    });
  },
});

// ============================================================================
// Cleanup
// ============================================================================

let cleanupInterval: NodeJS.Timeout | null = null;

export function startErrorCleanup(intervalMs = 60 * 60 * 1000): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    pruneOldErrors();
  }, intervalMs);

  appLogger.info('Error cleanup started', { intervalMs });
}

export function stopErrorCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    appLogger.info('Error cleanup stopped');
  }
}

export function clearAllErrors(): void {
  errors.clear();
  errorCounts.clear();
}
