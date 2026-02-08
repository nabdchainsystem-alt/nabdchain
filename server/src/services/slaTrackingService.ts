// =============================================================================
// SLA Tracking Service (Stage 7)
// =============================================================================
// Tracks SLA performance for analytics and trust scoring.
// No auto-penalties - data collection for seller performance metrics.
// =============================================================================

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type SLAType = 'order_confirmation' | 'shipping' | 'delivery' | 'dispute_response' | 'return_approval';
export type EntityType = 'order' | 'dispute' | 'return';

export interface SLAMetrics {
  totalSLAs: number;
  breaches: number;
  breachRate: number;
  onTimeRate: number;
  avgResponseTimeHours: number;
  byType: Record<SLAType, {
    total: number;
    breaches: number;
    avgTimeHours: number;
  }>;
}

export interface RecordSLAInput {
  entityType: EntityType;
  entityId: string;
  entityNumber?: string;
  sellerId: string;
  buyerId?: string;
  slaType: SLAType;
  expectedAt: Date;
  slaHours?: number;
  slaDays?: number;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Record the start of an SLA tracking period
 */
async function recordSLAStart(input: RecordSLAInput): Promise<any> {
  try {
    // Check if SLA already exists for this entity+type
    const existing = await prisma.sLARecord.findFirst({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        slaType: input.slaType,
      },
    });

    if (existing) {
      // Update if it exists
      return prisma.sLARecord.update({
        where: { id: existing.id },
        data: {
          expectedAt: input.expectedAt,
          slaHours: input.slaHours,
          slaDays: input.slaDays,
        },
      });
    }

    // Create new SLA record
    return prisma.sLARecord.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        entityNumber: input.entityNumber,
        sellerId: input.sellerId,
        buyerId: input.buyerId,
        slaType: input.slaType,
        expectedAt: input.expectedAt,
        slaHours: input.slaHours,
        slaDays: input.slaDays,
      },
    });
  } catch (error) {
    apiLogger.error('Error recording SLA start:', error);
    throw error;
  }
}

/**
 * Record completion of an SLA
 */
async function recordSLACompletion(
  entityType: EntityType,
  entityId: string,
  slaType: SLAType
): Promise<any | null> {
  try {
    const slaRecord = await prisma.sLARecord.findFirst({
      where: {
        entityType,
        entityId,
        slaType,
      },
    });

    if (!slaRecord) {
      return null;
    }

    const now = new Date();
    const isBreach = now > slaRecord.expectedAt;
    let breachDuration: number | null = null;

    if (isBreach) {
      // Calculate breach duration in minutes
      breachDuration = Math.floor((now.getTime() - slaRecord.expectedAt.getTime()) / 60000);
    }

    return prisma.sLARecord.update({
      where: { id: slaRecord.id },
      data: {
        actualAt: now,
        isBreach,
        breachDuration,
      },
    });
  } catch (error) {
    apiLogger.error('Error recording SLA completion:', error);
    throw error;
  }
}

/**
 * Check for active SLA breaches for a seller
 */
async function checkSLABreaches(sellerId: string): Promise<any[]> {
  const now = new Date();

  return prisma.sLARecord.findMany({
    where: {
      sellerId,
      actualAt: null, // Not yet completed
      expectedAt: { lt: now }, // Past deadline
    },
    orderBy: { expectedAt: 'asc' },
  });
}

/**
 * Get active (incomplete) SLAs for a seller
 */
async function getActiveSLAs(sellerId: string): Promise<any[]> {
  return prisma.sLARecord.findMany({
    where: {
      sellerId,
      actualAt: null, // Not yet completed
    },
    orderBy: { expectedAt: 'asc' },
  });
}

/**
 * Get SLA performance metrics for a seller
 */
