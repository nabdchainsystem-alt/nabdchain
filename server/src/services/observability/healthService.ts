/**
 * Health Check Service
 * Comprehensive health monitoring for all system components
 */

import { PrismaClient } from '@prisma/client';
import { appLogger } from './structuredLogger';
import { getGauge } from './metricsService';

// ============================================================================
// Types
// ============================================================================

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  responseTimeMs?: number;
  message?: string;
  details?: Record<string, unknown>;
  lastChecked: string;
}

export interface SystemHealth {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  components: ComponentHealth[];
}

export interface ReadinessCheck {
  ready: boolean;
  checks: {
    name: string;
    ready: boolean;
    message?: string;
  }[];
}

export interface LivenessCheck {
  alive: boolean;
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

type HealthChecker = () => Promise<ComponentHealth>;

// ============================================================================
// Health Check Registry
// ============================================================================

const healthCheckers = new Map<string, HealthChecker>();
const startTime = Date.now();
const appVersion = process.env.APP_VERSION || '1.0.0';

// ============================================================================
// Register Health Checks
// ============================================================================

export function registerHealthCheck(name: string, checker: HealthChecker): void {
  healthCheckers.set(name, checker);
  appLogger.debug(`Health check registered: ${name}`);
}

export function unregisterHealthCheck(name: string): void {
  healthCheckers.delete(name);
}

// ============================================================================
// Built-in Health Checks
// ============================================================================

// Database health check
export function createDatabaseHealthCheck(prisma: PrismaClient): HealthChecker {
  return async (): Promise<ComponentHealth> => {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTimeMs = Date.now() - startTime;

      // Check connection pool (if metrics preview feature is enabled)
      let poolStatus: Record<string, unknown> | undefined;
      try {
        // Prisma $metrics requires "metrics" preview feature
        const prismaWithMetrics = prisma as unknown as { $metrics?: { json: () => Promise<{ gauges?: Array<{ key: string; value: number }> }> } };
        if (prismaWithMetrics.$metrics) {
          const metrics = await prismaWithMetrics.$metrics.json();
          poolStatus = {
            activeConnections: metrics.gauges?.find((g) => g.key === 'prisma_pool_connections_open')?.value,
            idleConnections: metrics.gauges?.find((g) => g.key === 'prisma_pool_connections_idle')?.value,
          };
        }
      } catch {
        // Metrics might not be available
      }

      return {
        name: 'database',
        status: responseTimeMs < 100 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        responseTimeMs,
        message: 'Database connection successful',
        details: poolStatus,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        responseTimeMs: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Database connection failed',
        lastChecked: new Date().toISOString(),
      };
    }
  };
}

// Memory health check
export function createMemoryHealthCheck(
  maxHeapPercentage = 90,
  warnHeapPercentage = 75
): HealthChecker {
  return async (): Promise<ComponentHealth> => {
    const mem = process.memoryUsage();
    const heapPercentage = (mem.heapUsed / mem.heapTotal) * 100;

    let status: HealthStatus;
    let message: string;

    if (heapPercentage >= maxHeapPercentage) {
      status = HealthStatus.UNHEALTHY;
      message = `Heap usage critical: ${heapPercentage.toFixed(1)}%`;
    } else if (heapPercentage >= warnHeapPercentage) {
      status = HealthStatus.DEGRADED;
      message = `Heap usage high: ${heapPercentage.toFixed(1)}%`;
    } else {
      status = HealthStatus.HEALTHY;
      message = `Heap usage normal: ${heapPercentage.toFixed(1)}%`;
    }

    return {
      name: 'memory',
      status,
      message,
      details: {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        heapPercentage: heapPercentage.toFixed(1),
        rss: mem.rss,
        external: mem.external,
      },
      lastChecked: new Date().toISOString(),
    };
  };
}

// Event loop health check
export function createEventLoopHealthCheck(
  maxLagMs = 100,
  warnLagMs = 50
): HealthChecker {
  return async (): Promise<ComponentHealth> => {
    const lagMs = await measureEventLoopLag();

    let status: HealthStatus;
    let message: string;

    if (lagMs >= maxLagMs) {
      status = HealthStatus.UNHEALTHY;
      message = `Event loop lag critical: ${lagMs.toFixed(1)}ms`;
    } else if (lagMs >= warnLagMs) {
      status = HealthStatus.DEGRADED;
      message = `Event loop lag high: ${lagMs.toFixed(1)}ms`;
    } else {
      status = HealthStatus.HEALTHY;
      message = `Event loop lag normal: ${lagMs.toFixed(1)}ms`;
    }

    return {
      name: 'event_loop',
      status,
      responseTimeMs: lagMs,
      message,
      lastChecked: new Date().toISOString(),
    };
  };
}

async function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const end = process.hrtime.bigint();
      const lagNs = Number(end - start);
      resolve(lagNs / 1_000_000); // Convert to ms
    });
  });
}

