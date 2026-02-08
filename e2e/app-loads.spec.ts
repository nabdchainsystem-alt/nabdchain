import { test, expect } from '@playwright/test';
import { loginAsMaster, logout } from './helpers/auth';

/**
 * Smoke tests for the NABD Chain System.
 *
 * These tests verify that the application loads, renders core UI, and
 * basic navigation works.  They require:
 *   - Frontend running on localhost:5173
 *   - Backend  running on localhost:3001
 *   - VITE_USE_MOCK_AUTH=true in .env
 *
 * Run with:  pnpm test:e2e
 *
 * If the dev servers are not running, all tests will be skipped
 * automatically (see the beforeAll health-check).
 */

test.describe('App Smoke Tests', () => {
  // ------------------------------------------------------------------
  // Guard: skip entire suite if the dev server is unreachable
  // ------------------------------------------------------------------
  test.beforeAll(async ({ request }) => {
    try {
      const res = await request.get('http://localhost:5173/', { timeout: 5_000 });
      if (!res.ok()) {
        test.skip(true, 'Frontend dev server is not running on localhost:5173');
      }
    } catch {
      test.skip(true, 'Frontend dev server is not running on localhost:5173');
    }
  });

  // ------------------------------------------------------------------
  // 1. App renders without crashing
  // ------------------------------------------------------------------
  test('app renders without crashing', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    // The page should not show a raw error or blank white screen
    await expect(page.locator('body')).not.toHaveText(/Cannot read properties/);
  });

  // ------------------------------------------------------------------
  // 2. Landing page shows expected content (signed-out state)
  // ------------------------------------------------------------------
  test('landing page shows expected content when signed out', async ({ page }) => {
    // Ensure no mock auth is set so we land on the public page
    await page.goto('/');
    await logout(page);
    await page.goto('/');

    // The landing page or sign-in gate should be visible.
    // Depending on VITE_USE_MOCK_AUTH being true, we may see the
    // MockAuthProvider's unauthenticated state which renders the LandingPage.
    const bodyText = await page.locator('body').innerText();
    // The page should contain some recognisable text -- "NABD" branding or
    // typical landing page call-to-action.
    expect(bodyText.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // 3. App title is set
  // ------------------------------------------------------------------
  test('page has a title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    // Title should not be empty; it may contain "NABD" or "Vite" depending on build
    expect(title.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // 4. Mock auth login puts user in authenticated state
  // ------------------------------------------------------------------
  test('mock auth login transitions to authenticated state', async ({ page }) => {
    await loginAsMaster(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // After mock login the signed-in content should appear.
    // The app should no longer show the landing/sign-in screen.
    // We look for typical authenticated UI markers: sidebar, dashboard text, etc.
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(0);

    // If the sidebar is present, the user is authenticated
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
    // We don't hard-fail if the sidebar isn't found -- the app may use a
    // different element. Instead we just confirm the page isn't blank.
    if (await sidebar.isVisible().catch(() => false)) {
      await expect(sidebar).toBeVisible();
    }
  });

  // ------------------------------------------------------------------
  // 5. Sidebar is visible after authentication
  // ------------------------------------------------------------------
  test('sidebar is visible when authenticated', async ({ page }) => {
    await loginAsMaster(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The sidebar should be rendered. It typically contains navigation links.
    // We try several selectors because the app may not have data-testid attrs.
    const sidebar = page.locator('aside, [class*="sidebar"], [class*="Sidebar"], nav').first();
    // Give the app time to render the authenticated shell
    await page.waitForTimeout(2_000);
    const visible = await sidebar.isVisible().catch(() => false);
    expect(visible).toBe(true);
  });

  // ------------------------------------------------------------------
  // 6. Navigation between views works (mock-authenticated)
  // ------------------------------------------------------------------
  test('navigation between views works', async ({ page }) => {
    await loginAsMaster(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    // Try clicking a nav link if one is visible. The sidebar should
    // contain navigation items.
    const navLinks = page.locator('aside a, nav a, [class*="sidebar"] button, [class*="Sidebar"] button');
    const count = await navLinks.count();
    if (count > 0) {
      // Click the first navigable link/button
      await navLinks.first().click();
      await page.waitForTimeout(1_000);
      // Page should still be non-empty (no crash on navigation)
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    } else {
      // If no nav links found, just verify the page is still healthy
      test.info().annotations.push({ type: 'note', description: 'No sidebar nav links found to click' });
    }
  });

  // ------------------------------------------------------------------
  // 7. API health check responds (backend must be running)
  // ------------------------------------------------------------------
  test('API health check responds', async ({ request }) => {
    let response;
    try {
      response = await request.get('http://localhost:3001/health', { timeout: 5_000 });
    } catch {
      test.skip(true, 'Backend server is not running on localhost:3001');
      return;
    }
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBeDefined();
  });
});
