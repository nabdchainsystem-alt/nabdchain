import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash as Trash2,
  CalendarBlank as Calendar,
  Hash,
  Buildings as Building2,
  MapPin,
  Tag,
  CaretDown as ChevronDown,
} from 'phosphor-react';
import { SharedDatePicker } from '../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../components/ui/PortalPopup';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  existingTasks?: Record<string, unknown>[];
}

interface RequestItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  dueDate: string;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose, onSubmit, existingTasks = [] }) => {
  // Header State
  const [isManualReqId, setIsManualReqId] = useState(false);
  const [reqId, setReqId] = useState('');
  const [date, setDate] = useState('');
  const [department, setDepartment] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [relatedTo, setRelatedTo] = useState('');
  const [status, setStatus] = useState('Low');

  // UI State for Date Pickers
  const [showMainDatePicker, setShowMainDatePicker] = useState(false);
  const [activeItemDateId, setActiveItemDateId] = useState<string | null>(null);
  const mainDateRef = React.useRef<HTMLDivElement>(null);
  const itemDateRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  // Items State
  const [items, setItems] = useState<RequestItem[]>([
    { id: '1', itemCode: '', description: '', quantity: 1, dueDate: '' },
  ]);

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setDate(today.toISOString().split('T')[0]);

      if (!isManualReqId) {
        // Calculate Next ID
        const year = today.getFullYear();
        const prefix = `REQ-${year}`;

        // Find highest sequence number for this year
        let maxSeq = 0;
        existingTasks.forEach((task) => {
          const id = task.id || '';
          if (id.startsWith(prefix)) {
            const seqStr = id.replace(prefix, '');
            const seq = parseInt(seqStr);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        });

        const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
        setReqId(`${prefix}${nextSeq}`);
      }
    }
  }, [isOpen, isManualReqId, existingTasks]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        itemCode: '',
        description: '',
        quantity: 1,
        dueDate: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof RequestItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = () => {
    const formData = {
      id: reqId,
      date,
      department,
      warehouse,
      relatedTo,
      status,
      items,
    };
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-monday-dark-surface w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-monday-dark-surface">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">New Request</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Submit a new procurement requisition for approval
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50 dark:bg-monday-dark-bg">
          {/* 1. Request Header Details */}
          <div className="grid grid-cols-3 gap-6">
            {/* Column 1: Request # & Date */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between h-5 mb-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Request ID
                  </label>
                  <button
                    onClick={() => setIsManualReqId(!isManualReqId)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    {isManualReqId ? 'Auto-Generate' : 'Manual Entry'}
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={15} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={reqId}
                    onChange={(e) => setReqId(e.target.value)}
                    readOnly={!isManualReqId}
                    className={`pl-9 w-full px-4 py-2.5 text-sm rounded-lg border outline-none transition-all duration-200 ${
                      !isManualReqId
                        ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center h-5 mb-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </label>
                </div>
                <div className="relative group" ref={mainDateRef}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={15} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <div
                    onClick={() => setShowMainDatePicker(true)}
                    className="pl-9 w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer shadow-sm flex items-center justify-between"
                  >
                    {date ? new Date(date).toLocaleDateString() : 'Select date'}
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>

                  {showMainDatePicker && (
                    <PortalPopup triggerRef={mainDateRef} onClose={() => setShowMainDatePicker(false)}>
                      <SharedDatePicker
                        selectedDate={date}
                        onSelectDate={(d) => setDate(d.toISOString().split('T')[0])}
                        onClose={() => setShowMainDatePicker(false)}
                      />
                    </PortalPopup>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Department & Warehouse */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center h-5 mb-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={15} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={department}
                    placeholder="e.g. Operations"
                    onChange={(e) => setDepartment(e.target.value)}
                    className="pl-9 w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center h-5 mb-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Warehouse
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={15} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={warehouse}
                    placeholder="e.g. Main Hub"
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="pl-9 w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Status & Related To */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center h-5 mb-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority Status
                  </label>
                </div>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 appearance-none shadow-sm transition-all duration-200"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center h-5 mb-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Related To
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag size={15} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Project or Campaign"
                    value={relatedTo}
                    onChange={(e) => setRelatedTo(e.target.value)}
                    className="pl-9 w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

          {/* 2. Line Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Items List</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add the items you wish to procure</p>
              </div>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700/50 rounded-lg transition-all border border-blue-100 dark:border-gray-700 shadow-sm hover:shadow"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="px-5 py-3 w-[15%]">Item Code</th>
                    <th className="px-5 py-3 w-[35%]">Description</th>
                    <th className="px-5 py-3 w-[20%]">Due Date</th>
                    <th className="px-5 py-3 w-[15%]">Quantity</th>
                    <th className="px-5 py-3 w-[10%] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item, _index) => (
                    <tr key={item.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="px-5 py-2">
                        <input
                          type="text"
                          placeholder="Code"
                          value={item.itemCode}
                          onChange={(e) => updateItem(item.id, 'itemCode', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm bg-transparent border-b border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 focus:border-blue-500 rounded-none outline-none transition-all placeholder-gray-300"
                        />
                      </td>
                      <td className="px-5 py-2">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm bg-transparent border-b border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 focus:border-blue-500 rounded-none outline-none transition-all placeholder-gray-300"
                        />
                      </td>
                      <td className="px-5 py-2">
                        <div
                          className="relative"
                          ref={(el) => {
                            if (el) itemDateRefs.current[item.id] = el;
                          }}
                        >
                          <div
                            onClick={() => setActiveItemDateId(item.id)}
                            className="w-full px-2 py-1.5 text-sm bg-transparent border-b border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 focus:border-blue-500 rounded-none outline-none transition-all text-gray-600 dark:text-gray-300 cursor-pointer flex items-center justify-between"
                          >
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Set date'}
                            <Calendar size={12} className="text-gray-400" />
                          </div>

                          {activeItemDateId === item.id && (
                            <PortalPopup
                              triggerRef={{ current: itemDateRefs.current[item.id] }}
                              onClose={() => setActiveItemDateId(null)}
                            >
                              <SharedDatePicker
                                selectedDate={item.dueDate}
                                onSelectDate={(d) => updateItem(item.id, 'dueDate', d.toISOString().split('T')[0])}
                                onClose={() => setActiveItemDateId(null)}
                              />
                            </PortalPopup>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm bg-transparent border-b border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 focus:border-blue-500 rounded-none outline-none transition-all"
                        />
                      </td>
                      <td className="px-5 py-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length === 1}
                          className={`p-2 rounded-lg transition-colors ${
                            items.length === 1
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-monday-dark-surface flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {items.length} item{items.length !== 1 ? 's' : ''} in request
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} />
              Create Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
