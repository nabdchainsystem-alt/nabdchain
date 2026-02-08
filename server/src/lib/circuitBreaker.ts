// =============================================================================
// Circuit Breaker for Database Operations
// =============================================================================
// Prevents cascading failures when the database is unavailable.
// Workers use this to pause polling when DB connectivity issues are detected.
// =============================================================================

import { serverLogger } from '../utils/logger';

// =============================================================================
// Configuration
// =============================================================================

interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** How long to wait before attempting to half-open (ms) */
  resetTimeoutMs: number;
  /** Maximum backoff time (ms) */
  maxBackoffMs: number;
  /** Minimum backoff time (ms) */
  minBackoffMs: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
  maxBackoffMs: 300000, // 5 minutes
  minBackoffMs: 5000, // 5 seconds
};

// =============================================================================
// Circuit Breaker States
// =============================================================================

type CircuitState = 'closed' | 'open' | 'half-open';

// =============================================================================
// Circuit Breaker Class
// =============================================================================

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private lastFailureTime: Date | null = null;
  private lastErrorMessage: string | null = null;
  private lastSuccessTime: Date | null = null;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a successful operation - reset the circuit
   */
  recordSuccess(): void {
    if (this.state !== 'closed') {
      serverLogger.info(`[CircuitBreaker:${this.name}] Circuit closed after successful operation`);
    }
    this.state = 'closed';
    this.consecutiveFailures = 0;
    this.lastErrorMessage = null;
    this.lastSuccessTime = new Date();
  }

  /**
   * Record a failed operation
   */
  recordFailure(error: Error | string): void {
    this.consecutiveFailures++;
    this.lastFailureTime = new Date();
    this.lastErrorMessage = error instanceof Error ? error.message : error;

    if (this.consecutiveFailures >= this.config.failureThreshold) {
      if (this.state !== 'open') {
        serverLogger.warn(
          `[CircuitBreaker:${this.name}] Circuit OPEN after ${this.consecutiveFailures} failures: ${this.lastErrorMessage}`
        );
      }
      this.state = 'open';
    }
  }

  /**
   * Check if circuit allows operations
   * Returns true if operations should proceed, false if they should be skipped
   */
  canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if enough time has passed to try again
      const now = Date.now();
      const timeSinceFailure = this.lastFailureTime
        ? now - this.lastFailureTime.getTime()
        : Infinity;

      if (timeSinceFailure >= this.config.resetTimeoutMs) {
        // Transition to half-open to allow a test request
        this.state = 'half-open';
        serverLogger.info(`[CircuitBreaker:${this.name}] Circuit half-open, allowing test request`);
        return true;
      }

      return false;
    }

    // half-open state - allow one request to test
    return true;
  }

  /**
   * Get the recommended backoff time before next retry
   */
  getBackoffMs(): number {
    if (this.state === 'closed') {
      return 0;
    }

    // Calculate exponential backoff based on consecutive failures
    const backoff =
      this.config.minBackoffMs * Math.pow(2, Math.min(this.consecutiveFailures - 1, 10));
    return Math.min(backoff, this.config.maxBackoffMs);
  }

  /**
   * Get current circuit status for monitoring
   */
  getStatus(): {
    state: CircuitState;
    consecutiveFailures: number;
    lastError: string | null;
    lastFailureTime: Date | null;
    lastSuccessTime: Date | null;
  } {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastError: this.lastErrorMessage,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  /**
   * Check if circuit is open (DB operations should be skipped)
   */
  isOpen(): boolean {
    return this.state === 'open';
  }
}

// =============================================================================
// Singleton Instances for Common Use Cases
// =============================================================================

/** Circuit breaker for database operations */
export const dbCircuitBreaker = new CircuitBreaker('database', {
  failureThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
});

/**
 * Helper to check if an error is a database connection error
 */
export function isDbConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('can\'t reach database') ||
    message.includes('prepared statement') ||
    message.includes('server has closed the connection')
  );
}

/**
 * Wrap an async database operation with circuit breaker
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  breaker: CircuitBreaker = dbCircuitBreaker
): Promise<T | null> {
  if (!breaker.canExecute()) {
    return null;
  }

  try {
    const result = await operation();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    if (isDbConnectionError(error)) {
      breaker.recordFailure(error as Error);
    }
    throw error;
  }
}

export default CircuitBreaker;
