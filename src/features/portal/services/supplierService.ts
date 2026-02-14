import { portalApiClient } from './portalApiClient';
import type {
  Supplier,
  SupplierFilters,
  SupplierSortConfig,
  SuppliersResponse,
  SupplierSummary,
  SupplierEvaluationHistory,
} from '../types/supplier.types';

/**
 * Supplier Service
 * Handles all supplier-related API operations for buyers
 */
export const supplierService = {
  async getSuppliers(
    filters?: SupplierFilters,
    sort?: SupplierSortConfig,
    page = 1,
    pageSize = 20,
  ): Promise<SuppliersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.tier?.length) params.append('tier', filters.tier.join(','));
    if (filters?.riskLevel?.length) params.append('riskLevel', filters.riskLevel.join(','));
    if (filters?.categories?.length) params.append('categories', filters.categories.join(','));
    if (filters?.minReliabilityScore !== undefined) {
      params.append('minReliabilityScore', filters.minReliabilityScore.toString());
    }
    if (filters?.maxDependency !== undefined) {
      params.append('maxDependency', filters.maxDependency.toString());
    }

    if (sort) {
      params.append('sortField', sort.field);
      params.append('sortDirection', sort.direction);
    }

    return portalApiClient.get<SuppliersResponse>(`/api/buyer/suppliers?${params}`);
  },

  async getSupplier(supplierId: string): Promise<Supplier | null> {
    try {
      return await portalApiClient.get<Supplier>(`/api/buyer/suppliers/${supplierId}`);
    } catch {
      return null;
    }
  },

  async getSupplierSummary(): Promise<SupplierSummary> {
    return portalApiClient.get<SupplierSummary>(`/api/buyer/suppliers/summary`);
  },

  async getEvaluationHistory(supplierId: string): Promise<SupplierEvaluationHistory[]> {
    return portalApiClient.get<SupplierEvaluationHistory[]>(`/api/buyer/suppliers/${supplierId}/evaluations`);
  },

  async exportSuppliers(filters?: SupplierFilters): Promise<Blob> {
    // Blob response requires raw fetch (portalApiClient parses JSON)
    const params = new URLSearchParams();
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.tier?.length) params.append('tier', filters.tier.join(','));
    if (filters?.riskLevel?.length) params.append('riskLevel', filters.riskLevel.join(','));

    const token = portalApiClient.getAccessToken();
    const response = await fetch(`${portalApiClient.baseUrl}/api/buyer/suppliers/export?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to export suppliers: ${response.statusText}`);
    }

    return response.blob();
  },
};
