import { useState } from 'react';
import { Vendor, PurchaseOrder, InventoryItem } from './types';
import { VENDORS_DATA } from './vendorsData';
import { serviceLogger } from '../../utils/logger';

// Mock Purchase Orders
const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
    {
        id: 'po-1',
        vendorId: '1',
        items: [{ itemId: 'i-1', quantity: 100, unitPrice: 12 }],
        totalAmount: 1200,
        status: 'Fulfilled',
        createdAt: new Date('2023-01-15')
    },
    {
        id: 'po-2',
        vendorId: '2',
        items: [{ itemId: 'i-2', quantity: 5, unitPrice: 450 }],
        totalAmount: 2250,
        status: 'Sent',
        createdAt: new Date('2023-02-10')
    }
];

// Mock Inventory containing items linked to vendors
const MOCK_INVENTORY: InventoryItem[] = [
    { id: 'i-1', name: 'Portland Cement', sku: 'PC-001', category: 'Raw Material', quantity: 50, unitPrice: 12, reorderPoint: 100, supplierId: '1', location: 'W1' },
    { id: 'i-2', name: 'Steel Rebar', sku: 'SR-002', category: 'Raw Material', quantity: 200, unitPrice: 450, reorderPoint: 50, supplierId: '2', location: 'W1' },
    { id: 'i-3', name: 'Safety Helmets', sku: 'SH-003', category: 'Safety', quantity: 15, unitPrice: 25, reorderPoint: 20, supplierId: '5', location: 'W2' }
];

export const useMarketplaceData = () => {
    // In a real app moving this, you might fetch from API here.
    // For now, we use the local static data to ensure 100% portability.

    // We map the raw VENDORS_DATA to our Vendor type if needed, 
    // ensuring all required fields are present.
    const vendors: Vendor[] = VENDORS_DATA.map(v => {
        // Cast v to any to access potential fields not in source type, or to mock missing ones
        const source = v as any;
        return {
            ...v,
            id: v.id,
            name: v.name,
            category: v.category,
            // Ensure strictly required fields from our local type are populated if missing in data
            reliabilityScore: source.reliabilityScore || 95,
            contractStatus: source.contractStatus || source.status || 'Active',
            status: source.status || source.contractStatus || 'Active',
            paymentTerms: source.paymentTerms || 'Net30',
            rating: v.rating || 0
        } as Vendor;
    });

    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
    const [inventory] = useState<InventoryItem[]>(MOCK_INVENTORY);

    const addPurchaseOrder = (po: PurchaseOrder) => {
        serviceLogger.debug("Mock addPurchaseOrder:", po);
        setPurchaseOrders(prev => [...prev, po]);
    };

    return {
        vendors,
        purchaseOrders,
        inventory,
        addPurchaseOrder
    };
};
