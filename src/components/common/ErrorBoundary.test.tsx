import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
import { captureError, addBreadcrumb } from '../../utils/errorTracking';

// Mock the logger and error tracking
vi.mock('../../utils/logger', () => ({
  appLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../utils/errorTracking', () => ({
  captureError: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Mock phosphor-react icons to avoid rendering issues
vi.mock('phosphor-react', () => ({
  Warning: ({ className }: { size: number; className: string }) => (
    <span data-testid="warning-icon" className={className}>
      Warning
    </span>
  ),
  ArrowClockwise: (_props: { size: number }) => <span data-testid="retry-icon">Retry</span>,
  Bug: (_props: { size: number }) => <span data-testid="bug-icon">Bug</span>,
  Copy: (_props: { size: number }) => <span data-testid="copy-icon">Copy</span>,
  Check: (_props: { size: number }) => <span data-testid="check-icon">Check</span>,
}));

// A component that always throws
function Exploder({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test explosion');
  }
  return <div data-testid="healthy">Healthy content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for caught React errors during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ─── Basic rendering ──────────────────────────────────────────────

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">All good</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('All good');
  });

  it('renders the default error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Exploder />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test explosion')).toBeInTheDocument();
  });

  it('shows "Try Again" button in the error UI', () => {
    render(
      <ErrorBoundary>
        <Exploder />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('shows "Reload Page" button in the error UI', () => {
    render(
      <ErrorBoundary>
        <Exploder />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  // ─── Custom fallback ──────────────────────────────────────────────

  it('renders a custom ReactNode fallback', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error</div>}>
        <Exploder />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Custom Error');
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders a custom function fallback with error and reset', () => {
    const fallbackFn = vi.fn((error: Error, reset: () => void) => (
      <div>
        <span data-testid="fn-fallback-msg">{error.message}</span>
        <button data-testid="fn-reset" onClick={reset}>
          Reset
        </button>
      </div>
    ));

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <Exploder />
      </ErrorBoundary>,
    );

    expect(fallbackFn).toHaveBeenCalled();
    expect(screen.getByTestId('fn-fallback-msg')).toHaveTextContent('Test explosion');
  });

  // ─── onError callback ─────────────────────────────────────────────

  it('calls the onError callback when an error is caught', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Exploder />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test explosion');
  });

  // ─── Reset (Try Again) ───────────────────────────────────────────

  it('resets and re-renders children when "Try Again" is clicked', async () => {
    const user = userEvent.setup();

    // We need a component that can toggle between throwing and not
    let shouldThrow = true;

    function ConditionalExploder() {
      if (shouldThrow) throw new Error('Boom');
      return <div data-testid="recovered">Recovered</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalExploder />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the component before clicking reset
    shouldThrow = false;
    await user.click(screen.getByText('Try Again'));

    expect(screen.getByTestId('recovered')).toHaveTextContent('Recovered');
  });

  // ─── boundary name ────────────────────────────────────────────────

  it('passes the boundary name to error tracking', () => {
    render(
      <ErrorBoundary name="TestBoundary">
        <Exploder />
      </ErrorBoundary>,
    );

    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({ boundary: 'TestBoundary' }),
      }),
    );
    expect(addBreadcrumb).toHaveBeenCalledWith('Error caught in TestBoundary', expect.any(Object));
  });

  it('calls captureError with error severity', () => {
    render(
      <ErrorBoundary>
        <Exploder />
      </ErrorBoundary>,
    );

    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        severity: 'error',
      }),
    );
  });

  // ─── withErrorBoundary HOC ────────────────────────────────────────

  describe('withErrorBoundary', () => {
    it('wraps a component with an error boundary', () => {
      function MyComponent() {
        return <div data-testid="wrapped">Wrapped Content</div>;
      }

      const Wrapped = withErrorBoundary(MyComponent);
      render(<Wrapped />);
      expect(screen.getByTestId('wrapped')).toHaveTextContent('Wrapped Content');
    });

    it('catches errors from the wrapped component', () => {
      function FailingComponent(): React.ReactNode {
        throw new Error('HOC error');
      }

      const Wrapped = withErrorBoundary(FailingComponent);
      render(<Wrapped />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('sets displayName on the wrapped component', () => {
      function NamedComponent() {
        return null;
      }

      const Wrapped = withErrorBoundary(NamedComponent);
      expect(Wrapped.displayName).toBe('withErrorBoundary(NamedComponent)');
    });

    it('passes options to the error boundary', () => {
      const onError = vi.fn();

      function FailComponent(): React.ReactNode {
        throw new Error('Options test');
      }

      const Wrapped = withErrorBoundary(FailComponent, { onError, name: 'TestHOC' });
      render(<Wrapped />);
      expect(onError).toHaveBeenCalled();
    });
  });
});
