// =============================================================================
// Portal API Client
// =============================================================================
// Unified HTTP client for all portal API calls with:
// - Automatic Bearer token auth
// - Proactive token refresh
// - Retry-on-401 once
// - JSON error parsing
// - Base URL configuration
// =============================================================================

import { portalApiLogger } from '../../../utils/logger';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const DEV_LOGGING = import.meta.env.DEV; // Enable logging in development

// -----------------------------------------------------------------------------
// DEV Logging
// -----------------------------------------------------------------------------

function logApiCall(method: string, url: string, status: number, error?: string) {
  if (!DEV_LOGGING) return;
  const _timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const _statusColor = status >= 400 ? '\x1b[31m' : '\x1b[32m';
  portalApiLogger.debug(`${method.padEnd(6)} ${url} → ${status}${error ? ` | ${error}` : ''}`);
}

// Session event types
export type SessionEventType = 'session_expired' | 'session_invalid' | 'account_suspended' | 'service_unavailable';

// Session event listeners
const sessionEventListeners: ((event: SessionEventType, message: string) => void)[] = [];

// -----------------------------------------------------------------------------
// Token Utilities
// -----------------------------------------------------------------------------

/**
 * Decode a JWT token payload (client-side only, never trust for security)
 */
function decodeToken(token: string): { exp?: number; userId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if the access token is expired or about to expire
 */
function isTokenExpired(bufferMs = 0): boolean {
  const token = localStorage.getItem('portal_access_token');
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  const expiryTime = decoded.exp * 1000;
  return Date.now() >= expiryTime - bufferMs;
}

/**
 * Get the current access token
 */
function getAccessToken(): string | null {
  return localStorage.getItem('portal_access_token');
}

/**
 * Emit a session event to all listeners
 */
function emitSessionEvent(event: SessionEventType, message: string) {
  sessionEventListeners.forEach((listener) => {
    try {
      listener(event, message);
    } catch (e) {
      console.error('[PortalApiClient] Error in session event listener:', e);
    }
  });
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshToken(): Promise<boolean> {
  const storedRefreshToken = localStorage.getItem('portal_refresh_token');
  if (!storedRefreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/portal/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        emitSessionEvent('session_expired', 'Your session has expired. Please log in again.');
      }
      return false;
    }

    const data = await response.json();
    if (data.success && data.accessToken) {
      localStorage.setItem('portal_access_token', data.accessToken);
      localStorage.setItem('mock_auth_token', data.accessToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Ensure the token is fresh (refresh if about to expire)
 */
async function ensureFreshToken(): Promise<boolean> {
  if (isTokenExpired(TOKEN_REFRESH_BUFFER_MS)) {
    const refreshed = await refreshToken();
    if (!refreshed && isTokenExpired(0)) {
      emitSessionEvent('session_expired', 'Your session has expired. Please log in again.');
      return false;
    }
    return refreshed;
  }
  return true;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiError {
  error?: string;
  message?: string;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}

// -----------------------------------------------------------------------------
// Portal API Client
// -----------------------------------------------------------------------------

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Request body - will be JSON.stringified automatically */
  body?: unknown;
  /** Skip authentication (for public endpoints) */
  noAuth?: boolean;
  /** Skip automatic token refresh */
  skipRefresh?: boolean;
  /** Custom base URL override */
  baseUrl?: string;
}

/**
 * Make an authenticated API request with automatic token handling
 */
async function request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, noAuth, skipRefresh, baseUrl, headers: customHeaders, ...fetchOptions } = options;

  const url = `${baseUrl || API_BASE}${endpoint}`;

  // Ensure fresh token before request (unless skipped)
  if (!noAuth && !skipRefresh) {
    const tokenReady = await ensureFreshToken();
    if (!tokenReady) {
      // Token expired and refresh failed — try the request anyway
      // (the 401 retry handler below will attempt one more refresh)
      if (DEV_LOGGING) {
        portalApiLogger.debug(`Token not ready for ${endpoint}, proceeding anyway`);
      }
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Add auth header if not public
  if (!noAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (DEV_LOGGING) {
      portalApiLogger.debug(`No access token for authenticated request to ${endpoint}`);
    }
  }

  // Make the request
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle 401 - retry once after token refresh
  if (response.status === 401 && !noAuth) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401) {
        emitSessionEvent('session_expired', 'Your session has expired. Please log in again.');
      }
    } else {
      emitSessionEvent('session_expired', 'Your session has expired. Please log in again.');
    }
  }

  // Handle other status codes
  if (response.status === 403) {
    try {
      const data = await response.clone().json();
      if (data.error?.code === 'ACCOUNT_SUSPENDED') {
        emitSessionEvent('account_suspended', 'Your account has been suspended. Please contact support.');
      }
    } catch {
      // Ignore parse errors
    }
  } else if (response.status === 503) {
    emitSessionEvent('service_unavailable', 'Service temporarily unavailable. Please try again later.');
  }

  // Parse response
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    logApiCall(fetchOptions.method || 'GET', endpoint, response.status, errorMessage);
    throw new Error(errorMessage);
  }

  // Log successful request
  logApiCall(fetchOptions.method || 'GET', endpoint, response.status);

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// -----------------------------------------------------------------------------
// Convenience Methods
// -----------------------------------------------------------------------------

/**
 * GET request
 */
async function get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
async function post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request
 */
async function put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * PATCH request
 */
async function patch<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * DELETE request
 */
async function del<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'DELETE' });
}

// -----------------------------------------------------------------------------
// Session Event Subscription
// -----------------------------------------------------------------------------

/**
 * Subscribe to session events
 * Returns an unsubscribe function
 */
function onSessionEvent(listener: (event: SessionEventType, message: string) => void): () => void {
  sessionEventListeners.push(listener);
  return () => {
    const index = sessionEventListeners.indexOf(listener);
    if (index > -1) {
      sessionEventListeners.splice(index, 1);
    }
  };
}

// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

export const portalApiClient = {
  // Base request
  request,

  // Convenience methods
  get,
  post,
  put,
  patch,
  delete: del,

  // Session events
  onSessionEvent,

  // Token utilities (for components that need to check auth state)
  getAccessToken,
  isTokenExpired,
  ensureFreshToken,
  refreshToken,

  // Base URL for manual URL building
  baseUrl: API_BASE,
};

export default portalApiClient;
