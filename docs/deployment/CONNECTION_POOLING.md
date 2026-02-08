# Connection Pooling Guide

Production connection management for the NABD backend (Node.js + Express + Prisma + PostgreSQL).

---

## Why Connection Pooling Matters

PostgreSQL has a hard limit on simultaneous connections (typically 100 by default on managed databases, 20-25 on free tiers). Without proper pooling, your application will hit this limit and crash under load.

Three things make this especially important for NABD:

1. **Prisma creates a connection pool per process.** Each `PrismaClient` instance (see `server/src/lib/prisma.ts`) opens its own pool of connections. The default pool size is `num_physical_cpus * 2 + 1`.

2. **Horizontal scaling multiplies connections.** If you run 4 instances and each opens 10 connections, that is 40 connections consumed before any traffic arrives. Add background workers (`server/src/workers/`) and you consume even more.

3. **Connection storms happen under concurrency.** A traffic spike can exhaust all available connections at once, causing cascading timeouts across every request.

---

## Prisma Connection Pool Settings

Prisma reads pool configuration directly from the `DATABASE_URL` query string. There is no separate config file.

### Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `connection_limit` | `num_cpus * 2 + 1` | Maximum connections in the pool |
| `pool_timeout` | `10` (seconds) | How long a query waits for a free connection before erroring |
| `connect_timeout` | `5` (seconds) | Timeout for establishing a new connection to PostgreSQL |

### Example DATABASE_URL

```env
# In server/.env
DATABASE_URL="postgresql://nabd:password@host:5432/nabd_chain?connection_limit=10&pool_timeout=20&connect_timeout=10&sslmode=require"
```

### How to Choose connection_limit

Calculate the maximum total connections across all processes:

```
total_connections = connection_limit * number_of_instances
```

This total must stay below your PostgreSQL `max_connections` setting, leaving headroom for superuser connections and monitoring tools.

**Example:** Render free-tier PostgreSQL allows 97 connections. With 2 web instances + 1 worker:

```
connection_limit = floor(97 * 0.8 / 3) = 25
```

The `0.8` factor reserves 20% headroom for admin connections, migrations, and health checks.

---

## PgBouncer Setup

PgBouncer is a lightweight connection pooler that sits between your application and PostgreSQL. It multiplexes hundreds of client connections over a small number of real database connections.

### When You Need PgBouncer

- Running 3+ application instances
- PostgreSQL max_connections is low (managed databases, shared hosting)
- You see `too many connections` errors in logs
- Background workers compete with web traffic for connections

### Docker Compose Service

Add this to `server/docker-compose.yml` alongside the existing `postgres` service:

```yaml
services:
  postgres:
    # ... existing postgres service ...

  pgbouncer:
    image: bitnami/pgbouncer:1.22.0
    container_name: nabd-pgbouncer
    restart: unless-stopped
    ports:
      - "6432:6432"
    environment:
      POSTGRESQL_HOST: postgres
      POSTGRESQL_PORT: 5432
      POSTGRESQL_USERNAME: nabd
      POSTGRESQL_PASSWORD: nabd_dev
      POSTGRESQL_DATABASE: nabd_chain
      PGBOUNCER_PORT: 6432
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_DEFAULT_POOL_SIZE: 20
      PGBOUNCER_MAX_CLIENT_CONN: 200
      PGBOUNCER_MAX_DB_CONNECTIONS: 50
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "pg_isready", "-h", "localhost", "-p", "6432"]
      interval: 10s
      timeout: 5s
      retries: 3
```

### PgBouncer Configuration Reference

If you need a custom `pgbouncer.ini` instead of environment variables:

```ini
[databases]
nabd_chain = host=postgres port=5432 dbname=nabd_chain

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

; transaction mode: connections are returned to the pool after each transaction
; This is the correct mode for Prisma
pool_mode = transaction

; Pool sizing
default_pool_size = 20
max_client_conn = 200
max_db_connections = 50

; Timeouts
server_idle_timeout = 600
client_idle_timeout = 0
```

