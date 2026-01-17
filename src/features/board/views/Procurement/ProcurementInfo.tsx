import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, ShoppingCart, Truck, ClipboardText, Bank } from 'phosphor-react';

interface ProcurementInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProcurementInfo: React.FC<ProcurementInfoProps> = ({ isOpen, onClose }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const questions = [
        { q: 'How do I process a request?', a: 'Approve the requisition first. Once approved, the "FileText" icon will enable, allowing you to create an RFQ.' },
        { q: 'What defines an "Urgent" request?', a: 'Any request marked with "Urgent" priority. These are highlighted in rose/red and listed in the Urgent KPI view.' },
        { q: 'How are RFQs linked to Orders?', a: 'When an RFQ is finalized and sent to PO, an internal Order is automatically generated with a reference to the RFQ ID.' },
        { q: 'What is the "Goods Receipt" action?', a: 'It marks the order as "Received", indicating the physical goods have arrived at the warehouse.' }
    ];

    const toggleQuestion = (index: number) => {
        setOpenQuestionIndex(openQuestionIndex === index ? null : index);
    };

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || !shouldRender) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden pointer-events-none font-sans">
            <div
                className={`absolute inset-0 pointer-events-auto transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
                style={{ background: 'transparent' }}
            />

            <div
                className={`
                    pointer-events-auto
                    relative w-full max-w-md bg-white dark:bg-[#1a1d24] shadow-2xl h-full flex flex-col border-l border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : 'translate-x-full'}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                {/* Header */}
                <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1a1d24] z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Info size={24} className="text-indigo-600 dark:text-indigo-400" />
                            Procurement Guide
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lifecycle of Requisitions & Orders</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close guide"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-gray-300 pb-24">
                    {/* 01. Workflow */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">01</span>
                            Central Flow
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-sm leading-relaxed mb-4">
                                    Manage the end-to-end procurement process from initial request to delivery.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 text-[10px] font-bold">1</div>
                                        <span className="text-xs font-medium">Create Requisition & Get Approval</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 text-[10px] font-bold">2</div>
                                        <span className="text-xs font-medium">Generate RFQ & Invite Suppliers</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 text-[10px] font-bold">3</div>
                                        <span className="text-xs font-medium">Issue Purchase Order (PO)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 text-[10px] font-bold">4</div>
                                        <span className="text-xs font-medium">Receive Goods & Close Lifecycle</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 02. FAQs */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs">02</span>
                            Common Questions
                        </h3>
                        <div className="grid gap-2">
                            {questions.map((item, i) => (
                                <div key={i} className="rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors overflow-hidden">
                                    <button
                                        onClick={() => toggleQuestion(i)}
                                        className="w-full flex gap-3 items-center text-sm p-3 bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-800/50 transition-colors text-left"
                                    >
                                        {openQuestionIndex === i ? (
                                            <CaretDown weight="bold" className="text-indigo-500 shrink-0" size={14} />
                                        ) : (
                                            <CaretRight weight="bold" className="text-gray-400 shrink-0" size={14} />
                                        )}
                                        <span className={`font-medium ${openQuestionIndex === i ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.q}
                                        </span>
                                    </button>
                                    <div className={`px-3 overflow-hidden transition-all duration-300 ${openQuestionIndex === i ? 'max-h-40 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 pl-7 pb-2 leading-relaxed">{item.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 03. KPIs */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">03</span>
                            KPI Context
                        </h3>
                        <div className="space-y-6">
                            <DetailItem icon={<ClipboardText size={16} />} title="Total Requests" desc="Ever requisition logged, including draft and archived items." />
                            <DetailItem icon={<ShoppingCart size={16} />} title="Open Requests" desc="Requests that are approved but haven't been converted to an RFQ/PO yet." />
                            <DetailItem icon={<Truck size={16} />} title="Orders Tracking" desc="Monitor lead times from PO issuance to final Goods Receipt." />
                            <DetailItem icon={<Bank size={16} />} title="Spend Analysis" desc="Track total value against departments and budgets." />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#1f2229] z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const DetailItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="flex gap-4 text-left group">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
            {icon}
        </div>
        <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
        </div>
    </div>
);
