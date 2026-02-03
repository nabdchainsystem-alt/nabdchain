// =============================================================================
// Marketplace Order Service - Frontend API Client (Stage 4)
// =============================================================================
// Handles quote acceptance → order creation and order management
// =============================================================================

import { API_URL } from '../../../config/api';
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
// Marketplace Order Service
// =============================================================================

export const marketplaceOrderService = {
  /**
   * Accept a quote and create an order (Buyer action)
   * Entry conditions: Quote.status = SENT, Quote.validUntil > now, RFQ.status = QUOTED
   */
  async acceptQuote(
    token: string,
    quoteId: string,
    data: AcceptQuoteData = {}
  ): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to accept quote');
    }

    return response.json();
  },

  /**
   * Reject a quote (Buyer action)
   */
  async rejectQuote(
    token: string,
    quoteId: string,
    data: RejectQuoteData
  ): Promise<void> {
    const response = await fetch(`${API_URL}/items/quotes/${quoteId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to reject quote');
    }
  },

  /**
   * Get orders for the buyer
   */
  async getBuyerOrders(token: string, filters: OrderFilters = {}): Promise<OrdersResponse> {
    const url = new URL(`${API_URL}/items/orders/buyer`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.source) url.searchParams.append('source', filters.source);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch orders');
    }

    return response.json();
  },

  /**
   * Get orders for the seller
   */
  async getSellerOrders(token: string, filters: OrderFilters = {}): Promise<OrdersResponse> {
    const url = new URL(`${API_URL}/items/orders/seller`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.source) url.searchParams.append('source', filters.source);
    if (filters.page) url.searchParams.append('page', filters.page.toString());
    if (filters.limit) url.searchParams.append('limit', filters.limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch orders');
    }

    return response.json();
  },

  /**
   * Get a specific order by ID
   */
  async getOrder(token: string, orderId: string): Promise<MarketplaceOrder | null> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch order');
    }

    return response.json();
  },

  /**
   * Get audit history for an order
   */
  async getOrderHistory(token: string, orderId: string): Promise<OrderAuditEvent[]> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch order history');
    }

    return response.json();
  },

  /**
   * Seller confirms an order (pending_confirmation -> confirmed)
   */
  async confirmOrder(token: string, orderId: string): Promise<MarketplaceOrder | null> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to confirm order');
    }

    return response.json();
  },

  /**
   * Get order statistics for buyer
   */
  async getBuyerOrderStats(token: string): Promise<OrderStats> {
    const response = await fetch(`${API_URL}/items/orders/stats/buyer`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch order statistics');
    }

    return response.json();
  },

  /**
   * Get order statistics for seller
   */
  async getSellerOrderStats(token: string): Promise<OrderStats> {
    const response = await fetch(`${API_URL}/items/orders/stats/seller`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch order statistics');
    }

    return response.json();
  },

  // ==========================================================================
  // Stage 5: Order Fulfillment Methods
  // ==========================================================================

  /**
   * Seller rejects an order (pending_confirmation -> cancelled)
   */
  async rejectOrder(
    token: string,
    orderId: string,
    data: RejectOrderData
  ): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to reject order');
    }

    return response.json();
  },

  /**
   * Seller starts processing an order (confirmed -> processing)
   */
  async startProcessing(
    token: string,
    orderId: string,
    data: StartProcessingData = {}
  ): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to start processing');
    }

    return response.json();
  },

  /**
   * Seller ships an order (processing -> shipped)
   */
  async shipOrder(
    token: string,
    orderId: string,
    data: ShipOrderData
  ): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to ship order');
    }

    return response.json();
  },

  /**
   * Buyer confirms delivery (shipped -> delivered)
   */
  async markDelivered(
    token: string,
    orderId: string,
    data: MarkDeliveredData = {}
  ): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to confirm delivery');
    }

    return response.json();
  },

  /**
   * Close an order (delivered -> closed)
   */
  async closeOrder(token: string, orderId: string): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/close`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to close order');
    }

    return response.json();
  },

  /**
   * Cancel an order (before shipping)
   */
  async cancelOrder(
    token: string,
    orderId: string,
    data: CancelOrderData
  ): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to cancel order');
    }

    return response.json();
  },

  /**
   * Update tracking information
   */
  async updateTracking(
    token: string,
    orderId: string,
    data: UpdateTrackingData
  ): Promise<MarketplaceOrder> {
    const response = await fetch(`${API_URL}/items/orders/${orderId}/tracking`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update tracking');
    }

    return response.json();
  },
};

export default marketplaceOrderService;
