// =============================================================================
// Marketplace Order Service - Frontend API Client (Stage 4)
// =============================================================================
// Handles quote acceptance → order creation and order management
// =============================================================================

import { portalApiClient } from './portalApiClient';
import { portalApiLogger } from '../../../utils/logger';
import {
  MarketplaceOrder,
  OrderAuditEvent,
  AcceptQuoteData,
  RejectQuoteData,
  OrderFilters,
  OrdersResponse,
  OrderStats,
  // Stage 5: Fulfillment types
  RejectOrderData,
  StartProcessingData,
  ShipOrderData,
  MarkDeliveredData,
  CancelOrderData,
  UpdateTrackingData,
} from '../types/item.types';

// =============================================================================
// Helper: build query string from filters
// =============================================================================

function buildOrderQS(filters: OrderFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.source) p.append('source', filters.source);
  if (filters.page) p.append('page', filters.page.toString());
  if (filters.limit) p.append('limit', filters.limit.toString());
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Marketplace Order Service
// =============================================================================

export const marketplaceOrderService = {
  /**
   * Accept a quote and create an order (Buyer action)
   */
  async acceptQuote(quoteId: string, data: AcceptQuoteData = {}): Promise<MarketplaceOrder> {
    const idempotencyKey = `accept-quote-${quoteId}-${Date.now()}`;

    if (import.meta.env.DEV) {
      portalApiLogger.debug(`[MarketplaceOrder] acceptQuote`, { quoteId, data });
    }

    return portalApiClient.post<MarketplaceOrder>(`/api/items/quotes/${quoteId}/accept`, data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  },

  /**
   * Reject a quote (Buyer action)
   */
  async rejectQuote(quoteId: string, data: RejectQuoteData): Promise<void> {
    await portalApiClient.post(`/api/items/quotes/${quoteId}/reject`, data);
  },

  /**
   * Get orders for the buyer
   */
  async getBuyerOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    return portalApiClient.get<OrdersResponse>(`/api/items/orders/buyer${buildOrderQS(filters)}`);
  },

  /**
   * Get orders for the seller
   */
  async getSellerOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    return portalApiClient.get<OrdersResponse>(`/api/items/orders/seller${buildOrderQS(filters)}`);
  },

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: string): Promise<MarketplaceOrder | null> {
    try {
      return await portalApiClient.get<MarketplaceOrder>(`/api/items/orders/${orderId}`);
    } catch {
      return null;
    }
  },

  /**
   * Get audit history for an order
   */
  async getOrderHistory(orderId: string): Promise<OrderAuditEvent[]> {
    try {
      return await portalApiClient.get<OrderAuditEvent[]>(`/api/items/orders/${orderId}/history`);
    } catch {
      return [];
    }
  },

  /**
   * Seller confirms an order (pending_confirmation -> confirmed)
   */
  async confirmOrder(orderId: string): Promise<MarketplaceOrder | null> {
    try {
      return await portalApiClient.post<MarketplaceOrder>(`/api/items/orders/${orderId}/confirm`);
    } catch {
      return null;
    }
  },

  /**
   * Get order statistics for buyer
   */
  async getBuyerOrderStats(): Promise<OrderStats> {
    return portalApiClient.get<OrderStats>(`/api/items/orders/stats/buyer`);
  },

  /**
   * Get order statistics for seller
   */
  async getSellerOrderStats(): Promise<OrderStats> {
    return portalApiClient.get<OrderStats>(`/api/items/orders/stats/seller`);
  },

  // ==========================================================================
  // Stage 5: Order Fulfillment Methods
  // ==========================================================================

  async rejectOrder(orderId: string, data: RejectOrderData): Promise<MarketplaceOrder> {
    return portalApiClient.post<MarketplaceOrder>(`/api/items/orders/${orderId}/reject`, data);
  },

  async startProcessing(orderId: string, data: StartProcessingData = {}): Promise<MarketplaceOrder> {
    return portalApiClient.post<MarketplaceOrder>(`/api/items/orders/${orderId}/process`, data);
  },

  async shipOrder(orderId: string, data: ShipOrderData): Promise<MarketplaceOrder> {
    return portalApiClient.post<MarketplaceOrder>(`/api/items/orders/${orderId}/ship`, data);
  },

  async markDelivered(orderId: string, data: MarkDeliveredData = {}): Promise<MarketplaceOrder> {
    return portalApiClient.post<MarketplaceOrder>(`/api/items/orders/${orderId}/deliver`, data);
  },

  async closeOrder(orderId: string): Promise<MarketplaceOrder> {
    return portalApiClient.post<MarketplaceOrder>(`/api/items/orders/${orderId}/close`);
  },

  async cancelOrder(orderId: string, data: CancelOrderData): Promise<MarketplaceOrder> {
    return portalApiClient.post<MarketplaceOrder>(`/api/items/orders/${orderId}/cancel`, data);
  },

  async updateTracking(orderId: string, data: UpdateTrackingData): Promise<MarketplaceOrder> {
    return portalApiClient.patch<MarketplaceOrder>(`/api/items/orders/${orderId}/tracking`, data);
  },

  // =========================================================================
  // Tracking Stats
  // =========================================================================

  async getSellerTrackingStats(): Promise<{
    inTransit: number;
    outForDelivery: number;
    deliveredToday: number;
    delayed: number;
  }> {
    return portalApiClient.get(`/api/orders/seller/tracking-stats`);
  },

  async getBuyerTrackingStats(): Promise<{
    inTransit: number;
    outForDelivery: number;
    deliveredToday: number;
    delayed: number;
  }> {
    return portalApiClient.get(`/api/orders/buyer/tracking-stats`);
  },
};

export default marketplaceOrderService;
