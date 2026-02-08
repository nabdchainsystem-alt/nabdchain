# ADR-005: SQLite for Development, PostgreSQL for Production via Prisma

**Status:** Accepted

**Date:** 2025-09

## Context

NABD needs a relational database for its core data model (users, workspaces, boards, orders, disputes, etc.). The requirements are:

1. **Local development must be zero-config** -- new developers should be able to run the app without installing or configuring a database server.
2. **Production must use a robust, scalable RDBMS** -- the app serves multi-tenant B2B workloads with concurrent writes, full-text search, and complex joins.
3. **Schema changes must be version-controlled** -- migrations should be reproducible across environments.

## Decision

Use **Prisma ORM** as the data access layer with a dual-provider strategy:

- **Development:** PostgreSQL via Docker Compose (`server/docker-compose.yml`), with SQLite as an emergency fallback for environments without Docker.
- **Production:** PostgreSQL 14+ (hosted on Render, Supabase, AWS RDS, or similar).
- **Schema:** Single `server/prisma/schema.prisma` file with `provider = "postgresql"`.

### Local development setup

```bash
# Start local PostgreSQL
cd server && pnpm db:up   # docker compose up -d

# Run migrations
npx prisma migrate deploy

# Seed data (optional)
npx prisma db seed
```

The `docker-compose.yml` provides a PostgreSQL 16 container with:
- User: `nabd`, Password: `nabd_dev`, Database: `nabd_chain`
- Health check configured
- Named volume for data persistence across restarts

### Schema management

```bash
# Create a new migration
npx prisma migrate dev --name add_feature_x

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Consequences

### Positive

- **Prisma abstracts SQL dialect differences** -- the same schema and queries work across SQLite and PostgreSQL without conditional code.
- **Migrations are version-controlled** in `server/prisma/migrations/`, providing a full history of schema evolution.
- **Type-safe queries** -- Prisma Client generates TypeScript types from the schema, catching query errors at compile time.
- **Zero-config local dev** -- `pnpm db:up` starts a containerized PostgreSQL, no manual installation needed.
- **Production-grade features** -- PostgreSQL provides JSONB columns, full-text search, row-level locking, and connection pooling.

### Negative

- Developers need Docker installed for local PostgreSQL (or must use a remote database).
- Some PostgreSQL-specific features (e.g., `@db.JsonB`, array columns) are not available when using SQLite fallback.
- Prisma adds a runtime dependency (~2MB) and a build step (`prisma generate`).

### Mitigations

- The Docker Compose file is minimal (single service, alpine image) and starts in under 5 seconds.
- The `db:up`, `db:down`, and `db:reset` scripts in `server/package.json` make database management straightforward.
- Connection health is monitored via the `/health/db` endpoint with circuit breaker protection (`server/src/lib/circuitBreaker.ts`).

## Related Files

- `server/prisma/schema.prisma` -- database schema
- `server/prisma/migrations/` -- migration history
- `server/docker-compose.yml` -- local PostgreSQL container
- `server/src/lib/prisma.ts` -- Prisma client singleton with health checks
- `server/src/lib/circuitBreaker.ts` -- database circuit breaker
- `server/.env.example` -- `DATABASE_URL` configuration
