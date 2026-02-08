// =============================================================================
// Prisma Singleton
// =============================================================================
// Single PrismaClient instance shared across the entire application.
// Handles hot-reload in development and connection management.
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Configuration
// =============================================================================

const isDevelopment = process.env.NODE_ENV !== 'production';

// Prisma logging configuration
const logConfig = isDevelopment
  ? ['warn', 'error'] as const
  : ['error'] as const;

// =============================================================================
// Singleton Implementation
// =============================================================================

// Use globalThis to persist the client across hot-reloads in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a new client only if one doesn't exist
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: logConfig.map(level => ({ level, emit: 'event' as const })),
});

// Subscribe to log events
prisma.$on('error' as never, (e: { message: string }) => {
  apiLogger.error('[Prisma] Database error:', e.message);
});

prisma.$on('warn' as never, (e: { message: string }) => {
  apiLogger.warn('[Prisma] Database warning:', e.message);
});

// In development, cache the client to prevent multiple instances during hot-reload
if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

// =============================================================================
// Connection Health
// =============================================================================

let isConnected = false;
let lastConnectionError: string | null = null;
let lastHealthCheck: Date | null = null;

/**
 * Check if the database is connected and responsive
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  lastError: string | null;
  lastCheck: Date | null;
  responseTimeMs?: number;
}> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    lastConnectionError = null;
    lastHealthCheck = new Date();
    return {
      connected: true,
      lastError: null,
      lastCheck: lastHealthCheck,
      responseTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    isConnected = false;
    lastConnectionError = error instanceof Error ? error.message : 'Unknown error';
    lastHealthCheck = new Date();
    return {
      connected: false,
      lastError: lastConnectionError,
      lastCheck: lastHealthCheck,
      responseTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Get current connection status (cached, no DB call)
 */
export function getConnectionStatus(): {
  connected: boolean;
  lastError: string | null;
  lastCheck: Date | null;
} {
  return {
    connected: isConnected,
    lastError: lastConnectionError,
    lastCheck: lastHealthCheck,
  };
}

/**
 * Attempt to connect to the database
 * Returns true if successful, false otherwise
 */
export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    isConnected = true;
    lastConnectionError = null;
    apiLogger.info('[Prisma] Database connected successfully');
    return true;
  } catch (error) {
    isConnected = false;
    lastConnectionError = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Prisma] Database connection failed:', lastConnectionError);
    return false;
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    isConnected = false;
    apiLogger.info('[Prisma] Database disconnected');
  } catch (error) {
    apiLogger.error('[Prisma] Error disconnecting:', error);
  }
}

// =============================================================================
// Graceful Shutdown
// =============================================================================

// Handle process termination
const handleShutdown = async (signal: string) => {
  apiLogger.info(`[Prisma] Received ${signal}, disconnecting...`);
  await disconnectDatabase();
};

// Only register shutdown handlers once
if (!globalForPrisma.prisma) {
  process.on('beforeExit', () => handleShutdown('beforeExit'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

// =============================================================================
// Exports
// =============================================================================

export { prisma };
export type { PrismaClient };
export default prisma;
