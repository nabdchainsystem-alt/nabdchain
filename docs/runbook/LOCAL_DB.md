# Local Database Setup

> How to run PostgreSQL locally for development.

---

## Quick Start (Docker)

The fastest way to get started is using Docker:

```bash
# Start PostgreSQL
cd server
pnpm db:up

# Run migrations
pnpm prisma:migrate

# Start the server
pnpm dev
```

---

## Connection String

Add this to `server/.env`:

```bash
DATABASE_URL="postgresql://nabd:nabd_dev@localhost:5432/nabd_chain"
```

---

## Docker Commands

| Command | Description |
|---------|-------------|
| `pnpm db:up` | Start PostgreSQL container |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:reset` | Destroy data and start fresh |
| `pnpm db:ping` | Test database connectivity |

---

## Troubleshooting

### Database not connecting

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep nabd-postgres
   ```

2. Test connectivity:
   ```bash
   pnpm db:ping
   ```

3. Check logs:
   ```bash
   docker logs nabd-postgres
   ```

### Port already in use

If port 5432 is already in use:

```bash
# Find what's using the port
lsof -i :5432

# Either stop the existing PostgreSQL or change the port in docker-compose.yml
```

### Reset everything

To start completely fresh:

```bash
pnpm db:reset
pnpm prisma:migrate
```

---

## Alternative: Remote Database

You can also connect to a remote PostgreSQL instance:

### Render

1. Create a PostgreSQL instance on Render
2. Copy the "Internal Database URL"
3. Add to `server/.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@host.render.com:5432/db_name"
   ```

### Supabase

1. Create a project on Supabase
2. Go to Settings > Database > Connection string
3. Add to `server/.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   ```

### Neon

1. Create a project on Neon
2. Copy the connection string from the dashboard
3. Add to `server/.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
   ```

---

## Schema Validation

To validate your Prisma schema without connecting to the database:

```bash
pnpm prisma:validate
```

---

## Development Workflow

1. **Start database**: `pnpm db:up`
2. **Verify connection**: `pnpm db:ping`
3. **Run migrations**: `pnpm prisma:migrate`
4. **Start server**: `pnpm dev`

The server will start even if the database is temporarily down, but database operations will fail until connectivity is restored. Check `/health/db` for database status.

---

## Environment Flags

By default, background workers and schedulers are **disabled** in development to keep logs clean. This prevents error spam when the database is down.

### Quick Configurations

**Local API only** (default, quietest):
```bash
# No extra flags needed - workers disabled by default
```

**Local API + scheduler** (for testing scheduled jobs):
```bash
ENABLE_SCHEDULER=true
```

**Local API + workers** (for testing background processing):
```bash
ENABLE_WORKERS=true
ENABLE_JOB_QUEUE_WORKER=true
ENABLE_EVENT_OUTBOX_WORKER=true
```

**Full stack** (all features enabled):
```bash
ENABLE_WORKERS=true
ENABLE_SCHEDULER=true
ENABLE_JOB_QUEUE_WORKER=true
ENABLE_EVENT_OUTBOX_WORKER=true
```

### All Available Flags

| Flag | Default (Dev) | Default (Prod) | Description |
|------|---------------|----------------|-------------|
| `ENABLE_WORKERS` | false | true | Master switch for all workers |
| `ENABLE_SCHEDULER` | false | true | Cron scheduler for scheduled jobs |
| `ENABLE_JOB_QUEUE_WORKER` | false | true | Async job processing |
| `ENABLE_EVENT_OUTBOX_WORKER` | false | true | Webhook delivery |
| `WORKER_BACKOFF_MS` | 5000 | 5000 | Initial backoff when DB is down |
| `WORKER_MAX_BACKOFF_MS` | 60000 | 60000 | Maximum backoff delay |

### Circuit Breaker

Workers use a circuit breaker to handle database failures gracefully:

- After 3 consecutive failures, the circuit "opens" and workers pause
- Workers use exponential backoff (5s → 10s → 20s → 40s → 60s max)
- Once DB recovers, workers resume normal polling
- Check `/health/dev` to see worker and circuit breaker status

---

*See also: [LOCAL_DEV_RUNBOOK.md](./LOCAL_DEV_RUNBOOK.md)*
