import type {
  Supplier,
  SupplierFilters,
  SupplierSortConfig,
  SuppliersResponse,
  SupplierSummary,
  SupplierEvaluationHistory,
} from '../types/supplier.types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Supplier Service
 * Handles all supplier-related API operations for buyers
 */
export const supplierService = {
  /**
   * Get paginated list of suppliers with filters
   */
  async getSuppliers(
    token: string,
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

    const response = await fetch(`${API_BASE}/api/buyer/suppliers?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get a single supplier by ID with full details
   */
  async getSupplier(token: string, supplierId: string): Promise<Supplier | null> {
    const response = await fetch(`${API_BASE}/api/buyer/suppliers/${supplierId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to fetch supplier: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get supplier summary statistics
   */
  async getSupplierSummary(token: string): Promise<SupplierSummary> {
    const response = await fetch(`${API_BASE}/api/buyer/suppliers/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch supplier summary: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get evaluation history for a supplier
   */
  async getEvaluationHistory(token: string, supplierId: string): Promise<SupplierEvaluationHistory[]> {
    const response = await fetch(`${API_BASE}/api/buyer/suppliers/${supplierId}/evaluations`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch evaluation history: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Export suppliers to CSV
   */
  async exportSuppliers(token: string, filters?: SupplierFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.tier?.length) params.append('tier', filters.tier.join(','));
    if (filters?.riskLevel?.length) params.append('riskLevel', filters.riskLevel.join(','));

    const response = await fetch(`${API_BASE}/api/buyer/suppliers/export?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export suppliers: ${response.statusText}`);
    }

    return response.blob();
  },
};

// NOTE: Mock data generators removed - see MOCK_REMOVAL_REPORT.md
// All supplier data must come from API. Frontend handles empty states gracefully.
