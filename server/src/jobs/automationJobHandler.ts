// =============================================================================
// Automation Job Handler - Stage 8: Automation, Payouts & Scale
// =============================================================================

import { automationRulesService } from '../services/automationRulesService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const automationJobHandler = {
  /**
   * Check for SLA breaches and trigger automation rules
   * Runs every 5 minutes
   */
  async checkSLABreaches(): Promise<void> {
    console.log('[AutomationJob] Checking SLA breaches...');

    try {
      // Find SLA records approaching breach (within 24 hours)
      const upcomingBreaches = await prisma.sLARecord.findMany({
        where: {
          isBreach: false,
          actualAt: null, // Not yet completed
          expectedAt: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
            gt: new Date(),
          },
        },
      });

      console.log(`[AutomationJob] Found ${upcomingBreaches.length} upcoming SLA breaches`);

      // Group by seller
      const breachesBySeller = upcomingBreaches.reduce((acc, breach) => {
        const sellerId = breach.sellerId;
        if (!acc[sellerId]) acc[sellerId] = [];
        acc[sellerId].push(breach);
        return acc;
      }, {} as Record<string, typeof upcomingBreaches>);

      // Process each seller's breaches
      for (const [sellerId, breaches] of Object.entries(breachesBySeller)) {
        for (const breach of breaches) {
          const hoursUntilBreach = Math.max(
            0,
            (new Date(breach.expectedAt).getTime() - Date.now()) / (1000 * 60 * 60)
          );

          await automationRulesService.onSLAWarning(
            'order',
            breach.entityId,
            sellerId,
            hoursUntilBreach
          );
        }
      }
    } catch (error) {
      console.error('[AutomationJob] Failed to check SLA breaches:', error);
    }
  },

  /**
   * Process delayed orders and trigger automation rules
   * Runs every 15 minutes
   */
  async processDelayedOrders(): Promise<void> {
    console.log('[AutomationJob] Processing delayed orders...');

    try {
      // Find orders that are at risk or delayed based on healthStatus
      const delayedOrders = await prisma.marketplaceOrder.findMany({
        where: {
          status: { in: ['confirmed', 'processing', 'shipped'] },
          healthStatus: { in: ['at_risk', 'delayed', 'critical'] },
        },
      });

      console.log(`[AutomationJob] Found ${delayedOrders.length} delayed orders`);

      for (const order of delayedOrders) {
        await automationRulesService.onOrderStatusChange(
          order.id,
          order.sellerId,
          order.healthStatus
        );
      }
    } catch (error) {
      console.error('[AutomationJob] Failed to process delayed orders:', error);
    }
  },

  /**
   * Check for low stock items and trigger automation rules
   * Runs every hour
   */
  async checkLowStock(): Promise<void> {
    console.log('[AutomationJob] Checking low stock items...');

    try {
      // Find items with low stock
      // Items use userId for the seller, stock for inventory count
      const lowStockItems = await prisma.item.findMany({
        where: {
          status: 'active',
          stock: { lte: 10 }, // Low stock threshold
        },
        take: 100, // Limit batch size
      });

      console.log(`[AutomationJob] Found ${lowStockItems.length} low stock items`);

      for (const item of lowStockItems) {
        await automationRulesService.onStockChange(
          item.id,
          item.userId, // userId is the seller
          item.stock
        );
      }
    } catch (error) {
      console.error('[AutomationJob] Failed to check low stock:', error);
    }
  },

  /**
   * Process stale disputes and trigger automation rules
   * Runs daily
   */
  async processStaleDisputes(): Promise<void> {
    console.log('[AutomationJob] Processing stale disputes...');

    try {
      // Find disputes that have been open for more than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const staleDisputes = await prisma.marketplaceDispute.findMany({
        where: {
          status: { in: ['open', 'under_review'] },
          createdAt: { lt: sevenDaysAgo },
        },
      });

      console.log(`[AutomationJob] Found ${staleDisputes.length} stale disputes`);

      for (const dispute of staleDisputes) {
        await automationRulesService.onDisputeOpened(
          dispute.id,
          dispute.sellerId
        );
      }
    } catch (error) {
      console.error('[AutomationJob] Failed to process stale disputes:', error);
    }
  },

  /**
   * Clean up old automation execution logs
   * Runs daily at 6 AM
   */
  async cleanupOldLogs(): Promise<void> {
    console.log('[AutomationJob] Cleaning up old execution logs...');

    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await prisma.automationExecution.deleteMany({
        where: {
          executedAt: { lt: ninetyDaysAgo },
        },
      });

      console.log(`[AutomationJob] Deleted ${result.count} old execution logs`);
    } catch (error) {
      console.error('[AutomationJob] Failed to cleanup old logs:', error);
    }
  },

  /**
   * Check for unread RFQs and alert sellers
   * Runs every 30 minutes - alerts if RFQ unread > configurable hours (default 4)
   */
  async checkUnreadRFQs(): Promise<void> {
    console.log('[AutomationJob] Checking unread RFQs...');

    try {
      const hoursThreshold = 4; // Default: alert if unread for 4+ hours
      const thresholdTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

      // Find RFQs that are pending and haven't been viewed
      const unreadRFQs = await prisma.itemRFQ.findMany({
        where: {
          status: 'pending',
          viewedAt: null,
          createdAt: { lt: thresholdTime },
        },
        take: 100,
      });

      console.log(`[AutomationJob] Found ${unreadRFQs.length} unread RFQs (>${hoursThreshold}h)`);

      // Group by seller for batch notifications
      const rfqsBySeller = unreadRFQs.reduce((acc, rfq) => {
        if (!acc[rfq.sellerId]) acc[rfq.sellerId] = [];
        acc[rfq.sellerId].push(rfq);
        return acc;
      }, {} as Record<string, typeof unreadRFQs>);

      // Trigger automation rules for each RFQ
      for (const [sellerId, rfqs] of Object.entries(rfqsBySeller)) {
        for (const rfq of rfqs) {
          const hoursUnread = Math.floor((Date.now() - rfq.createdAt.getTime()) / (1000 * 60 * 60));

          await automationRulesService.onRFQReceived(rfq.id, sellerId);

          // Log alert for unread RFQ
          await prisma.automationExecution.create({
            data: {
              ruleId: 'system-unread-rfq-alert',
              sellerId,
              entityType: 'rfq',
              entityId: rfq.id,
              entityNumber: rfq.rfqNumber || undefined,
              triggerData: JSON.stringify({
                hoursUnread,
                threshold: hoursThreshold,
                buyerId: rfq.buyerId,
                quantity: rfq.quantity,
              }),
              actionTaken: `Alert: RFQ unread for ${hoursUnread} hours`,
              actionResult: 'success',
            },
          });
        }
      }
    } catch (error) {
      console.error('[AutomationJob] Failed to check unread RFQs:', error);
    }
  },

  /**
   * Flag slow-moving listings that have no activity
   * Runs daily - flags items with no orders/RFQs for X days (default 30)
   */
  async flagSlowMovingListings(): Promise<void> {
    console.log('[AutomationJob] Checking slow-moving listings...');

    try {
      const daysThreshold = 30; // Default: flag if no activity for 30+ days
      const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

      // Find active listings with no recent orders
      const slowMovingItems = await prisma.item.findMany({
        where: {
          status: 'active',
          lastOrderAt: {
            lt: thresholdDate,
          },
        },
        take: 100,
      });

      // Also check items that have NEVER had an order and are old enough
      const neverOrderedItems = await prisma.item.findMany({
        where: {
          status: 'active',
          lastOrderAt: null,
          createdAt: { lt: thresholdDate },
        },
        take: 100,
      });

      const allSlowItems = [...slowMovingItems, ...neverOrderedItems];
      console.log(`[AutomationJob] Found ${allSlowItems.length} slow-moving listings (>${daysThreshold} days)`);

      for (const item of allSlowItems) {
        const daysSinceActivity = item.lastOrderAt
          ? Math.floor((Date.now() - item.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Update item metadata to add slow-moving tag
        const metadata = item.metadata ? JSON.parse(item.metadata) : {};
        const tags = metadata.tags || [];

        if (!tags.includes('slow-moving')) {
          tags.push('slow-moving');
          metadata.tags = tags;
          metadata.flaggedAsSlowAt = new Date().toISOString();
          metadata.daysSinceActivity = daysSinceActivity;

          await prisma.item.update({
            where: { id: item.id },
            data: { metadata: JSON.stringify(metadata) },
          });

          // Log the automation execution
          await prisma.automationExecution.create({
            data: {
              ruleId: 'system-slow-moving-flag',
              sellerId: item.userId,
              entityType: 'item',
              entityId: item.id,
              entityNumber: item.sku || undefined,
              triggerData: JSON.stringify({
                daysSinceActivity,
                threshold: daysThreshold,
                lastOrderAt: item.lastOrderAt?.toISOString(),
                itemName: item.name,
              }),
              actionTaken: `Tagged as slow-moving (${daysSinceActivity} days inactive)`,
              actionResult: 'success',
            },
          });
        }
      }
    } catch (error) {
      console.error('[AutomationJob] Failed to flag slow-moving listings:', error);
    }
  },

  /**
   * Process all pending automation rules for all entity types
   * This is a comprehensive scan that runs daily to catch anything missed
   */
  async runDailyAutomationScan(): Promise<void> {
    console.log('[AutomationJob] Running daily automation scan...');

    try {
      // Run all checks in sequence
      await this.checkSLABreaches();
      await this.processDelayedOrders();
      await this.checkLowStock();
      await this.checkUnreadRFQs();
      await this.flagSlowMovingListings();
      await this.processStaleDisputes();

      console.log('[AutomationJob] Daily automation scan completed');
    } catch (error) {
      console.error('[AutomationJob] Daily automation scan failed:', error);
    }
  },

  /**
   * Clean up expired idempotency keys (run hourly)
   * Keys expire after 24 hours to allow retries but prevent memory bloat
   */
  async cleanupExpiredIdempotencyKeys(): Promise<void> {
    console.log('[AutomationJob] Cleaning up expired idempotency keys...');

    try {
      const result = await prisma.idempotencyKey.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      console.log(`[AutomationJob] Cleaned up ${result.count} expired idempotency keys`);
    } catch (error) {
      console.error('[AutomationJob] Failed to cleanup idempotency keys:', error);
    }
  },
};

export default automationJobHandler;
