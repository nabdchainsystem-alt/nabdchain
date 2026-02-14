// =============================================================================
// Order Service - Frontend API Client for Marketplace Orders
// =============================================================================

import { portalApiClient } from './portalApiClient';
import {
  Order,
  OrderFilters,
  OrderStats,
  CreateOrderFromRFQData,
  CreateDirectOrderData,
  UpdateOrderData,
  ShipOrderData,
  OrderStatus,
  BuyerDashboardSummary,
} from '../types/order.types';

// =============================================================================
// Helper
// =============================================================================

function buildSellerQS(filters: OrderFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.paymentStatus) p.append('paymentStatus', filters.paymentStatus);
  if (filters.fulfillmentStatus) p.append('fulfillmentStatus', filters.fulfillmentStatus);
  if (filters.source) p.append('source', filters.source);
  if (filters.search) p.append('search', filters.search);
  if (filters.dateFrom) p.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) p.append('dateTo', filters.dateTo);
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

function buildBuyerQS(filters: OrderFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.append('status', filters.status);
  if (filters.search) p.append('search', filters.search);
  if (filters.dateFrom) p.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) p.append('dateTo', filters.dateTo);
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// =============================================================================
// Order Service
// =============================================================================

export const orderService = {
  // ---------------------------------------------------------------------------
  // Seller Operations
  // ---------------------------------------------------------------------------

  async getSellerOrders(filters: OrderFilters = {}): Promise<Order[]> {
    return portalApiClient.get<Order[]>(`/api/orders/seller${buildSellerQS(filters)}`);
  },

  async getSellerOrderStats(): Promise<OrderStats> {
    return portalApiClient.get<OrderStats>(`/api/orders/seller/stats`);
  },

  async getSellerOrder(orderId: string): Promise<Order | null> {
    try {
      return await portalApiClient.get<Order>(`/api/orders/seller/${orderId}`);
    } catch {
      return null;
    }
  },

  async confirmOrder(orderId: string): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/seller/${orderId}/confirm`);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/seller/${orderId}/status`, { status });
  },

  async updateOrder(orderId: string, data: UpdateOrderData): Promise<Order> {
    return portalApiClient.put<Order>(`/api/orders/seller/${orderId}`, data);
  },

  async shipOrder(orderId: string, data: ShipOrderData): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/seller/${orderId}/ship`, data);
  },

  async markDelivered(orderId: string): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/seller/${orderId}/deliver`);
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/seller/${orderId}/cancel`, { reason });
  },

  // ---------------------------------------------------------------------------
  // Buyer Operations
  // ---------------------------------------------------------------------------

  async getBuyerOrders(filters: OrderFilters = {}): Promise<Order[]> {
    return portalApiClient.get<Order[]>(`/api/orders/buyer${buildBuyerQS(filters)}`);
  },

  async getBuyerOrder(orderId: string): Promise<Order | null> {
    try {
      return await portalApiClient.get<Order>(`/api/orders/buyer/${orderId}`);
    } catch {
      return null;
    }
  },

  async createOrderFromRFQ(data: CreateOrderFromRFQData): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/from-rfq`, data);
  },

  async createDirectOrder(data: CreateDirectOrderData): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/direct`, data);
  },

  async buyerCancelOrder(orderId: string, reason?: string): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/buyer/${orderId}/cancel`, { reason });
  },

  async confirmDelivery(orderId: string): Promise<Order> {
    return portalApiClient.post<Order>(`/api/orders/buyer/${orderId}/confirm-delivery`);
  },

  async getBuyerDashboardSummary(): Promise<BuyerDashboardSummary> {
    return portalApiClient.get<BuyerDashboardSummary>(`/api/orders/buyer/dashboard`);
  },
};

export default orderService;
