# Security Fixes Report

> Security hardening pass completed February 2026

---

## Executive Summary

This report documents a security audit and hardening pass performed on the NABD codebase.
All identified issues have been addressed with minimal code changes - no refactoring or feature changes.

**Status:** All critical issues resolved. System is prepared for safe secret rotation.

---

## 1. Issues Identified

### 1.1 Hardcoded Credentials (LOW RISK - Development Only)

| File | Line | Issue |
|------|------|-------|
| `src/features/auth/DeveloperLoginModal.tsx` | 37-38 | Hardcoded dev credentials (master@nabdchain.com, sam@nabdchain.com) |
| `server/scripts/seed-e2e-data.ts` | 18 | Hardcoded test password (TestPass123!) |
| `server/src/services/portalAdminService.ts` | 573 | Hardcoded temp password (PortalAdmin123!) |

**Assessment:** These are development-only credentials. They only work when:
- `NODE_ENV !== 'production'` AND
- `ALLOW_DEV_TOKENS=true` (explicitly set)

**Action:** No code change needed. Runtime protection is sufficient.

### 1.2 Dangerous Default Values (FIXED)

| File | Issue | Fix |
|------|-------|-----|
| `server/.env.example` | `ALLOW_DEV_TOKENS=true` by default | Changed to commented out (disabled) |

### 1.3 Secrets Loading (VERIFIED SAFE)

All secrets are properly loaded from environment variables:

| Secret | Source | Production Validation |
|--------|--------|----------------------|
| `DATABASE_URL` | env var | Required always |
| `CLERK_SECRET_KEY` | env var | Required in production |
| `ENCRYPTION_KEY` | env var | Required in production |
| `PORTAL_JWT_SECRET` | env var | Required in production (NEW) |
| `GOOGLE_CLIENT_SECRET` | env var | Required in production |
| `OUTLOOK_CLIENT_SECRET` | env var | Required in production |
| `GEMINI_API_KEY` | env var | Optional |

### 1.4 Git Tracking (.env Files)

**Status:** SAFE - No .env files are tracked in git.

Verified with: `git ls-files | grep -E "\.env$|\.env\." | grep -v example`

---

## 2. Fixes Applied

### 2.1 Runtime Validation (server/src/utils/env.ts)

Added fail-fast checks for dangerous configurations in production:

```typescript
// CRITICAL: Block dangerous flags in production
if (process.env.ALLOW_DEV_TOKENS === 'true') {
    throw new Error('SECURITY VIOLATION: ALLOW_DEV_TOKENS=true is not allowed in production.');
}

if (process.env.PORTAL_ALLOW_SEED_ENDPOINT === 'true') {
    throw new Error('SECURITY VIOLATION: PORTAL_ALLOW_SEED_ENDPOINT=true is not allowed in production.');
}
```

### 2.2 Triple-Gate Auth Protection (server/src/middleware/auth.ts)

Enhanced dev token protection with triple-gate:

```typescript
const isDevTokensAllowed = isDevelopment && ALLOW_DEV_TOKENS && !isProduction;
```

This ensures dev tokens are ONLY available when ALL conditions are met:
1. `NODE_ENV !== 'production'`
2. `ALLOW_DEV_TOKENS=true` explicitly set
3. No production indicators detected

### 2.3 Production Required Variables

Added `PORTAL_JWT_SECRET` to required production variables.

### 2.4 Disabled Dangerous Defaults

Changed `server/.env.example`:
- `ALLOW_DEV_TOKENS=true` -> Commented out (disabled by default)

---

## 3. Required Environment Variables

### 3.1 Local Development

```bash
# REQUIRED
DATABASE_URL="postgresql://nabd:nabd_dev@localhost:5432/nabd_chain"
PORT=3001

# OPTIONAL (for dev features)
# ALLOW_DEV_TOKENS=true              # Enable dev login bypass
# PORTAL_ALLOW_SEED_ENDPOINT=true    # Enable admin seeding
```

### 3.2 Staging

