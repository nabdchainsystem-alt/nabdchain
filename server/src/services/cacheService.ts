import { Redis } from '@upstash/redis';
import { cacheLogger } from '../utils/logger';

// Initialize Redis client (only if credentials are available)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// In-memory cache fallback when Redis is not available
interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt?: number;
}

class MemoryCache {
  private cache = new Map<string, MemoryCacheEntry<unknown>>();
  private maxSize = 1000; // Max entries to prevent memory leaks

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  getWithStale<T>(key: string): { value: T | null; isStale: boolean } {
    const entry = this.cache.get(key);
    if (!entry) return { value: null, isStale: false };
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return { value: null, isStale: false };
    }
    const isStale = entry.staleAt ? Date.now() > entry.staleAt : false;
    return { value: entry.value as T, isStale };
  }

  set<T>(key: string, value: T, ttlSeconds: number, staleAfterSeconds?: number): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, 100);
      keysToDelete.forEach(k => this.cache.delete(k));
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      staleAt: staleAfterSeconds ? Date.now() + staleAfterSeconds * 1000 : undefined,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  increment(key: string, ttlSeconds: number): number {
    const existing = this.get<number>(key) || 0;
    const newValue = existing + 1;
    this.set(key, newValue, ttlSeconds);
    return newValue;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

// Default TTL values (in seconds)
export const TTL = {
  INSTANT: 10,         // 10 seconds - for real-time data
  SHORT: 60,           // 1 minute - for frequently changing data
  MEDIUM: 300,         // 5 minutes - for moderately changing data
  LONG: 3600,          // 1 hour - for stable data
  DAY: 86400,          // 24 hours - for rarely changing data
};

// Cache key generators for consistency
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  workspace: (id: string) => `workspace:${id}`,
  workspaces: (userId: string) => `workspaces:${userId}`,
  board: (id: string) => `board:${id}`,
  boards: (workspaceId: string) => `boards:${workspaceId}`,
  rooms: (boardId: string) => `rooms:${boardId}`,
  rows: (roomId: string) => `rows:${roomId}`,
  activities: (workspaceId: string) => `activities:${workspaceId}`,
  rateLimit: (key: string) => `rate:${key}`,
};

/**
 * Cache service for Redis operations with in-memory fallback
 * All methods gracefully handle missing Redis connection
 */
