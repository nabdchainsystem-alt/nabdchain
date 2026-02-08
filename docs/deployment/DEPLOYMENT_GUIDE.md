# NABD Deployment Guide

This guide covers deploying the NABD platform to production environments. NABD consists of two deployable units: a **React frontend** (static SPA) and a **Node.js backend** (Express API server).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Database Setup](#database-setup)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Production Checklist](#production-checklist)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Dependency | Minimum Version | Purpose |
|-----------|----------------|---------|
| Node.js | 20 LTS | Runtime for backend and build tooling |
| pnpm | 10.x | Package manager |
| PostgreSQL | 14+ | Primary database |
| Redis | 7+ | Job queue (BullMQ), optional but recommended |

### Optional

| Dependency | Purpose |
|-----------|---------|
| Docker | Containerized deployment |
| Sentry | Error tracking |
| Clerk | Production authentication |

---

## Environment Variables

### Frontend (`.env`)

Copy from `.env.example` at project root:

```bash
# Required
VITE_API_URL=https://api.your-domain.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here

# Must be false in production
VITE_USE_MOCK_AUTH=false
```

**Security note:** All `VITE_` prefixed variables are bundled into the browser build. Never put secrets in frontend env vars.

### Backend (`server/.env`)

Copy from `server/.env.example`:

```bash
# Required
DATABASE_URL="postgresql://user:password@host:5432/nabd_chain?sslmode=require"
PORT=3001
CLERK_SECRET_KEY=sk_live_your_secret_key
CLERK_PUBLISHABLE_KEY=pk_live_your_key
ENCRYPTION_KEY=your_64_char_hex_key  # openssl rand -hex 32

# CORS
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Portal Auth (JWT)
PORTAL_JWT_SECRET=your_64_char_base64_secret  # openssl rand -base64 64

# Optional - Redis for BullMQ job queue
REDIS_URL=redis://user:password@host:6379

# Optional - Sentry error tracking
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Optional - AI features
GEMINI_API_KEY=your_gemini_key

# Optional - Email OAuth
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=https://api.your-domain.com/api/auth/google/callback
OUTLOOK_CLIENT_ID=your_id
OUTLOOK_CLIENT_SECRET=your_secret
OUTLOOK_REDIRECT_URI=https://api.your-domain.com/api/auth/outlook/callback
```

### Critical security settings for production

```bash
NODE_ENV=production
ALLOW_DEV_TOKENS=false         # NEVER true in production
PORTAL_ALLOW_SEED_ENDPOINT=    # Must be unset in production
ALLOW_LEGACY_PORTAL_AUTH=false # Disable after JWT migration
```

---

## Docker Deployment

Both the frontend and backend have multi-stage Dockerfiles optimized for production.

### Frontend (`Dockerfile` at project root)

Builds the React app and serves it via nginx:

```bash
docker build -t nabd-frontend .
docker run -p 80:80 nabd-frontend
```

The nginx config includes:
- SPA routing (all paths fallback to `index.html`)
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Gzip compression
- Aggressive caching for `/assets/` (1 year, immutable)
- `/health` endpoint returning 200

### Backend (`server/Dockerfile`)

Compiles TypeScript and runs with production dependencies only:

```bash
cd server
docker build -t nabd-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e CLERK_SECRET_KEY="sk_live_..." \
  -e ENCRYPTION_KEY="..." \
  -e PORTAL_JWT_SECRET="..." \
  -e NODE_ENV=production \
  nabd-backend
```

The backend Dockerfile includes:
- Non-root user (`nabd`) for security
- Built-in health check (`wget` to `/health` every 30s)
- Prisma client generation in the build stage

### Local PostgreSQL (`server/docker-compose.yml`)

For local development only:

```bash
cd server
docker compose up -d          # Start PostgreSQL
docker compose down           # Stop
docker compose down -v        # Stop and delete data
```

Connection string: `postgresql://nabd:nabd_dev@localhost:5432/nabd_chain`

---

## Manual Deployment

### Build Frontend

```bash
pnpm install --frozen-lockfile
pnpm build
# Output: dist/ -- serve with nginx, Cloudflare Pages, Vercel, etc.
```

### Build Backend

```bash
cd server
pnpm install --frozen-lockfile
npx prisma generate
pnpm tsc
# Output: dist/ -- run with `node dist/index.js`
```

### Start Backend

```bash
cd server
NODE_ENV=production node dist/index.js
```

---

## Database Setup

### Initial Setup

```bash
cd server

# Run all migrations
npx prisma migrate deploy

# Verify connection
npx prisma db execute --stdin <<< "SELECT 1"
```

### Seed Data (Optional)

```bash
npx prisma db seed
```

### Migration Workflow

```bash
# Development: create migration from schema changes
npx prisma migrate dev --name descriptive_name

# Production: apply pending migrations
npx prisma migrate deploy
```

### Connection Pooling

For production with many concurrent connections, use PgBouncer or your cloud provider's built-in connection pooler. Configure via `DATABASE_URL`:

```
postgresql://user:pass@pgbouncer-host:6432/nabd_chain?pgbouncer=true
```

---

## Health Checks

The backend exposes several health endpoints, all unauthenticated:

| Endpoint | Purpose | Success | Failure |
|----------|---------|---------|---------|
| `GET /health` | Full health check (all components) | 200 | 503 |
| `GET /health/live` | Kubernetes liveness probe (is process running?) | 200 | -- |
| `GET /health/ready` | Kubernetes readiness probe (ready for traffic?) | 200 | 503 |
| `GET /health/db` | Database health with circuit breaker status | 200 | 503 |
| `GET /health/dev` | Development status (workers, scheduler, DB) | 200 | -- |
| `GET /status` | System status summary (health + errors + metrics) | 200 | 500 |

### Kubernetes/Container Orchestration

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Docker Health Check (built into Dockerfile)

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1
```

---

## Monitoring

### Prometheus Metrics

The `/metrics` endpoint serves Prometheus-compatible metrics:

```bash
curl http://localhost:3001/metrics
```

**Default Node.js metrics** (via `prom-client`):
- `process_cpu_seconds_total`
- `process_resident_memory_bytes`
- `nodejs_eventloop_lag_seconds`
- `nodejs_gc_duration_seconds`

**Custom HTTP metrics:**
- `http_request_duration_seconds` (histogram) -- labels: method, route, status_code
- `http_requests_total` (counter) -- labels: method, route, status_code
- `http_active_connections` (gauge)

Route paths are normalized to prevent high-cardinality labels (UUIDs and numeric IDs are replaced with `:id`).

Additional JSON endpoints:
- `GET /metrics/json` -- all metrics in JSON format
- `GET /metrics/summary` -- high-level summary

### Sentry Error Tracking

Set `SENTRY_DSN` to enable Sentry integration:

```bash
SENTRY_DSN=https://key@o0.ingest.sentry.io/0
SENTRY_RELEASE=nabd@1.0.0  # Optional, defaults to package version
```

Features:
- Express request/response context attached to errors
- 10% trace sampling in production (100% in development)
- Sensitive data (passwords, tokens, keys) stripped from reports before sending

### Error Tracking API

Protected endpoints for admin/staff users:

| Endpoint | Purpose |
|----------|---------|
| `GET /errors` | Error statistics |
| `GET /errors/recent` | Recent errors (limit via `?limit=50`) |
| `GET /errors/category/:category` | Errors by category |
| `GET /errors/severity/:severity` | Errors by severity |
| `POST /errors/:fingerprint/resolve` | Mark error as resolved |

---

## Production Checklist

### Security

- [ ] `NODE_ENV=production` is set
- [ ] `ALLOW_DEV_TOKENS=false` (or unset)
- [ ] `PORTAL_ALLOW_SEED_ENDPOINT` is unset
- [ ] `ALLOW_LEGACY_PORTAL_AUTH=false`
- [ ] `ENCRYPTION_KEY` is a unique 64-character hex string
- [ ] `PORTAL_JWT_SECRET` is a unique base64 string (at least 64 characters)
- [ ] CORS origin is restricted to your frontend domain (`CORS_ORIGIN`)
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Helmet security headers are active (enabled by default in production)

### Rate Limiting

The server applies rate limiting via `express-rate-limit`:
- Portal login: 10 requests per 15-minute window
- Portal signup: 5 requests per 15-minute window
- General API: configured via `rateLimiters` middleware

### CSRF Protection

CSRF tokens are issued via `GET /api/auth/portal/csrf-token` and validated on state-changing portal requests.

### Infrastructure

- [ ] PostgreSQL is provisioned with automated backups
- [ ] Redis is provisioned (optional, for BullMQ job queue)
- [ ] DNS is configured for frontend and API domains
- [ ] TLS certificates are provisioned (HTTPS)
- [ ] Log aggregation is configured (stdout/stderr from containers)
- [ ] Prometheus scrape target is configured for `/metrics`
- [ ] Sentry DSN is configured for error tracking
- [ ] Health check monitoring is configured for `/health`

### Background Workers

Workers are enabled by default in production (`NODE_ENV=production`):

| Worker | Purpose | Control Variable |
|--------|---------|-----------------|
| Event Outbox | Webhook delivery | `ENABLE_EVENT_OUTBOX_WORKER` |
| Job Queue | Async job processing | `ENABLE_JOB_QUEUE_WORKER` |
| Scheduler | Cron-based periodic jobs | `ENABLE_SCHEDULER` |

Master switch: `ENABLE_WORKERS=true` (default in production).

---

## Scaling

### Horizontal Scaling (Multiple Backend Instances)

The backend is stateless and can be horizontally scaled behind a load balancer. Considerations:

1. **Session state:** Authentication is token-based (Clerk JWT or portal JWT), no server-side sessions. Any instance can handle any request.

2. **Socket.IO:** If using real-time features (live collaboration), configure the Redis adapter for Socket.IO so events are broadcast across instances:
   ```bash
   REDIS_URL=redis://your-redis-host:6379
   ```

3. **Database connections:** Each instance opens its own connection pool. Use PgBouncer to limit total connections to PostgreSQL:
   ```
   DATABASE_URL="postgresql://user:pass@pgbouncer:6432/nabd_chain?pgbouncer=true"
   ```

4. **Background workers:** Run workers on a single instance (or use BullMQ's built-in distributed locking via Redis) to prevent duplicate job execution.

### Vertical Scaling

- **PostgreSQL:** Increase connection limits, add read replicas for analytics queries.
- **Redis:** Increase memory for larger job queues. Redis Cluster for high availability.
- **Backend:** Increase Node.js heap size (`--max-old-space-size=4096`) for memory-intensive operations.

### CDN

Serve the frontend via a CDN (Cloudflare, CloudFront, Vercel Edge). The Vite build output includes content-hashed filenames in `/assets/`, safe for aggressive caching (1 year, immutable).

---

## Troubleshooting

### Database Connection Failures

Check the health endpoint:
```bash
curl http://localhost:3001/health/db
```

The response includes circuit breaker state:
- `closed` -- normal operation
- `open` -- circuit tripped after repeated failures, requests are rejected
- `half-open` -- circuit is testing if DB is back

### Workers Not Processing Jobs

Check the dev health endpoint:
```bash
curl http://localhost:3001/health/dev
```

Verify `features.workers` and `features.scheduler` are `true`. If `false`, set `ENABLE_WORKERS=true` and `ENABLE_SCHEDULER=true`.

### Build Failures

```bash
# Frontend
pnpm tsc --noEmit   # Type check
pnpm lint            # Lint check
pnpm build           # Full build

# Backend
cd server
pnpm tsc             # Compile
pnpm test            # Run tests
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `CLERK_SECRET_KEY` error on startup | Missing env var | Set `CLERK_SECRET_KEY` in `server/.env` |
| Database connection refused | PostgreSQL not running | `cd server && pnpm db:up` (local) or check `DATABASE_URL` |
| 503 on `/health/ready` | Database circuit breaker open | Check DB connectivity, wait for circuit to half-open |
| CORS errors in browser | Misconfigured `CORS_ORIGIN` | Set `CORS_ORIGIN` to your frontend URL |
| Workers not starting | `ENABLE_WORKERS` not set | Set `ENABLE_WORKERS=true` |
