import { describe, it, expect, vi, beforeEach } from 'vitest';
import { portalAuthService } from './portalAuthService';

// Use a real in-memory store that the service can interact with
let store: Record<string, string> = {};

const getItemSpy = vi.fn((key: string) => store[key] ?? null);
const setItemSpy = vi.fn((key: string, value: string) => {
  store[key] = value;
});
const removeItemSpy = vi.fn((key: string) => {
  delete store[key];
});
const clearSpy = vi.fn(() => {
  store = {};
});

function mockFetchOk(data: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

describe('portalAuthService', () => {
  beforeEach(() => {
    store = {};
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
    getItemSpy.mockClear();
    setItemSpy.mockClear();
    removeItemSpy.mockClear();
    clearSpy.mockClear();
    // Re-assign implementations after mockClear
    getItemSpy.mockImplementation((key: string) => store[key] ?? null);
    setItemSpy.mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
    removeItemSpy.mockImplementation((key: string) => {
      delete store[key];
    });
    clearSpy.mockImplementation(() => {
      store = {};
    });
    // Override localStorage AFTER setup.ts beforeAll has run.
    // setup.ts replaces window.localStorage with a plain object of vi.fn() stubs,
    // so we must re-replace it here in beforeEach.
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: setItemSpy,
        removeItem: removeItemSpy,
        clear: clearSpy,
        length: 0,
        key: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  // ---------------------------------------------------------------------------
  // Signup
  // ---------------------------------------------------------------------------

  describe('signupBuyer', () => {
    it('sends buyer signup data to correct endpoint', async () => {
      const signupData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'secure123',
        companyName: 'Acme Inc',
      };
      const authResponse = { success: true, user: { id: 'u-1' }, accessToken: 'tok' };
      mockFetchOk(authResponse);

      const result = await portalAuthService.signupBuyer(signupData);
      expect(result).toEqual(authResponse);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/auth/portal/buyer/signup');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(opts.body)).toEqual(signupData);
    });
  });

  describe('signupSeller', () => {
    it('sends seller signup data to correct endpoint', async () => {
      const signupData = {
        fullName: 'Jane Seller',
        email: 'jane@shop.com',
        password: 'secure456',
        displayName: 'Jane Shop',
      };
      mockFetchOk({ success: true });

      await portalAuthService.signupSeller(signupData);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/auth/portal/seller/signup');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(signupData);
    });
  });

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  describe('login', () => {
    it('sends credentials to login endpoint', async () => {
      const loginData = { email: 'user@test.com', password: 'pass', portalType: 'buyer' as const };
      const response = { success: true, accessToken: 'access-tok', refreshToken: 'refresh-tok' };
      mockFetchOk(response);

      const result = await portalAuthService.login(loginData);
      expect(result).toEqual(response);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/auth/portal/login');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(loginData);
    });

    it('returns error response without throwing', async () => {
      const errorResp = { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Wrong password' } };
      mockFetchOk(errorResp);

      const result = await portalAuthService.login({
        email: 'user@test.com',
        password: 'wrong',
        portalType: 'seller',
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });
  });

  // ---------------------------------------------------------------------------
  // Email Check
  // ---------------------------------------------------------------------------

  describe('checkEmail', () => {
    it('checks email availability via GET', async () => {
      mockFetchOk({ success: true, available: true });
      const result = await portalAuthService.checkEmail('new@example.com');

      expect(result.available).toBe(true);
      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/auth/portal/check-email');
      expect(url).toContain('email=new%40example.com');
    });

    it('returns unavailable for existing email', async () => {
      mockFetchOk({ success: true, available: false });
      const result = await portalAuthService.checkEmail('taken@example.com');
      expect(result.available).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Token Management
  // ---------------------------------------------------------------------------

  describe('storeAuthTokens', () => {
    it('stores tokens and user info in localStorage', () => {
      portalAuthService.storeAuthTokens(
        { accessToken: 'at', refreshToken: 'rt' },
        'buyer',
        'user-123',
        'user@test.com',
        'Test User',
      );

      expect(setItemSpy).toHaveBeenCalledWith('portal_access_token', 'at');
      expect(setItemSpy).toHaveBeenCalledWith('portal_refresh_token', 'rt');
      expect(setItemSpy).toHaveBeenCalledWith('portal_type', 'buyer');
      expect(setItemSpy).toHaveBeenCalledWith('portal_user_id', 'user-123');
      expect(setItemSpy).toHaveBeenCalledWith('portal_user_email', 'user@test.com');
      expect(setItemSpy).toHaveBeenCalledWith('portal_user_name', 'Test User');
    });
  });

  describe('clearAuthTokens', () => {
    it('removes all portal auth keys from localStorage', () => {
      portalAuthService.clearAuthTokens();

      expect(removeItemSpy).toHaveBeenCalledWith('portal_access_token');
      expect(removeItemSpy).toHaveBeenCalledWith('portal_refresh_token');
      expect(removeItemSpy).toHaveBeenCalledWith('portal_type');
      expect(removeItemSpy).toHaveBeenCalledWith('portal_user_id');
      expect(removeItemSpy).toHaveBeenCalledWith('portal_user_email');
      expect(removeItemSpy).toHaveBeenCalledWith('portal_user_name');
      expect(removeItemSpy).toHaveBeenCalledWith('nabd_dev_mode');
      expect(removeItemSpy).toHaveBeenCalledWith('mock_auth_token');
    });
  });

  describe('getStoredAuth', () => {
    it('returns stored auth info from localStorage', () => {
      getItemSpy.mockImplementation((key: string) => {
        const store: Record<string, string> = {
          portal_access_token: 'tok-123',
          portal_type: 'seller',
          portal_user_id: 'u-5',
        };
        return store[key] || null;
      });

      const auth = portalAuthService.getStoredAuth();
      expect(auth.accessToken).toBe('tok-123');
      expect(auth.portalType).toBe('seller');
      expect(auth.userId).toBe('u-5');
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when portal token exists', () => {
      getItemSpy.mockImplementation((key: string) => {
        if (key === 'portal_access_token') return 'some-token';
        return null;
      });
      expect(portalAuthService.isAuthenticated()).toBe(true);
    });

    it('returns true in dev mode with mock token', () => {
      getItemSpy.mockImplementation((key: string) => {
        if (key === 'mock_auth_token') return 'mock-tok';
        if (key === 'nabd_dev_mode') return 'true';
        return null;
      });
      expect(portalAuthService.isAuthenticated()).toBe(true);
    });

    it('returns false with no tokens', () => {
      getItemSpy.mockReturnValue(null);
      expect(portalAuthService.isAuthenticated()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Session Validation (dev mode)
  // ---------------------------------------------------------------------------

  describe('validateSession', () => {
    it('returns mock session in dev mode', async () => {
      getItemSpy.mockImplementation((key: string) => {
        const store: Record<string, string> = {
          nabd_dev_mode: 'true',
          portal_access_token: 'tok',
          portal_type: 'buyer',
          portal_user_email: 'dev@example.com',
          portal_user_name: 'Dev User',
          portal_user_id: 'dev-id',
        };
        return store[key] || null;
      });

      const session = await portalAuthService.validateSession();
      expect(session.success).toBe(true);
      expect(session.user?.email).toBe('dev@example.com');
      expect(session.user?.portalRole).toBe('buyer');
      expect(session.buyer).toBeDefined();
      expect(session.seller).toBeUndefined();
    });

    it('returns error when no token exists and not dev mode', async () => {
      getItemSpy.mockReturnValue(null);

      const session = await portalAuthService.validateSession();
      expect(session.success).toBe(false);
      expect(session.error?.code).toBe('NO_TOKEN');
    });
  });

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  describe('logout', () => {
    it('clears all auth tokens', () => {
      portalAuthService.logout();
      expect(removeItemSpy).toHaveBeenCalledWith('portal_access_token');
      expect(removeItemSpy).toHaveBeenCalledWith('portal_refresh_token');
    });
  });
});
