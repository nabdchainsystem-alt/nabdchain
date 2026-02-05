/**
 * Observability Middleware
 * Request tracing, timing, and metrics collection
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import {
  appLogger,
  requestContext,
  generateCorrelationId,
} from '../services/observability/structuredLogger';
import { RequestMetrics } from '../services/observability/metricsService';
import { trackError, ErrorCategory } from '../services/observability/errorTracker';

// ============================================================================
// Types
// ============================================================================

interface RequestWithTiming extends Request {
  startTime?: number;
  correlationId?: string;
  requestId?: string;
}

interface ObservabilityOptions {
  excludePaths?: string[];
  slowRequestThresholdMs?: number;
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  maxBodyLogLength?: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: ObservabilityOptions = {
  excludePaths: ['/health', '/health/live', '/health/ready', '/metrics'],
  slowRequestThresholdMs: 1000,
  logRequestBody: false,
  logResponseBody: false,
  maxBodyLogLength: 1000,
};

// ============================================================================
// Correlation ID Middleware
// ============================================================================

export function correlationMiddleware() {
  return (req: RequestWithTiming, res: Response, next: NextFunction): void => {
    // Get or generate correlation ID
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      generateCorrelationId();

    // Generate unique request ID
    const requestId = randomUUID();

    // Attach to request
    req.correlationId = correlationId;
    req.requestId = requestId;

    // Set response headers
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Request-ID', requestId);

    // Run request in context
    requestContext.run(
      {
        correlationId,
        requestId,
        startTime: Date.now(),
      },
      () => next()
    );
  };
}

// ============================================================================
// Request Logging Middleware
// ============================================================================

export function requestLoggingMiddleware(options: ObservabilityOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: RequestWithTiming, res: Response, next: NextFunction): void => {
    // Skip excluded paths
    if (opts.excludePaths?.some((p) => req.path.startsWith(p))) {
      return next();
    }

    req.startTime = Date.now();

    // Log incoming request
    const requestLog: Record<string, unknown> = {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      contentLength: req.get('content-length'),
    };

    if (opts.logRequestBody && req.body && Object.keys(req.body).length > 0) {
      const bodyStr = JSON.stringify(req.body);
      requestLog.body =
        bodyStr.length > (opts.maxBodyLogLength || 1000)
          ? bodyStr.slice(0, opts.maxBodyLogLength) + '...'
          : req.body;
    }

    appLogger.info(`→ ${req.method} ${req.path}`, requestLog);

    // Capture response body for logging (optional)
    const originalJson = res.json;
    let responseBody: unknown;

    if (opts.logResponseBody) {
      res.json = function (body: unknown) {
        responseBody = body;
        return originalJson.call(this, body);
      };
    }

    res.on('finish', () => {
      const duration = Date.now() - (req.startTime || Date.now());

      // Log response
      const responseLog: Record<string, unknown> = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      };

      if (opts.logResponseBody && responseBody) {
        const bodyStr = JSON.stringify(responseBody);
        responseLog.body =
          bodyStr.length > (opts.maxBodyLogLength || 1000)
            ? bodyStr.slice(0, opts.maxBodyLogLength) + '...'
            : responseBody;
      }

      // Determine log level based on status code
      if (res.statusCode >= 500) {
        appLogger.error(`← ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`, undefined, responseLog);
      } else if (res.statusCode >= 400) {
        appLogger.warn(`← ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`, responseLog);
      } else if (duration >= (opts.slowRequestThresholdMs || 1000)) {
        appLogger.warn(`← ${req.method} ${req.path} ${res.statusCode} SLOW (${duration}ms)`, responseLog);
      } else {
        appLogger.info(`← ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`, responseLog);
      }
    });

    next();
  };
}

// ============================================================================
// Metrics Middleware
// ============================================================================

export function metricsMiddleware(options: ObservabilityOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: RequestWithTiming, res: Response, next: NextFunction): void => {
    // Skip excluded paths
    if (opts.excludePaths?.some((p) => req.path.startsWith(p))) {
      return next();
    }

    req.startTime = Date.now();
    RequestMetrics.incrementActiveConnections();

    // Capture response finish
    res.on('finish', () => {
      const duration = Date.now() - (req.startTime || Date.now());

      RequestMetrics.incrementRequests(req.method, req.path, res.statusCode);
      RequestMetrics.observeResponseTime(req.method, req.path, duration);
      RequestMetrics.decrementActiveConnections();
    });

    next();
  };
}

// ============================================================================
// Error Tracking Middleware
// ============================================================================

export function errorTrackingMiddleware() {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    trackError(err, {
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      correlationId: (req as RequestWithTiming).correlationId,
      userId: (req as unknown as { userId?: string }).userId,
    });

    next(err);
  };
}

// ============================================================================
// Combined Observability Middleware
// ============================================================================

export function observabilityMiddleware(options: ObservabilityOptions = {}) {
  const correlation = correlationMiddleware();
  const logging = requestLoggingMiddleware(options);
  const metrics = metricsMiddleware(options);

  return (req: Request, res: Response, next: NextFunction): void => {
    correlation(req as RequestWithTiming, res, () => {
      logging(req as RequestWithTiming, res, () => {
        metrics(req as RequestWithTiming, res, next);
      });
    });
  };
}

// ============================================================================
// Security Headers Logging
// ============================================================================

export function securityAuditMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Log security-relevant events
    const sensitiveEndpoints = [
      '/api/auth',
      '/api/login',
      '/api/portal-auth',
      '/api/payments',
      '/api/payouts',
    ];

    const isSensitive = sensitiveEndpoints.some((ep) => req.path.startsWith(ep));

    if (isSensitive) {
      appLogger.info('Security audit: Sensitive endpoint accessed', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type { ObservabilityOptions };
