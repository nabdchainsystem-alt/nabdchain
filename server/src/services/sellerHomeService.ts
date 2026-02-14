// =============================================================================
// Seller Home Service - Aggregated Dashboard Data
// =============================================================================
// Returns real data from database. Frontend handles empty states gracefully.
// NOTE: Mock data removed - see MOCK_REMOVAL_REPORT.md

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'rfq' | 'order' | 'invoice' | 'payout' | 'dispute' | 'verification';

export interface SellerAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  messageAr: string;
  ctaLabel: string;
  ctaLabelAr: string;
  ctaRoute: string;
  count?: number;
  createdAt: string;
}

export type FocusPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface SellerFocus {
  id: string;
  priority: FocusPriority;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  hint?: string;
  hintAr?: string;
  ctaLabel: string;
  ctaLabelAr: string;
  ctaRoute: string;
  ctaFilter?: string;
  isEmpty: boolean;
}

export type SystemHealthStatus = 'healthy' | 'warning' | 'critical';

export interface SystemHealth {
  status: SystemHealthStatus;
  message: string;
  messageAr: string;
  issues: Array<{
    area: string;
    areaAr: string;
    ctaRoute: string;
  }>;
}

export interface OnboardingProgress {
  isComplete: boolean;
  canPublish: boolean;
  completedSteps: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    label: string;
    labelAr: string;
    completed: boolean;
    ctaRoute?: string;
  }>;
}

export interface BusinessPulseData {
  labels: string[];
  revenue: number[];
  orders: number[];
}

export interface SellerHomeKPIs {
  revenue: number;
  revenueChange: number;
  activeOrders: number;
  ordersNeedingAction: number;
  rfqInbox: number;
  newRfqs: number;
  pendingPayout: number;
  pendingCounterOffers: number;
  currency: string;
}

export interface SellerHomeSummary {
  kpis: SellerHomeKPIs;
  alerts: SellerAlert[];
  focus: SellerFocus;
  systemHealth: SystemHealth;
  onboarding: OnboardingProgress | null;
  pulse: BusinessPulseData;
  sellerStatus: 'active' | 'new' | 'inactive' | 'suspended';
  lastUpdated: string;
}

// =============================================================================
// Empty State Helpers (No mock data - production mode)
// =============================================================================

/**
 * Generate empty pulse data with real date labels but zero values
 */
function getEmptyPulse(days: number): BusinessPulseData {
  const now = new Date();
  const labels: string[] = [];
  const revenue: number[] = [];
  const orders: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    revenue.push(0); // Zero, not random
    orders.push(0);  // Zero, not random
  }

  return { labels, revenue, orders };
}

/**
 * Empty focus state when seller has no listings
 */
function getEmptyFocus(): SellerFocus {
  return {
    id: 'add-listings',
    priority: 'high',
    title: 'Add your first product to start selling',
    titleAr: 'أضف منتجك الأول لبدء البيع',
    description: 'List products to receive quote requests from buyers',
    descriptionAr: 'أضف منتجات لاستقبال طلبات الأسعار من المشترين',
    ctaLabel: 'Add Product',
    ctaLabelAr: 'إضافة منتج',
    ctaRoute: 'listings',
    isEmpty: true,
  };
}

/**
 * Active seller focus - based on real data
 */
