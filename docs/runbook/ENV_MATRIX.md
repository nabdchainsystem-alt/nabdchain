# NABD Environment Matrix

> Configuration matrix for Local, Staging, and Production environments.

---

## Environment Overview

| Aspect | Local | Staging | Production |
|--------|-------|---------|------------|
| **Frontend URL** | http://localhost:5173 | https://staging.nabdchain.com | https://nabdchain.com |
| **API Base URL** | http://localhost:3001 | https://staging-api.nabdchain.com | https://api.nabdchain.com |
| **Database** | PostgreSQL @ localhost:5432 | PostgreSQL @ Render | PostgreSQL @ Render |
| **Auth Mode** | Mock Auth or Clerk (dev) | Clerk (test keys) | Clerk (production keys) |
| **Workers** | Auto-start (can disable) | Enabled | Enabled |
| **Debug Endpoints** | Enabled | Enabled | Disabled |
| **Console Logs** | Enabled | Enabled | Stripped by Terser |

---

## Frontend Environment Variables

### Local Development (`.env`)

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Authentication
VITE_USE_MOCK_AUTH=true
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# NOTE: AI features use backend proxy - no frontend API key needed
```

### Staging (Vercel Environment Variables)

```env
VITE_API_URL=https://staging-api.nabdchain.com
VITE_USE_MOCK_AUTH=false
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Production (Vercel Environment Variables)

```env
VITE_API_URL=https://api.nabdchain.com
VITE_USE_MOCK_AUTH=false
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

---

## Backend Environment Variables

### Local Development (`server/.env`)

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/nabd_chain"

# Auth
CLERK_SECRET_KEY=sk_test_...
ALLOW_DEV_TOKENS=true

# Encryption
ENCRYPTION_KEY=<generate-random-64-char-hex>

# OAuth (optional for local)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
OUTLOOK_REDIRECT_URI=http://localhost:3001/api/auth/outlook/callback

# AI (optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Staging (Render Environment Variables)

```env
NODE_ENV=staging
PORT=3001
DATABASE_URL=<render-postgres-internal-url>
CLERK_SECRET_KEY=sk_test_...
ALLOW_DEV_TOKENS=false
ENCRYPTION_KEY=<staging-encryption-key>
FRONTEND_URL=https://staging.nabdchain.com
CORS_ORIGIN=https://staging.nabdchain.com
```

### Production (Render Environment Variables)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=<render-postgres-internal-url>
CLERK_SECRET_KEY=sk_live_...
ALLOW_DEV_TOKENS=false
ENCRYPTION_KEY=<production-encryption-key>
FRONTEND_URL=https://nabdchain.com
CORS_ORIGIN=https://nabdchain.com,https://www.nabdchain.com
```

---

## Database Configuration

| Environment | Host | Port | Database | SSL |
|-------------|------|------|----------|-----|
| Local | localhost | 5432 | nabd_chain | No |
| Staging | Render Internal | 5432 | nabd_staging | Yes |
| Production | Render Internal | 5432 | nabd_prod | Yes |

### Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

---

## Port Matrix

| Service | Local | Staging | Production |
|---------|-------|---------|------------|
| Frontend (Vite) | 5173 | N/A (Vercel) | N/A (Vercel) |
| Frontend (Preview) | 3000 | N/A | N/A |
| Backend API | 3001 | 443 (HTTPS) | 443 (HTTPS) |
| PostgreSQL | 5432 | 5432 | 5432 |
| Prisma Studio | 5555 | N/A | N/A |

---

## Feature Flags by Environment

| Feature | Local | Staging | Production |
|---------|-------|---------|------------|
| Mock Authentication | Yes | No | No |
| Dev Tokens | Yes | No | No |
| Debug Endpoints | Yes | Yes | No |
| Console Logs | Yes | Yes | No (stripped) |
| Source Maps | Yes | Yes | No |
| ENV Banner | Yes | Yes | No |
| Background Workers | Yes (auto) | Yes | Yes |

---

## CORS Configuration

### Local
```javascript
// Allows any localhost origin
origin: true
```

### Staging/Production
```javascript
origin: [
  'https://nabdchain.com',
  'https://www.nabdchain.com',
  'https://app.nabdchain.com',
  'https://nabdchain.vercel.app'
]
```

---

## Health Check URLs by Environment

| Environment | Health Check |
|-------------|--------------|
| Local | http://localhost:3001/health |
| Staging | https://staging-api.nabdchain.com/health |
| Production | https://api.nabdchain.com/health |

---

## Deployment Platforms

| Component | Local | Staging | Production |
|-----------|-------|---------|------------|
| Frontend | Vite Dev Server | Vercel | Vercel |
| Backend | tsx watch | Render | Render |
| Database | Homebrew PostgreSQL | Render PostgreSQL | Render PostgreSQL |
| File Storage | Local filesystem | Cloudflare R2 | Cloudflare R2 |

---

## Quick Reference: Required Variables

### Minimum for Local Dev
```
DATABASE_URL
```

### Required for Production
```
DATABASE_URL
CLERK_SECRET_KEY
ENCRYPTION_KEY
CORS_ORIGIN
FRONTEND_URL
```

---

*See also: [LOCAL_DEV_RUNBOOK.md](./LOCAL_DEV_RUNBOOK.md) for step-by-step local setup.*
