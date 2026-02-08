// =============================================================================
// Customer Service - Aggregated Customer Data from Orders
// =============================================================================

import { prisma } from '../lib/prisma';
import { apiLogger } from '../utils/logger';

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

export interface CustomerDetails extends Customer {
  orders: CustomerOrder[];
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
   * Get all customers for a seller (aggregated from orders)
   */
  async getSellerCustomers(sellerId: string, filters: CustomerFilters = {}): Promise<Customer[]> {
    try {
      // Aggregate customers from orders
      const customerData = await prisma.marketplaceOrder.groupBy({
        by: ['buyerId', 'buyerName', 'buyerEmail', 'buyerCompany', 'currency'],
        where: { sellerId },
        _count: { id: true },
        _sum: { totalPrice: true },
        _max: { createdAt: true },
        _min: { createdAt: true },
      });

      let customers: Customer[] = customerData.map((c) => ({
        id: c.buyerId,
        name: c.buyerName || 'Unknown Customer',
        email: c.buyerEmail,
        company: c.buyerCompany,
        totalOrders: c._count.id,
        totalSpend: c._sum.totalPrice || 0,
        currency: c.currency || 'SAR',
        lastOrderDate: c._max.createdAt?.toISOString() || null,
        firstOrderDate: c._min.createdAt?.toISOString() || null,
      }));

      // Apply search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        customers = customers.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.email?.toLowerCase().includes(search) ||
            c.company?.toLowerCase().includes(search)
        );
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'lastOrderDate';
      const sortOrder = filters.sortOrder || 'desc';

      customers.sort((a, b) => {
        let aVal: string | number | null;
        let bVal: string | number | null;

        switch (sortBy) {
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'totalOrders':
            aVal = a.totalOrders;
            bVal = b.totalOrders;
            break;
          case 'totalSpend':
            aVal = a.totalSpend;
            bVal = b.totalSpend;
            break;
          case 'lastOrderDate':
          default:
            aVal = a.lastOrderDate;
            bVal = b.lastOrderDate;
        }

        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return customers;
    } catch (error) {
      apiLogger.error('Error fetching customers:', error);
      return [];
    }
  },

  /**
   * Get customer details with order history
   */
  async getCustomerDetails(sellerId: string, customerId: string): Promise<CustomerDetails | null> {
    try {
      // Get customer orders
      const orders = await prisma.marketplaceOrder.findMany({
        where: { sellerId, buyerId: customerId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (orders.length === 0) {
        return null;
      }

      // Aggregate customer data
      const firstOrder = orders[orders.length - 1];
      const lastOrder = orders[0];
      const totalSpend = orders.reduce((sum, o) => sum + o.totalPrice, 0);

      return {
        id: customerId,
        name: firstOrder.buyerName || 'Unknown Customer',
        email: firstOrder.buyerEmail,
        company: firstOrder.buyerCompany,
        totalOrders: orders.length,
        totalSpend,
        currency: firstOrder.currency,
        lastOrderDate: lastOrder.createdAt.toISOString(),
        firstOrderDate: firstOrder.createdAt.toISOString(),
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          itemName: o.itemName,
          quantity: o.quantity,
          totalPrice: o.totalPrice,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      apiLogger.error('Error fetching customer details:', error);
      return null;
    }
  },
};

export default customerService;
