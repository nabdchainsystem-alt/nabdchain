// =============================================================================
// Marketplace Payment Service - Frontend API Client (Stage 6)
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  MarketplacePayment,
  PaymentFilters,
  PaymentsResponse,
  RecordPaymentData,
  RecordOrderPaymentData,
  ConfirmPaymentData,
  FailPaymentData,
} from '../types/invoice.types';

// =============================================================================
// Helper
// =============================================================================

function buildPaymentQS(filters: PaymentFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.invoiceId) p.append('invoiceId', filters.invoiceId);
  if (filters.dateFrom) p.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) p.append('dateTo', filters.dateTo);
  if (filters.page) p.append('page', filters.page.toString());
  if (filters.limit) p.append('limit', filters.limit.toString());
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Payment Service
// =============================================================================

export const marketplacePaymentService = {
  // ---------------------------------------------------------------------------
  // Invoice Payment Operations
  // ---------------------------------------------------------------------------

  async getInvoicePayments(invoiceId: string): Promise<MarketplacePayment[]> {
    return portalApiClient.get<MarketplacePayment[]>(`/api/payments/invoice/${invoiceId}`);
  },

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  async getBuyerPayments(filters: PaymentFilters = {}): Promise<PaymentsResponse> {
    return portalApiClient.get<PaymentsResponse>(`/api/payments/buyer${buildPaymentQS(filters)}`);
  },

  async recordPayment(data: RecordPaymentData): Promise<MarketplacePayment> {
    return portalApiClient.post<MarketplacePayment>(`/api/payments/buyer`, data);
  },

  async recordOrderPayment(orderId: string, data: RecordOrderPaymentData): Promise<MarketplacePayment> {
    return portalApiClient.post<MarketplacePayment>(`/api/items/orders/buyer/${orderId}/payments`, data);
  },

  async getBuyerPayment(paymentId: string): Promise<MarketplacePayment | null> {
    try {
      return await portalApiClient.get<MarketplacePayment>(`/api/payments/buyer/${paymentId}`);
    } catch {
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  async getSellerPayments(filters: PaymentFilters = {}): Promise<PaymentsResponse> {
    return portalApiClient.get<PaymentsResponse>(`/api/payments/seller${buildPaymentQS(filters)}`);
  },

  async getSellerPayment(paymentId: string): Promise<MarketplacePayment | null> {
    try {
      return await portalApiClient.get<MarketplacePayment>(`/api/payments/seller/${paymentId}`);
    } catch {
      return null;
    }
  },

  async confirmPayment(paymentId: string, data: ConfirmPaymentData = {}): Promise<MarketplacePayment> {
    return portalApiClient.post<MarketplacePayment>(`/api/payments/seller/${paymentId}/confirm`, data);
  },

  async failPayment(paymentId: string, data: FailPaymentData): Promise<MarketplacePayment> {
    return portalApiClient.post<MarketplacePayment>(`/api/payments/seller/${paymentId}/fail`, data);
  },

  async confirmCODPayment(orderId: string, data: { notes?: string } = {}): Promise<void> {
    await portalApiClient.post(`/api/orders/buyer/${orderId}/confirm-cod`, data);
  },
};

export default marketplacePaymentService;