// Disk space health check (simplified, works on most systems)
export function createDiskHealthCheck(
  path = '.',
  minFreePercentage = 10,
  warnFreePercentage = 20
): HealthChecker {
  return async (): Promise<ComponentHealth> => {
    try {
      // This is a simplified check - in production, use a proper disk check library
      const fs = await import('fs/promises');
      const stats = await fs.statfs(path);

      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const freePercentage = (freeBytes / totalBytes) * 100;

      let status: HealthStatus;
      let message: string;

      if (freePercentage <= minFreePercentage) {
        status = HealthStatus.UNHEALTHY;
        message = `Disk space critical: ${freePercentage.toFixed(1)}% free`;
      } else if (freePercentage <= warnFreePercentage) {
        status = HealthStatus.DEGRADED;
        message = `Disk space low: ${freePercentage.toFixed(1)}% free`;
      } else {
        status = HealthStatus.HEALTHY;
        message = `Disk space OK: ${freePercentage.toFixed(1)}% free`;
      }

      return {
        name: 'disk',
        status,
        message,
        details: {
          totalBytes,
          freeBytes,
          freePercentage: freePercentage.toFixed(1),
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'disk',
        status: HealthStatus.DEGRADED,
        message: 'Unable to check disk space',
        lastChecked: new Date().toISOString(),
      };
    }
  };
}

// External service health check (generic HTTP check)
export function createExternalServiceHealthCheck(
  name: string,
  url: string,
  timeoutMs = 5000
): HealthChecker {
  return async (): Promise<ComponentHealth> => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      if (response.ok) {
        return {
          name,
          status: responseTimeMs < timeoutMs / 2 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
          responseTimeMs,
          message: `Service responding (${response.status})`,
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          name,
          status: HealthStatus.DEGRADED,
          responseTimeMs,
          message: `Service returned ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        name,
        status: HealthStatus.UNHEALTHY,
        responseTimeMs: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Service unreachable',
        lastChecked: new Date().toISOString(),
      };
    }
  };
}

// ============================================================================
// Health Check Execution
// ============================================================================

export async function checkHealth(): Promise<SystemHealth> {
  const components: ComponentHealth[] = [];

  // Run all health checks in parallel
  const checkPromises = Array.from(healthCheckers.entries()).map(
    async ([name, checker]) => {
      try {
        return await checker();
      } catch (error) {
        return {
          name,
          status: HealthStatus.UNHEALTHY,
          message: error instanceof Error ? error.message : 'Health check failed',
          lastChecked: new Date().toISOString(),
        } as ComponentHealth;
      }
    }
  );

  const results = await Promise.all(checkPromises);
  components.push(...results);

  // Determine overall status
  let overallStatus = HealthStatus.HEALTHY;
  for (const component of components) {
    if (component.status === HealthStatus.UNHEALTHY) {
      overallStatus = HealthStatus.UNHEALTHY;
      break;
    } else if (component.status === HealthStatus.DEGRADED) {
      overallStatus = HealthStatus.DEGRADED;
    }
  }

  return {
    status: overallStatus,
    version: appVersion,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    components,
  };
}

export async function checkReadiness(): Promise<ReadinessCheck> {
  // Check critical components for readiness
  const criticalComponents = ['database'];
  const checks: ReadinessCheck['checks'] = [];

  for (const name of criticalComponents) {
    const checker = healthCheckers.get(name);
    if (checker) {
      try {
        const result = await checker();
        checks.push({
          name,
          ready: result.status !== HealthStatus.UNHEALTHY,
          message: result.message,
        });
      } catch (error) {
        checks.push({
          name,
          ready: false,
          message: error instanceof Error ? error.message : 'Check failed',
        });
      }
    }
  }

  return {
    ready: checks.every((c) => c.ready),
    checks,
  };
}

export function checkLiveness(): LivenessCheck {
  const mem = process.memoryUsage();

  return {
    alive: true,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memoryUsage: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
    },
  };
}

// ============================================================================
// Detailed Component Checks
// ============================================================================

export async function checkComponent(name: string): Promise<ComponentHealth | null> {
  const checker = healthCheckers.get(name);
  if (!checker) return null;

  try {
    return await checker();
  } catch (error) {
    return {
      name,
      status: HealthStatus.UNHEALTHY,
      message: error instanceof Error ? error.message : 'Check failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

export function getRegisteredChecks(): string[] {
  return Array.from(healthCheckers.keys());
}

// ============================================================================
// Initialization Helper
// ============================================================================

export function initializeDefaultHealthChecks(prisma: PrismaClient): void {
  registerHealthCheck('database', createDatabaseHealthCheck(prisma));
  registerHealthCheck('memory', createMemoryHealthCheck());
  registerHealthCheck('event_loop', createEventLoopHealthCheck());
  registerHealthCheck('disk', createDiskHealthCheck());

  appLogger.info('Default health checks initialized', {
    checks: getRegisteredChecks(),
  });
}