function getActiveFocus(pendingRfqCount: number): SellerFocus {
  if (pendingRfqCount > 0) {
    return {
      id: 'respond-rfqs',
      priority: 'high',
      title: `Respond to ${pendingRfqCount} pending RFQ${pendingRfqCount > 1 ? 's' : ''}`,
      titleAr: `رد على ${pendingRfqCount} طلب${pendingRfqCount > 1 ? 'ات' : ''} معلق`,
      description: 'Quick responses improve your conversion rate and seller ranking',
      descriptionAr: 'الردود السريعة تحسن نسبة التحويل وترتيبك كبائع',
      hint: 'Sellers who respond within 2 hours have higher win rates',
      hintAr: 'البائعون الذين يردون خلال ساعتين لديهم نسبة فوز أعلى',
      ctaLabel: 'Review RFQs',
      ctaLabelAr: 'مراجعة الطلبات',
      ctaRoute: 'rfqs',
      ctaFilter: 'pending',
      isEmpty: false,
    };
  }

  // Default: maintain listings
  return {
    id: 'maintain-listings',
    priority: 'low',
    title: 'Keep your listings up to date',
    titleAr: 'حافظ على تحديث منتجاتك',
    description: 'Accurate listings attract more buyers',
    descriptionAr: 'القوائم الدقيقة تجذب المزيد من المشترين',
    ctaLabel: 'View Listings',
    ctaLabelAr: 'عرض المنتجات',
    ctaRoute: 'listings',
    isEmpty: false,
  };
}

// Empty KPI state
const EMPTY_KPIS: SellerHomeKPIs = {
  revenue: 0,
  revenueChange: 0,
  activeOrders: 0,
  ordersNeedingAction: 0,
  rfqInbox: 0,
  newRfqs: 0,
  pendingPayout: 0,
  pendingCounterOffers: 0,
  currency: 'SAR',
};

// =============================================================================
// Service Implementation
// =============================================================================

