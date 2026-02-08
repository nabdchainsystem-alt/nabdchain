/**
 * Performance monitoring and optimization utilities
 * Provides tools to measure and improve app performance
 */

import { appLogger } from './logger';

// Performance marks for debugging
const PERF_MARKS: Map<string, number> = new Map();

/**
 * Start a performance measurement
 */
export function perfStart(label: string): void {
  if (typeof performance !== 'undefined') {
    PERF_MARKS.set(label, performance.now());
  }
}

/**
 * End a performance measurement and log the result
 */
export function perfEnd(label: string, threshold = 16): number {
  if (typeof performance === 'undefined') return 0;

  const start = PERF_MARKS.get(label);
  if (!start) return 0;

  const duration = performance.now() - start;
  PERF_MARKS.delete(label);

  // Only log if exceeds threshold (default 16ms = 1 frame at 60fps)
  if (duration > threshold && process.env.NODE_ENV === 'development') {
    appLogger.warn(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Debounce function with leading edge option
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  const { leading = false, trailing = true } = options;

  return function (this: unknown, ...args: Parameters<T>) {
    const isFirstCall = !timeout;
    lastArgs = args;

    if (timeout) {
      clearTimeout(timeout);
    }

    if (leading && isFirstCall) {
      func.apply(this, args);
    }

    timeout = setTimeout(() => {
      if (trailing && lastArgs) {
        func.apply(this, lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait period
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallbackFallback(callback: () => void, options: { timeout?: number } = {}): number {
  if ('requestIdleCallback' in window) {
    return (
      window as Window & { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }
    ).requestIdleCallback(callback, options);
  }
  // Fallback for Safari and older browsers
  return setTimeout(callback, options.timeout ?? 1) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallbackFallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Batch DOM reads and writes to prevent layout thrashing
 */
class DOMBatcher {
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];
  private scheduled = false;

  read(fn: () => void): void {
    this.readQueue.push(fn);
    this.schedule();
  }

  write(fn: () => void): void {
    this.writeQueue.push(fn);
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      // Execute reads first (to batch layout calculations)
      const reads = this.readQueue.splice(0);
      reads.forEach((fn) => fn());

      // Then execute writes (to batch DOM mutations)
      const writes = this.writeQueue.splice(0);
      writes.forEach((fn) => fn());

      this.scheduled = false;

      // If more work was queued during execution, schedule again
      if (this.readQueue.length || this.writeQueue.length) {
        this.schedule();
      }
    });
  }
}

export const domBatcher = new DOMBatcher();

/**
 * Shallow compare two objects (for React.memo comparisons)
 */
export function shallowEqual<T extends Record<string, unknown>>(objA: T, objB: T): boolean {
  if (objA === objB) return true;
  if (!objA || !objB) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}

/**
 * Deep compare objects (use sparingly - expensive)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keysA = Object.keys(aObj);
    const keysB = Object.keys(bObj);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Create a memoized function that caches the last result
 */
export function memoizeOne<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  isEqual: (a: TArgs, b: TArgs) => boolean = (a, b) => a.length === b.length && a.every((arg, i) => arg === b[i]),
): (...args: TArgs) => TResult {
  let lastArgs: TArgs | null = null;
  let lastResult: TResult;

  return function (this: unknown, ...args: TArgs): TResult {
    if (lastArgs && isEqual(args, lastArgs)) {
      return lastResult;
    }

    lastResult = fn.apply(this, args);
    lastArgs = args;
    return lastResult;
  };
}

/**
 * Chunk an array for batch processing
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process items in batches using requestIdleCallback
 */
export async function processBatched<T, R>(items: T[], processor: (item: T) => R, batchSize = 50): Promise<R[]> {
  const chunks = chunkArray(items, batchSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    await new Promise<void>((resolve) => {
      requestIdleCallbackFallback(() => {
        results.push(...chunk.map(processor));
        resolve();
      });
    });
  }

  return results;
}

/**
 * Intersection Observer for lazy loading
 */
export function createLazyObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {},
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '100px', // Start loading 100px before visible
    threshold: 0,
    ...options,
  });
}

/**
 * Calculate virtualization window
 */
export function getVirtualWindow(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3,
): { start: number; end: number; offsetY: number } {
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(totalItems, visibleEnd + overscan);
  const offsetY = start * itemHeight;

  return { start, end, offsetY };
}

// ============================================================================
// ANIMATION & SMOOTHNESS UTILITIES
// For buttery-smooth interactions like Monday.com and ClickUp
// ============================================================================

/**
 * RAF-based throttle - ensures callback only runs once per animation frame
 * This is specifically optimized for smooth visual updates
 */
export function rafThrottle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          callback.apply(this, lastArgs);
        }
        rafId = null;
      });
    }
  };
}

