# Secrets Rotation Checklist

> This document lists all secret keys found in the codebase that require rotation.
> **DO NOT add actual secret values to this file.**

---

## Required Rotations

The following secrets were found and should be rotated:

### Server Secrets (server/.env)

| Secret Key | Found In | Action Required |
|------------|----------|-----------------|
| `DATABASE_URL` | server/.env | Rotate database password if exposed |
| `CLERK_SECRET_KEY` | server/.env | Rotate in Clerk Dashboard |
| `ENCRYPTION_KEY` | server/.env | Generate new 64-char hex key |
| `GOOGLE_CLIENT_SECRET` | server/.env | Rotate in Google Cloud Console |
| `OUTLOOK_CLIENT_SECRET` | server/.env | Rotate in Azure Portal |
| `GEMINI_API_KEY` | server/.env | Rotate in Google AI Studio |

### Client Secrets (root .env)

| Secret Key | Found In | Action Required |
|------------|----------|-----------------|
| `VITE_GEMINI_API_KEY` | .env | **CRITICAL**: Remove from frontend, use backend proxy |
| `VITE_CLERK_PUBLISHABLE_KEY` | .env | Publishable keys are safe (public by design) |

---

## Rotation Steps by Provider

### 1. Clerk Authentication
1. Go to https://dashboard.clerk.com
2. Navigate to API Keys
3. Rotate the secret key
4. Update `CLERK_SECRET_KEY` in server/.env

### 2. Google OAuth (Gmail Integration)
1. Go to https://console.cloud.google.com
2. Navigate to APIs & Services > Credentials
3. Edit the OAuth 2.0 Client
4. Generate new client secret
5. Update `GOOGLE_CLIENT_SECRET` in server/.env

### 3. Microsoft/Outlook OAuth
1. Go to https://portal.azure.com
2. Navigate to App Registrations
3. Select your app > Certificates & secrets
4. Generate new client secret
5. Update `OUTLOOK_CLIENT_SECRET` in server/.env

### 4. Google Gemini AI
1. Go to https://makersuite.google.com/app/apikey
2. Delete compromised key
3. Generate new API key
4. Update `GEMINI_API_KEY` in server/.env only (NOT frontend)

### 5. Encryption Key
```bash
# Generate new 64-character hex key:
openssl rand -hex 32
```
Update `ENCRYPTION_KEY` in server/.env

---

## Security Notes

### CRITICAL: Gemini API Key Exposure

The `VITE_GEMINI_API_KEY` was exposed to the browser bundle. This is a security vulnerability because:
- Any user can extract the key from browser DevTools
- The key can be used to make API calls on your behalf
- Usage charges will be billed to your account

**Remediation**:
- The frontend now uses a backend proxy (`/api/ai/...`) for Gemini calls
- Remove `VITE_GEMINI_API_KEY` from root .env
- Only set `GEMINI_API_KEY` in server/.env

### Safe Keys (No Rotation Needed)

These keys are designed to be public:
- `VITE_CLERK_PUBLISHABLE_KEY` (pk_test_... or pk_live_...)
- `VITE_API_URL` (just a URL, not a secret)

---

## Post-Rotation Verification

After rotating all secrets:

1. Update local .env files
2. Update Render environment variables (production)
3. Update Vercel environment variables (frontend)
4. Restart all services
5. Test authentication flow
6. Test email integration (Google, Outlook)
7. Test AI features

---

*Last updated: February 2026*
