/**
 * Test Utilities
 * Helper functions for testing React components
 */
import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, Mock } from 'vitest';

// ============================================================================
// Custom Render with Providers
// ============================================================================

interface WrapperProps {
    children: ReactNode;
}

/**
 * Create a wrapper with all necessary providers
 */
function AllProviders({ children }: WrapperProps) {
    // Add your context providers here
    return <>{children}</>;
}

/**
 * Custom render function that includes providers
 */
function customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
    const user = userEvent.setup();
    return {
        user,
        ...render(ui, { wrapper: AllProviders, ...options }),
    };
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// ============================================================================
// Mock Factories
// ============================================================================

/**
 * Create a mock user
 */
export function createMockUser(overrides = {}) {
    return {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        workspaceId: 'workspace-123',
        ...overrides,
    };
}

/**
 * Create a mock board
 */
export function createMockBoard(overrides = {}) {
    return {
        id: 'board-123',
        name: 'Test Board',
        userId: 'user-123',
        workspaceId: 'workspace-123',
        columns: [],
        tasks: [],
        defaultView: 'table',
        availableViews: ['table', 'kanban'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock task
 */
export function createMockTask(overrides = {}) {
    return {
        id: 'task-123',
        name: 'Test Task',
        status: 'pending',
        priority: 'medium',
        dueDate: null,
        personId: null,
        ...overrides,
    };
}

/**
 * Create a mock workspace
 */
export function createMockWorkspace(overrides = {}) {
    return {
        id: 'workspace-123',
        name: 'Test Workspace',
        ownerId: 'user-123',
        icon: 'Briefcase',
        color: 'blue',
        ...overrides,
    };
}

// ============================================================================
// Mock API Helpers
// ============================================================================

/**
 * Create a mock fetch response
 */
export function mockFetchResponse<T>(data: T, status = 200): Mock {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
    });
}

/**
 * Create a mock fetch error
 */
export function mockFetchError(message: string, status = 500): Mock {
    return vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: () => Promise.resolve({ error: message }),
        text: () => Promise.resolve(message),
    });
}

/**
 * Create a mock network error
 */
export function mockNetworkError(): Mock {
    return vi.fn().mockRejectedValue(new Error('Network error'));
}

// ============================================================================
// Wait Helpers
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    { timeout = 5000, interval = 50 } = {}
): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        if (await condition()) return;
        await new Promise((r) => setTimeout(r, interval));
    }

    throw new Error('Timeout waiting for condition');
}

/**
 * Wait for a specific amount of time
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// DOM Helpers
// ============================================================================

/**
 * Get all text content from an element
 */
export function getTextContent(element: HTMLElement): string {
    return element.textContent?.trim() || '';
}

/**
 * Check if element is visible
 */
export function isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
    );
}

/**
 * Simulate window resize
 */
export function resizeWindow(width: number, height: number): void {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    window.dispatchEvent(new Event('resize'));
}

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Mock localStorage with data
 */
export function mockLocalStorage(data: Record<string, unknown>): void {
    const store: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
        store[key] = JSON.stringify(value);
    }

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        store[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
        delete store[key];
    });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
        Object.keys(store).forEach((key) => delete store[key]);
    });
}

// ============================================================================
// Accessibility Helpers
// ============================================================================

/**
 * Check if element has accessible name
 */
export function hasAccessibleName(element: HTMLElement): boolean {
    return !!(
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.getAttribute('title') ||
        element.textContent?.trim()
    );
}

/**
 * Get accessible name of element
 */
export function getAccessibleName(element: HTMLElement): string {
    return (
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.textContent?.trim() ||
        ''
    );
}
