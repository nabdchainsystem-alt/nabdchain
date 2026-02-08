# ADR-001: Mock Auth Strategy with Clerk Abstraction Layer

**Status:** Accepted

**Date:** 2025-10

## Context

NABD uses Clerk as its production authentication provider. However, Clerk requires API keys and network access to function, which creates friction for local development:

- Developers need valid Clerk publishable keys to run the app locally.
- Offline development is impossible without mocking.
- CI pipelines and E2E tests need deterministic auth without external dependencies.
- New team members cannot onboard without obtaining Clerk credentials first.

The codebase has 100+ components that call `useAuth()`, `useUser()`, `useClerk()`, and render `<SignedIn>` / `<SignedOut>` guards. A solution must be transparent to all consumers.

## Decision

Introduce an **auth adapter layer** (`src/auth-adapter.tsx`) that re-exports all Clerk primitives through wrapper functions. Each wrapper checks a runtime flag (`VITE_USE_MOCK_AUTH=true` or `localStorage nabd_dev_mode`) and delegates to either real Clerk hooks or a `MockAuthProvider`.

The adapter exports these drop-in replacements:

| Adapter Export | Clerk Original |
|----------------|----------------|
| `AuthProvider` | `ClerkProvider` |
| `useAuth` | `useAuth` |
| `useUser` | `useClerkUser` |
| `useClerk` | `useClerk` |
| `useSignUp` | `useClerkSignUp` |
| `SignedIn` | `ClerkSignedIn` |
| `SignedOut` | `ClerkSignedOut` |
| `SignIn` | `ClerkSignIn` |
| `SignUp` | `ClerkSignUp` |
| `RedirectToSignIn` | `ClerkRedirectToSignIn` |

The `MockAuthProvider` (`src/features/auth/MockAuthProvider.tsx`) provides a hardcoded "Master Admin" user with a deterministic token (`mock-jwt-token-...`), and the server's auth middleware (`server/src/middleware/auth.ts`) accepts dev tokens when `ALLOW_DEV_TOKENS=true`.

### Key design choices

1. **Runtime flag, not build flag** -- `USE_MOCK_AUTH` is checked at render time so a single build can switch modes via environment variable or localStorage toggle.
2. **Same import path everywhere** -- All components import from `@/auth-adapter`, never from `@clerk/clerk-react` directly. This is the single point of indirection.
3. **Mock user mirrors Clerk shape** -- `MockAuthProvider` returns objects shaped like Clerk's `User` type so downstream code works unchanged.

## Consequences

### Positive

- Zero-config local development: `VITE_USE_MOCK_AUTH=true` is the only requirement.
- E2E tests (Playwright) run against mock auth with deterministic user sessions.
- No Clerk API calls during development, faster startup and no rate-limit concerns.
- Switching to a different auth provider (e.g., Auth0, Supabase Auth) only requires changing the adapter, not 100+ consumer files.

### Negative

- The mock path does not exercise real Clerk flows (MFA, email verification, session refresh). These must be tested separately in staging.
- Two code paths exist in the adapter -- a bug in the mock path may not surface in production, and vice versa.
- The `ALLOW_DEV_TOKENS=true` server flag is a security risk if accidentally enabled in production. It must never be set outside local development.

### Mitigations

- CI pipeline asserts `ALLOW_DEV_TOKENS` is not set in the production build.
- The mock sign-in UI displays a prominent "Developer Access" label to make the mode visually obvious.

## Related Files

- `src/auth-adapter.tsx` -- adapter layer
- `src/features/auth/MockAuthProvider.tsx` -- mock implementation
- `server/src/middleware/auth.ts` -- server-side token validation
- `.env.example` -- `VITE_USE_MOCK_AUTH` documentation
