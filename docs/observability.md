# NABD Observability & Monitoring

This document describes the observability and monitoring infrastructure for the NABD platform.

## Overview

The observability system provides:
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Metrics Collection**: Request timing, database queries, business metrics
- **Error Tracking**: Centralized error collection with categorization and alerting
- **Health Checks**: Component-level health monitoring for Kubernetes readiness/liveness

---

## Metrics List

### HTTP Request Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `http_requests_total` | Counter | method, path, status | Total HTTP requests processed |
| `http_request_duration_ms` | Histogram | method, path | Request latency in milliseconds |
| `http_active_connections` | Gauge | - | Current number of active HTTP connections |

### Database Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `db_queries_total` | Counter | operation, table | Total database queries executed |
| `db_query_duration_ms` | Histogram | operation, table | Query execution time in milliseconds |
| `db_errors_total` | Counter | operation, table, error_type | Database errors by type |
| `db_pool_active_connections` | Gauge | - | Active database pool connections |
| `db_pool_idle_connections` | Gauge | - | Idle database pool connections |

### Business Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `orders_total` | Counter | status | Total orders by status |
| `order_value_total` | Counter | currency | Total order value in currency |
| `rfqs_total` | Counter | status | Total RFQs created |
| `disputes_total` | Counter | type, resolution | Disputes by type and resolution |
| `active_users` | Gauge | portal_type | Active users by portal (buyer/seller) |
| `active_sessions` | Gauge | - | Total active user sessions |

### Job Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `job_runs_total` | Counter | job, status | Job executions by name and status |
| `job_duration_ms` | Histogram | job | Job execution duration |
| `job_last_run_timestamp` | Gauge | job | Last run timestamp per job |

### System Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `process_heap_used_bytes` | Gauge | - | Heap memory in use |
| `process_heap_total_bytes` | Gauge | - | Total heap memory |
| `process_external_bytes` | Gauge | - | External memory (C++ objects) |
| `process_rss_bytes` | Gauge | - | Resident set size |
| `process_cpu_user_microseconds` | Gauge | - | CPU user time |
| `process_cpu_system_microseconds` | Gauge | - | CPU system time |
| `event_loop_lag_ms` | Gauge | - | Event loop lag in milliseconds |

### Error Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `errors_total` | Counter | category, severity | Total errors by category and severity |

---

## Logging Schema

### Log Entry Structure

All logs are structured JSON with the following schema:

```typescript
interface LogEntry {
  // Timestamp in ISO 8601 format
  timestamp: string;           // "2024-01-15T10:30:45.123Z"

  // Log level
  level: "debug" | "info" | "warn" | "error" | "fatal";

  // Human-readable message
  message: string;

  // Service identifier
  service: string;             // "nabd-api", "nabd-auth", "nabd-database", etc.

  // Environment
  environment: string;         // "development" | "production"

  // Application version
  version: string;             // "1.0.0"

  // Server hostname
  hostname: string;

  // Process ID
  pid: number;

  // Request correlation ID (for request tracing)
  correlationId?: string;      // UUID format

  // Additional context
  context?: {
    requestId?: string;
    userId?: string;
    workspaceId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: number;
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
  };

  // Error details (when level is "error" or "fatal")
  error?: {
    name: string;
    message: string;
    stack?: string;            // Only in development
    code?: string;             // Error code (e.g., "P2002" for Prisma)
  };
}
```

### Log Levels

| Level | Usage | Output |
|-------|-------|--------|
| `debug` | Verbose debugging info | Development only |
| `info` | Normal operations, request logs | All environments |
| `warn` | Potential issues, slow requests | All environments |
| `error` | Errors that need attention | All environments |
| `fatal` | Critical system failures | All environments |

### Pre-configured Loggers

```typescript
import { appLogger, authLog, dbLog, socketLog, jobLog, paymentLog } from './services/observability';

// General application logging
appLogger.info('User signed in', { userId: 'user_123' });

// Authentication-specific
authLog.warn('Failed login attempt', { ip: '192.168.1.1' });

// Database operations
dbLog.debug('Query executed', { table: 'users', duration: 15 });

// WebSocket events
socketLog.info('Client connected', { socketId: 'abc123' });

// Background jobs
jobLog.info('Job completed', { job: 'cleanup', duration: 500 });

// Payment processing
paymentLog.info('Payment processed', { orderId: 'order_123', amount: 99.99 });
```

### Request Logging Format

HTTP requests are automatically logged with the following pattern:

```
→ GET /api/users                    # Incoming request
← GET /api/users 200 (45ms)         # Successful response
← POST /api/orders 500 (120ms)      # Error response (logged as error)
← GET /api/data 200 SLOW (1500ms)   # Slow response (logged as warn)
```

### Sensitive Data Redaction

The following fields are automatically redacted from logs:
- `password`
- `token`
- `apiKey`
- `secret`
- `authorization`
- `cookie`
- `creditCard`
- `ssn`
- `encryptionKey`

---

## Alert Conditions

### Pre-configured Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Critical Error | Any CRITICAL severity error | Critical | Immediate notification |
| High Error Spike | 5+ HIGH severity errors per minute | High | Error log + notification |
| Database Error Spike | 10+ database errors per minute | High | Error log + notification |

### Alert Configuration

```typescript
import { registerAlertThreshold, ErrorSeverity, ErrorCategory } from './services/observability';

// Custom alert for authentication failures
registerAlertThreshold({
  category: ErrorCategory.AUTHENTICATION,
  countPerMinute: 10,
  action: (errors) => {
    // Send to PagerDuty, Slack, etc.
    notifySecurityTeam(errors);
  },
});

// Custom alert for payment errors
registerAlertThreshold({
  category: ErrorCategory.BUSINESS_LOGIC,
  countPerMinute: 5,
  action: (errors) => {
    if (errors.some(e => e.message.includes('payment'))) {
      notifyFinanceTeam(errors);
    }
  },
});
```

