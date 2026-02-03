// =============================================================================
// Marketplace Invoice Service - Frontend API Client (Stage 6)
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  MarketplaceInvoice,
  InvoiceStats,
  InvoiceFilters,
  InvoicesResponse,
  InvoiceEvent,
} from '../types/invoice.types';

// =============================================================================
// Invoice Service
// =============================================================================

export const marketplaceInvoiceService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all invoices for the authenticated seller
   */
  async getSellerInvoices(
    token: string,
    filters: InvoiceFilters = {}
  ): Promise<InvoicesResponse> {
    const url = new URL(`${API_URL}/invoices/seller`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.overdueOnly) url.searchParams.append('overdueOnly', 'true');
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoices');
    }

    return response.json();
  },

  /**
   * Get seller invoice statistics
   */
  async getSellerInvoiceStats(token: string): Promise<InvoiceStats> {
    const response = await fetch(`${API_URL}/invoices/seller/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoice statistics');
    }

    return response.json();
  },

  /**
   * Get single invoice for seller
   */
  async getSellerInvoice(token: string, invoiceId: string): Promise<MarketplaceInvoice | null> {
    const response = await fetch(`${API_URL}/invoices/seller/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoice');
    }

    return response.json();
  },

  /**
   * Issue an invoice (freeze content, start payment terms)
   */
  async issueInvoice(token: string, invoiceId: string): Promise<MarketplaceInvoice> {
    const response = await fetch(`${API_URL}/invoices/seller/${invoiceId}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to issue invoice');
    }

    return response.json();
  },

  /**
   * Cancel a draft invoice
   */
  async cancelInvoice(token: string, invoiceId: string, reason: string): Promise<MarketplaceInvoice> {
    const response = await fetch(`${API_URL}/invoices/seller/${invoiceId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to cancel invoice');
    }

    return response.json();
  },

  /**
   * Get invoice event history
   */
  async getInvoiceHistory(token: string, invoiceId: string): Promise<InvoiceEvent[]> {
    const response = await fetch(`${API_URL}/invoices/seller/${invoiceId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoice history');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all invoices for the authenticated buyer
   */
  async getBuyerInvoices(
    token: string,
    filters: InvoiceFilters = {}
  ): Promise<InvoicesResponse> {
    const url = new URL(`${API_URL}/invoices/buyer`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.overdueOnly) url.searchParams.append('overdueOnly', 'true');
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoices');
    }

    return response.json();
  },

  /**
   * Get buyer invoice statistics
   */
  async getBuyerInvoiceStats(token: string): Promise<InvoiceStats> {
    const response = await fetch(`${API_URL}/invoices/buyer/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoice statistics');
    }

    return response.json();
  },

  /**
   * Get single invoice for buyer
   */
  async getBuyerInvoice(token: string, invoiceId: string): Promise<MarketplaceInvoice | null> {
    const response = await fetch(`${API_URL}/invoices/buyer/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoice');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Order-based Operations
  // ---------------------------------------------------------------------------

  /**
   * Get invoice for a specific order
   */
  async getInvoiceByOrder(token: string, orderId: string): Promise<MarketplaceInvoice | null> {
    const response = await fetch(`${API_URL}/invoices/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch invoice');
    }

    return response.json();
  },

  /**
   * Manually generate invoice for an order
   */
  async generateInvoice(token: string, orderId: string): Promise<MarketplaceInvoice> {
    const response = await fetch(`${API_URL}/invoices/generate/${orderId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to generate invoice');
    }

    return response.json();
  },
};

export default marketplaceInvoiceService;
