// =============================================================================
// Portal Authentication Service (Frontend)
// Handles API calls for Buyer and Seller authentication
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export interface OnboardingState {
  sellerId: string;
  status: string;
  onboardingStep: number;
  completedSteps: number[];
  stepData: {
    step1?: any;
    step2?: any;
    step3?: any;
    step4?: any;
    step5?: any;
    step6?: any;
  };
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
   */
  async getOnboardingState(userId: string): Promise<{ success: boolean; data?: OnboardingState }> {
    const response = await fetch(`${API_BASE}/api/auth/portal/seller/onboarding`, {
      headers: {
        'x-user-id': userId,
      },
    });
    return response.json();
  },

  /**
   * Save onboarding step data
   */
  async saveOnboardingStep(
    userId: string,
    stepId: number,
    stepData: Record<string, unknown>
  ): Promise<{ success: boolean; completedSteps?: number[]; currentStep?: number; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/api/auth/portal/seller/onboarding/step/${stepId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(stepData),
    });
    return response.json();
  },

  /**
   * Submit seller onboarding for review
   */
  async submitOnboarding(userId: string): Promise<{ success: boolean; message?: string; redirectTo?: string; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/api/auth/portal/seller/onboarding/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
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
    userName?: string
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
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('portal_access_token');
  },
};

export default portalAuthService;
