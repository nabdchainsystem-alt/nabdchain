/**
 * Metrics Collection Service
 * Collects and exposes application metrics for monitoring
 */

import { appLogger } from './structuredLogger';

// ============================================================================
// Types
// ============================================================================

export interface MetricLabels {
  [key: string]: string;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  value: number;
  labels?: MetricLabels;
  timestamp: number;
}

export interface HistogramBucket {
  le: number; // less than or equal
  count: number;
}

export interface HistogramMetric {
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

export interface MetricSummary {
  name: string;
  description: string;
  type: string;
  current: number;
  min?: number;
  max?: number;
  avg?: number;
  count?: number;
}

// ============================================================================
// Metric Collections
// ============================================================================

// Counter: monotonically increasing values
const counters = new Map<string, { value: number; description: string; labels?: MetricLabels }>();

// Gauge: values that can go up and down
const gauges = new Map<string, { value: number; description: string; labels?: MetricLabels }>();

// Histogram: observation distributions
const histograms = new Map<string, {
  buckets: number[];
  counts: number[];
  sum: number;
  count: number;
  description: string;
  labels?: MetricLabels;
}>();

// ============================================================================
// Counter Operations
// ============================================================================

export function incrementCounter(
  name: string,
  description: string,
  value = 1,
  labels?: MetricLabels
): void {
  const key = formatKey(name, labels);
  const existing = counters.get(key);

  if (existing) {
    existing.value += value;
  } else {
    counters.set(key, { value, description, labels });
  }
}

export function getCounter(name: string, labels?: MetricLabels): number {
  const key = formatKey(name, labels);
  return counters.get(key)?.value || 0;
}

// ============================================================================
// Gauge Operations
// ============================================================================

export function setGauge(
  name: string,
  description: string,
  value: number,
  labels?: MetricLabels
): void {
  const key = formatKey(name, labels);
  gauges.set(key, { value, description, labels });
}

export function incrementGauge(name: string, value = 1, labels?: MetricLabels): void {
  const key = formatKey(name, labels);
  const existing = gauges.get(key);
  if (existing) {
    existing.value += value;
  }
}

export function decrementGauge(name: string, value = 1, labels?: MetricLabels): void {
  incrementGauge(name, -value, labels);
}

export function getGauge(name: string, labels?: MetricLabels): number {
  const key = formatKey(name, labels);
  return gauges.get(key)?.value || 0;
}

// ============================================================================
// Histogram Operations
// ============================================================================

const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export function observeHistogram(
  name: string,
  description: string,
  value: number,
  labels?: MetricLabels,
  buckets: number[] = DEFAULT_BUCKETS
): void {
  const key = formatKey(name, labels);
  let existing = histograms.get(key);

  if (!existing) {
    existing = {
      buckets: [...buckets].sort((a, b) => a - b),
      counts: new Array(buckets.length).fill(0),
      sum: 0,
      count: 0,
      description,
      labels,
    };
    histograms.set(key, existing);
  }

  existing.sum += value;
  existing.count += 1;

  for (let i = 0; i < existing.buckets.length; i++) {
    if (value <= existing.buckets[i]) {
      existing.counts[i] += 1;
    }
  }
}

export function getHistogram(name: string, labels?: MetricLabels): HistogramMetric | null {
  const key = formatKey(name, labels);
  const existing = histograms.get(key);

  if (!existing) return null;

  return {
    buckets: existing.buckets.map((le, i) => ({ le, count: existing.counts[i] })),
    sum: existing.sum,
    count: existing.count,
  };
}

// ============================================================================
// Request Metrics (pre-defined)
// ============================================================================

export const RequestMetrics = {
  incrementRequests(method: string, path: string, statusCode: number): void {
    incrementCounter(
      'http_requests_total',
      'Total HTTP requests',
      1,
      { method, path: normalizePath(path), status: String(statusCode) }
    );
  },

  observeResponseTime(method: string, path: string, durationMs: number): void {
    observeHistogram(
      'http_request_duration_ms',
      'HTTP request duration in milliseconds',
      durationMs,
      { method, path: normalizePath(path) }
    );
  },

  incrementActiveConnections(): void {
    incrementGauge('http_active_connections', 1);
  },

  decrementActiveConnections(): void {
    decrementGauge('http_active_connections', 1);
  },

  setActiveConnections(count: number): void {
    setGauge('http_active_connections', 'Number of active HTTP connections', count);
  },
};

// ============================================================================
// Database Metrics (pre-defined)
// ============================================================================

export const DatabaseMetrics = {
  incrementQueries(operation: string, table: string): void {
    incrementCounter(
      'db_queries_total',
      'Total database queries',
      1,
      { operation, table }
    );
  },

  observeQueryTime(operation: string, table: string, durationMs: number): void {
    observeHistogram(
      'db_query_duration_ms',
      'Database query duration in milliseconds',
      durationMs,
      { operation, table }
    );
  },

  incrementErrors(operation: string, table: string, errorType: string): void {
    incrementCounter(
      'db_errors_total',
      'Total database errors',
      1,
      { operation, table, error_type: errorType }
    );
  },

  setConnectionPoolSize(active: number, idle: number): void {
    setGauge('db_pool_active_connections', 'Active database connections', active);
    setGauge('db_pool_idle_connections', 'Idle database connections', idle);
  },
};

// ============================================================================
// Business Metrics (pre-defined)
// ============================================================================

export const BusinessMetrics = {
  incrementOrders(status: string): void {
    incrementCounter(
      'orders_total',
      'Total orders created',
      1,
      { status }
    );
  },

  setOrderValue(amount: number, currency: string = 'USD'): void {
    incrementCounter(
      'order_value_total',
      'Total order value',
      amount,
      { currency }
    );
  },

  incrementRFQs(status: string): void {
    incrementCounter(
      'rfqs_total',
      'Total RFQs created',
      1,
      { status }
    );
  },

  incrementDisputes(type: string, resolution?: string): void {
    incrementCounter(
      'disputes_total',
      'Total disputes',
      1,
      { type, resolution: resolution || 'pending' }
    );
  },

  setActiveUsers(count: number, portalType: 'buyer' | 'seller'): void {
    setGauge('active_users', 'Number of active users', count, { portal_type: portalType });
  },

  setActiveSessions(count: number): void {
    setGauge('active_sessions', 'Number of active sessions', count);
  },
};

// ============================================================================
// Job Metrics (pre-defined)
// ============================================================================

export const JobMetrics = {
  incrementJobRuns(jobName: string, status: 'success' | 'failure'): void {
    incrementCounter(
      'job_runs_total',
      'Total job executions',
      1,
      { job: jobName, status }
    );
  },

  observeJobDuration(jobName: string, durationMs: number): void {
    observeHistogram(
      'job_duration_ms',
      'Job execution duration in milliseconds',
      durationMs,
      { job: jobName }
    );
  },

  setJobLastRun(jobName: string, timestamp: number): void {
    setGauge('job_last_run_timestamp', 'Last job run timestamp', timestamp, { job: jobName });
  },
};

// ============================================================================
// System Metrics
// ============================================================================

export const SystemMetrics = {
  collectMemoryUsage(): void {
    const mem = process.memoryUsage();
    setGauge('process_heap_used_bytes', 'Heap memory used', mem.heapUsed);
    setGauge('process_heap_total_bytes', 'Total heap memory', mem.heapTotal);
    setGauge('process_external_bytes', 'External memory', mem.external);
    setGauge('process_rss_bytes', 'Resident set size', mem.rss);
  },

  collectCPUUsage(): void {
    const cpu = process.cpuUsage();
    setGauge('process_cpu_user_microseconds', 'CPU user time', cpu.user);
    setGauge('process_cpu_system_microseconds', 'CPU system time', cpu.system);
  },

  setEventLoopLag(lagMs: number): void {
    setGauge('event_loop_lag_ms', 'Event loop lag in milliseconds', lagMs);
  },
};

// Collect system metrics every 15 seconds
let systemMetricsInterval: NodeJS.Timeout | null = null;

export function startSystemMetricsCollection(intervalMs = 15000): void {
  if (systemMetricsInterval) return;

  SystemMetrics.collectMemoryUsage();
  SystemMetrics.collectCPUUsage();

  systemMetricsInterval = setInterval(() => {
    SystemMetrics.collectMemoryUsage();
    SystemMetrics.collectCPUUsage();
  }, intervalMs);

  appLogger.info('System metrics collection started', { intervalMs });
}

export function stopSystemMetricsCollection(): void {
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
    systemMetricsInterval = null;
    appLogger.info('System metrics collection stopped');
  }
}

