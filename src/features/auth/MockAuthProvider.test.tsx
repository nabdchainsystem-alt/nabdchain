import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockAuthProvider, useMockAuthContext } from './MockAuthProvider';

// Helper to create a fresh localStorage mock with a backing store
function freshLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    get length() {
      return Object.keys(store).length;
    },
    _store: store,
  };
}

// Test consumer component that exposes the auth context
function AuthConsumer() {
  const auth = useMockAuthContext();
  return (
    <div>
      <span data-testid="is-loaded">{String(auth.isLoaded)}</span>
      <span data-testid="is-signed-in">{String(auth.isSignedIn)}</span>
      <span data-testid="user-id">{auth.userId ?? 'none'}</span>
      <span data-testid="user-name">{auth.user?.fullName ?? 'none'}</span>
      <span data-testid="user-email">{auth.user?.primaryEmailAddress?.emailAddress ?? 'none'}</span>
      <button data-testid="sign-in" onClick={auth.signIn}>
        Sign In
      </button>
      <button data-testid="login-google" onClick={auth.loginAsGoogle}>
        Google
      </button>
      <button data-testid="login-sam" onClick={auth.loginAsSam}>
        Sam
      </button>
      <button data-testid="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    </div>
  );
}

describe('MockAuthProvider', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLS: any;

  beforeEach(() => {
    mockLS = freshLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockLS,
      writable: true,
      configurable: true,
    });
    // Mock history.pushState and dispatchEvent to prevent errors during signOut
    vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  it('renders children', () => {
    render(
      <MockAuthProvider>
        <div data-testid="child">Hello</div>
      </MockAuthProvider>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('provides isLoaded as true', () => {
    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );
    expect(screen.getByTestId('is-loaded')).toHaveTextContent('true');
  });

  it('starts as signed out when no token is stored', () => {
    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );
    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('false');
    expect(screen.getByTestId('user-id')).toHaveTextContent('none');
  });

  it('signs in as master when signIn is called', async () => {
    const user = userEvent.setup();
    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );

    await user.click(screen.getByTestId('sign-in'));

    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');
    expect(screen.getByTestId('user-id')).toHaveTextContent('user_master_local_admin');
    expect(screen.getByTestId('user-email')).toHaveTextContent('master@nabd.com');
    expect(mockLS.setItem).toHaveBeenCalledWith('mock_auth_token', 'master-token');
  });

  it('signs in as Google user', async () => {
    const user = userEvent.setup();
    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );

    await user.click(screen.getByTestId('login-google'));

    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');
    expect(screen.getByTestId('user-id')).toHaveTextContent('user_google_simulated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('user@gmail.com');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Google User');
  });

  it('signs in as Sam', async () => {
    const user = userEvent.setup();
    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );

    await user.click(screen.getByTestId('login-sam'));

    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');
    expect(screen.getByTestId('user-id')).toHaveTextContent('user_sam_master');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Sam');
  });

  it('signs out and clears state', async () => {
    const user = userEvent.setup();

    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );

    // Sign in first
    await user.click(screen.getByTestId('sign-in'));
    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');

    // Sign out
    await user.click(screen.getByTestId('sign-out'));

    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('false');
    expect(screen.getByTestId('user-id')).toHaveTextContent('none');
    expect(mockLS.removeItem).toHaveBeenCalled();
  });

  it('auto-signs in when master-token is found in localStorage on mount', () => {
    mockLS._store['mock_auth_token'] = 'master-token';

    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );

    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');
    expect(screen.getByTestId('user-id')).toHaveTextContent('user_master_local_admin');
  });

  it('auto-signs in when google-token is found on mount', () => {
    mockLS._store['mock_auth_token'] = 'google-token';

    render(
      <MockAuthProvider>
        <AuthConsumer />
      </MockAuthProvider>,
    );

    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');
    expect(screen.getByTestId('user-id')).toHaveTextContent('user_google_simulated');
  });

  it('getToken returns the mock_auth_token from localStorage', async () => {
    mockLS._store['mock_auth_token'] = 'test-token';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const captured: { getToken: any } = { getToken: null };

    function TokenConsumer() {
      const auth = useMockAuthContext();
      captured.getToken = auth.getToken;
      return null;
    }

    render(
      <MockAuthProvider>
        <TokenConsumer />
      </MockAuthProvider>,
    );

    const token = await captured.getToken();
    expect(token).toBe('test-token');
  });

  it('getToken prefers portal_access_token over mock_auth_token', async () => {
    mockLS._store['portal_access_token'] = 'jwt-portal-token';
    mockLS._store['mock_auth_token'] = 'fallback-token';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const captured: { getToken: any } = { getToken: null };

    function TokenConsumer() {
      const auth = useMockAuthContext();
      captured.getToken = auth.getToken;
      return null;
    }

    render(
      <MockAuthProvider>
        <TokenConsumer />
      </MockAuthProvider>,
    );

    const token = await captured.getToken();
    expect(token).toBe('jwt-portal-token');
  });

  it('throws if useMockAuthContext is used outside of provider', () => {
    // Suppress the expected error output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadConsumer() {
      useMockAuthContext();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow('useMockAuthContext must be used within a MockAuthProvider');

    spy.mockRestore();
  });
});