const sellerHomeService = {
  /**
   * Get alerts for the seller dashboard
   * Returns real alerts based on database state
   */
  async getAlerts(sellerId: string): Promise<SellerAlert[]> {
    try {
      const alerts: SellerAlert[] = [];
      const now = new Date();

      // Check for actionable RFQs (direct + marketplace where seller quoted)
      const actionableRfqs = await prisma.itemRFQ.count({
        where: {
          OR: [
            { sellerId, status: { in: ['new', 'viewed', 'under_review'] } },
            { quotes: { some: { sellerId } }, status: { in: ['new', 'viewed', 'under_review'] } },
          ],
        },
      });

      if (actionableRfqs > 0) {
        alerts.push({
          id: 'rfq-waiting',
          type: 'rfq',
          severity: actionableRfqs > 5 ? 'critical' : 'warning',
          message: `You have ${actionableRfqs} RFQ${actionableRfqs > 1 ? 's' : ''} waiting for response`,
          messageAr: `لديك ${actionableRfqs} طلب${actionableRfqs > 1 ? 'ات' : ''} بانتظار الرد`,
          ctaLabel: 'View RFQs',
          ctaLabelAr: 'عرض الطلبات',
          ctaRoute: 'rfqs',
          count: actionableRfqs,
          createdAt: now.toISOString(),
        });
      }

      // Check for orders needing attention (pending confirmation)
      const ordersNeedingAction = await prisma.marketplaceOrder.count({
        where: { sellerId, status: 'pending_confirmation' },
      });

      if (ordersNeedingAction > 0) {
        alerts.push({
          id: 'orders-need-action',
          type: 'order',
          severity: ordersNeedingAction > 3 ? 'critical' : 'warning',
          message: `${ordersNeedingAction} order${ordersNeedingAction > 1 ? 's need' : ' needs'} confirmation`,
          messageAr: `${ordersNeedingAction} طلب${ordersNeedingAction > 1 ? 'ات تحتاج' : ' يحتاج'} للتأكيد`,
          ctaLabel: 'Review orders',
          ctaLabelAr: 'مراجعة الطلبات',
          ctaRoute: 'orders',
          count: ordersNeedingAction,
          createdAt: now.toISOString(),
        });
      }

      // Check for low stock items
      const lowStockItems = await prisma.item.count({
        where: { userId: sellerId, status: 'out_of_stock' },
      });

      if (lowStockItems > 0) {
        alerts.push({
          id: 'low-stock',
          type: 'order',
          severity: 'info',
          message: `${lowStockItems} item${lowStockItems > 1 ? 's are' : ' is'} out of stock`,
          messageAr: `${lowStockItems} منتج${lowStockItems > 1 ? 'ات نفدت' : ' نفد'} من المخزون`,
          ctaLabel: 'Update inventory',
          ctaLabelAr: 'تحديث المخزون',
          ctaRoute: 'listings',
          count: lowStockItems,
          createdAt: now.toISOString(),
        });
      }

      return alerts;
    } catch (error) {
      apiLogger.error('[SellerHomeService] Error getting alerts:', error);
      return []; // Return empty array, not mock data
    }
  },

  /**
   * Get the primary focus item for the seller
   * Based on real database state
   */
  async getFocus(sellerId: string): Promise<SellerFocus> {
    try {
      // Check if seller has any items
      const itemCount = await prisma.item.count({
        where: { userId: sellerId },
      });

      if (itemCount === 0) {
        return getEmptyFocus();
      }

      // Check for actionable RFQs to guide focus
      const actionableRfqs = await prisma.itemRFQ.count({
        where: {
          OR: [
            { sellerId, status: { in: ['new', 'viewed', 'under_review'] } },
            { quotes: { some: { sellerId } }, status: { in: ['new', 'viewed', 'under_review'] } },
          ],
        },
      });

      return getActiveFocus(actionableRfqs);
    } catch (error) {
      apiLogger.error('[SellerHomeService] Error getting focus:', error);
      return getEmptyFocus();
    }
  },

  /**
   * Get system health status
   */
  async getSystemHealth(sellerId: string): Promise<SystemHealth> {
    return {
      status: 'healthy',
      message: 'All systems normal',
      messageAr: 'جميع الأنظمة تعمل بشكل طبيعي',
      issues: [],
    };
  },

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(sellerId: string): Promise<OnboardingProgress | null> {
    try {
      const itemCount = await prisma.item.count({
        where: { userId: sellerId },
      });

      // If seller has items, assume onboarding is complete
      if (itemCount > 0) {
        return null;
      }

      return {
        isComplete: false,
        canPublish: false,
        completedSteps: 1,
        totalSteps: 4,
        steps: [
          { id: 'account', label: 'Create seller account', labelAr: 'إنشاء حساب البائع', completed: true },
          { id: 'profile', label: 'Complete business profile', labelAr: 'إكمال الملف التجاري', completed: false, ctaRoute: 'settings' },
          { id: 'verification', label: 'Submit verification documents', labelAr: 'تقديم وثائق التحقق', completed: false, ctaRoute: 'settings' },
          { id: 'listing', label: 'Add your first product', labelAr: 'إضافة منتجك الأول', completed: false, ctaRoute: 'listings' },
        ],
      };
    } catch {
      return null;
    }
  },

  /**
   * Get business pulse data from real orders
   */
  async getBusinessPulse(sellerId: string, days: number = 7): Promise<BusinessPulseData> {
    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      // Fetch orders for the period
      const orders = await prisma.marketplaceOrder.findMany({
        where: {
          sellerId,
          createdAt: { gte: startDate },
          status: { notIn: ['cancelled'] },
        },
        select: {
          totalPrice: true,
          createdAt: true,
        },
      });

      // Initialize arrays with zeros
      const labels: string[] = [];
      const revenue: number[] = [];
      const orderCounts: number[] = [];

      // Build day-by-day data
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

        // Calculate totals for this day
        const dayOrders = orders.filter(
          (o) => o.createdAt >= dayStart && o.createdAt <= dayEnd
        );

        revenue.push(dayOrders.reduce((sum, o) => sum + o.totalPrice, 0));
        orderCounts.push(dayOrders.length);
      }

      return { labels, revenue, orders: orderCounts };
    } catch (error) {
      apiLogger.error('[SellerHomeService] Error getting business pulse:', error);
      return getEmptyPulse(days);
    }
  },

  /**
   * Get complete seller home summary
   */
  async getSummary(sellerId: string, pulseDays: number = 7): Promise<SellerHomeSummary> {
    const [alerts, focus, systemHealth, onboarding, pulse, kpiData] = await Promise.all([
      this.getAlerts(sellerId),
      this.getFocus(sellerId),
      this.getSystemHealth(sellerId),
      this.getOnboardingProgress(sellerId),
      this.getBusinessPulse(sellerId, pulseDays),
      this.getKPIs(sellerId),
    ]);

    // Determine seller status
    let sellerStatus: SellerHomeSummary['sellerStatus'] = 'active';
    try {
      const itemCount = await prisma.item.count({ where: { userId: sellerId } });
      if (itemCount === 0) {
        sellerStatus = 'new';
      }
    } catch {
      // Fallback to active
    }

    return {
      kpis: kpiData,
      alerts,
      focus,
      systemHealth,
      onboarding,
      pulse,
      sellerStatus,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Get KPI data from real database
   */
  async getKPIs(sellerId: string): Promise<SellerHomeKPIs> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const twentyFourHoursAgo = new Date(now);
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const [
        currentRevenue,
        previousRevenue,
        activeOrders,
        ordersNeedingAction,
        totalRfqs,
        newRfqs,
        deliveredOrders,
        pendingCounterOffers,
      ] = await Promise.all([
        // Current period revenue (last 30 days)
        prisma.marketplaceOrder.aggregate({
          where: {
            sellerId,
            createdAt: { gte: thirtyDaysAgo },
            status: { notIn: ['cancelled'] },
          },
          _sum: { totalPrice: true },
        }),
        // Previous period revenue (30-60 days ago)
        prisma.marketplaceOrder.aggregate({
          where: {
            sellerId,
            createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
            status: { notIn: ['cancelled'] },
          },
          _sum: { totalPrice: true },
        }),
        // Active orders (not cancelled, not delivered)
        prisma.marketplaceOrder.count({
          where: {
            sellerId,
            status: { notIn: ['cancelled', 'delivered'] },
          },
        }),
        // Orders needing action (pending confirmation)
        prisma.marketplaceOrder.count({
          where: {
            sellerId,
            status: 'pending_confirmation',
          },
        }),
        // Total RFQs in inbox (all non-terminal statuses, direct + marketplace)
        prisma.itemRFQ.count({
          where: {
            OR: [
              { sellerId },
              { quotes: { some: { sellerId } } },
            ],
            status: { in: ['new', 'viewed', 'under_review', 'ignored', 'quoted', 'accepted', 'rejected'] },
            isArchived: false,
          },
        }),
        // New/unread RFQs needing response
        prisma.itemRFQ.count({
          where: {
            OR: [
              { sellerId },
              { quotes: { some: { sellerId } } },
            ],
            status: { in: ['new'] },
            isArchived: false,
          },
        }),
        // Delivered orders (for pending payout calculation)
        prisma.marketplaceOrder.aggregate({
          where: {
            sellerId,
            status: 'delivered',
            // Simplified: assume delivered orders without payout record are pending
          },
          _sum: { totalPrice: true },
        }),
        // Pending counter-offers on seller's quotes
        prisma.counterOffer.count({
          where: {
            status: 'pending',
            quote: { sellerId },
          },
        }),
      ]);

      const currentRevenueValue = currentRevenue._sum.totalPrice || 0;
      const previousRevenueValue = previousRevenue._sum.totalPrice || 0;

      // Calculate revenue change percentage
      let revenueChange = 0;
      if (previousRevenueValue > 0) {
        revenueChange = Math.round(
          ((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100
        );
      } else if (currentRevenueValue > 0) {
        revenueChange = 100; // New revenue from zero
      }

      return {
        revenue: currentRevenueValue,
        revenueChange,
        activeOrders,
        ordersNeedingAction,
        rfqInbox: totalRfqs,
        newRfqs,
        pendingPayout: deliveredOrders._sum.totalPrice || 0,
        pendingCounterOffers,
        currency: 'SAR',
      };
    } catch (error) {
      apiLogger.error('[SellerHomeService] Error getting KPIs:', error);
      return EMPTY_KPIS;
    }
  },
};

export default sellerHomeService;
