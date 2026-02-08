# Portal Authentication Migration Guide

> This document describes the migration from legacy `x-user-id` header authentication to JWT-based authentication for the portal system.

---

## Overview

The portal authentication system has been upgraded from an insecure header-based approach to proper JWT authentication. This migration provides:

- **Secure token-based authentication** with signed JWTs
- **Token expiration and refresh** (12h access / 30d refresh)
- **Account lockout protection** against brute-force attacks
- **Improved password hashing** (100,000 PBKDF2 iterations)
- **Role-based access control** (buyer, seller, admin, staff)

---

## Breaking Changes

### API Changes

1. **Protected endpoints now require JWT tokens**
   - All `/api/auth/portal/seller/onboarding*` routes
   - All `/api/portal-admin/*` routes

2. **Response format changes**
   - Login/signup now returns `{ accessToken, refreshToken, expiresIn, user, ... }`
   - Token refresh endpoint: `POST /api/auth/portal/refresh`

3. **Seed endpoint is now secured**
   - Requires `PORTAL_ALLOW_SEED_ENDPOINT=true`
   - Blocked in production (`NODE_ENV=production`)
   - Password returned via server logs only

### Authentication Header Format

**Before (Legacy):**
```
x-user-id: <userId>
```

**After (JWT):**
```
Authorization: Bearer <accessToken>
```

---

## Migration Steps

### Phase 1: Enable Legacy Support (Current)

During migration, both authentication methods are supported.

```bash
# server/.env
ALLOW_LEGACY_PORTAL_AUTH=true
```

This allows existing clients to continue working while new clients adopt JWT.

### Phase 2: Update Clients

1. **On Login/Signup**, store the returned tokens:
   ```typescript
   const result = await portalAuthService.login({ email, password, portalType });
   if (result.success) {
     portalAuthService.storeAuthTokens(
       { accessToken: result.accessToken!, refreshToken: result.refreshToken! },
       portalType,
       result.user!.id,
       result.user!.email
     );
   }
   ```

2. **On API calls**, use the stored JWT:
   ```typescript
   const token = localStorage.getItem('portal_access_token');
   fetch('/api/...', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   });
   ```

3. **Handle token expiration** by refreshing:
   ```typescript
   const response = await fetch('/api/auth/portal/refresh', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ refreshToken: localStorage.getItem('portal_refresh_token') })
   });
   const data = await response.json();
   if (data.success) {
     localStorage.setItem('portal_access_token', data.accessToken);
   }
   ```

### Phase 3: Disable Legacy Auth

Once all clients have migrated:

```bash
# server/.env
ALLOW_LEGACY_PORTAL_AUTH=false  # or remove the variable
```

This will reject all requests using the old `x-user-id` header.

---

## New Environment Variables

Add these to your `server/.env`:

```bash
# Required in production
PORTAL_JWT_SECRET=<generate-with-openssl-rand-base64-64>

# Optional (defaults provided)
PORTAL_JWT_ISSUER=nabd-portal
PORTAL_JWT_AUDIENCE=nabd-portal-users

# Migration support (disable once migration complete)
ALLOW_LEGACY_PORTAL_AUTH=true

# Development only (never enable in production)
PORTAL_ALLOW_SEED_ENDPOINT=true
```

### Generating a Secure JWT Secret

```bash
openssl rand -base64 64
```

---

## Token Specifications

| Token Type | Expiration | Contains |
|------------|------------|----------|
| Access Token | 12 hours | userId, email, portalRole, sellerId/buyerId |
| Refresh Token | 30 days | userId, email, jti (unique ID for revocation) |

### Token Payload (Access)

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "portalRole": "seller",
  "sellerId": "uuid",
  "type": "access",
  "iss": "nabd-portal",
  "aud": "nabd-portal-users",
  "sub": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Account Lockout

Failed login attempts are tracked:

| Setting | Value |
|---------|-------|
| Max Attempts | 10 |
| Window | 30 minutes |
| Lockout Duration | 15 minutes |

After 10 failed attempts within 30 minutes, the account is locked for 15 minutes.

---

## Password Hashing

Passwords are now hashed with:
- **Algorithm**: PBKDF2-SHA512
- **Iterations**: 100,000 (OWASP recommended)
- **Salt**: 32 bytes (random per password)
- **Hash length**: 64 bytes

Legacy passwords (v1, 1000 iterations) are automatically upgraded on next login.

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/portal/buyer/signup` | None | Create buyer account |
| POST | `/api/auth/portal/seller/signup` | None | Create seller account |
| POST | `/api/auth/portal/login` | None | Login (returns JWT) |
| POST | `/api/auth/portal/refresh` | None | Refresh access token |
| GET | `/api/auth/portal/check-email` | None | Check email availability |

### Seller Onboarding (Requires JWT)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/portal/seller/onboarding` | JWT | Get onboarding state |
| PUT | `/api/auth/portal/seller/onboarding/step/:id` | JWT | Save step data |
| POST | `/api/auth/portal/seller/onboarding/submit` | JWT | Submit for review |

### Admin (Requires JWT + Admin Role)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/portal-admin/me` | JWT (admin) | Get current admin info |
| GET | `/api/portal-admin/users` | JWT (admin) | List all users |
| GET | `/api/portal-admin/users/:id` | JWT (admin) | Get user details |
| PATCH | `/api/portal-admin/users/:id` | JWT (admin) | Update user |
| POST | `/api/portal-admin/users/:id/reset-password` | JWT (admin) | Reset password |
| GET | `/api/portal-admin/audit-logs` | JWT (admin) | Get audit logs |

---

## Troubleshooting

### "Token has expired" error

The access token has expired. Use the refresh token to get a new access token:

```typescript
const refreshed = await portalAuthService.refreshAccessToken();
if (!refreshed) {
  // Redirect to login
  portalAuthService.clearAuthTokens();
  window.location.href = '/portal/login';
}
```

### "Invalid token signature" error

The JWT secret may have changed, or the token was tampered with. Clear tokens and re-authenticate.

### "Account is locked" error

Too many failed login attempts. Wait 15 minutes or contact an admin.

### Legacy auth deprecation warnings

If you see warnings like `[Portal Auth] DEPRECATED: Using legacy x-user-id header`, update your client to use JWT authentication.

---

*Last updated: February 2026*
