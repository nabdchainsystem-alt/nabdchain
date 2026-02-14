// =============================================================================
// Seller Home Summary Service
// Consolidates all seller home data into a single request
// =============================================================================

import { portalApiClient } from './portalApiClient';

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
  pendingCounterOffers: number;
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
    pendingCounterOffers: 0,
    currency: 'USD',
  },
  alerts: [],
  focus: {
    id: 'check-rfqs',
    priority: 'medium',
    title: 'Check your RFQ inbox',
    titleAr:
      '\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u0646\u062F\u0648\u0642 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0623\u0633\u0639\u0627\u0631',
    description: 'You have new quote requests waiting',
    descriptionAr:
      '\u0644\u062F\u064A\u0643 \u0637\u0644\u0628\u0627\u062A \u0623\u0633\u0639\u0627\u0631 \u062C\u062F\u064A\u062F\u0629 \u0641\u064A \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631',
    ctaLabel: 'View RFQs',
    ctaLabelAr: '\u0639\u0631\u0636 \u0627\u0644\u0637\u0644\u0628\u0627\u062A',
    ctaRoute: 'rfqs',
    isEmpty: false,
  },
  systemHealth: {
    status: 'healthy',
    message: 'All systems operational',
    messageAr: '\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u062A\u0639\u0645\u0644',
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
  async getSummary(days: number = 7): Promise<SellerHomeSummary> {
    const isDevMode = localStorage.getItem('nabd_dev_mode') === 'true';

    try {
      const data = await portalApiClient.get<SellerHomeSummary>(`/api/seller/home/summary?days=${days}`);

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
  async getAlerts(): Promise<SellerAlert[]> {
    return portalApiClient.get<SellerAlert[]>('/api/seller/home/alerts');
  },

  /**
   * Get focus item only
   */
  async getFocus(): Promise<SellerFocus> {
    return portalApiClient.get<SellerFocus>('/api/seller/home/focus');
  },

  /**
   * Get business pulse data
   */
  async getPulse(days: number = 7): Promise<BusinessPulseData> {
    return portalApiClient.get<BusinessPulseData>(`/api/seller/home/pulse?days=${days}`);
  },

  /**
   * Get system health
   */
  async getHealth(): Promise<SystemHealth> {
    return portalApiClient.get<SystemHealth>('/api/seller/home/health');
  },

  /**
   * Get onboarding progress
   */
  async getOnboarding(): Promise<OnboardingProgress | null> {
    return portalApiClient.get<OnboardingProgress | null>('/api/seller/home/onboarding');
  },

  // Mock data generators removed during service consolidation - backend is single source of truth.
  // See: docs/runbook/SERVICE_CONSOLIDATION_REPORT.md
  // All summary data must come from GET /api/seller/home/summary
};

// NOTE: getMockSummary() and getEmptySummary() removed during service consolidation.
// Backend handles empty state detection and returns appropriate response structure.

export default sellerHomeSummaryService;
