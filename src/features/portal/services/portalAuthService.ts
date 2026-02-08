// =============================================================================
// Portal Authentication Service (Frontend)
// Handles API calls for Buyer and Seller authentication
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Token refresh buffer - refresh tokens when they have less than this time remaining
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface BuyerSignupData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
}

export interface SellerSignupData {
  fullName: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
  portalType: 'buyer' | 'seller';
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    portalRole: string;
  };
  buyer?: {
    id: string;
    companyName: string;
    status: string;
  };
  seller?: {
    id: string;
    displayName: string;
    slug: string;
    status: string;
    onboardingStep: number;
  };
  accessToken?: string;
  refreshToken?: string;
  redirectTo?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionInfo {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    portalRole: string;
    portalStatus: string;
  };
  seller?: {
    id: string;
    displayName: string;
    slug: string;
    status: string;
    onboardingStep: number;
  };
  buyer?: {
    id: string;
    companyName: string;
    status: string;
  };
  tokenInfo?: {
    expiresAt: number | null;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface OnboardingState {
  sellerId: string;
  status: string;
  onboardingStep: number;
  completedSteps: number[];
  stepData: {
    step1?: Record<string, unknown>;
    step2?: Record<string, unknown>;
    step3?: Record<string, unknown>;
    step4?: Record<string, unknown>;
    step5?: Record<string, unknown>;
    step6?: Record<string, unknown>;
  };
}

// Session event types for global handling
export type SessionEventType = 'session_expired' | 'session_invalid' | 'account_suspended' | 'service_unavailable';

// Session event listeners
const sessionEventListeners: ((event: SessionEventType, message: string) => void)[] = [];

// -----------------------------------------------------------------------------
// Session Event Handling
// -----------------------------------------------------------------------------

/**
 * Emit a session event to all listeners
 */
function emitSessionEvent(event: SessionEventType, message: string) {
  sessionEventListeners.forEach((listener) => {
    try {
      listener(event, message);
    } catch (e) {
      console.error('[PortalAuth] Error in session event listener:', e);
    }
  });
}

// -----------------------------------------------------------------------------
// Token Management
// -----------------------------------------------------------------------------

/**
 * Decode a JWT token without verification (for client-side expiry check)
 * WARNING: Never trust the contents for security - always verify on server
 */
function decodeToken(token: string): { exp?: number; userId?: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Handle base64url encoding
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
 * Check if the current access token is expired or about to expire
 */
function isTokenExpired(bufferMs = 0): boolean {
  const token = localStorage.getItem('portal_access_token');
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const now = Date.now();

  return now >= expiryTime - bufferMs;
}

/**
 * Get time until token expires in milliseconds
 */
function getTokenTimeRemaining(): number {
  const token = localStorage.getItem('portal_access_token');
  if (!token) return 0;

  const decoded = decodeToken(token);
  if (!decoded?.exp) return 0;

  const expiryTime = decoded.exp * 1000;
  const remaining = expiryTime - Date.now();

  return Math.max(0, remaining);
}

/**
 * Get authorization headers with JWT token
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('portal_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
      // Refresh token is invalid or expired
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
 * Proactively refresh token if it's close to expiring
 */
async function ensureFreshToken(): Promise<boolean> {
  // If token is about to expire within buffer time, refresh it
  if (isTokenExpired(TOKEN_REFRESH_BUFFER_MS)) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      // Check if it's actually expired (not just close to expiry)
      if (isTokenExpired(0)) {
        emitSessionEvent('session_expired', 'Your session has expired. Please log in again.');
        return false;
      }
    }
    return refreshed;
  }
  return true;
}