### Recommended Alert Thresholds

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| Error rate (5xx) | > 1% of requests | > 5% of requests |
| Response time (p95) | > 1000ms | > 3000ms |
| Response time (p99) | > 2000ms | > 5000ms |
| Database query time (p95) | > 100ms | > 500ms |
| Memory usage | > 75% heap | > 90% heap |
| Event loop lag | > 50ms | > 100ms |
| Disk space | < 20% free | < 10% free |
| Failed jobs | > 3 failures/hour | > 10 failures/hour |

---

## Health Check Endpoints

### Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `GET /health` | Full health check with all components | No |
| `GET /health/live` | Kubernetes liveness probe | No |
| `GET /health/ready` | Kubernetes readiness probe | No |
| `GET /health/:component` | Check specific component | No |
| `GET /metrics` | Prometheus-compatible metrics | No |
| `GET /metrics/json` | JSON-formatted metrics | No |
| `GET /status` | Overall system status summary | No |
| `GET /errors` | Error statistics | No |
| `GET /errors/recent` | Recent error list | No |

### Health Response Format

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:45.123Z",
  "components": [
    {
      "name": "database",
      "status": "healthy",
      "responseTimeMs": 5,
      "message": "Database connection successful"
    },
    {
      "name": "memory",
      "status": "healthy",
      "message": "Heap usage normal: 45.2%"
    },
    {
      "name": "event_loop",
      "status": "healthy",
      "responseTimeMs": 0.5,
      "message": "Event loop lag normal: 0.5ms"
    }
  ]
}
```

### Health Status Values

| Status | HTTP Code | Meaning |
|--------|-----------|---------|
| `healthy` | 200 | All components functioning normally |
| `degraded` | 200 | Some components slow but functional |
| `unhealthy` | 503 | Critical components failing |

---

## Integration Examples

### Prometheus/Grafana

The `/metrics` endpoint exports Prometheus-compatible metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nabd-api'
    static_configs:
      - targets: ['api.nabdchain.com:3001']
    metrics_path: '/metrics'
```

### Kubernetes Probes

```yaml
# deployment.yaml
spec:
  containers:
    - name: nabd-api
      livenessProbe:
        httpGet:
          path: /health/live
          port: 3001
        initialDelaySeconds: 10
        periodSeconds: 15
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3001
        initialDelaySeconds: 5
        periodSeconds: 10
```

### Log Aggregation (ELK/Datadog)

Logs are output as JSON to stdout, compatible with any log aggregator:

```bash
# Docker log driver for Datadog
docker run -e DD_API_KEY=xxx \
  --log-driver=datadog \
  --log-opt tag="service:nabd-api" \
  nabd-api
```

### External Alerting Integration

```typescript
import { registerAlertThreshold } from './services/observability';

// Slack integration
registerAlertThreshold({
  severity: ErrorSeverity.CRITICAL,
  countPerMinute: 1,
  action: async (errors) => {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Critical Error: ${errors[0].message}`,
        attachments: errors.map(e => ({
          color: 'danger',
          title: e.category,
          text: e.message,
        })),
      }),
    });
  },
});

// PagerDuty integration
registerAlertThreshold({
  severity: ErrorSeverity.CRITICAL,
  countPerMinute: 1,
  action: async (errors) => {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: process.env.PAGERDUTY_ROUTING_KEY,
        event_action: 'trigger',
        payload: {
          summary: `Critical Error: ${errors[0].message}`,
          severity: 'critical',
          source: 'nabd-api',
        },
      }),
    });
  },
});
```

---

## Usage in Code

### Logging

```typescript
import { appLogger } from './services/observability';

// Basic logging
appLogger.info('Processing order', { orderId: 'order_123' });

// Error logging
appLogger.error('Failed to process payment', error, {
  orderId: 'order_123',
  amount: 99.99,
});

// Timed operations
const endTimer = appLogger.startTimer('processOrder');
await processOrder(order);
endTimer(); // Logs: "processOrder completed" with duration
```

### Metrics

```typescript
import { RequestMetrics, BusinessMetrics, DatabaseMetrics } from './services/observability';

// Track business events
BusinessMetrics.incrementOrders('completed');
BusinessMetrics.setOrderValue(99.99, 'USD');

// Track database operations
const start = Date.now();
await prisma.user.findMany();
DatabaseMetrics.observeQueryTime('findMany', 'user', Date.now() - start);
```

### Error Tracking

```typescript
import { trackError, ErrorCategory } from './services/observability';

try {
  await riskyOperation();
} catch (error) {
  trackError(error, {
    operation: 'riskyOperation',
    userId: user.id,
  });
  throw error;
}
```

---

## File Locations

| File | Purpose |
|------|---------|
| `server/src/services/observability/structuredLogger.ts` | Structured logging with correlation IDs |
| `server/src/services/observability/metricsService.ts` | Metrics collection and Prometheus export |
| `server/src/services/observability/errorTracker.ts` | Error categorization and alerting |
| `server/src/services/observability/healthService.ts` | Health checks and readiness probes |
| `server/src/services/observability/index.ts` | Module exports and initialization |
| `server/src/middleware/observabilityMiddleware.ts` | Request tracing middleware |
| `server/src/routes/monitoringRoutes.ts` | Health, metrics, and error endpoints |