**Important:** Always use `pool_mode = transaction` with Prisma. Session mode prevents connection reuse, and statement mode breaks multi-statement transactions.

### Pointing Prisma at PgBouncer

Update `DATABASE_URL` to connect through PgBouncer instead of directly to PostgreSQL. You must add `pgbouncer=true` to tell Prisma to disable features incompatible with PgBouncer (prepared statements).

```env
# Before (direct connection)
DATABASE_URL="postgresql://nabd:password@host:5432/nabd_chain?sslmode=require"

# After (through PgBouncer)
DATABASE_URL="postgresql://nabd:password@host:6432/nabd_chain?pgbouncer=true&connection_limit=10&pool_timeout=20&sslmode=require"
```

The `pgbouncer=true` parameter tells Prisma to:
- Disable prepared statements (incompatible with transaction pooling)
- Avoid using `SET` commands that require session-level state

**Migrations:** Prisma Migrate needs a direct connection (not PgBouncer) because it uses advisory locks. Use a separate `DIRECT_URL` in `schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // PgBouncer URL for queries
  directUrl = env("DIRECT_DATABASE_URL") // Direct PostgreSQL URL for migrations
}
```

```env
DATABASE_URL="postgresql://nabd:password@host:6432/nabd_chain?pgbouncer=true&connection_limit=10"
DIRECT_DATABASE_URL="postgresql://nabd:password@host:5432/nabd_chain"
```

---

## Render / Cloud Deployment

### Render Managed PostgreSQL

Render's PostgreSQL instances have the following connection limits:

| Plan | Max Connections |
|------|----------------|
| Free | 97 |
| Starter | 97 |
| Standard | 120 |
| Pro | 200 |

Render does not include a built-in PgBouncer. For most NABD deployments on Render:

```env
# Single instance on Render free tier
DATABASE_URL="postgresql://user:pass@host:5432/nabd_chain?connection_limit=10&pool_timeout=20&sslmode=require"
```

If you scale beyond 2 instances on Render, deploy PgBouncer as a separate Render service (Docker) or use an external pooler.

### Supabase (Built-in Pooling)

Supabase provides a built-in PgBouncer on port 6543. Use their pooled connection string:

```env
# Supabase pooled connection (port 6543, not 5432)
DATABASE_URL="postgresql://postgres.[ref]:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"

# Direct connection for migrations
DIRECT_DATABASE_URL="postgresql://postgres.[ref]:password@aws-0-region.supabase.com:5432/postgres"
```

### Neon (Built-in Pooling)

Neon provides pooling by adding `-pooler` to the hostname:

```env
# Neon pooled connection
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech:5432/nabd_chain?pgbouncer=true&connection_limit=10"

# Direct connection for migrations
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech:5432/nabd_chain"
```

---

## Monitoring Connection Usage

### Prometheus Metrics

The NABD server exposes Prometheus metrics at `GET /metrics` (configured in `server/src/lib/metrics.ts`). Key metrics for connection monitoring:

| Metric | Type | Description |
|--------|------|-------------|
| `http_active_connections` | Gauge | Currently active HTTP connections (proxy for DB load) |
| `http_request_duration_seconds` | Histogram | Request latency; spikes indicate connection pool exhaustion |
| `http_requests_total` | Counter | Total requests; use rate to correlate with connection usage |

When request duration spikes correlate with high `http_active_connections`, connection pool saturation is the likely cause.

### PostgreSQL pg_stat_activity

Connect to PostgreSQL directly and query active connections:

```sql
-- Count connections by state
SELECT state, count(*)
FROM pg_stat_activity
WHERE datname = 'nabd_chain'
GROUP BY state;

-- See which queries are waiting for connections
SELECT pid, state, wait_event_type, wait_event, query, now() - query_start AS duration
FROM pg_stat_activity
WHERE datname = 'nabd_chain'
  AND state != 'idle'
ORDER BY duration DESC;

-- Count connections by application/client
SELECT client_addr, usename, count(*)
FROM pg_stat_activity
WHERE datname = 'nabd_chain'
GROUP BY client_addr, usename;

-- Check maximum allowed connections
SHOW max_connections;
```

