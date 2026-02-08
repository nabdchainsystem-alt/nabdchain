// =============================================================================
// Portal Token Service
// =============================================================================
// JWT-based token management for portal authentication.
// Handles signing, verification, and refresh tokens.
// =============================================================================

import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Configuration
// =============================================================================

const getJwtSecret = (): string => {
  const secret = process.env.PORTAL_JWT_SECRET;
  if (!secret) {
    // In development, use a fallback secret with a warning
    if (process.env.NODE_ENV !== 'production') {
      apiLogger.warn('[Portal Token] PORTAL_JWT_SECRET not set, using fallback for development');
      return 'dev-portal-jwt-secret-change-me-in-production';
    }
    throw new Error('PORTAL_JWT_SECRET environment variable is required in production');
  }
  return secret;
};

const JWT_CONFIG = {
  issuer: process.env.PORTAL_JWT_ISSUER || 'nabd-portal',
  audience: process.env.PORTAL_JWT_AUDIENCE || 'nabd-portal-users',
  accessTokenTTL: '12h' as const,  // 12 hours
  refreshTokenTTL: '30d' as const, // 30 days
};

// =============================================================================
// Types
// =============================================================================

export interface PortalTokenPayload {
  userId: string;
  email: string;
  portalRole: 'buyer' | 'seller' | 'admin' | 'staff';
  sellerId?: string;
  buyerId?: string;
}

export interface DecodedPortalToken extends JwtPayload, PortalTokenPayload {
  type: 'access' | 'refresh';
  exp?: number;
  iat?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

export interface VerifyResult {
  valid: boolean;
  payload?: DecodedPortalToken;
  error?: {
    code: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_MALFORMED' | 'SIGNATURE_INVALID';
    message: string;
  };
}

// =============================================================================
// Token Generation
// =============================================================================

/**
 * Sign a portal access token
 */
export function signPortalAccessToken(payload: PortalTokenPayload): string {
  const secret = getJwtSecret();

  const tokenPayload = {
    ...payload,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: JWT_CONFIG.accessTokenTTL,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: payload.userId,
  };

  return jwt.sign(tokenPayload, secret, options);
}

/**
 * Sign a portal refresh token
 */
export function signPortalRefreshToken(payload: PortalTokenPayload): string {
  const secret = getJwtSecret();

  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    type: 'refresh',
    // Refresh tokens include a random jti for revocation tracking
    jti: crypto.randomUUID(),
  };

  const options: SignOptions = {
    expiresIn: JWT_CONFIG.refreshTokenTTL,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: payload.userId,
  };

  return jwt.sign(tokenPayload, secret, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: PortalTokenPayload): TokenPair {
  const accessToken = signPortalAccessToken(payload);
  const refreshToken = signPortalRefreshToken(payload);

  // Calculate expiry in seconds (12 hours = 43200 seconds)
  const expiresIn = 12 * 60 * 60;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

// =============================================================================
// Token Verification
// =============================================================================

/**
 * Verify a portal token (access or refresh)
 */
export function verifyPortalToken(token: string, expectedType?: 'access' | 'refresh'): VerifyResult {
  const secret = getJwtSecret();

  const options: VerifyOptions = {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  };

  try {
    const decoded = jwt.verify(token, secret, options) as DecodedPortalToken;

    // Validate token type if specified
    if (expectedType && decoded.type !== expectedType) {
      return {
        valid: false,
        error: {
          code: 'TOKEN_INVALID',
          message: `Expected ${expectedType} token, got ${decoded.type}`,
        },
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      };
    }

    if (err instanceof jwt.JsonWebTokenError) {
      if (err.message.includes('signature')) {
        return {
          valid: false,
          error: {
            code: 'SIGNATURE_INVALID',
            message: 'Invalid token signature',
          },
        };
      }

      return {
        valid: false,
        error: {
          code: 'TOKEN_MALFORMED',
          message: 'Token is malformed',
        },
      };
    }

    return {
      valid: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Token verification failed',
      },
    };
  }
}

/**
 * Verify an access token specifically
 */
export function verifyAccessToken(token: string): VerifyResult {
  return verifyPortalToken(token, 'access');
}

/**
 * Verify a refresh token specifically
 */
export function verifyRefreshToken(token: string): VerifyResult {
  return verifyPortalToken(token, 'refresh');
}

/**
 * Decode a token without verification (for debugging/logging only)
 * WARNING: Do not use this for authentication - always use verify functions
 */
export function decodeTokenUnsafe(token: string): DecodedPortalToken | null {
  try {
    return jwt.decode(token) as DecodedPortalToken | null;
  } catch {
    return null;
  }
}

// =============================================================================
// Token Refresh
// =============================================================================

/**
 * Refresh an access token using a valid refresh token
 * Returns a new access token (refresh token remains the same)
 */
export async function refreshAccessToken(
  refreshToken: string,
  getUserData: (userId: string) => Promise<PortalTokenPayload | null>
): Promise<{
  success: boolean;
  accessToken?: string;
  error?: { code: string; message: string };
}> {
  const result = verifyRefreshToken(refreshToken);

  if (!result.valid || !result.payload) {
    return {
      success: false,
      error: result.error || { code: 'TOKEN_INVALID', message: 'Invalid refresh token' },
    };
  }

  // Get fresh user data to ensure user still exists and has correct permissions
  const userData = await getUserData(result.payload.userId);

  if (!userData) {
    return {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found or no longer has portal access',
      },
    };
  }

  // Generate new access token with fresh user data
  const accessToken = signPortalAccessToken(userData);

  return {
    success: true,
    accessToken,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>" format
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Check if ALLOW_LEGACY_PORTAL_AUTH is enabled
 * Used for backwards compatibility with x-user-id header
 */
export function isLegacyAuthAllowed(): boolean {
  const allowLegacy = process.env.ALLOW_LEGACY_PORTAL_AUTH;
  return allowLegacy === 'true' || allowLegacy === '1';
}

export default {
  signPortalAccessToken,
  signPortalRefreshToken,
  generateTokenPair,
  verifyPortalToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeTokenUnsafe,
  refreshAccessToken,
  extractTokenFromHeader,
  isLegacyAuthAllowed,
};
