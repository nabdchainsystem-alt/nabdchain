// =============================================================================
// Marketplace Payment Service - Frontend API Client (Stage 6)
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  MarketplacePayment,
  PaymentFilters,
  PaymentsResponse,
  RecordPaymentData,
  ConfirmPaymentData,
  FailPaymentData,
} from '../types/invoice.types';

// =============================================================================
// Payment Service
// =============================================================================

export const marketplacePaymentService = {
  // ---------------------------------------------------------------------------
  // Invoice Payment Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all payments for an invoice
   */
  async getInvoicePayments(token: string, invoiceId: string): Promise<MarketplacePayment[]> {
    const response = await fetch(`${API_URL}/payments/invoice/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch payments');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all payments for the authenticated buyer
   */
  async getBuyerPayments(
    token: string,
    filters: PaymentFilters = {}
  ): Promise<PaymentsResponse> {
    const url = new URL(`${API_URL}/payments/buyer`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.invoiceId) url.searchParams.append('invoiceId', filters.invoiceId);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch payments');
    }

    return response.json();
  },

  /**
   * Record a payment (buyer provides bank transfer reference)
   */
  async recordPayment(token: string, data: RecordPaymentData): Promise<MarketplacePayment> {
    const response = await fetch(`${API_URL}/payments/buyer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to record payment');
    }

    return response.json();
  },

  /**
   * Get single payment for buyer
   */
  async getBuyerPayment(token: string, paymentId: string): Promise<MarketplacePayment | null> {
    const response = await fetch(`${API_URL}/payments/buyer/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch payment');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all payments for the authenticated seller
   */
  async getSellerPayments(
    token: string,
    filters: PaymentFilters = {}
  ): Promise<PaymentsResponse> {
    const url = new URL(`${API_URL}/payments/seller`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.invoiceId) url.searchParams.append('invoiceId', filters.invoiceId);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch payments');
    }

    return response.json();
  },

  /**
   * Get single payment for seller
   */
  async getSellerPayment(token: string, paymentId: string): Promise<MarketplacePayment | null> {
    const response = await fetch(`${API_URL}/payments/seller/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch payment');
    }

    return response.json();
  },

  /**
   * Confirm a payment (seller verifies bank transfer received)
   */
  async confirmPayment(
    token: string,
    paymentId: string,
    data: ConfirmPaymentData = {}
  ): Promise<MarketplacePayment> {
    const response = await fetch(`${API_URL}/payments/seller/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to confirm payment');
    }

    return response.json();
  },

  /**
   * Mark a payment as failed
   */
  async failPayment(
    token: string,
    paymentId: string,
    data: FailPaymentData
  ): Promise<MarketplacePayment> {
    const response = await fetch(`${API_URL}/payments/seller/${paymentId}/fail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update payment');
    }

    return response.json();
  },
};

export default marketplacePaymentService;
