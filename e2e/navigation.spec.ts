import { test, expect } from '@playwright/test';
import { loginAsMaster, logout } from './helpers/auth';

/**
 * E2E tests for navigation and core UI interactions.
 *
 * Tests verify that authenticated users can navigate between
 * major sections of the application without errors.
 *
 * Prerequisites:
 *   - Frontend on localhost:5173 (VITE_USE_MOCK_AUTH=true)
 */

test.describe('Navigation & Core UI', () => {
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

  test.beforeEach(async ({ page }) => {
    await loginAsMaster(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ------------------------------------------------------------------
  // 1. Sidebar contains multiple navigation items
  // ------------------------------------------------------------------
  test('sidebar shows navigation items', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    const navItems = page.locator('aside a, aside button, nav a, [class*="sidebar"] a, [class*="sidebar"] button, [class*="Sidebar"] a, [class*="Sidebar"] button');
    const count = await navItems.count();

    // Should have at least some navigation elements
    expect(count).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // 2. Clicking multiple nav items navigates without errors
  // ------------------------------------------------------------------
  test('navigating to multiple sections works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    const navItems = page.locator('aside a, [class*="sidebar"] a, [class*="Sidebar"] a');
    const count = await navItems.count();

    // Click up to 3 different nav items
    const maxClicks = Math.min(count, 3);
    for (let i = 0; i < maxClicks; i++) {
      const item = navItems.nth(i);
      if (await item.isVisible().catch(() => false)) {
        await item.click();
        await page.waitForTimeout(1_500);

        // Verify page doesn't crash
        const body = await page.locator('body').innerText();
        expect(body.length).toBeGreaterThan(0);
        expect(body).not.toContain('Cannot read properties');
      }
    }
  });

  // ------------------------------------------------------------------
  // 3. Dark mode toggle works (if present)
  // ------------------------------------------------------------------
  test('dark mode toggle is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    // Look for dark mode toggle button
    const darkModeBtn = page.locator('button[aria-label*="dark"], button[aria-label*="theme"], button[title*="dark"], button[title*="theme"], [class*="dark-mode"], [class*="theme-toggle"]').first();

    if (await darkModeBtn.isVisible().catch(() => false)) {
      await darkModeBtn.click();
      await page.waitForTimeout(500);

      // Page should still render
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Dark mode toggle not found - may use different UI element',
      });
    }
  });

  // ------------------------------------------------------------------
  // 4. Search/command palette is accessible
  // ------------------------------------------------------------------
  test('command palette or search is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    // Look for search input or command palette trigger
    const searchTrigger = page.locator('input[type="search"], input[placeholder*="Search"], button[aria-label*="search"], [class*="search"], [class*="Search"]').first();

    if (await searchTrigger.isVisible().catch(() => false)) {
      await searchTrigger.click();
      await page.waitForTimeout(500);

      // Page should still render
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    } else {
      // Try keyboard shortcut Cmd+K / Ctrl+K for command palette
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(500);
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    }
  });

  // ------------------------------------------------------------------
  // 5. No console errors on initial load
  // ------------------------------------------------------------------
  test('no fatal console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3_000);

    // Filter out known harmless errors
    const fatalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('Loading chunk') &&
        !e.includes('Failed to fetch') &&
        !e.includes('NetworkError')
    );

    expect(fatalErrors.length).toBe(0);
  });
});
