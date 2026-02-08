import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the logger before importing lazyWithRetry
vi.mock('./logger', () => ({
  appLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { lazyWithRetry } from './lazyWithRetry';

// Create fresh sessionStorage mock for each test
function freshSessionStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(),
    key: vi.fn(),
    get length() {
      return Object.keys(store).length;
    },
    _store: store,
  };
}

describe('lazyWithRetry', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSS: any;
  const reloadMock = vi.fn();

  beforeEach(() => {
    mockSS = freshSessionStorageMock();
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSS,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
      configurable: true,
    });
    reloadMock.mockClear();
  });

  it('returns a lazy React component', () => {
    const DummyComponent = () => React.createElement('div', null, 'Hello');
    const LazyComp = lazyWithRetry(() => Promise.resolve({ default: DummyComponent }));
    // React.lazy returns an object with $$typeof symbol
    expect(LazyComp).toBeDefined();
    expect(typeof LazyComp).toBe('object');
  });

  it('successfully renders the lazy loaded component', async () => {
    const DummyComponent = () => React.createElement('div', { 'data-testid': 'lazy-content' }, 'Loaded');
    const LazyComp = lazyWithRetry(() => Promise.resolve({ default: DummyComponent }));

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', null, 'Loading...') },
        React.createElement(LazyComp, null),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('lazy-content')).toHaveTextContent('Loaded');
    });
  });

  it('clears the retry flag from sessionStorage on successful import', async () => {
    // Pre-set the retry flag
    mockSS._store['__lazy_retry__'] = '1';

    const DummyComponent = () => React.createElement('div', { 'data-testid': 'success' }, 'OK');
    const LazyComp = lazyWithRetry(() => Promise.resolve({ default: DummyComponent }));

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', null, 'Loading...') },
        React.createElement(LazyComp, null),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    expect(mockSS.removeItem).toHaveBeenCalledWith('__lazy_retry__');
  });

  it('calls window.location.reload on first chunk load error', async () => {
    const chunkError = new Error('Failed to fetch dynamically imported module /chunk.js');
    const importer = vi.fn().mockRejectedValue(chunkError);

    const LazyComp = lazyWithRetry(importer);

    // Suppress the error boundary console noise
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', null, 'Loading...') },
        React.createElement(LazyComp, null),
      ),
    );

    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalled();
    });

    expect(mockSS.setItem).toHaveBeenCalledWith('__lazy_retry__', '1');
  });

  it('does not reload if already retried (throws the error instead)', async () => {
    // Mark as already retried
    mockSS._store['__lazy_retry__'] = '1';

    const chunkError = new Error('Loading chunk failed');
    const importer = vi.fn().mockRejectedValue(chunkError);

    const LazyComp = lazyWithRetry(importer);

    // Suppress error output
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Wrapping in an ErrorBoundary to catch the thrown error
    let caughtError: Error | null = null;

    class TestErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
      state = { hasError: false };
      static getDerivedStateFromError(error: Error) {
        caughtError = error;
        return { hasError: true };
      }
      render() {
        if (this.state.hasError) return React.createElement('div', { 'data-testid': 'error-caught' }, 'Error');
        // @ts-expect-error React.Component props untyped without @types/react
        return this.props.children;
      }
    }

    render(
      React.createElement(
        TestErrorBoundary,
        null,
        React.createElement(
          Suspense,
          { fallback: React.createElement('div', null, 'Loading...') },
          React.createElement(LazyComp, null),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-caught')).toBeInTheDocument();
    });

    expect(reloadMock).not.toHaveBeenCalled();
    expect(caughtError).toBeDefined();
    expect(caughtError!.message).toBe('Loading chunk failed');
  });

  it('throws non-chunk errors without reloading', async () => {
    const regularError = new Error('Module not found');
    const importer = vi.fn().mockRejectedValue(regularError);

    const LazyComp = lazyWithRetry(importer);

    vi.spyOn(console, 'error').mockImplementation(() => {});

    let caughtError: Error | null = null;

    class TestErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
      state = { hasError: false };
      static getDerivedStateFromError(error: Error) {
        caughtError = error;
        return { hasError: true };
      }
      render() {
        if (this.state.hasError) return React.createElement('div', { 'data-testid': 'error-caught' }, 'Error');
        // @ts-expect-error React.Component props untyped without @types/react
        return this.props.children;
      }
    }

    render(
      React.createElement(
        TestErrorBoundary,
        null,
        React.createElement(
          Suspense,
          { fallback: React.createElement('div', null, 'Loading...') },
          React.createElement(LazyComp, null),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-caught')).toBeInTheDocument();
    });

    expect(reloadMock).not.toHaveBeenCalled();
    expect(caughtError).toBeDefined();
    expect(caughtError!.message).toBe('Module not found');
  });

  it('recognizes "Importing a module script failed" as a chunk error', async () => {
    const chunkError = new Error('Importing a module script failed');
    const importer = vi.fn().mockRejectedValue(chunkError);

    const LazyComp = lazyWithRetry(importer);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', null, 'Loading...') },
        React.createElement(LazyComp, null),
      ),
    );

    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  it('recognizes "ChunkLoadError" as a chunk error', async () => {
    const chunkError = new Error('ChunkLoadError: loading chunk 42 failed');
    const importer = vi.fn().mockRejectedValue(chunkError);

    const LazyComp = lazyWithRetry(importer);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', null, 'Loading...') },
        React.createElement(LazyComp, null),
      ),
    );

    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  it('does not treat non-Error objects with no message as chunk errors', async () => {
    // String rejection is not an Error with a message property
    const importer = vi.fn().mockRejectedValue('just a string');

    const LazyComp = lazyWithRetry(importer);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    class TestErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
      state = { hasError: false };
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      render() {
        if (this.state.hasError) return React.createElement('div', { 'data-testid': 'error-caught' }, 'Error');
        // @ts-expect-error React.Component props untyped without @types/react
        return this.props.children;
      }
    }

    render(
      React.createElement(
        TestErrorBoundary,
        null,
        React.createElement(
          Suspense,
          { fallback: React.createElement('div', null, 'Loading...') },
          React.createElement(LazyComp, null),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-caught')).toBeInTheDocument();
    });

    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('calls the importer only once on success', async () => {
    const DummyComponent = () => React.createElement('div', { 'data-testid': 'once' }, 'Once');
    const importer = vi.fn().mockResolvedValue({ default: DummyComponent });

    const LazyComp = lazyWithRetry(importer);

    render(
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', null, 'Loading...') },
        React.createElement(LazyComp, null),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('once')).toBeInTheDocument();
    });

    expect(importer).toHaveBeenCalledTimes(1);
  });
});
