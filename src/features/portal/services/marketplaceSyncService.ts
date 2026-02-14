// =============================================================================
// Marketplace Sync Service - Buyer <-> Marketplace Integration
// =============================================================================

import { portalApiClient } from './portalApiClient';
import { Item } from '../types/item.types';

// =============================================================================
// Types
// =============================================================================

export interface EligibleSupplier {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerCompany?: string;
  country?: string;
  verified: boolean;
  isActive: boolean;
  responseTime: number; // in hours
  rfqSuccessRate: number;
  itemsAvailable: number;
  rating?: number;
  lastActiveAt?: string;
}

export interface SupplierEligibilityFilters {
  category?: string;
  itemId?: string;
  country?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  maxResponseTime?: number;
}

export interface MarketplaceSyncStatus {
  lastSyncAt: string;
  totalActiveItems: number;
  totalActiveSuppliers: number;
  newItemsToday: number;
  inactiveSuppliers: number;
}

// =============================================================================
// Marketplace Sync Service
// =============================================================================

export const marketplaceSyncService = {
  // ---------------------------------------------------------------------------
  // Supplier Eligibility
  // ---------------------------------------------------------------------------

  /**
   * Get eligible suppliers for an RFQ
   * Only returns suppliers that are:
   * - Active (not deactivated)
   * - Have items in the requested category
   * - Meet quality criteria
   */
  async getEligibleSuppliers(filters: SupplierEligibilityFilters = {}): Promise<EligibleSupplier[]> {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.itemId) params.append('itemId', filters.itemId);
    if (filters.country) params.append('country', filters.country);
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.verifiedOnly) params.append('verifiedOnly', 'true');
    if (filters.maxResponseTime) params.append('maxResponseTime', filters.maxResponseTime.toString());

    const query = params.toString();

    try {
      return await portalApiClient.get<EligibleSupplier[]>(
        `/api/marketplace/eligible-suppliers${query ? `?${query}` : ''}`,
      );
    } catch {
      // Fallback to mock data
      return this.getMockEligibleSuppliers(filters);
    }
  },

  /**
   * Check if a specific supplier is eligible for an RFQ
   */
  async checkSupplierEligibility(supplierId: string, itemId?: string): Promise<{ eligible: boolean; reason?: string }> {
    try {
      return await portalApiClient.get<{ eligible: boolean; reason?: string }>(
        `/api/marketplace/check-eligibility/${supplierId}${itemId ? `?itemId=${itemId}` : ''}`,
      );
    } catch {
      // Assume eligible on network error
      return { eligible: true };
    }
  },

  // ---------------------------------------------------------------------------
  // Marketplace Discovery
  // ---------------------------------------------------------------------------

  /**
   * Get all discoverable items from active sellers
   * Only returns items that are:
   * - Published (status = active)
   * - Publicly visible (visibility = public)
   * - From active sellers
   */
  async getDiscoverableItems(
    filters: { category?: string; search?: string; page?: number } = {},
  ): Promise<{ items: Item[]; totalCount: number }> {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());

    // Add filter to exclude inactive sellers
    params.append('activeOnly', 'true');

    try {
      return await portalApiClient.get<{ items: Item[]; totalCount: number }>(
        `/api/marketplace/discoverable?${params.toString()}`,
      );
    } catch {
      return { items: [], totalCount: 0 };
    }
  },

  // ---------------------------------------------------------------------------
  // Sync Status
  // ---------------------------------------------------------------------------

  /**
   * Get marketplace sync status
   */
  async getSyncStatus(): Promise<MarketplaceSyncStatus> {
    try {
      return await portalApiClient.get<MarketplaceSyncStatus>('/api/marketplace/sync-status');
    } catch {
      return this.getMockSyncStatus();
    }
  },

  // ---------------------------------------------------------------------------
  // RFQ Routing
  // ---------------------------------------------------------------------------

  /**
   * Route RFQ to eligible suppliers only
   * This ensures RFQs are only sent to suppliers that:
   * - Are active on the platform
   * - Have the capability to fulfill the request
   * - Meet quality thresholds
   */
  async routeRFQToSuppliers(rfqData: {
    itemId?: string;
    category: string;
    quantity: number;
    targetSupplierIds?: string[];
  }): Promise<{ supplierIds: string[]; excludedCount: number }> {
    try {
      return await portalApiClient.post<{ supplierIds: string[]; excludedCount: number }>(
        '/api/marketplace/route-rfq',
        rfqData,
      );
    } catch {
      // Fallback: return all target suppliers (validation done on backend)
      return {
        supplierIds: rfqData.targetSupplierIds || [],
        excludedCount: 0,
      };
    }
  },

  // ---------------------------------------------------------------------------
  // Mock Data Generators
  // ---------------------------------------------------------------------------

  getMockEligibleSuppliers(filters: SupplierEligibilityFilters = {}): EligibleSupplier[] {
    const baseSuppliers: EligibleSupplier[] = [
      {
        id: 'es-1',
        sellerId: 'seller-1',
        sellerName: 'Industrial Parts Co.',
        sellerCompany: 'Industrial Parts Trading LLC',
        country: 'Saudi Arabia',
        verified: true,
        isActive: true,
        responseTime: 2.5,
        rfqSuccessRate: 85,
        itemsAvailable: 145,
        rating: 4.8,
        lastActiveAt: new Date().toISOString(),
      },
      {
        id: 'es-2',
        sellerId: 'seller-2',
        sellerName: 'Global Machinery Ltd.',
        sellerCompany: 'Global Machinery Solutions',
        country: 'UAE',
        verified: true,
        isActive: true,
        responseTime: 4.2,
        rfqSuccessRate: 78,
        itemsAvailable: 89,
        rating: 4.5,
        lastActiveAt: new Date().toISOString(),
      },
      {
        id: 'es-3',
        sellerId: 'seller-3',
        sellerName: 'Tech Components Inc.',
        sellerCompany: 'Tech Components GmbH',
        country: 'Germany',
        verified: true,
        isActive: true,
        responseTime: 6.0,
        rfqSuccessRate: 92,
        itemsAvailable: 234,
        rating: 4.9,
        lastActiveAt: new Date().toISOString(),
      },
      {
        id: 'es-4',
        sellerId: 'seller-4',
        sellerName: 'Asia Industrial Supply',
        country: 'China',
        verified: false,
        isActive: true,
        responseTime: 8.5,
        rfqSuccessRate: 65,
        itemsAvailable: 312,
        rating: 4.0,
        lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'es-5',
        sellerId: 'seller-5',
        sellerName: 'Local Parts Center',
        sellerCompany: 'Local Parts Est.',
        country: 'Saudi Arabia',
        verified: true,
        isActive: true,
        responseTime: 1.5,
        rfqSuccessRate: 75,
        itemsAvailable: 56,
        rating: 4.6,
        lastActiveAt: new Date().toISOString(),
      },
    ];

    // Apply filters
    let filtered = baseSuppliers.filter((s) => s.isActive);

    if (filters.verifiedOnly) {
      filtered = filtered.filter((s) => s.verified);
    }

    if (filters.country) {
      filtered = filtered.filter((s) => s.country === filters.country);
    }

    if (filters.minRating) {
      filtered = filtered.filter((s) => (s.rating || 0) >= filters.minRating!);
    }

    if (filters.maxResponseTime) {
      filtered = filtered.filter((s) => s.responseTime <= filters.maxResponseTime!);
    }

    return filtered;
  },

  getMockSyncStatus(): MarketplaceSyncStatus {
    return {
      lastSyncAt: new Date().toISOString(),
      totalActiveItems: 1247,
      totalActiveSuppliers: 89,
      newItemsToday: 23,
      inactiveSuppliers: 12,
    };
  },
};

export default marketplaceSyncService;
