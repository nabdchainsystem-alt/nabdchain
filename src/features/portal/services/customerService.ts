// =============================================================================
// Customer Service - Frontend API Client for Customer Data
// =============================================================================

import { API_URL } from '../../../config/api';

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
  async getSellerCustomers(token: string, filters: CustomerFilters = {}): Promise<Customer[]> {
    const url = new URL(`${API_URL}/customers/seller`);

    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.sortBy) url.searchParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) url.searchParams.append('sortOrder', filters.sortOrder);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }

    return response.json();
  },

  /**
   * Get customer details with order history
   */
  async getCustomerDetails(token: string, customerId: string): Promise<CustomerDetails | null> {
    const response = await fetch(`${API_URL}/customers/seller/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch customer details');
    }

    return response.json();
  },
};

export default customerService;
