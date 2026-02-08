import { Page } from '@playwright/test';

/**
 * E2E auth helpers for the NABD Chain System.
 *
 * The app supports mock authentication when VITE_USE_MOCK_AUTH=true.
 * MockAuthProvider reads `mock_auth_token` and `nabd_dev_mode` from
 * localStorage to determine auth state.
 *
 * These helpers inject the correct localStorage values before navigation
 * so the app boots directly into the authenticated state.
 */

/** Available mock user tokens recognised by MockAuthProvider. */
export const MOCK_TOKENS = {
  master: 'master-token',
  dev: 'dev-token',
  google: 'google-token',
  sam: 'sam-token',
  buyer: 'buyer-portal-token',
  seller: 'seller-portal-token',
} as const;

export type MockRole = keyof typeof MOCK_TOKENS;

/**
 * Injects localStorage entries so that MockAuthProvider treats the
 * session as already authenticated.
 *
 * Must be called **before** `page.goto()` so the React app picks up
 * the values on its initial render.  Because `localStorage` can only
 * be set once the page has a document, we navigate to `about:blank`
 * (same-origin policy is satisfied after the first real navigation),
 * set the values, and then let the caller navigate to the desired URL.
 *
 * Usage:
 * ```ts
 * await loginAsMockUser(page, 'master');
 * await page.goto('/');
 * ```
 */
export async function loginAsMockUser(page: Page, role: MockRole = 'master'): Promise<void> {
  // Navigate to the app origin so we can set localStorage on the correct domain
  await page.goto('/', { waitUntil: 'commit' });

  await page.evaluate(
    ({ token, role: r }) => {
      localStorage.setItem('mock_auth_token', token);
      localStorage.setItem('nabd_dev_mode', 'true');

      // For portal roles, also set portal_type
      if (r === 'buyer') {
        localStorage.setItem('portal_type', 'buyer');
      } else if (r === 'seller') {
        localStorage.setItem('portal_type', 'seller');
      }
    },
    { token: MOCK_TOKENS[role], role },
  );
}

/**
 * Convenience: inject mock-auth tokens for the buyer portal and reload.
 */
export async function loginAsBuyer(page: Page): Promise<void> {
  await loginAsMockUser(page, 'buyer');
  await page.goto('/');
}

/**
 * Convenience: inject mock-auth tokens for the seller portal and reload.
 */
export async function loginAsSeller(page: Page): Promise<void> {
  await loginAsMockUser(page, 'seller');
  await page.goto('/');
}

/**
 * Convenience: inject mock-auth tokens for the master admin and reload.
 */
export async function loginAsMaster(page: Page): Promise<void> {
  await loginAsMockUser(page, 'master');
  await page.goto('/');
}

/**
 * Clear all mock-auth related localStorage entries.
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('mock_auth_token');
    localStorage.removeItem('nabd_dev_mode');
    localStorage.removeItem('portal_type');
    localStorage.removeItem('portal_access_token');
    localStorage.removeItem('portal_user_id');
    localStorage.removeItem('portal_user_email');
    localStorage.removeItem('portal_user_name');
    localStorage.removeItem('seller_status');
    localStorage.removeItem('buyer-portal-page');
    localStorage.removeItem('seller-portal-page');
  });
}
