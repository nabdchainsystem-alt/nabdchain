// =============================================================================
// Seller Home Service - Aggregated Dashboard Data
// =============================================================================
// Note: This service returns mock data as some Prisma models are not yet created.
// The frontend gracefully falls back to mock data when backend fails.

import { prisma } from '../lib/prisma';

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
// Mock Data Generators
// =============================================================================

function generateMockPulse(days: number): BusinessPulseData {
  const now = new Date();
  const labels: string[] = [];
  const revenue: number[] = [];
  const orders: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    revenue.push(Math.floor(Math.random() * 5000) + 1000);
    orders.push(Math.floor(Math.random() * 10) + 1);
  }

  return { labels, revenue, orders };
}

function generateMockAlerts(): SellerAlert[] {
  const now = new Date();
  return [
    {
      id: 'rfq-waiting',
      type: 'rfq',
      severity: 'warning',
      message: 'You have 2 RFQs waiting for response',
      messageAr: 'لديك 2 طلبات بانتظار الرد',
      ctaLabel: 'View RFQs',
      ctaLabelAr: 'عرض الطلبات',
      ctaRoute: 'rfqs',
      count: 2,
      createdAt: now.toISOString(),
    },
    {
      id: 'orders-at-risk',
      type: 'order',
      severity: 'critical',
      message: '1 order is at risk of delay',
      messageAr: '1 طلب معرض للتأخير',
      ctaLabel: 'Review order',
      ctaLabelAr: 'مراجعة الطلب',
      ctaRoute: 'orders',
      count: 1,
      createdAt: now.toISOString(),
    },
  ];
}

function generateMockFocus(): SellerFocus {
  return {
    id: 'respond-rfqs',
    priority: 'high',
    title: 'Respond to 4 RFQs to increase win rate',
    titleAr: 'رد على 4 طلبات لزيادة نسبة الفوز',
    description: 'Quick responses improve your conversion rate and seller ranking',
    descriptionAr: 'الردود السريعة تحسن نسبة التحويل وترتيبك كبائع',
    hint: 'Sellers who respond within 2 hours have 40% higher win rates',
    hintAr: 'البائعون الذين يردون خلال ساعتين لديهم نسبة فوز أعلى بـ 40%',
    ctaLabel: 'Review RFQs',
    ctaLabelAr: 'مراجعة الطلبات',
    ctaRoute: 'rfqs',
    ctaFilter: 'unread',
    isEmpty: false,
  };
}

function generateEmptyFocus(): SellerFocus {
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

// =============================================================================
// Service Implementation
// =============================================================================

const sellerHomeService = {
  /**
   * Get alerts for the seller dashboard
   */
  async getAlerts(sellerId: string): Promise<SellerAlert[]> {
    // Return mock data - real implementation requires additional Prisma models
    return generateMockAlerts();
  },

  /**
   * Get the primary focus item for the seller
   */
  async getFocus(sellerId: string): Promise<SellerFocus> {
    try {
      // Check if seller has any items
      const itemCount = await prisma.item.count({
        where: { userId: sellerId },
      });

      if (itemCount === 0) {
        return generateEmptyFocus();
      }

      return generateMockFocus();
    } catch {
      return generateMockFocus();
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
   * Get business pulse data
   */
  async getBusinessPulse(sellerId: string, days: number = 7): Promise<BusinessPulseData> {
    return generateMockPulse(days);
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
   * Get KPI data
   */
  async getKPIs(sellerId: string): Promise<SellerHomeKPIs> {
    // Mock KPIs - real implementation requires MarketplaceOrder, Payout, RfqResponse models
    return {
      revenue: 24500,
      revenueChange: 12,
      activeOrders: 8,
      ordersNeedingAction: 2,
      rfqInbox: 15,
      newRfqs: 4,
      pendingPayout: 8750,
      currency: 'SAR',
    };
  },
};

export default sellerHomeService;
