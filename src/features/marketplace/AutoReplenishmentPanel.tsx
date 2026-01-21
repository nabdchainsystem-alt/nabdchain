import React, { useState, useEffect } from 'react';
import { useMarketplaceData } from './integration';
import { PurchaseOrder, InventoryItem, Vendor } from './types';
import { ShoppingCart, CheckCircle, XCircle, Warning as AlertTriangle } from 'phosphor-react';

// --- Local Service Logic (Decoupled from global services) ---
const checkReorderLevels = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item => item.quantity <= item.reorderPoint);
};

const createConsolidatedPOs = (inventory: InventoryItem[], vendors: Vendor[]): PurchaseOrder[] => {
    const lowStockItems = checkReorderLevels(inventory);
    const pos: PurchaseOrder[] = [];
    const itemsByVendor: Record<string, InventoryItem[]> = {};

    // Group items by vendor
    lowStockItems.forEach(item => {
        if (!itemsByVendor[item.supplierId]) {
            itemsByVendor[item.supplierId] = [];
        }
        itemsByVendor[item.supplierId].push(item);
    });

    // Create PO for each vendor
    Object.keys(itemsByVendor).forEach(vendorId => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        const vendorItems = itemsByVendor[vendorId];
        const poItems = vendorItems.map(item => ({
            itemId: item.id,
            quantity: Math.max(item.reorderPoint * 2, 10),
            unitPrice: item.unitPrice
        }));

        const totalAmount = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        pos.push({
            id: `po-${Date.now()}-${vendorId}`,
            vendorId: vendorId,
            items: poItems,
            totalAmount,
            status: 'Draft',
            createdAt: new Date(),
            notes: 'Consolidated auto-replenishment order.'
        });
    });

    return pos;
};

export const AutoReplenishmentPanel: React.FC = () => {
    const { inventory, vendors, addPurchaseOrder } = useMarketplaceData();
    const [suggestedPOs, setSuggestedPOs] = useState<PurchaseOrder[]>([]);

    useEffect(() => {
        const pos = createConsolidatedPOs(inventory, vendors);
        setSuggestedPOs(pos);
    }, [inventory, vendors]);

    const handleApprove = (po: PurchaseOrder) => {
        addPurchaseOrder({ ...po, status: 'Pending Approval' });
        setSuggestedPOs(prev => prev.filter(p => p.id !== po.id));
    };

    const handleDismiss = (poId: string) => {
        setSuggestedPOs(prev => prev.filter(p => p.id !== poId));
    };

    if (suggestedPOs.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="text-green-500" size={48} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Inventory Healthy</h3>
                <p className="text-gray-500 mt-1">No low stock items detected. Auto-replenishment is active.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-orange-50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-orange-500" size={24} />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Suggested Replenishment</h2>
                        <p className="text-sm text-orange-700">{suggestedPOs.length} orders generated based on low stock.</p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {suggestedPOs.map(po => {
                    const vendor = vendors.find(v => v.id === po.vendorId);
                    return (
                        <div key={po.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">{vendor?.name || 'Unknown Vendor'}</h3>
                                    <div className="text-sm text-gray-500">{po.items.length} items • Total: ${po.totalAmount.toLocaleString()}</div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleDismiss(po.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Dismiss"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleApprove(po)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-clickup-purple text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                    >
                                        <ShoppingCart size={16} />
                                        <span>Approve Order</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-gray-200">
                                            <th className="pb-2">Item</th>
                                            <th className="pb-2">Qty</th>
                                            <th className="pb-2 text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {po.items.map((item, idx) => {
                                            const invItem = inventory.find(i => i.id === item.itemId);
                                            return (
                                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-2 text-gray-700">{invItem?.name || item.itemId}</td>
                                                    <td className="py-2">{item.quantity}</td>
                                                    <td className="py-2 text-right">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
