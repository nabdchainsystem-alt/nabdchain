// =============================================================================
// Idempotency Middleware - Production Hardening
// =============================================================================
// Prevents duplicate operations on critical POST/PUT endpoints
// Uses Idempotency-Key header to track and replay requests
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

interface IdempotencyResult {
  isReplay: boolean;
  idempotencyRecord?: {
    id: string;
    responseStatus: number | null;
    responseBody: string | null;
    status: string;
  };
}

// =============================================================================
// Constants
// =============================================================================

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
const IDEMPOTENCY_KEY_EXPIRY_HOURS = 24;

// Error code for duplicate/replay requests
export const IDEMPOTENT_REPLAY_CODE = 'IDEMPOTENT_REPLAY';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate fingerprint from key + endpoint + userId
 */
function generateFingerprint(key: string, endpoint: string, userId: string | null): string {
  const data = `${key}:${endpoint}:${userId || 'anonymous'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Calculate expiry time (24 hours from now)
 */
function calculateExpiryTime(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + IDEMPOTENCY_KEY_EXPIRY_HOURS);
  return expiry;
}

/**
 * Check if an idempotency key exists and get its state
 */
async function checkIdempotencyKey(
  key: string,
  endpoint: string,
  userId: string | null
): Promise<IdempotencyResult> {
  const fingerprint = generateFingerprint(key, endpoint, userId);

  const existing = await prisma.idempotencyKey.findUnique({
    where: { fingerprint },
    select: {
      id: true,
      responseStatus: true,
      responseBody: true,
      status: true,
      expiresAt: true,
    },
  });

  // If no record exists, not a replay
  if (!existing) {
    return { isReplay: false };
  }

  // If expired, delete and treat as new
  if (existing.expiresAt < new Date()) {
    await prisma.idempotencyKey.delete({ where: { fingerprint } });
    return { isReplay: false };
  }

  // Record exists and is valid
  return {
    isReplay: true,
    idempotencyRecord: {
      id: existing.id,
      responseStatus: existing.responseStatus,
      responseBody: existing.responseBody,
      status: existing.status,
    },
  };
}

/**
 * Create a new idempotency record (pending state)
 */
async function createIdempotencyRecord(
  key: string,
  endpoint: string,
  method: string,
  userId: string | null
): Promise<string> {
  const fingerprint = generateFingerprint(key, endpoint, userId);
  const expiresAt = calculateExpiryTime();

  const record = await prisma.idempotencyKey.create({
    data: {
      key,
      endpoint,
      method,
      userId,
      fingerprint,
      status: 'pending',
      expiresAt,
    },
  });

  return record.id;
}

/**
 * Complete an idempotency record with response
 */
async function completeIdempotencyRecord(
  recordId: string,
  responseStatus: number,
  responseBody: string,
  createdEntityId?: string,
  createdEntityType?: string
): Promise<void> {
  await prisma.idempotencyKey.update({
    where: { id: recordId },
    data: {
      responseStatus,
      responseBody,
      status: 'completed',
      completedAt: new Date(),
      createdEntityId,
      createdEntityType,
    },
  });
}

/**
 * Mark an idempotency record as failed
 */
async function failIdempotencyRecord(recordId: string, errorBody: string): Promise<void> {
  await prisma.idempotencyKey.update({
    where: { id: recordId },
    data: {
      responseStatus: 500,
      responseBody: errorBody,
      status: 'failed',
      completedAt: new Date(),
    },
  });
}

// =============================================================================
// Middleware Factory
// =============================================================================

interface IdempotencyOptions {
  required?: boolean; // If true, request fails without Idempotency-Key
  entityType?: string; // Type of entity being created (order, payment, etc.)
}

/**
 * Create idempotency middleware for an endpoint
 *
 * Usage:
 *   router.post('/orders', idempotency({ required: true, entityType: 'order' }), createOrder);
 */
export function idempotency(options: IdempotencyOptions = {}) {
  const { required = false, entityType } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;

    // If no key provided
    if (!idempotencyKey) {
      if (required) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key header is required for this operation',
          },
        });
      }
      // Key not required, proceed without idempotency protection
      return next();
    }

    // Validate key format (should be a valid UUID or similar)
    if (idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key must be between 16 and 128 characters',
        },
      });
    }

    // Get user ID from request (assumes auth middleware has run)
    const userId = (req as any).userId || (req as any).user?.id || null;
    const endpoint = req.originalUrl.split('?')[0]; // Remove query params
    const method = req.method;

    try {
      // Check if key already exists
      const result = await checkIdempotencyKey(idempotencyKey, endpoint, userId);

      if (result.isReplay) {
        const record = result.idempotencyRecord!;

        // If still pending, request is in progress (concurrent request)
        if (record.status === 'pending') {
          return res.status(409).json({
            success: false,
            error: {
              code: 'REQUEST_IN_PROGRESS',
              message: 'A request with this Idempotency-Key is already being processed',
            },
          });
        }

        // If completed, replay the response
        if (record.status === 'completed' && record.responseBody) {
          res.setHeader('Idempotent-Replayed', 'true');
          return res.status(record.responseStatus || 200).json({
            ...JSON.parse(record.responseBody),
            _idempotent: {
              replayed: true,
              code: IDEMPOTENT_REPLAY_CODE,
            },
          });
        }

        // If failed, allow retry
        // Delete the failed record and proceed
        await prisma.idempotencyKey.delete({ where: { id: record.id } });
      }

      // Create new idempotency record
      const recordId = await createIdempotencyRecord(idempotencyKey, endpoint, method, userId);

      // Store record ID and options on request for use in response
      (req as any)._idempotencyRecordId = recordId;
      (req as any)._idempotencyEntityType = entityType;

      // Override res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        const statusCode = res.statusCode;

        // Complete idempotency record asynchronously
        const createdEntityId = body?.order?.id || body?.payment?.id || body?.dispute?.id || body?.payout?.id || body?.data?.id;

        completeIdempotencyRecord(
          recordId,
          statusCode,
          JSON.stringify(body),
          createdEntityId,
          entityType
        ).catch(err => {
          console.error('[Idempotency] Failed to complete record:', err);
        });

        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('[Idempotency] Middleware error:', error);
      // On error, proceed without idempotency (fail open for availability)
      next();
    }
  };
}

// =============================================================================
// Cleanup Job (call from scheduler)
// =============================================================================

/**
 * Clean up expired idempotency keys
 * Should be run periodically (e.g., hourly)
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

// =============================================================================
// Export
// =============================================================================

export default idempotency;
