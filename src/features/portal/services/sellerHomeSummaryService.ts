// =============================================================================
// Seller Home Summary Service
// Consolidates all seller home data into a single request
// =============================================================================

import { API_URL } from '../../../config/api';

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

export interface FocusItem {
  id: string;
  type: 'rfq' | 'order' | 'listing' | 'payout' | 'verification';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  actionRoute: string;
  count?: number;
}

export interface BusinessPulseData {
  labels: string[];
  revenue: number[];
  orders: number[];
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
// Service
// =============================================================================

export const sellerHomeSummaryService = {
  /**
   * Get complete seller home summary in a single request
   * This consolidates KPIs, alerts, focus, pulse, health, and onboarding
   */
  async getSummary(token: string, days: number = 7): Promise<SellerHomeSummary> {
    const response = await fetch(`${API_URL}/seller/home/summary?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seller home summary');
    }

    return response.json();
  },

  /**
   * Get alerts only
   */
  async getAlerts(token: string): Promise<SellerAlert[]> {
    const response = await fetch(`${API_URL}/seller/home/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    return response.json();
  },

  /**
   * Get focus item only
   */
  async getFocus(token: string): Promise<SellerFocus> {
    const response = await fetch(`${API_URL}/seller/home/focus`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch focus');
    }

    return response.json();
  },

  /**
   * Get business pulse data
   */
  async getPulse(token: string, days: number = 7): Promise<BusinessPulseData> {
    const response = await fetch(`${API_URL}/seller/home/pulse?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pulse data');
    }

    return response.json();
  },

  /**
   * Get system health
   */
  async getHealth(token: string): Promise<SystemHealth> {
    const response = await fetch(`${API_URL}/seller/home/health`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch health');
    }

    return response.json();
  },

  /**
   * Get onboarding progress
   */
  async getOnboarding(token: string): Promise<OnboardingProgress | null> {
    const response = await fetch(`${API_URL}/seller/home/onboarding`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch onboarding');
    }

    return response.json();
  },

  /**
   * Generate mock summary data for development/fallback
   */
  getMockSummary(days: number = 7): SellerHomeSummary {
    const now = new Date();
    const labels = [];
    const revenue = [];
    const orders = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      revenue.push(Math.floor(Math.random() * 5000) + 1000);
      orders.push(Math.floor(Math.random() * 10) + 1);
    }

    return {
      kpis: {
        revenue: 24500,
        revenueChange: 12,
        activeOrders: 8,
        ordersNeedingAction: 2,
        rfqInbox: 15,
        newRfqs: 4,
        pendingPayout: 8750,
        currency: 'SAR',
      },
      alerts: [
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
      ],
      focus: {
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
      },
      systemHealth: {
        status: 'healthy',
        message: 'All systems normal',
        messageAr: 'جميع الأنظمة تعمل بشكل طبيعي',
        issues: [],
      },
      onboarding: null,
      pulse: {
        labels,
        revenue,
        orders,
      },
      sellerStatus: 'active',
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Generate empty state summary for new sellers
   */
  getEmptySummary(): SellerHomeSummary {
    const now = new Date();
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    return {
      kpis: {
        revenue: 0,
        revenueChange: 0,
        activeOrders: 0,
        ordersNeedingAction: 0,
        rfqInbox: 0,
        newRfqs: 0,
        pendingPayout: 0,
        currency: 'SAR',
      },
      alerts: [],
      focus: {
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
      },
      systemHealth: {
        status: 'healthy',
        message: 'All systems normal',
        messageAr: 'جميع الأنظمة تعمل بشكل طبيعي',
        issues: [],
      },
      onboarding: {
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
      },
      pulse: {
        labels,
        revenue: Array(7).fill(0),
        orders: Array(7).fill(0),
      },
      sellerStatus: 'new',
      lastUpdated: new Date().toISOString(),
    };
  },
};

export default sellerHomeSummaryService;
