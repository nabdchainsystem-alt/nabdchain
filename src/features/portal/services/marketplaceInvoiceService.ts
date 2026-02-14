// =============================================================================
// Marketplace Invoice Service - Frontend API Client (Stage 6)
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  MarketplaceInvoice,
  InvoiceStats,
  InvoiceFilters,
  InvoicesResponse,
  InvoiceEvent,
} from '../types/invoice.types';

// =============================================================================
// Helper
// =============================================================================

function buildInvoiceQS(filters: InvoiceFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.dateFrom) p.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) p.append('dateTo', filters.dateTo);
  if (filters.search) p.append('search', filters.search);
  if (filters.overdueOnly) p.append('overdueOnly', 'true');
  if (filters.page) p.append('page', filters.page.toString());
  if (filters.limit) p.append('limit', filters.limit.toString());
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Invoice Service
// =============================================================================

export const marketplaceInvoiceService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  async getSellerInvoices(filters: InvoiceFilters = {}): Promise<InvoicesResponse> {
    return portalApiClient.get<InvoicesResponse>(`/api/invoices/seller${buildInvoiceQS(filters)}`);
  },

  async getSellerInvoiceStats(): Promise<InvoiceStats> {
    return portalApiClient.get<InvoiceStats>(`/api/invoices/seller/stats`);
  },

  async getSellerInvoice(invoiceId: string): Promise<MarketplaceInvoice | null> {
    try {
      return await portalApiClient.get<MarketplaceInvoice>(`/api/invoices/seller/${invoiceId}`);
    } catch {
      return null;
    }
  },

  async issueInvoice(invoiceId: string): Promise<MarketplaceInvoice> {
    return portalApiClient.post<MarketplaceInvoice>(`/api/invoices/seller/${invoiceId}/issue`);
  },

  async cancelInvoice(invoiceId: string, reason: string): Promise<MarketplaceInvoice> {
    return portalApiClient.post<MarketplaceInvoice>(`/api/invoices/seller/${invoiceId}/cancel`, { reason });
  },

  async getInvoiceHistory(invoiceId: string): Promise<InvoiceEvent[]> {
    return portalApiClient.get<InvoiceEvent[]>(`/api/invoices/seller/${invoiceId}/history`);
  },

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  async getBuyerInvoices(filters: InvoiceFilters = {}): Promise<InvoicesResponse> {
    return portalApiClient.get<InvoicesResponse>(`/api/invoices/buyer${buildInvoiceQS(filters)}`);
  },

  async getBuyerInvoiceStats(): Promise<InvoiceStats> {
    return portalApiClient.get<InvoiceStats>(`/api/invoices/buyer/stats`);
  },

  async getBuyerInvoice(invoiceId: string): Promise<MarketplaceInvoice | null> {
    try {
      return await portalApiClient.get<MarketplaceInvoice>(`/api/invoices/buyer/${invoiceId}`);
    } catch {
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // Order-based Operations
  // ---------------------------------------------------------------------------

  async getInvoiceByOrder(orderId: string): Promise<MarketplaceInvoice | null> {
    try {
      return await portalApiClient.get<MarketplaceInvoice>(`/api/invoices/order/${orderId}`);
    } catch {
      return null;
    }
  },

  async generateInvoice(orderId: string): Promise<MarketplaceInvoice> {
    return portalApiClient.post<MarketplaceInvoice>(`/api/invoices/generate/${orderId}`);
  },

  // ---------------------------------------------------------------------------
  // PDF Operations
  // ---------------------------------------------------------------------------

  /**
   * Download invoice PDF.
   * Fetches the PDF blob with auth and triggers a browser download.
   */
  async downloadPdf(invoiceId: string, invoiceNumber?: string): Promise<void> {
    const token = portalApiClient.getAccessToken();
    const url = `${portalApiClient.baseUrl}/api/invoices/${invoiceId}/pdf`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as { error?: string }).error || 'Failed to download PDF');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = invoiceNumber ? `${invoiceNumber}.pdf` : 'invoice.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },
};

export default marketplaceInvoiceService;
