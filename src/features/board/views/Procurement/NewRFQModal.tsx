import React, { useState, useEffect } from 'react';
import { X, Hash, Buildings as Building2, MapPin, Tag, User, Calculator, Package } from 'phosphor-react';

interface NewRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  requestData: Record<string, unknown>;
}

interface ItemWithPrice {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  dueDate?: string;
  unitPrice?: number;
}

export const NewRFQModal: React.FC<NewRFQModalProps> = ({ isOpen, onClose, onSubmit, requestData }) => {
  const [vendorName, setVendorName] = useState('');
  const [items, setItems] = useState<ItemWithPrice[]>([]);
  const [vatRate] = useState(0.15); // 15%

  // Calculate total quantity from request items
  const requestTotalQty = React.useMemo(() => items.reduce((acc, item) => acc + (item.quantity || 0), 0), [items]);

  const subtotal = React.useMemo(
    () => items.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0),
    [items],
  );

  const hasAnyPrice = React.useMemo(() => items.some((item) => (item.unitPrice || 0) > 0), [items]);

  const vatAmount = subtotal * vatRate;
  const totalWithVat = subtotal + vatAmount;

  useEffect(() => {
    if (isOpen && requestData) {
      setVendorName('');
      const mappedItems: ItemWithPrice[] = (
        (requestData.items || []) as Array<{
          id?: string;
          itemCode?: string;
          description?: string;
          quantity?: number;
          dueDate?: string;
          unitPrice?: number;
        }>
      ).map((item) => ({
        id: item.id || Math.random().toString(36).slice(2),
        itemCode: item.itemCode || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        dueDate: item.dueDate,
        unitPrice: item.unitPrice || 0,
      }));
      setItems(mappedItems);
    }
  }, [isOpen, requestData]);

  const handlePriceChange = (id: string, value: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unitPrice: value } : item)));
  };

  const handleSubmit = () => {
    const totalQty = requestTotalQty;
    const avgUnitPrice = totalQty > 0 ? subtotal / totalQty : 0;
    const formData = {
      id: `RFQ-${Date.now().toString().slice(-6)}`,
      requestId: requestData.id,
      date: new Date().toISOString().split('T')[0],
      department: requestData.department,
      warehouse: requestData.warehouse,
      supplier: vendorName,
      value: totalWithVat,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days from now
      status: 'Open',
      createdDate: new Date().toISOString().split('T')[0],
      // Extra info for record keeping
      items,
      unitPrice: avgUnitPrice,
      quantity: totalQty,
      vatAmount,
      totalExVat: subtotal,
      relatedTo: requestData.relatedTo,
    };
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-monday-dark-surface w-full max-w-4xl min-w-[900px] rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-monday-dark-surface">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Create New RFQ</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generating RFQ for Request {requestData?.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 bg-gray-50/50 dark:bg-monday-dark-bg">
          {/* Read-only segment from Request */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
            <div className="flex items-center gap-3">
              <Hash size={16} className="text-blue-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-400">Request ID</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{requestData?.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-blue-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-400">Department</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{requestData?.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-blue-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-400">Warehouse</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{requestData?.warehouse}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag size={16} className="text-blue-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-400">Related To</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {requestData?.relatedTo || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 gap-6">
            {/* Vendor Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vendor Name
              </label>
              <div className="relative group">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Select or type vendor name"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items & Pricing
                  </label>
                  <span className="text-[11px] text-gray-400">Currency: SAR</span>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Package size={12} /> Qty from request:{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{requestTotalQty}</span>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/60 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-2">Item Code</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2 text-right whitespace-nowrap">Qty</th>
                        <th className="px-4 py-2 whitespace-nowrap">Unit Price (SAR)</th>
                        <th className="px-4 py-2 text-right whitespace-nowrap">Line Total (SAR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No items found on this request.
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => {
                          const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                                {item.itemCode || '-'}
                              </td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.description || '-'}</td>
                              <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs">
                                  <Package size={12} /> {item.quantity || 0}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <div className="relative group max-w-[160px]">
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.unitPrice ?? 0}
                                    onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                                    className="w-full pl-3 pr-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                                {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
                  <span>Total quantity across items</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{requestTotalQty}</span>
                </div>
              </div>
            </div>

            {/* Calculations */}
            <div className="p-5 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Subtotal (SAR)</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">VAT (15%)</span>
                  <Calculator size={12} className="text-gray-400" />
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-900 dark:text-gray-100 font-bold uppercase tracking-wider text-xs">
                  Total Amount (SAR)
                </span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {totalWithVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-monday-dark-surface flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!vendorName || items.length === 0 || !hasAnyPrice}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Generate RFQ Record
          </button>
        </div>
      </div>
    </div>
  );
};