/**
 * Cancel a RAF throttle
 */
export function cancelRafThrottle(_throttledFn: ReturnType<typeof rafThrottle>): void {
  // This is a no-op since we don't expose the rafId externally
  // But useful for type compatibility
}

/**
 * Smooth scroll to element or position with easing
 */
export function smoothScrollTo(
  element: HTMLElement | Window,
  target: number | HTMLElement,
  duration = 300,
  easing: 'ease-out' | 'ease-in-out' | 'spring' = 'ease-out',
): Promise<void> {
  return new Promise((resolve) => {
    const isWindow = element === window;
    const startPosition = isWindow ? window.scrollY : (element as HTMLElement).scrollTop;

    const targetPosition = typeof target === 'number' ? target : target.offsetTop;

    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const easingFunctions = {
      'ease-out': (t: number) => 1 - Math.pow(1 - t, 3),
      'ease-in-out': (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      spring: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      },
    };

    const ease = easingFunctions[easing];

    function animate(currentTime: number) {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeProgress = ease(progress);
      const position = startPosition + distance * easeProgress;

      if (isWindow) {
        window.scrollTo(0, position);
      } else {
        (element as HTMLElement).scrollTop = position;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

/**
 * Create a continuous animation loop that stops when cancelled
 */
export function createAnimationLoop(callback: (deltaTime: number, totalTime: number) => boolean | void): {
  start: () => void;
  stop: () => void;
} {
  let rafId: number | null = null;
  let startTime: number | null = null;
  let lastTime: number | null = null;

  const loop = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    if (lastTime === null) lastTime = currentTime;

    const deltaTime = currentTime - lastTime;
    const totalTime = currentTime - startTime;
    lastTime = currentTime;

    const shouldContinue = callback(deltaTime, totalTime);

    if (shouldContinue !== false && rafId !== null) {
      rafId = requestAnimationFrame(loop);
    }
  };

  return {
    start: () => {
      if (rafId === null) {
        startTime = null;
        lastTime = null;
        rafId = requestAnimationFrame(loop);
      }
    },
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

/**
 * Spring physics animation - for natural feeling motion
 */
export function springAnimation(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  options: {
    stiffness?: number; // Spring stiffness (default: 170)
    damping?: number; // Damping ratio (default: 26)
    mass?: number; // Mass (default: 1)
    velocity?: number; // Initial velocity (default: 0)
  } = {},
): { stop: () => void } {
  const { stiffness = 170, damping = 26, mass = 1, velocity: initialVelocity = 0 } = options;

  let position = from;
  let velocity = initialVelocity;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  const step = (currentTime: number) => {
    if (lastTime === null) lastTime = currentTime;

    // Fixed timestep for stability
    const dt = Math.min((currentTime - lastTime) / 1000, 0.064);
    lastTime = currentTime;

    // Spring physics
    const displacement = position - to;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * dt;
    position += velocity * dt;

    // Check if animation is complete (at rest)
    const isAtRest = Math.abs(velocity) < 0.01 && Math.abs(position - to) < 0.01;

    if (isAtRest) {
      onUpdate(to);
      rafId = null;
    } else {
      onUpdate(position);
      rafId = requestAnimationFrame(step);
    }
  };

  rafId = requestAnimationFrame(step);

  return {
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

/**
 * Lerp (linear interpolation) with frame-rate independent smoothing
 */
export function smoothLerp(current: number, target: number, smoothing: number, deltaTime: number): number {
  // Frame-rate independent smoothing
  const t = 1 - Math.pow(1 - smoothing, deltaTime / 16.67);
  return current + (target - current) * t;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimal animation duration based on user preferences
 */
export function getOptimalDuration(baseDuration: number): number {
  return prefersReducedMotion() ? 0 : baseDuration;
}

// Note: react-window types may not match the actual exports in v2.x
// Import directly from 'react-window' if needed