### PgBouncer Stats

If running PgBouncer, connect to its admin console:

```bash
psql -h localhost -p 6432 -U nabd pgbouncer
```

```sql
SHOW POOLS;    -- Current pool status (cl_active, cl_waiting, sv_active)
SHOW STATS;    -- Request/transaction counts
SHOW SERVERS;  -- Backend server connections
```

Key things to watch:
- `cl_waiting > 0` means clients are waiting for connections (pool too small)
- `sv_active` close to `default_pool_size` means pool is near capacity

### Health Check Endpoint

The NABD server provides a database health check via `checkDatabaseHealth()` in `server/src/lib/prisma.ts`. Use this in your monitoring to detect connection issues early:

```bash
# The health check runs SELECT 1 and reports response time
curl http://localhost:3001/api/monitoring/health
```

---

## Recommended Production Config

### Small (1-2 instances, < 100 concurrent users)

No PgBouncer needed. Configure Prisma pool directly.

```env
DATABASE_URL="postgresql://user:pass@host:5432/nabd_chain?connection_limit=10&pool_timeout=20&sslmode=require"
```

- `connection_limit=10` per instance = 20 max connections
- Leaves plenty of headroom on a 97-connection database

### Medium (3-5 instances, 100-500 concurrent users)

Add PgBouncer. Reduce Prisma's pool size since PgBouncer handles multiplexing.

```env
DATABASE_URL="postgresql://user:pass@host:6432/nabd_chain?pgbouncer=true&connection_limit=5&pool_timeout=20"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/nabd_chain?sslmode=require"
```

PgBouncer settings:
```
default_pool_size = 20
max_client_conn = 200
max_db_connections = 80
```

- Each instance opens 5 Prisma connections to PgBouncer
- PgBouncer maintains 20 real connections to PostgreSQL
- Supports 200 simultaneous client connections across all instances

### Large (5+ instances, 500+ concurrent users)

Aggressive pooling with PgBouncer and reduced per-instance pools.

```env
DATABASE_URL="postgresql://user:pass@host:6432/nabd_chain?pgbouncer=true&connection_limit=3&pool_timeout=30"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/nabd_chain?sslmode=require"
```

PgBouncer settings:
```
default_pool_size = 50
max_client_conn = 500
max_db_connections = 150
```

- Each instance opens 3 Prisma connections to PgBouncer
- PgBouncer maintains up to 50 real connections per database
- Supports 500 simultaneous client connections
- Increase `pool_timeout` to 30s to handle queue pressure

---

## Troubleshooting

### "Too many connections" Error

1. Check current connections: `SELECT count(*) FROM pg_stat_activity;`
2. Lower `connection_limit` in `DATABASE_URL`
3. Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes';`
4. If persistent, deploy PgBouncer

### "Timed out fetching a new connection from the connection pool"

This is a Prisma error meaning `pool_timeout` was exceeded.

1. Increase `pool_timeout` (e.g., from 10 to 20 seconds)
2. Increase `connection_limit` if your database can handle it
3. Check for long-running queries holding connections
4. Look for missing `await` on Prisma calls (unreturned connections)

### Connections Leak After Deploy

The NABD server registers graceful shutdown handlers in `server/src/lib/prisma.ts` (SIGINT, SIGTERM, beforeExit). If connections leak after deploys:

1. Verify your deployment platform sends SIGTERM before killing the process
2. Ensure the grace period is long enough (at least 10 seconds)
3. Check that `prisma.$disconnect()` is being called in the shutdown handler

### PgBouncer "no more connections allowed"

1. Increase `max_client_conn` in PgBouncer config
2. Reduce `connection_limit` in Prisma's `DATABASE_URL`
3. Check for connection leaks in application code
