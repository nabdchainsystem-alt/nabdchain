# ADR-006: BullMQ with Redis for Background Job Processing

**Status:** Accepted (Implemented)

**Date:** 2025-12

## Context

NABD has several operations that should not run synchronously in HTTP request handlers:

- **Payout calculations** -- aggregating seller earnings across orders and generating payout records.
- **Trust scoring** -- computing seller trust scores from order history, dispute rates, and delivery performance.
- **Automation rules** -- evaluating user-defined automation triggers and executing actions.
- **Scale safety checks** -- monitoring system health metrics and enforcing rate limits.
- **Event outbox processing** -- delivering webhook events to external systems reliably.

Running these in-request would cause timeouts, block the event loop, and provide no retry mechanism on failure.

The project also needed to work without Redis in local development, where background jobs are less critical.

## Decision

Use **BullMQ** backed by **Redis** for production job processing, with an automatic **fallback to database-polled queues** when Redis is unavailable.

### Architecture

```
                   +------------------+
  HTTP Handler --> | addJob()         |
                   +--------+---------+
                            |
                   Redis?   |
                  yes/      \no
                 /           \
    +------------+    +----------------+
    | BullMQ     |    | DB Job Queue   |
    | (Redis)    |    | (Prisma poll)  |
    +------+-----+    +-------+--------+
           |                  |
    +------v------------------v--------+
    |        Job Workers               |
    |  - payoutJobHandler              |
    |  - trustJobHandler               |
    |  - automationJobHandler          |
    |  - scaleSafetyJobHandler         |
    +----------------------------------+
```

### Implementation (`server/src/lib/bullmq.ts`)

```typescript
// Initialize -- returns true if Redis is available, false for DB fallback
const redisAvailable = initBullMQ();

// Register handlers
registerJobHandler('calculate-payouts', payoutJobHandler);
registerJobHandler('update-trust-scores', trustJobHandler);

// Enqueue a job (returns false if BullMQ unavailable, caller uses DB queue)
const queued = await addJob('calculate-payouts', { sellerId: '...' }, {
  delay: 5000,       // 5-second delay
  attempts: 3,       // 3 retries
  priority: 1,       // Higher priority
});
```

### Configuration

| Environment Variable | Purpose | Default |
|---------------------|---------|---------|
| `REDIS_URL` | Redis connection string | (none -- disables BullMQ) |
| `UPSTASH_REDIS_URL` | Alternative Redis URL (Upstash serverless) | (none) |
| `ENABLE_WORKERS` | Master switch for background workers | `true` in production, `false` in dev |
| `ENABLE_SCHEDULER` | Enable cron-based scheduled jobs | `true` in production, `false` in dev |

### Worker configuration

- **Concurrency:** 10 concurrent jobs per worker
- **Retry strategy:** Exponential backoff, starting at 5 seconds
- **Completed job retention:** Last 1,000
- **Failed job retention:** Last 5,000
- **Graceful shutdown:** Workers drain on SIGTERM/SIGINT

## Consequences

### Positive

- **Reliable retries** -- failed jobs are retried with exponential backoff, not silently dropped.
- **Observability** -- job completion and failure are logged via the structured logger.
- **No Redis required for development** -- the DB-polled fallback means `pnpm dev` works without Redis.
- **Scheduled jobs** -- BullMQ supports cron-like repeatable jobs for periodic tasks (trust score recalculation, payout batching).
- **Graceful degradation** -- if Redis goes down mid-operation, the system logs the error and falls back to DB polling.

### Negative

- **Redis is an additional infrastructure dependency** in production.
- **DB-polled fallback is less efficient** -- it uses periodic polling instead of Redis pub/sub, introducing latency.
- **Two code paths** for job delivery (BullMQ vs. DB queue) increase testing surface.

### Mitigations

- Redis is a standard component in production deployments and is available as a managed service on all major cloud providers.
- The `addJob()` function returns a boolean indicating which path was used, allowing callers to log the routing decision.
- Worker enable/disable flags are environment-driven, so dev and production configurations are explicit.

## Related Files

- `server/src/lib/bullmq.ts` -- BullMQ initialization, job registration, enqueueing
- `server/src/jobs/scheduler.ts` -- Cron scheduler for periodic jobs
- `server/src/jobs/payoutJobHandler.ts` -- Payout job handler
- `server/src/jobs/trustJobHandler.ts` -- Trust score job handler
- `server/src/jobs/automationJobHandler.ts` -- Automation rules job handler
- `server/src/jobs/scaleSafetyJobHandler.ts` -- Scale safety job handler
- `server/src/workers/jobQueueWorker.ts` -- DB-polled job queue worker
- `server/src/workers/eventOutboxWorker.ts` -- Event outbox worker
- `server/.env.example` -- Worker configuration variables
