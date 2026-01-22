import { Redis } from '@upstash/redis';

// Initialize Redis client (only if credentials are available)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Default TTL values (in seconds)
export const TTL = {
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
 * Cache service for Redis operations
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
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      return await redis.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = TTL.MEDIUM): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching a pattern
   * Note: Use sparingly as SCAN can be expensive
   */
  async deletePattern(pattern: string): Promise<boolean> {
    if (!redis) return false;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache deletePattern error:', error);
      return false;
    }
  },

  /**
   * Get or set: Returns cached value or fetches and caches new value
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = TTL.MEDIUM
  ): Promise<T> {
    if (!redis) {
      return fetcher();
    }

    try {
      // Try to get from cache
      const cached = await redis.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch fresh data
      const fresh = await fetcher();

      // Cache the result (don't await to avoid blocking)
      redis.set(key, fresh, { ex: ttlSeconds }).catch(err =>
        console.error('Cache set error in getOrSet:', err)
      );

      return fresh;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      return fetcher();
    }
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
      console.error('Cache increment error:', error);
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
      console.error('Rate limit check error:', error);
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
