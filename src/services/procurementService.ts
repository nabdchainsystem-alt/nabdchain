import {
    ProcurementRequest,
    CreateProcurementRequestData,
    UpdateProcurementRequestData,
    RFQ,
    CreateRFQData,
    UpdateRFQData,
    Order,
    CreateOrderData,
    UpdateOrderData
} from './types';
import { API_BASE_URL } from '../config/api';
import { appLogger } from '../utils/logger';

const API_URL = API_BASE_URL;

type CollectionKey = 'procurementRequests' | 'rfqs' | 'orders';

const LOCAL_KEYS: Record<CollectionKey, CollectionKey> = {
    procurementRequests: 'procurementRequests',
    rfqs: 'rfqs',
    orders: 'orders'
};

const readLocal = <T>(key: CollectionKey): T[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(key) || '[]') || [];
    } catch {
        return [];
    }
};

const writeLocal = <T>(key: CollectionKey, data: T[]): void => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // ignore write failures
    }
};

const upsertLocal = <T extends { id: string }>(key: CollectionKey, item: T): T => {
    const existing = readLocal<T>(key);
    const next = [item, ...existing.filter((entry) => entry.id !== item.id)];
    writeLocal(key, next);
    return item;
};

const removeLocal = (key: CollectionKey, id: string): void => {
    const existing = readLocal<{ id: string }>(key);
    writeLocal(key, existing.filter((entry) => entry.id !== id));
};

export const procurementService = {
    async getAllRequests(): Promise<ProcurementRequest[]> {
        try {
            const response = await fetch(`${API_URL}/procurementRequests`);
            if (!response.ok) throw new Error('Failed to fetch requests');
            const data = await response.json();
            writeLocal(LOCAL_KEYS.procurementRequests, data);
            return data;
        } catch (error) {
            appLogger.error('Error fetching requests:', error);
            return readLocal<ProcurementRequest>(LOCAL_KEYS.procurementRequests);
        }
    },

    async createRequest(request: CreateProcurementRequestData): Promise<ProcurementRequest> {
        try {
            const response = await fetch(`${API_URL}/procurementRequests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) throw new Error('Failed to create request');
            const created = await response.json();
            upsertLocal(LOCAL_KEYS.procurementRequests, created);
            return created;
        } catch (error) {
            appLogger.error('Error creating request:', error);
            const fallback = { ...request, id: `local-${Date.now()}`, status: 'Draft' as const };
            return upsertLocal(LOCAL_KEYS.procurementRequests, fallback);
        }
    },

    async updateRequest(id: string, updates: UpdateProcurementRequestData): Promise<ProcurementRequest> {
        try {
            const response = await fetch(`${API_URL}/procurementRequests/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update request');
            const updated = await response.json();
            upsertLocal(LOCAL_KEYS.procurementRequests, updated);
            return updated;
        } catch (error) {
            appLogger.error('Error updating request:', error);
            const existing = readLocal<ProcurementRequest>(LOCAL_KEYS.procurementRequests).find(r => r.id === id);
            const merged = { ...existing, ...updates, id } as ProcurementRequest;
            return upsertLocal(LOCAL_KEYS.procurementRequests, merged);
        }
    },

    async deleteRequest(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/procurementRequests/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete request');
            return true;
        } catch (error) {
            appLogger.error('Error deleting request:', error);
            removeLocal(LOCAL_KEYS.procurementRequests, id);
            return true;
        }
    },

    async getAllRfqs(): Promise<RFQ[]> {
        try {
            const response = await fetch(`${API_URL}/rfqs`);
            if (!response.ok) throw new Error('Failed to fetch RFQs');
            const data = await response.json();
            writeLocal(LOCAL_KEYS.rfqs, data);
            return data;
        } catch (error) {
            appLogger.error('Error fetching RFQs:', error);
            return readLocal<RFQ>(LOCAL_KEYS.rfqs);
        }
    },

    async createRfq(rfq: CreateRFQData): Promise<RFQ> {
        try {
            const response = await fetch(`${API_URL}/rfqs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rfq),
            });
            if (!response.ok) throw new Error('Failed to create RFQ');
            const created = await response.json();
            upsertLocal(LOCAL_KEYS.rfqs, created);
            return created;
        } catch (error) {
            appLogger.error('Error creating RFQ:', error);
            const fallback = { ...rfq, id: `local-${Date.now()}`, status: 'Draft' as const };
            return upsertLocal(LOCAL_KEYS.rfqs, fallback);
        }
    },

    async updateRfq(id: string, updates: UpdateRFQData): Promise<RFQ> {
        try {
            const response = await fetch(`${API_URL}/rfqs/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update RFQ');
            const updated = await response.json();
            upsertLocal(LOCAL_KEYS.rfqs, updated);
            return updated;
        } catch (error) {
            appLogger.error('Error updating RFQ:', error);
            const existing = readLocal<RFQ>(LOCAL_KEYS.rfqs).find(r => r.id === id);
            const merged = { ...existing, ...updates, id } as RFQ;
            return upsertLocal(LOCAL_KEYS.rfqs, merged);
        }
    },

    async deleteRfq(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/rfqs/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete RFQ');
            return true;
        } catch (error) {
            appLogger.error('Error deleting RFQ:', error);
            removeLocal(LOCAL_KEYS.rfqs, id);
            return true;
        }
    },

    async getAllOrders(): Promise<Order[]> {
        try {
            const response = await fetch(`${API_URL}/orders`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data = await response.json();
            writeLocal(LOCAL_KEYS.orders, data);
            return data;
        } catch (error) {
            appLogger.error('Error fetching orders:', error);
            return readLocal<Order>(LOCAL_KEYS.orders);
        }
    },

    async createOrder(order: CreateOrderData): Promise<Order> {
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order),
            });
            if (!response.ok) throw new Error('Failed to create order');
            const created = await response.json();
            upsertLocal(LOCAL_KEYS.orders, created);
            return created;
        } catch (error) {
            appLogger.error('Error creating order:', error);
            const fallback = { ...order, id: `local-${Date.now()}`, status: 'Pending' as const };
            return upsertLocal(LOCAL_KEYS.orders, fallback);
        }
    },

    async updateOrder(id: string, updates: UpdateOrderData): Promise<Order> {
        try {
            const response = await fetch(`${API_URL}/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update order');
            const updated = await response.json();
            upsertLocal(LOCAL_KEYS.orders, updated);
            return updated;
        } catch (error) {
            appLogger.error('Error updating order:', error);
            const existing = readLocal<Order>(LOCAL_KEYS.orders).find(o => o.id === id);
            const merged = { ...existing, ...updates, id } as Order;
            return upsertLocal(LOCAL_KEYS.orders, merged);
        }
    },

    async deleteOrder(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/orders/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete order');
            return true;
        } catch (error) {
            appLogger.error('Error deleting order:', error);
            removeLocal(LOCAL_KEYS.orders, id);
            return true;
        }
    }
};