async function getSellerSLAMetrics(
  sellerId: string,
  period?: 'week' | 'month' | 'quarter'
): Promise<SLAMetrics> {
  // Calculate date range
  let dateFrom: Date | undefined;
  if (period) {
    dateFrom = new Date();
    switch (period) {
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'quarter':
        dateFrom.setMonth(dateFrom.getMonth() - 3);
        break;
    }
  }

  const where: any = {
    sellerId,
    actualAt: { not: null }, // Only completed SLAs
  };

  if (dateFrom) {
    where.createdAt = { gte: dateFrom };
  }

  const slaRecords = await prisma.sLARecord.findMany({
    where,
  });

  // Calculate metrics
  const totalSLAs = slaRecords.length;
  const breaches = slaRecords.filter((r) => r.isBreach).length;
  const breachRate = totalSLAs > 0 ? Math.round((breaches / totalSLAs) * 100) : 0;
  const onTimeRate = 100 - breachRate;

  // Calculate average response time
  let totalResponseTime = 0;
  let responseCount = 0;
  slaRecords.forEach((r) => {
    if (r.actualAt) {
      const responseTime = (r.actualAt.getTime() - r.createdAt.getTime()) / 3600000; // Hours
      totalResponseTime += responseTime;
      responseCount++;
    }
  });
  const avgResponseTimeHours = responseCount > 0
    ? Math.round((totalResponseTime / responseCount) * 10) / 10
    : 0;

  // Calculate by type
  const byType: SLAMetrics['byType'] = {
    order_confirmation: { total: 0, breaches: 0, avgTimeHours: 0 },
    shipping: { total: 0, breaches: 0, avgTimeHours: 0 },
    delivery: { total: 0, breaches: 0, avgTimeHours: 0 },
    dispute_response: { total: 0, breaches: 0, avgTimeHours: 0 },
    return_approval: { total: 0, breaches: 0, avgTimeHours: 0 },
  };

  const typeTimeSums: Record<string, { totalTime: number; count: number }> = {};

  slaRecords.forEach((r) => {
    const type = r.slaType as SLAType;
    if (byType[type]) {
      byType[type].total++;
      if (r.isBreach) {
        byType[type].breaches++;
      }
      if (r.actualAt) {
        const responseTime = (r.actualAt.getTime() - r.createdAt.getTime()) / 3600000;
        if (!typeTimeSums[type]) {
          typeTimeSums[type] = { totalTime: 0, count: 0 };
        }
        typeTimeSums[type].totalTime += responseTime;
        typeTimeSums[type].count++;
      }
    }
  });

  // Calculate average time per type
  Object.keys(typeTimeSums).forEach((type) => {
    const slaType = type as SLAType;
    if (typeTimeSums[type].count > 0) {
      byType[slaType].avgTimeHours = Math.round(
        (typeTimeSums[type].totalTime / typeTimeSums[type].count) * 10
      ) / 10;
    }
  });

  return {
    totalSLAs,
    breaches,
    breachRate,
    onTimeRate,
    avgResponseTimeHours,
    byType,
  };
}

/**
 * Get SLA history for a specific entity
 */
async function getSLAHistoryForEntity(
  entityType: EntityType,
  entityId: string
): Promise<any[]> {
  return prisma.sLARecord.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get SLA history for a seller with pagination
 */
async function getSellerSLAHistory(
  sellerId: string,
  filters: {
    slaType?: SLAType;
    breachOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ records: any[]; total: number; page: number; limit: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { sellerId };

  if (filters.slaType) {
    where.slaType = filters.slaType;
  }

  if (filters.breachOnly) {
    where.isBreach = true;
  }

  const [records, total] = await Promise.all([
    prisma.sLARecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sLARecord.count({ where }),
  ]);

  return { records, total, page, limit };
}

// =============================================================================
// Export
// =============================================================================

export const slaTrackingService = {
  recordSLAStart,
  recordSLACompletion,
  checkSLABreaches,
  getActiveSLAs,
  getSellerSLAMetrics,
  getSLAHistoryForEntity,
  getSellerSLAHistory,
};

export default slaTrackingService;