// ============================================================================
// Export Metrics
// ============================================================================

export function getAllMetrics(): Metric[] {
  const metrics: Metric[] = [];
  const now = Date.now();

  // Counters
  for (const [key, data] of counters.entries()) {
    metrics.push({
      name: key.split('{')[0],
      type: 'counter',
      description: data.description,
      value: data.value,
      labels: data.labels,
      timestamp: now,
    });
  }

  // Gauges
  for (const [key, data] of gauges.entries()) {
    metrics.push({
      name: key.split('{')[0],
      type: 'gauge',
      description: data.description,
      value: data.value,
      labels: data.labels,
      timestamp: now,
    });
  }

  // Histograms (emit as multiple metrics)
  for (const [key, data] of histograms.entries()) {
    const baseName = key.split('{')[0];

    // Sum
    metrics.push({
      name: `${baseName}_sum`,
      type: 'histogram',
      description: `${data.description} (sum)`,
      value: data.sum,
      labels: data.labels,
      timestamp: now,
    });

    // Count
    metrics.push({
      name: `${baseName}_count`,
      type: 'histogram',
      description: `${data.description} (count)`,
      value: data.count,
      labels: data.labels,
      timestamp: now,
    });

    // Buckets
    for (let i = 0; i < data.buckets.length; i++) {
      metrics.push({
        name: `${baseName}_bucket`,
        type: 'histogram',
        description: `${data.description} (bucket)`,
        value: data.counts[i],
        labels: { ...data.labels, le: String(data.buckets[i]) },
        timestamp: now,
      });
    }
  }

  return metrics;
}

