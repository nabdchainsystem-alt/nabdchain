import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  captureError,
  captureMessage,
  getErrorBuffer,
  clearErrorBuffer,
  addBreadcrumb,
  getBreadcrumbs,
  withErrorTracking,
  tryCatch,
  initErrorTracking,
  setUser,
} from './errorTracking';

describe('errorTracking utility', () => {
  beforeEach(() => {
    // Reset the buffer and breadcrumbs before each test
    clearErrorBuffer();

    // Suppress console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  // ─── captureError ─────────────────────────────────────────────────

  describe('captureError', () => {
    it('adds an Error object to the error buffer', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureError(new Error('test error'));
      const buffer = getErrorBuffer();
      expect(buffer.length).toBeGreaterThanOrEqual(1);
      const found = buffer.find((r) => r.message === 'test error');
      expect(found).toBeDefined();
      expect(found!.severity).toBe('error');
    });

    it('converts a string to an Error and captures it', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureError('string error');
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'string error');
      expect(found).toBeDefined();
    });

    it('respects the severity option', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureError(new Error('warn level'), { severity: 'warning' });
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'warn level');
      expect(found).toBeDefined();
      expect(found!.severity).toBe('warning');
    });

    it('includes tags in the report', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureError(new Error('tagged'), { tags: { component: 'Header' } });
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'tagged');
      expect(found).toBeDefined();
      expect(found!.tags).toEqual({ component: 'Header' });
    });

    it('includes userId in the context when provided', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureError(new Error('user error'), { userId: 'u123' });
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'user error');
      expect(found).toBeDefined();
      expect(found!.context.userId).toBe('u123');
    });

    it('generates a fingerprint for the error', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureError(new Error('fingerprinted'));
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'fingerprinted');
      expect(found).toBeDefined();
      expect(found!.fingerprint).toBeDefined();
      expect(typeof found!.fingerprint).toBe('string');
      expect(found!.fingerprint!.length).toBeGreaterThan(0);
    });

    it('calls onError callback when configured', () => {
      const onError = vi.fn();
      initErrorTracking({ environment: 'test', sampleRate: 1, onError });
      clearErrorBuffer();
      captureError(new Error('callback test'));
      expect(onError).toHaveBeenCalled();
      const reportArg = onError.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (args: any[]) => args[0].message === 'callback test',
      );
      expect(reportArg).toBeDefined();
    });

    it('drops the report when beforeSend returns null', () => {
      const beforeSend = vi.fn().mockReturnValue(null);
      initErrorTracking({ environment: 'test', sampleRate: 1, beforeSend });
      clearErrorBuffer();
      captureError(new Error('should be dropped'));
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'should be dropped');
      expect(found).toBeUndefined();
    });
  });

  // ─── captureMessage ───────────────────────────────────────────────

  describe('captureMessage', () => {
    it('adds a message report to the buffer', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureMessage('hello info', 'info');
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'hello info');
      expect(found).toBeDefined();
      expect(found!.severity).toBe('info');
    });

    it('defaults to info severity', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureMessage('default severity');
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'default severity');
      expect(found).toBeDefined();
      expect(found!.severity).toBe('info');
    });

    it('includes extra data in the context', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureMessage('with extras', 'debug', { key: 'value' });
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'with extras');
      expect(found).toBeDefined();
      expect(found!.context.extra).toEqual({ key: 'value' });
    });
  });

  // ─── getErrorBuffer / clearErrorBuffer ────────────────────────────

  describe('getErrorBuffer / clearErrorBuffer', () => {
    it('returns a copy of the buffer (not the same reference)', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      clearErrorBuffer();
      captureMessage('test');
      const buf1 = getErrorBuffer();
      const buf2 = getErrorBuffer();
      expect(buf1).not.toBe(buf2);
      expect(buf1).toEqual(buf2);
    });

    it('clearErrorBuffer empties the buffer', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1 });
      captureMessage('to be cleared');
      expect(getErrorBuffer().length).toBeGreaterThan(0);
      clearErrorBuffer();
      expect(getErrorBuffer().length).toBe(0);
    });
  });

  // ─── addBreadcrumb / getBreadcrumbs ───────────────────────────────

  describe('addBreadcrumb / getBreadcrumbs', () => {
    it('adds a breadcrumb with message and timestamp', () => {
      addBreadcrumb('user clicked button');
      const crumbs = getBreadcrumbs();
      expect(crumbs.length).toBeGreaterThanOrEqual(1);
      const last = crumbs[crumbs.length - 1];
      expect(last.message).toBe('user clicked button');
      expect(last.timestamp).toBeGreaterThan(0);
    });

    it('includes optional data', () => {
      addBreadcrumb('navigation', { from: '/home', to: '/settings' });
      const crumbs = getBreadcrumbs();
      const last = crumbs[crumbs.length - 1];
      expect(last.data).toEqual({ from: '/home', to: '/settings' });
    });

    it('returns a copy of breadcrumbs (not the same reference)', () => {
      addBreadcrumb('test');
      const b1 = getBreadcrumbs();
      const b2 = getBreadcrumbs();
      expect(b1).not.toBe(b2);
    });
  });

  // ─── withErrorTracking ────────────────────────────────────────────

  describe('withErrorTracking', () => {
    it('wraps a sync function and captures errors', () => {
      initErrorTracking({ environment: 'test', sampleRate: 1, beforeSend: undefined, onError: undefined });
      clearErrorBuffer();
      const failing = () => {
        throw new Error('sync fail');
      };
      const wrapped = withErrorTracking(failing, 'syncFn');

      expect(() => wrapped()).toThrow('sync fail');
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'sync fail');
      expect(found).toBeDefined();
    });

    it('returns the result of a successful sync function', () => {
      const add = (a: number, b: number) => a + b;
      const wrapped = withErrorTracking(add, 'add');
      expect(wrapped(3, 4)).toBe(7);
    });

    it('wraps async functions and captures rejected promises', async () => {
      initErrorTracking({ environment: 'test', sampleRate: 1, beforeSend: undefined, onError: undefined });
      clearErrorBuffer();
      const asyncFailing = async () => {
        throw new Error('async fail');
      };
      const wrapped = withErrorTracking(asyncFailing, 'asyncFn');

      await expect(wrapped()).rejects.toThrow('async fail');
      const buffer = getErrorBuffer();
      const found = buffer.find((r) => r.message === 'async fail');
      expect(found).toBeDefined();
    });
  });

  // ─── tryCatch ─────────────────────────────────────────────────────

  describe('tryCatch', () => {
    it('returns the result on success', async () => {
      const result = await tryCatch(() => Promise.resolve(42), 0);
      expect(result).toBe(42);
    });

    it('returns the fallback on failure', async () => {
      const result = await tryCatch(() => Promise.reject(new Error('fail')), 'default');
      expect(result).toBe('default');
    });

    it('captures the error in the buffer when not silent', async () => {
      initErrorTracking({ environment: 'test', sampleRate: 1, beforeSend: undefined, onError: undefined });
      clearErrorBuffer();
      await tryCatch(() => Promise.reject(new Error('captured')), null);
      const buffer = getErrorBuffer();
      const hasIt = buffer.some((r) => r.message === 'captured');
      expect(hasIt).toBe(true);
    });

    it('does not capture the error when silent is true', async () => {
      initErrorTracking({ environment: 'test', sampleRate: 1, beforeSend: undefined, onError: undefined });
      clearErrorBuffer();
      await tryCatch(() => Promise.reject(new Error('silent')), null, { silent: true });
      const buffer = getErrorBuffer();
      const hasIt = buffer.some((r) => r.message === 'silent');
      expect(hasIt).toBe(false);
    });
  });

  // ─── setUser ──────────────────────────────────────────────────────

  describe('setUser', () => {
    it('sets a user id without throwing', () => {
      expect(() => setUser('user_123')).not.toThrow();
    });

    it('clears the user without throwing', () => {
      expect(() => setUser(null)).not.toThrow();
    });
  });
});
