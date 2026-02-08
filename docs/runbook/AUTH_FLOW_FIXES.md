# Portal Auth Flow Fixes

> **Date:** February 2026
> **Prompt:** Auth Flow Stabilization

---

## Summary

This document describes the fixes implemented to address portal authentication issues, specifically the "user disappears" problem where users would appear logged out unexpectedly.

---

## Root Causes Identified

### 1. Token-Only Validation
The frontend only checked if a token existed in localStorage (`isAuthenticated()`), not whether it was valid. Users with expired tokens appeared "authenticated" but all API calls would fail.

### 2. No Session Validation on Mount
The app never validated the session with the backend on load. If a token expired while the user was away, they'd see the app but nothing would work.

### 3. Silent API Failures
When `authenticatedFetch()` failed to refresh tokens, it just returned the 401 response. The UI didn't handle this gracefully - users saw broken functionality without understanding why.

### 4. No Proactive Token Refresh
Tokens were only refreshed reactively (after a 401), not proactively before expiration.

### 5. Token Expiration Not Checked Client-Side
JWTs contain an `exp` claim that can be decoded client-side, but this wasn't used.

---

## Fixes Implemented

### 1. Backend: `/me` Endpoint

Added `GET /api/auth/portal/me` endpoint for session validation.

**File:** `server/src/routes/portalAuthRoutes.ts`

```typescript
// Returns current user info and token expiration
{
  success: true,
  user: { id, email, name, portalRole, portalStatus },
  seller?: { id, displayName, slug, status, onboardingStep },
  buyer?: { id, companyName, status },
  tokenInfo: { expiresAt }
}
```

### 2. Client-Side Token Expiration Checking

**File:** `src/features/portal/services/portalAuthService.ts`

Added functions to decode JWT and check expiration:

```typescript
// Decode token to get exp claim
function decodeToken(token: string): { exp?: number } | null

// Check if token is expired
function isTokenExpired(bufferMs = 0): boolean

// Get time remaining until expiry
function getTokenTimeRemaining(): number

// Proactively refresh before expiry
async function ensureFreshToken(): Promise<boolean>
```

**Token Refresh Buffer:** 5 minutes before expiry, the token is proactively refreshed.

### 3. Session Validation on App Mount

**File:** `src/features/portal/PortalMarketplacePage.tsx`

The app now validates the session when it loads:

1. Shows "Validating session..." spinner
2. Calls `/me` endpoint to verify session
3. If valid, proceeds to portal
4. If expired, clears tokens and shows login
5. If network error but token not expired, allows offline access

### 4. Session Event System

Added a global event system for auth state changes:

```typescript
// Event types
type SessionEventType =
  | 'session_expired'      // Token expired, needs re-login
  | 'session_invalid'      // Token invalid/malformed
  | 'account_suspended'    // Account suspended by admin
  | 'service_unavailable'  // Backend/DB unavailable

// Subscribe to events
portalAuthService.onSessionEvent((event, message) => {
  // Handle session events globally
});
```

### 5. Global Auth Error Handler

**File:** `src/features/portal/PortalMarketplacePage.tsx`

Added `SessionErrorBanner` component that displays:
- Session expired warnings (amber banner)
- Account suspended errors (red banner)
- Service unavailable warnings (yellow banner)

### 6. Enhanced authenticatedFetch

The `authenticatedFetch()` function now:

1. Proactively refreshes tokens before they expire
2. Handles 401 responses with token refresh retry
3. Emits session events on final auth failures
4. Handles 403 (account suspended) and 503 (service unavailable)

---

## New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/portal/me` | GET | Validate session and return user info |

---

## New Service Methods

| Method | Description |
|--------|-------------|
| `isTokenExpired()` | Check if access token is expired |
| `needsTokenRefresh()` | Check if token is close to expiry |
| `getTokenTimeRemaining()` | Get milliseconds until token expires |
| `validateSession()` | Call `/me` to validate session with backend |
| `onSessionEvent()` | Subscribe to session events (returns unsubscribe fn) |
| `logoutWithReason()` | Clear tokens and emit session event |

---

## UI Changes

### Loading State
When the app loads with stored tokens, it shows a "Validating session..." spinner while checking with the backend.

### Session Error Banner
A dismissible banner appears at the top of the screen when session issues occur:

- **Amber:** Session expired, please log in again
- **Red:** Account suspended, contact support
- **Yellow:** Service temporarily unavailable

---

## Token Specifications

| Token | TTL | Contents |
|-------|-----|----------|
| Access Token | 12 hours | userId, email, portalRole, sellerId/buyerId |
| Refresh Token | 30 days | userId, email, jti (for revocation) |

### Refresh Strategy

1. Tokens refresh proactively 5 minutes before expiry
2. On 401 response, attempt refresh and retry once
3. If refresh fails, emit `session_expired` event
4. Clear stored tokens and redirect to login

---

## Admin Visibility

The admin portal (`/portal/admin`) provides visibility into:

- **User List:** All portal users with search, filters, pagination
- **User Details:** View/edit individual users
- **Role Management:** Change user roles (buyer/seller/admin/staff)
- **Status Management:** Activate/suspend accounts
- **Password Reset:** Generate temporary passwords
- **Audit Logs:** Track all admin actions

Access the admin portal by:
1. Log in with an admin account
2. Set `portal_type=admin` in localStorage
3. Navigate to the portal marketplace

---

## Migration Notes

### For Existing Users

No action required. Existing tokens will continue to work. On next refresh:
- Valid tokens: Continue working
- Expired access tokens: Auto-refresh if refresh token valid
- Expired refresh tokens: Redirect to login with "session expired" message

### For Developers

1. Use `authenticatedFetch()` for all authenticated API calls
2. Subscribe to session events for custom handling:
   ```typescript
   const unsubscribe = portalAuthService.onSessionEvent((event, message) => {
     console.log(`Session event: ${event} - ${message}`);
   });
   ```
3. Use `validateSession()` to check session validity
4. Token expiration is checked client-side before API calls

---

## Verification Checklist

- [ ] User can log in successfully
- [ ] Session persists across page refreshes
- [ ] Expired tokens show "session expired" message
- [ ] Proactive token refresh works before expiry
- [ ] 401 responses trigger token refresh and retry
- [ ] Account suspension shows appropriate error
- [ ] DB unavailability shows service unavailable message
- [ ] Admin can view/manage users
- [ ] Audit logs capture admin actions

---

*See also: [PORTAL_AUTH_MIGRATION.md](./PORTAL_AUTH_MIGRATION.md)*
