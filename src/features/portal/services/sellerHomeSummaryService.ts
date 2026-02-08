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

// Mock data for dev mode role switching
const getMockSellerSummary = (days: number): SellerHomeSummary => ({
  kpis: {
    revenue: 0,
    revenueChange: 0,
    activeOrders: 0,
    ordersNeedingAction: 0,
    rfqInbox: 1,
    newRfqs: 1,
    pendingPayout: 0,
    currency: 'USD',
  },
  alerts: [],
  focus: {
    id: 'check-rfqs',
    priority: 'medium',
    title: 'Check your RFQ inbox',
    titleAr: 'تحقق من صندوق طلبات الأسعار',
    description: 'You have new quote requests waiting',
    descriptionAr: 'لديك طلبات أسعار جديدة في الانتظار',
    ctaLabel: 'View RFQs',
    ctaLabelAr: 'عرض الطلبات',
    ctaRoute: 'rfqs',
    isEmpty: false,
  },
  systemHealth: {
    status: 'healthy',
    message: 'All systems operational',
    messageAr: 'جميع الأنظمة تعمل',
    issues: [],
  },
  onboarding: null,
  pulse: {
    labels: Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    }),
    revenue: Array(days).fill(0),
    orders: Array(days).fill(0),
  },
  sellerStatus: 'active',
  lastUpdated: new Date().toISOString(),
});

export const sellerHomeSummaryService = {
  /**
   * Get complete seller home summary in a single request
   * This consolidates KPIs, alerts, focus, pulse, health, and onboarding
   */
  async getSummary(token: string, days: number = 7): Promise<SellerHomeSummary> {
    const isDevMode = localStorage.getItem('nabd_dev_mode') === 'true';

    try {
      const response = await fetch(`${API_URL}/seller/home/summary?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // In dev mode, return mock data if API fails
        if (isDevMode) {
          return getMockSellerSummary(days);
        }
        throw new Error('Failed to fetch seller home summary');
      }

      const data = await response.json();

      // In dev mode, if user appears as "new" seller (from role switch), show active view
      if (isDevMode && data.sellerStatus === 'new') {
        return getMockSellerSummary(days);
      }

      return data;
    } catch (error) {
      // In dev mode, return mock data on any error
      if (isDevMode) {
        return getMockSellerSummary(days);
      }
      throw error;
    }
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

  // Mock data generators removed during service consolidation - backend is single source of truth.
  // See: docs/runbook/SERVICE_CONSOLIDATION_REPORT.md
  // All summary data must come from GET /api/seller/home/summary
};

// NOTE: getMockSummary() and getEmptySummary() removed during service consolidation.
// Backend handles empty state detection and returns appropriate response structure.

export default sellerHomeSummaryService;