/**
 * Make an authenticated API call with automatic token refresh
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Proactively refresh token if needed
  await ensureFreshToken();

  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  let response = await fetch(url, { ...options, headers });

  // Handle different error codes
  if (response.status === 401) {
    // Try to refresh token and retry once
    const refreshed = await refreshToken();
    if (refreshed) {
      const newHeaders = {
        ...getAuthHeaders(),
        ...options.headers,
      };
      response = await fetch(url, { ...options, headers: newHeaders });

      // If still 401 after refresh, session is truly expired
      if (response.status === 401) {
        emitSessionEvent('session_expired', 'Your session has expired. Please log in again.');
      }
    } else {
      emitSessionEvent('session_expired', 'Your session has expired. Please log in again.');
    }
  } else if (response.status === 403) {
    // Check if account is suspended
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

  return response;
}

// -----------------------------------------------------------------------------
// API Functions
// -----------------------------------------------------------------------------

export const portalAuthService = {
  /**
   * Sign up as a buyer
   */
  async signupBuyer(data: BuyerSignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/portal/buyer/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  /**
   * Sign up as a seller
   */
  async signupSeller(data: SellerSignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/portal/seller/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  /**
   * Login to portal
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/portal/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  /**
   * Check if email is available
   */
  async checkEmail(email: string): Promise<{ success: boolean; available: boolean }> {
    const response = await fetch(`${API_BASE}/api/auth/portal/check-email?email=${encodeURIComponent(email)}`);
    return response.json();
  },

  /**
   * Get seller onboarding state
   * Now uses JWT authentication instead of x-user-id header
   */
  async getOnboardingState(_userId?: string): Promise<{ success: boolean; data?: OnboardingState }> {
    const response = await authenticatedFetch(`${API_BASE}/api/auth/portal/seller/onboarding`);
    return response.json();
  },

  /**
   * Save onboarding step data
   * Now uses JWT authentication instead of x-user-id header
   */
  async saveOnboardingStep(
    _userId: string,
    stepId: number,
    stepData: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    completedSteps?: number[];
    currentStep?: number;
    error?: { code: string; message: string };
  }> {
    const response = await authenticatedFetch(`${API_BASE}/api/auth/portal/seller/onboarding/step/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(stepData),
    });
    return response.json();
  },

  /**
   * Submit seller onboarding for review
   * Now uses JWT authentication instead of x-user-id header
   */
  async submitOnboarding(
    _userId?: string,
  ): Promise<{ success: boolean; message?: string; redirectTo?: string; error?: { code: string; message: string } }> {
    const response = await authenticatedFetch(`${API_BASE}/api/auth/portal/seller/onboarding/submit`, {
      method: 'POST',
    });
    return response.json();
  },

  /**
   * Store auth tokens in localStorage
   */
  storeAuthTokens(
    tokens: { accessToken: string; refreshToken: string },
    portalType: 'buyer' | 'seller',
    userId: string,
    userEmail?: string,
    userName?: string,
  ) {
    localStorage.setItem('portal_access_token', tokens.accessToken);
    localStorage.setItem('portal_refresh_token', tokens.refreshToken);
    localStorage.setItem('portal_type', portalType);
    localStorage.setItem('portal_user_id', userId);
    localStorage.setItem('nabd_dev_mode', 'true');
    localStorage.setItem('mock_auth_token', tokens.accessToken);
    if (userEmail) {
      localStorage.setItem('portal_user_email', userEmail);
    }
    if (userName) {
      localStorage.setItem('portal_user_name', userName);
    }
  },

  /**
   * Clear auth tokens from localStorage
   */
  clearAuthTokens() {
    localStorage.removeItem('portal_access_token');
    localStorage.removeItem('portal_refresh_token');
    localStorage.removeItem('portal_type');
    localStorage.removeItem('portal_user_id');
    localStorage.removeItem('portal_user_email');
    localStorage.removeItem('portal_user_name');
    localStorage.removeItem('nabd_dev_mode');
    localStorage.removeItem('mock_auth_token');
  },

  /**
   * Get stored auth info
   */
  getStoredAuth(): { accessToken: string | null; portalType: string | null; userId: string | null } {
    return {
      accessToken: localStorage.getItem('portal_access_token'),
      portalType: localStorage.getItem('portal_type'),
      userId: localStorage.getItem('portal_user_id'),
    };
  },

  /**
   * Check if user is authenticated (has token in storage)
   * NOTE: This only checks localStorage, not token validity.
   * Use validateSession() for full validation.
   */
  isAuthenticated(): boolean {
    const hasPortalToken = !!localStorage.getItem('portal_access_token');
    const hasMockToken = !!localStorage.getItem('mock_auth_token');
    const isDevMode = localStorage.getItem('nabd_dev_mode') === 'true';
    return hasPortalToken || (hasMockToken && isDevMode);
  },

  /**
   * Check if the current token is expired
   */
  isTokenExpired(): boolean {
    return isTokenExpired(0);
  },

  /**
   * Check if the token needs refresh (close to expiry)
   */
  needsTokenRefresh(): boolean {
    return isTokenExpired(TOKEN_REFRESH_BUFFER_MS);
  },

  /**
   * Get time until token expires in milliseconds
   */
  getTokenTimeRemaining(): number {
    return getTokenTimeRemaining();
  },

  /**
   * Refresh the access token
   * Returns true if refresh was successful, false otherwise
   */
  async refreshAccessToken(): Promise<boolean> {
    return refreshToken();
  },

  /**
   * Validate the current session with the backend
   * This is the most reliable way to check if the user is truly authenticated
   */
  async validateSession(): Promise<SessionInfo> {
    const token = localStorage.getItem('portal_access_token');
    const mockToken = localStorage.getItem('mock_auth_token');
    const isDevMode = localStorage.getItem('nabd_dev_mode') === 'true';

    // In dev mode, return a mock session that supports both roles for quick switching
    // This allows seamless buyer/seller switching without backend validation
    if (isDevMode && (token || mockToken)) {
      const portalType = localStorage.getItem('portal_type') || 'buyer';
      const userEmail = localStorage.getItem('portal_user_email') || 'user@nabdchain.com';
      const userName = localStorage.getItem('portal_user_name') || 'Mock User';
      const userId = localStorage.getItem('portal_user_id') || 'mock-user-id';
      return {
        success: true,
        user: {
          id: userId,
          email: userEmail,
          name: userName,
          portalRole: portalType,
          portalStatus: 'active',
        },
        buyer:
          portalType === 'buyer'
            ? {
                id: `${userId}-buyer`,
                companyName: 'Mock Company',
                status: 'active',
              }
            : undefined,
        seller:
          portalType === 'seller'
            ? {
                id: `${userId}-seller`,
                displayName: userName,
                slug: 'mock-seller',
                status: 'active',
                onboardingStep: 6,
              }
            : undefined,
      };
    }

    if (!token) {
      return {
        success: false,
        error: { code: 'NO_TOKEN', message: 'No access token found' },
      };
    }

    // Check if token is obviously expired before making the call
    if (isTokenExpired(0)) {
      // Try to refresh first
      const refreshed = await refreshToken();
      if (!refreshed) {
        return {
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Session expired' },
        };
      }
    }

    try {
      const response = await authenticatedFetch(`${API_BASE}/api/auth/portal/me`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.error || { code: 'VALIDATION_FAILED', message: 'Session validation failed' },
        };
      }

      return await response.json();
    } catch (_error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to validate session' },
      };
    }
  },

  /**
   * Subscribe to session events (expiry, suspension, etc.)
   * Returns an unsubscribe function
   */
  onSessionEvent(listener: (event: SessionEventType, message: string) => void): () => void {
    sessionEventListeners.push(listener);
    return () => {
      const index = sessionEventListeners.indexOf(listener);
      if (index > -1) {
        sessionEventListeners.splice(index, 1);
      }
    };
  },

  /**
   * Logout - clear all auth tokens
   */
  logout() {
    this.clearAuthTokens();
  },

  /**
   * Logout with reason - clears tokens and emits event
   */
  logoutWithReason(reason: SessionEventType, message: string) {
    this.clearAuthTokens();
    emitSessionEvent(reason, message);
  },
};

export default portalAuthService;