export function getMetricsSummary(): MetricSummary[] {
  const summaries: MetricSummary[] = [];

  for (const [key, data] of counters.entries()) {
    summaries.push({
      name: key,
      description: data.description,
      type: 'counter',
      current: data.value,
    });
  }

  for (const [key, data] of gauges.entries()) {
    summaries.push({
      name: key,
      description: data.description,
      type: 'gauge',
      current: data.value,
    });
  }

  for (const [key, data] of histograms.entries()) {
    summaries.push({
      name: key,
      description: data.description,
      type: 'histogram',
      current: data.count > 0 ? data.sum / data.count : 0,
      count: data.count,
      avg: data.count > 0 ? data.sum / data.count : 0,
    });
  }

  return summaries;
}

// Prometheus-compatible format
export function getPrometheusMetrics(): string {
  const lines: string[] = [];
  const now = Date.now();

  for (const [key, data] of counters.entries()) {
    const [name, labelsStr] = parseKey(key);
    lines.push(`# HELP ${name} ${data.description}`);
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name}${labelsStr || ''} ${data.value}`);
    lines.push('');
  }

  for (const [key, data] of gauges.entries()) {
    const [name, labelsStr] = parseKey(key);
    lines.push(`# HELP ${name} ${data.description}`);
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name}${labelsStr || ''} ${data.value}`);
    lines.push('');
  }

  for (const [key, data] of histograms.entries()) {
    const [name, labelsStr] = parseKey(key);
    lines.push(`# HELP ${name} ${data.description}`);
    lines.push(`# TYPE ${name} histogram`);

    for (let i = 0; i < data.buckets.length; i++) {
      const bucketLabels = labelsStr
        ? labelsStr.slice(0, -1) + `,le="${data.buckets[i]}"}`
        : `{le="${data.buckets[i]}"}`;
      lines.push(`${name}_bucket${bucketLabels} ${data.counts[i]}`);
    }

    const infLabels = labelsStr
      ? labelsStr.slice(0, -1) + ',le="+Inf"}'
      : '{le="+Inf"}';
    lines.push(`${name}_bucket${infLabels} ${data.count}`);
    lines.push(`${name}_sum${labelsStr || ''} ${data.sum}`);
    lines.push(`${name}_count${labelsStr || ''} ${data.count}`);
    lines.push('');
  }

  return lines.join('\n');
}

// Reset all metrics (useful for testing)
export function resetAllMetrics(): void {
  counters.clear();
  gauges.clear();
  histograms.clear();
}

// ============================================================================
// Helpers
// ============================================================================

function formatKey(name: string, labels?: MetricLabels): string {
  if (!labels || Object.keys(labels).length === 0) {
    return name;
  }
  const labelStr = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(',');
  return `${name}{${labelStr}}`;
}

function parseKey(key: string): [string, string | null] {
  const match = key.match(/^([^{]+)(\{.+\})?$/);
  if (match) {
    return [match[1], match[2] || null];
  }
  return [key, null];
}

function normalizePath(path: string): string {
  // Replace dynamic path segments with placeholders
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:id');
}