export const cacheService = {
  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return redis !== null;
  },

  /**
   * Check if using memory fallback
   */
  isUsingMemory(): boolean {
    return redis === null;
  },

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (redis) {
      try {
        return await redis.get<T>(key);
      } catch (error) {
        cacheLogger.error('Redis get error, falling back to memory:', error);
      }
    }
    // Fall back to memory cache
    return memoryCache.get<T>(key);
  },

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = TTL.MEDIUM): Promise<boolean> {
    // Always set in memory for fast access
    memoryCache.set(key, value, ttlSeconds);

    // Also set in Redis if available
    if (redis) {
      try {
        await redis.set(key, value, { ex: ttlSeconds });
        return true;
      } catch (error) {
        cacheLogger.error('Redis set error:', error);
      }
    }
    return true; // Memory cache succeeded
  },

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    // Delete from memory
    memoryCache.delete(key);

    // Delete from Redis if available
    if (redis) {
      try {
        await redis.del(key);
        return true;
      } catch (error) {
        cacheLogger.error('Redis delete error:', error);
      }
    }
    return true;
  },

  /**
   * Delete multiple keys matching a pattern
   * Note: Use sparingly as SCAN can be expensive
   */
  async deletePattern(pattern: string): Promise<boolean> {
    // Delete from memory
    memoryCache.deletePattern(pattern);

    // Delete from Redis if available
    if (redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        return true;
      } catch (error) {
        cacheLogger.error('Redis deletePattern error:', error);
      }
    }
    return true;
  },

  /**
   * Get or set: Returns cached value or fetches and caches new value
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = TTL.MEDIUM
  ): Promise<T> {
    // Try Redis first
    if (redis) {
      try {
        const cached = await redis.get<T>(key);
        if (cached !== null) {
          // Also update memory cache for faster subsequent access
          memoryCache.set(key, cached, ttlSeconds);
          return cached;
        }
      } catch (error) {
        cacheLogger.error('Redis getOrSet error, using memory:', error);
      }
    }

    // Try memory cache
    const memoryCached = memoryCache.get<T>(key);
    if (memoryCached !== null) {
      return memoryCached;
    }

    // Fetch fresh data
    const fresh = await fetcher();

    // Cache in memory
    memoryCache.set(key, fresh, ttlSeconds);

    // Cache in Redis (don't await)
    if (redis) {
      redis.set(key, fresh, { ex: ttlSeconds }).catch(err =>
        cacheLogger.error('Redis set error in getOrSet:', err)
      );
    }

    return fresh;
  },

  /**
   * Stale-While-Revalidate: Return stale data immediately while fetching fresh
   * Best for data that changes but doesn't need to be instantly fresh
   */
  async getStaleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttlSeconds?: number;
      staleAfterSeconds?: number;
    } = {}
  ): Promise<T> {
    const { ttlSeconds = TTL.MEDIUM, staleAfterSeconds = TTL.SHORT } = options;

    // Check memory cache first (fastest)
    const { value: memoryCached, isStale } = memoryCache.getWithStale<T>(key);

    if (memoryCached !== null) {
      // If stale, refresh in background
      if (isStale) {
        this.refreshInBackground(key, fetcher, ttlSeconds, staleAfterSeconds);
      }
      return memoryCached;
    }

    // Check Redis
    if (redis) {
      try {
        const redisCached = await redis.get<T>(key);
        if (redisCached !== null) {
          memoryCache.set(key, redisCached, ttlSeconds, staleAfterSeconds);
          return redisCached;
        }
      } catch (error) {
        cacheLogger.error('Redis SWR error:', error);
      }
    }

    // No cached data, fetch fresh
    const fresh = await fetcher();
    memoryCache.set(key, fresh, ttlSeconds, staleAfterSeconds);

    if (redis) {
      redis.set(key, fresh, { ex: ttlSeconds }).catch(() => {});
    }

    return fresh;
  },

  /**
   * Refresh cache in background without blocking
   */
  refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    staleAfterSeconds?: number
  ): void {
    setImmediate(async () => {
      try {
        const fresh = await fetcher();
        memoryCache.set(key, fresh, ttlSeconds, staleAfterSeconds);
        if (redis) {
          await redis.set(key, fresh, { ex: ttlSeconds });
        }
      } catch (error) {
        cacheLogger.error('Background refresh error:', error);
      }
    });
  },

  /**
   * Increment a counter (useful for rate limiting)
   */
  async increment(key: string, ttlSeconds: number = 60): Promise<number> {
    if (!redis) return 0;
    try {
      const count = await redis.incr(key);
      // Set expiry only on first increment
      if (count === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      cacheLogger.error('Cache increment error:', error);
      return 0;
    }
  },

  /**
   * Check rate limit
   * Returns true if within limit, false if exceeded
   */
  async checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    if (!redis) {
      return { allowed: true, remaining: limit, resetIn: 0 };
    }

    const key = cacheKeys.rateLimit(identifier);

    try {
      const count = await this.increment(key, windowSeconds);
      const ttl = await redis.ttl(key);

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetIn: ttl > 0 ? ttl : windowSeconds,
      };
    } catch (error) {
      cacheLogger.error('Rate limit check error:', error);
      return { allowed: true, remaining: limit, resetIn: 0 };
    }
  },

  /**
   * Invalidate cache when data changes
   */
  async invalidateBoard(boardId: string): Promise<void> {
    await this.delete(cacheKeys.board(boardId));
    await this.delete(cacheKeys.rooms(boardId));
  },

  async invalidateWorkspace(workspaceId: string): Promise<void> {
    await this.delete(cacheKeys.workspace(workspaceId));
    await this.delete(cacheKeys.boards(workspaceId));
    await this.delete(cacheKeys.activities(workspaceId));
  },

  async invalidateUser(userId: string): Promise<void> {
    await this.delete(cacheKeys.user(userId));
    await this.delete(cacheKeys.workspaces(userId));
  },
};

export default cacheService;
