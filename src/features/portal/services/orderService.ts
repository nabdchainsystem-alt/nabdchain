// =============================================================================
// Order Service - Frontend API Client for Marketplace Orders
// =============================================================================

import { API_URL } from '../../../config/api';
import {
  Order,
  OrderFilters,
  OrderStats,
  CreateOrderFromRFQData,
  CreateDirectOrderData,
  UpdateOrderData,
  ShipOrderData,
  OrderStatus,
  FulfillmentStatus,
  BuyerDashboardSummary,
} from '../types/order.types';

// =============================================================================
// Types
// =============================================================================

interface PaginatedResponse<T> {
  orders: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Order Service
// =============================================================================

export const orderService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all orders for the authenticated seller
   */
  async getSellerOrders(token: string, filters: OrderFilters = {}): Promise<Order[]> {
    const url = new URL(`${API_URL}/orders/seller`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.paymentStatus) url.searchParams.append('paymentStatus', filters.paymentStatus);
    if (filters.fulfillmentStatus) url.searchParams.append('fulfillmentStatus', filters.fulfillmentStatus);
    if (filters.source) url.searchParams.append('source', filters.source);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  },

  /**
   * Get seller order statistics
   */
  async getSellerOrderStats(token: string): Promise<OrderStats> {
    const response = await fetch(`${API_URL}/orders/seller/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order statistics');
    }

    return response.json();
  },

  /**
   * Get single order for seller
   */
  async getSellerOrder(token: string, orderId: string): Promise<Order | null> {
    const response = await fetch(`${API_URL}/orders/seller/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  },

  /**
   * Confirm order (seller)
   */
  async confirmOrder(token: string, orderId: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/seller/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm order');
    }

    return response.json();
  },

  /**
   * Update order status (seller)
   */
  async updateOrderStatus(
    token: string,
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/seller/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update order status');
    }

    return response.json();
  },

  /**
   * Update order details (seller)
   */
  async updateOrder(
    token: string,
    orderId: string,
    data: UpdateOrderData
  ): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/seller/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update order');
    }

    return response.json();
  },

  /**
   * Ship order (seller)
   */
  async shipOrder(token: string, orderId: string, data: ShipOrderData): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/seller/${orderId}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to ship order');
    }

    return response.json();
  },

  /**
   * Mark order as delivered (seller)
   */
  async markDelivered(token: string, orderId: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/seller/${orderId}/deliver`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark order as delivered');
    }

    return response.json();
  },

  /**
   * Cancel order (seller)
   */
  async cancelOrder(token: string, orderId: string, reason?: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/seller/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel order');
    }

    return response.json();
  },

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  /**
   * Get all orders for the authenticated buyer
   */
  async getBuyerOrders(token: string, filters: OrderFilters = {}): Promise<Order[]> {
    const url = new URL(`${API_URL}/orders/buyer`);

    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.search) url.searchParams.append('search', filters.search);
    if (filters.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) url.searchParams.append('dateTo', filters.dateTo);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  },

  /**
   * Get single order for buyer
   */
  async getBuyerOrder(token: string, orderId: string): Promise<Order | null> {
    const response = await fetch(`${API_URL}/orders/buyer/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  },

  /**
   * Create order from accepted RFQ (buyer)
   */
  async createOrderFromRFQ(token: string, data: CreateOrderFromRFQData): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/from-rfq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order from RFQ');
    }

    return response.json();
  },

  /**
   * Create direct order (buyer)
   */
  async createDirectOrder(token: string, data: CreateDirectOrderData): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }

    return response.json();
  },

  /**
   * Cancel order (buyer - only before confirmation)
   */
  async buyerCancelOrder(token: string, orderId: string, reason?: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/buyer/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel order');
    }

    return response.json();
  },

  /**
   * Confirm delivery (buyer)
   */
  async confirmDelivery(token: string, orderId: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/buyer/${orderId}/confirm-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm delivery');
    }

    return response.json();
  },

  /**
   * Get buyer dashboard summary with KPIs and trends
   */
  async getBuyerDashboardSummary(token: string): Promise<BuyerDashboardSummary> {
    const response = await fetch(`${API_URL}/orders/buyer/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }

    return response.json();
  },
};

export default orderService;
