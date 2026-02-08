/**
 * Prometheus Metrics Library
 * Uses prom-client to expose standard metrics for monitoring
 */

import { Request, Response, NextFunction } from 'express';
import client, { Registry, Histogram, Counter, Gauge } from 'prom-client';

// ============================================================================
// Registry
// ============================================================================

// Use the default global registry from prom-client
const register: Registry = client.register;

// Collect default Node.js metrics (GC, event loop, memory, etc.)
client.collectDefaultMetrics({ register });

// ============================================================================
// Custom Metrics
// ============================================================================

/**
 * Histogram tracking HTTP request duration in seconds.
 * Labels: method, route, status_code
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Counter tracking total HTTP requests.
 * Labels: method, route, status_code
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

/**
 * Gauge tracking the number of currently active HTTP connections.
 */
export const activeConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// ============================================================================
// Route Path Normalization
// ============================================================================

/**
 * Normalize a route path by replacing dynamic segments (UUIDs, numeric IDs,
 * and long alphanumeric tokens) with `:id` to prevent high-cardinality labels.
 */
function normalizeRoutePath(path: string): string {
  return path
    // Replace UUIDs (8-4-4-4-12 hex pattern)
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:id'
    )
    // Replace purely numeric path segments
    .replace(/\/\d+/g, '/:id')
    // Replace long alphanumeric tokens (20+ chars, likely IDs)
    .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:id');
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Express middleware that records request duration and count using
 * prom-client Histogram and Counter. Also tracks active connections
 * via a Gauge.
 *
 * Should be mounted early in the middleware stack (after body parsing,
 * before route handlers).
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip the /metrics endpoint itself to avoid recursion in metrics
  if (req.path === '/metrics') {
    return next();
  }

  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = normalizeRoutePath(req.path);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    end(labels);
    httpRequestsTotal.inc(labels);
    activeConnections.dec();
  });

  next();
}

// ============================================================================
// Exports
// ============================================================================

export { register };