```bash
# REQUIRED
DATABASE_URL="<staging-database-url>"
NODE_ENV=staging
CLERK_SECRET_KEY="<clerk-secret>"
ENCRYPTION_KEY="<64-char-hex>"
PORTAL_JWT_SECRET="<secure-random-string>"
GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-secret>"
GOOGLE_REDIRECT_URI="https://staging.nabdchain.com/api/auth/google/callback"
OUTLOOK_CLIENT_ID="<outlook-client-id>"
OUTLOOK_CLIENT_SECRET="<outlook-secret>"
OUTLOOK_REDIRECT_URI="https://staging.nabdchain.com/api/auth/outlook/callback"

# MUST BE FALSE/UNSET
# ALLOW_DEV_TOKENS - must NOT be set
# PORTAL_ALLOW_SEED_ENDPOINT - must NOT be set
```

### 3.3 Production

```bash
# REQUIRED
DATABASE_URL="<production-database-url>"
NODE_ENV=production
CLERK_SECRET_KEY="<clerk-secret>"
ENCRYPTION_KEY="<64-char-hex>"
PORTAL_JWT_SECRET="<secure-random-string>"
GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-secret>"
GOOGLE_REDIRECT_URI="https://app.nabdchain.com/api/auth/google/callback"
OUTLOOK_CLIENT_ID="<outlook-client-id>"
OUTLOOK_CLIENT_SECRET="<outlook-secret>"
OUTLOOK_REDIRECT_URI="https://app.nabdchain.com/api/auth/outlook/callback"

# BLOCKED BY RUNTIME VALIDATION
# ALLOW_DEV_TOKENS=true        -> Server will CRASH if set
# PORTAL_ALLOW_SEED_ENDPOINT=true -> Server will CRASH if set
```

---

## 4. Pre-Deployment Checklist

Before deploying to staging or production:

- [ ] `NODE_ENV` is set correctly (staging/production)
- [ ] `ALLOW_DEV_TOKENS` is NOT set or is `false`
- [ ] `PORTAL_ALLOW_SEED_ENDPOINT` is NOT set or is `false`
- [ ] `ENCRYPTION_KEY` is set (64-char hex)
- [ ] `PORTAL_JWT_SECRET` is set (secure random string)
- [ ] `CLERK_SECRET_KEY` is set
- [ ] All OAuth secrets are set (Google, Outlook)
- [ ] Database URL points to correct environment

---

## 5. Secret Rotation Preparation

The system is now prepared for safe secret rotation:

| Secret | How to Rotate |
|--------|---------------|
| `CLERK_SECRET_KEY` | Rotate in Clerk Dashboard, update env |
| `GOOGLE_CLIENT_SECRET` | Rotate in Google Cloud Console, update env |
| `OUTLOOK_CLIENT_SECRET` | Rotate in Azure Portal, update env |
| `GEMINI_API_KEY` | Rotate in Google AI Studio, update env |
| `ENCRYPTION_KEY` | Generate new: `openssl rand -hex 32`, update env |
| `PORTAL_JWT_SECRET` | Generate new: `openssl rand -base64 64`, update env |

See `docs/security/SECRETS_ROTATION_CHECKLIST.md` for detailed rotation procedures.

---

## 6. Files Modified

| File | Change |
|------|--------|
| `server/src/utils/env.ts` | Added production validation, blocked dangerous flags |
| `server/src/middleware/auth.ts` | Enhanced triple-gate protection for dev tokens |
| `server/.env.example` | Changed ALLOW_DEV_TOKENS default to disabled |

---

## 7. Verification Commands

```bash
# Verify no .env files in git
git ls-files | grep -E "\.env$" | grep -v example

# Test production validation (should fail)
NODE_ENV=production ALLOW_DEV_TOKENS=true pnpm dev
# Expected: Server crashes with "SECURITY VIOLATION" error

# Test development mode (should succeed)
ALLOW_DEV_TOKENS=true pnpm dev
# Expected: Server starts with dev tokens enabled
```

---

*Report generated: February 2026*
*No secrets were rotated - only system hardening applied.*
