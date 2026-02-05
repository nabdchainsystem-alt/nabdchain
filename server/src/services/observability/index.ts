/**
 * Observability Module
 * Centralized exports for all observability services
 */

// Structured Logging
export {
  StructuredLogger,
  appLogger,
  authLog,
  dbLog,
  socketLog,
  jobLog,
  paymentLog,
  requestContext,
  generateCorrelationId,
  getCurrentCorrelationId,
  getCurrentRequestId,
  type LogLevel,
  type LogContext,
  type LogEntry,
} from './structuredLogger';

// Metrics
export {
  incrementCounter,
  getCounter,
  setGauge,
  incrementGauge,
  decrementGauge,
  getGauge,
  observeHistogram,
  getHistogram,
  RequestMetrics,
  DatabaseMetrics,
  BusinessMetrics,
  JobMetrics,
  SystemMetrics,
  startSystemMetricsCollection,
  stopSystemMetricsCollection,
  getAllMetrics,
  getMetricsSummary,
  getPrometheusMetrics,
  resetAllMetrics,
  type Metric,
  type MetricLabels,
  type HistogramMetric,
  type MetricSummary,
} from './metricsService';

// Error Tracking
export {
  trackError,
  getError,
  getRecentErrors,
  getErrorsByCategory,
  getErrorsBySeverity,
  getErrorStats,
  resolveError,
  unresolveError,
  registerAlertThreshold,
  errorTrackingMiddleware,
  startErrorCleanup,
  stopErrorCleanup,
  clearAllErrors,
  ErrorSeverity,
  ErrorCategory,
  type TrackedError,
  type ErrorStats,
} from './errorTracker';

// Health Checks
export {
  registerHealthCheck,
  unregisterHealthCheck,
  createDatabaseHealthCheck,
  createMemoryHealthCheck,
  createEventLoopHealthCheck,
  createDiskHealthCheck,
  createExternalServiceHealthCheck,
  checkHealth,
  checkReadiness,
  checkLiveness,
  checkComponent,
  getRegisteredChecks,
  initializeDefaultHealthChecks,
  HealthStatus,
  type ComponentHealth,
  type SystemHealth,
  type ReadinessCheck,
  type LivenessCheck,
} from './healthService';

// ============================================================================
// Initialization Helper
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { initializeDefaultHealthChecks } from './healthService';
import { startSystemMetricsCollection } from './metricsService';
import { startErrorCleanup } from './errorTracker';
import { appLogger } from './structuredLogger';

export function initializeObservability(prisma: PrismaClient): void {
  appLogger.info('Initializing observability services...');

  // Initialize health checks
  initializeDefaultHealthChecks(prisma);

  // Start system metrics collection
  startSystemMetricsCollection(15000); // Every 15 seconds

  // Start error cleanup
  startErrorCleanup(60 * 60 * 1000); // Every hour

  appLogger.info('Observability services initialized');
}

export function shutdownObservability(): void {
  appLogger.info('Shutting down observability services...');

  const { stopSystemMetricsCollection } = require('./metricsService');
  const { stopErrorCleanup } = require('./errorTracker');

  stopSystemMetricsCollection();
  stopErrorCleanup();

  appLogger.info('Observability services shut down');
}
