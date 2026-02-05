/**
 * Monitoring Routes
 * Endpoints for health checks, metrics, and observability
 */

import { Router, Request, Response } from 'express';
import {
  checkHealth,
  checkReadiness,
  checkLiveness,
  checkComponent,
  getRegisteredChecks,
  HealthStatus,
} from '../services/observability/healthService';
import {
  getAllMetrics,
  getMetricsSummary,
  getPrometheusMetrics,
} from '../services/observability/metricsService';
import {
  getErrorStats,
  getRecentErrors,
  getErrorsByCategory,
  getErrorsBySeverity,
  resolveError,
  ErrorCategory,
  ErrorSeverity,
} from '../services/observability/errorTracker';

const router = Router();

// ============================================================================
// Health Check Endpoints
// ============================================================================

/**
 * GET /health
 * Full health check with all components
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await checkHealth();

    const statusCode =
      health.status === HealthStatus.HEALTHY
        ? 200
        : health.status === HealthStatus.DEGRADED
          ? 200
          : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.UNHEALTHY,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe - is the process running?
 */
router.get('/health/live', (req: Request, res: Response) => {
  const liveness = checkLiveness();
  res.status(200).json(liveness);
});

/**
 * GET /health/ready
 * Kubernetes readiness probe - is the service ready to accept traffic?
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const readiness = await checkReadiness();
    const statusCode = readiness.ready ? 200 : 503;
    res.status(statusCode).json(readiness);
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
});

/**
 * GET /health/:component
 * Check specific component health
 */
router.get('/health/:component', async (req: Request, res: Response) => {
  const component = String(req.params.component);

  const health = await checkComponent(component);
  if (!health) {
    res.status(404).json({
      error: `Component '${component}' not found`,
      availableComponents: getRegisteredChecks(),
    });
    return;
  }

  const statusCode = health.status === HealthStatus.UNHEALTHY ? 503 : 200;
  res.status(statusCode).json(health);
});

// ============================================================================
// Metrics Endpoints
// ============================================================================

/**
 * GET /metrics
 * Prometheus-compatible metrics endpoint
 */
router.get('/metrics', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(getPrometheusMetrics());
});

/**
 * GET /metrics/json
 * JSON-formatted metrics
 */
router.get('/metrics/json', (req: Request, res: Response) => {
  res.json({
    timestamp: new Date().toISOString(),
    metrics: getAllMetrics(),
  });
});

/**
 * GET /metrics/summary
 * High-level metrics summary
 */
router.get('/metrics/summary', (req: Request, res: Response) => {
  res.json({
    timestamp: new Date().toISOString(),
    summary: getMetricsSummary(),
  });
});

// ============================================================================
// Error Tracking Endpoints
// ============================================================================

/**
 * GET /errors
 * Error statistics and recent errors
 */
router.get('/errors', (req: Request, res: Response) => {
  const stats = getErrorStats();
  res.json({
    timestamp: new Date().toISOString(),
    stats,
  });
});

/**
 * GET /errors/recent
 * List of recent errors
 */
router.get('/errors/recent', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const errors = getRecentErrors(limit);

  res.json({
    timestamp: new Date().toISOString(),
    count: errors.length,
    errors,
  });
});

/**
 * GET /errors/category/:category
 * Errors by category
 */
router.get('/errors/category/:category', (req: Request, res: Response) => {
  const categoryParam = String(req.params.category);

  if (!Object.values(ErrorCategory).includes(categoryParam as ErrorCategory)) {
    res.status(400).json({
      error: 'Invalid category',
      validCategories: Object.values(ErrorCategory),
    });
    return;
  }

  const errors = getErrorsByCategory(categoryParam as ErrorCategory);
  res.json({
    timestamp: new Date().toISOString(),
    category: categoryParam,
    count: errors.length,
    errors,
  });
});

/**
 * GET /errors/severity/:severity
 * Errors by severity
 */
router.get('/errors/severity/:severity', (req: Request, res: Response) => {
  const severityParam = String(req.params.severity) as ErrorSeverity;

  if (!Object.values(ErrorSeverity).includes(severityParam)) {
    res.status(400).json({
      error: 'Invalid severity',
      validSeverities: Object.values(ErrorSeverity),
    });
    return;
  }

  const errors = getErrorsBySeverity(severityParam);
  res.json({
    timestamp: new Date().toISOString(),
    severity: severityParam,
    count: errors.length,
    errors,
  });
});

/**
 * POST /errors/:fingerprint/resolve
 * Mark an error as resolved
 */
router.post('/errors/:fingerprint/resolve', (req: Request, res: Response) => {
  const fingerprint = String(req.params.fingerprint);
  const resolved = resolveError(fingerprint);

  if (resolved) {
    res.json({ success: true, message: 'Error marked as resolved' });
  } else {
    res.status(404).json({ error: 'Error not found' });
  }
});

// ============================================================================
// Debug Endpoints (Development Only)
// ============================================================================

if (process.env.NODE_ENV !== 'production') {
  /**
   * GET /debug/env
   * Show non-sensitive environment configuration
   */
  router.get('/debug/env', (req: Request, res: Response) => {
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    });
  });

  /**
   * GET /debug/memory
   * Detailed memory usage
   */
  router.get('/debug/memory', (req: Request, res: Response) => {
    const mem = process.memoryUsage();
    res.json({
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
      external: formatBytes(mem.external),
      rss: formatBytes(mem.rss),
      arrayBuffers: formatBytes(mem.arrayBuffers),
      raw: mem,
    });
  });

  /**
   * POST /debug/gc
   * Trigger garbage collection (if available)
   */
  router.post('/debug/gc', (req: Request, res: Response) => {
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();

      res.json({
        message: 'Garbage collection triggered',
        freed: {
          heapUsed: formatBytes(before.heapUsed - after.heapUsed),
          rss: formatBytes(before.rss - after.rss),
        },
      });
    } else {
      res.status(400).json({
        error: 'GC not exposed. Start Node with --expose-gc flag.',
      });
    }
  });
}

// ============================================================================
// Status Endpoint
// ============================================================================

/**
 * GET /status
 * Overall system status summary
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const [health, errorStats] = await Promise.all([
      checkHealth(),
      Promise.resolve(getErrorStats()),
    ]);

    const metricsSummary = getMetricsSummary();

    res.json({
      status: health.status,
      version: health.version,
      uptime: health.uptime,
      timestamp: new Date().toISOString(),
      health: {
        overall: health.status,
        components: health.components.map((c) => ({
          name: c.name,
          status: c.status,
        })),
      },
      errors: {
        total: errorStats.total,
        critical: errorStats.bySeverity.critical,
        high: errorStats.bySeverity.high,
      },
      metrics: {
        requestCount: metricsSummary.find((m) => m.name.includes('http_requests'))?.current || 0,
        avgResponseTime: metricsSummary.find((m) => m.name.includes('http_request_duration'))?.avg || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Status check failed',
    });
  }
});

// ============================================================================
// Helpers
// ============================================================================

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export default router;
