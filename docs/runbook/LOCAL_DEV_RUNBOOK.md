# NABD Local Development Runbook

> Quick reference for running NABD locally. Last updated: February 2026.

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | v20+ (LTS recommended) | `node -v` |
| pnpm | v8+ | `pnpm -v` |
| PostgreSQL | v16+ | `psql --version` |

### macOS (Homebrew)

```bash
# Install Node.js
brew install node@20

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
brew install postgresql@16
brew services start postgresql@16
```

---

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url> nabd
cd nabd

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd server && pnpm install && cd ..
```

### 2. Database Setup

```bash
# Ensure PostgreSQL is running
brew services start postgresql@16

# Create database (if not exists)
createdb nabd_chain

# Push Prisma schema
cd server
npx prisma db push
npx prisma generate
cd ..
```

### 3. Environment Variables

**Frontend** (`.env` in root):
```env
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK_AUTH=true
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Backend** (`server/.env`):
```env
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/nabd_chain"
PORT=3001
ALLOW_DEV_TOKENS=true
NODE_ENV=development
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

### 5. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |
| Metrics | http://localhost:3001/metrics |

---

## Common Errors & Fixes

### EADDRINUSE (Port already in use)

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 pnpm dev
```

### Database Connection Refused (localhost:5432)

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@16

# If stale lock file exists
rm /opt/homebrew/var/postgresql@16/postmaster.pid
brew services restart postgresql@16

# Verify connection
psql -d nabd_chain -c "SELECT 1;"
```

### Prisma Client Not Generated

```bash
cd server
npx prisma generate
npx prisma db push
```

### Workers Spamming Logs

Workers auto-start in dev mode. If database is down, they spam errors every 1-5 seconds.

**Quick fix:** Start PostgreSQL before starting the server.

**Future improvement:** Add `SKIP_BACKGROUND_JOBS=true` to disable workers locally.

### Mock Auth Not Working

Ensure in frontend `.env`:
```env
VITE_USE_MOCK_AUTH=true
```

Or set in browser localStorage:
```javascript
localStorage.setItem('nabd_dev_mode', 'true');
```

---

## Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Full health check with all components |
| `GET /health/live` | Kubernetes liveness probe |
| `GET /health/ready` | Kubernetes readiness probe |
| `GET /status` | Overall system status summary |
| `GET /metrics` | Prometheus-compatible metrics |
| `GET /debug/env` | Environment info (dev only) |

---

## Verification Checklist

After starting both servers, verify:

- [ ] **ENV Banner visible** - Bottom-right corner shows "DEV" badge with API URL
- [ ] **Server logs** - Shows `NABD API running on port 3001`
- [ ] **Health endpoint** - `curl http://localhost:3001/health` returns `{"status":"healthy",...}`
- [ ] **Frontend loads** - http://localhost:5173 shows landing page or portal
- [ ] **No DB errors** - Server logs don't show repeated connection errors

---

## Useful Commands

```bash
# Check server health
curl http://localhost:3001/health | jq

# Check debug environment
curl http://localhost:3001/debug/env | jq

# Reset database (DESTRUCTIVE)
cd server && npx prisma db push --force-reset

# View Prisma Studio (database GUI)
cd server && npx prisma studio

# Build frontend
pnpm build

# Type check
pnpm tsc --noEmit
```

---

## Troubleshooting Decision Tree

```
App won't start?
├── Frontend error?
│   ├── Check `pnpm install` completed
│   ├── Check port 5173 is free
│   └── Check Vite config for errors
├── Backend error?
│   ├── Check `cd server && pnpm install` completed
│   ├── Check port 3001 is free
│   ├── Check DATABASE_URL in .env
│   └── Check PostgreSQL is running
└── Both running but not connecting?
    ├── Check CORS (API_URL matches)
    ├── Check proxy in vite.config.ts
    └── Check browser console for errors
```

---

*See also: [ENV_MATRIX.md](./ENV_MATRIX.md) for environment-specific configurations.*
