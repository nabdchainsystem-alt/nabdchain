// =============================================================================
// Customer Service - Aggregated Customer Data from Orders
// =============================================================================

import { prisma } from '../lib/prisma';

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
// Mock Data for Demo
// =============================================================================

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Ahmed Al-Faisal',
    email: 'ahmed@alfaisal-trading.com',
    company: 'Al-Faisal Trading Co.',
    totalOrders: 12,
    totalSpend: 45600,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust_2',
    name: 'Mohammed Hassan',
    email: 'mhassan@gulf-equipment.com',
    company: 'Gulf Equipment Co.',
    totalOrders: 8,
    totalSpend: 32400,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust_3',
    name: 'Khalid bin Salman',
    email: 'khalid@saudi-parts.com',
    company: 'Saudi Parts Ltd.',
    totalOrders: 15,
    totalSpend: 67800,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust_4',
    name: 'Omar Al-Rashid',
    email: 'omar@eastern-supply.com',
    company: 'Eastern Supply',
    totalOrders: 6,
    totalSpend: 18900,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust_5',
    name: 'Fahad Al-Otaibi',
    email: 'fahad@riyadh-machinery.com',
    company: 'Riyadh Machinery Works',
    totalOrders: 22,
    totalSpend: 124500,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust_6',
    name: 'Yusuf Ibrahim',
    email: 'yusuf@jeddah-industrial.com',
    company: 'Jeddah Industrial',
    totalOrders: 4,
    totalSpend: 9200,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust_7',
    name: 'Tariq Al-Mutairi',
    email: 'tariq@dammam-parts.com',
    company: 'Dammam Parts Trading',
    totalOrders: 9,
    totalSpend: 38700,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust_8',
    name: 'Saud Al-Ghamdi',
    email: 'saud@khobar-motors.com',
    company: 'Khobar Motors',
    totalOrders: 3,
    totalSpend: 7500,
    currency: 'SAR',
    lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    firstOrderDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_CUSTOMER_ORDERS: Record<string, CustomerOrder[]> = {
  cust_1: [
    { id: 'ord_1', orderNumber: 'ORD-2024-0048', itemName: 'Industrial Pump HP-5000', quantity: 2, totalPrice: 5000, status: 'delivered', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ord_2', orderNumber: 'ORD-2024-0042', itemName: 'Hydraulic Valve Assembly', quantity: 5, totalPrice: 8500, status: 'delivered', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ord_3', orderNumber: 'ORD-2024-0035', itemName: 'Motor Controller MC-300', quantity: 3, totalPrice: 3600, status: 'delivered', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  cust_3: [
    { id: 'ord_4', orderNumber: 'ORD-2024-0049', itemName: 'Bearing Set IB-200', quantity: 10, totalPrice: 4500, status: 'shipped', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ord_5', orderNumber: 'ORD-2024-0044', itemName: 'Pneumatic Cylinder PC-100', quantity: 8, totalPrice: 7120, status: 'delivered', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  cust_5: [
    { id: 'ord_6', orderNumber: 'ORD-2024-0047', itemName: 'Safety Valve SV-50', quantity: 20, totalPrice: 6400, status: 'in_progress', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ord_7', orderNumber: 'ORD-2024-0040', itemName: 'Industrial Pump HP-5000', quantity: 5, totalPrice: 12500, status: 'delivered', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ord_8', orderNumber: 'ORD-2024-0032', itemName: 'Motor Controller MC-300', quantity: 10, totalPrice: 12000, status: 'delivered', createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
  ],
};

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

      // Return mock data if no real data
      if (customers.length === 0) {
        return applyFiltersToMock(MOCK_CUSTOMERS, filters);
      }

      return customers;
    } catch (error) {
      console.log('Using mock data for customers:', error);
      return applyFiltersToMock(MOCK_CUSTOMERS, filters);
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
        // Return mock data
        const mockCustomer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
        if (!mockCustomer) return null;

        return {
          ...mockCustomer,
          orders: MOCK_CUSTOMER_ORDERS[customerId] || [],
        };
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
      console.log('Using mock data for customer details:', error);
      const mockCustomer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
      if (!mockCustomer) return null;

      return {
        ...mockCustomer,
        orders: MOCK_CUSTOMER_ORDERS[customerId] || [],
      };
    }
  },
};

// Helper function to apply filters to mock data
function applyFiltersToMock(customers: Customer[], filters: CustomerFilters): Customer[] {
  let result = [...customers];

  if (filters.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.company?.toLowerCase().includes(search)
    );
  }

  const sortBy = filters.sortBy || 'lastOrderDate';
  const sortOrder = filters.sortOrder || 'desc';

  result.sort((a, b) => {
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

  return result;
}

export default customerService;
