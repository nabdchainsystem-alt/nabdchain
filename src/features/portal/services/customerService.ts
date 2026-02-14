// =============================================================================
// Customer Service - Frontend API Client for Customer Data
// =============================================================================

import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  totalOrders: number;
  totalSpend: number;
  currency: string;
  lastOrderDate: string | null;
  firstOrderDate: string | null;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface CustomerDetails extends Customer {
  orders: CustomerOrder[];
}

export interface CustomerFilters {
  search?: string;
  sortBy?: 'name' | 'totalOrders' | 'totalSpend' | 'lastOrderDate';
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Customer Service
// =============================================================================

export const customerService = {
  /**
   * Get all customers for the authenticated seller
   */
  async getSellerCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const qs = params.toString();
    return portalApiClient.get<Customer[]>(`/api/customers/seller${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get customer details with order history
   */
  async getCustomerDetails(customerId: string): Promise<CustomerDetails | null> {
    try {
      return await portalApiClient.get<CustomerDetails>(`/api/customers/seller/${customerId}`);
    } catch {
      // Return null on 404 or any error fetching details
      return null;
    }
  },
};

export default customerService;
