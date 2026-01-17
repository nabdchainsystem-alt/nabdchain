import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, Database, Table, Calculator } from 'phosphor-react';

interface SalesDashboardInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SalesDashboardInfo: React.FC<SalesDashboardInfoProps> = ({ isOpen, onClose }) => {
    // Local state to handle animation rendering
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    // State to track expanded accordion items
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);

    // Ensure we only render efficiently
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const questions = [
        { q: 'Are sales growing?', a: 'Check the "Sales Over Time" chart and the "Total Sales" KPI trend arrow. Green/Up means growth.' },
        { q: 'Is pricing working?', a: 'Compare "Total Sales" vs "Net Revenue". A large gap might mean heavy discounting is needed to move product.' },
        { q: 'Are returns high?', a: 'Look at the "Returned Orders" KPI and "Status" Pie Chart. A high % here requires immediate attention.' },
        { q: 'Volume vs Value focus?', a: 'See "Avg Order Value" vs "Orders Count". If orders are up but value is down, you are selling more cheap items.' }
    ];

    const toggleQuestion = (index: number) => {
        setOpenQuestionIndex(openQuestionIndex === index ? null : index);
    };

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Double RAF to ensure browser paints the mount state (closed) before animating to open
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        } else {
            setIsVisible(false);
            // Wait for animation to finish before hiding (500ms matches duration-500)
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || !shouldRender) return null;

    // Use Portal to render outside of parent stacking contexts
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden pointer-events-none font-sans">
            {/* Transparent backdrop for click-outside dismissal - only active when open */}
            <div
                className={`absolute inset-0 pointer-events-auto transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
                style={{ background: 'transparent' }}
            />

            {/* Drawer Panel */}
            <div
                className={`
                    pointer-events-auto
                    relative w-full max-w-md bg-white dark:bg-[#1a1d24] shadow-2xl h-full flex flex-col border-l border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : 'translate-x-full'}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                {/* Header - Fixed/Static */}
                <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1a1d24] z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Info size={24} className="text-blue-600 dark:text-blue-400" />
                            Sales Insights
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Understanding Sales Insights</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close info window"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-gray-300 pb-24">

                    {/* 1. Overview */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">01</span>
                            Overview
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            This dashboard gives you a quick snapshot of your sales health.
                            It helps you understand how much you are selling, profitability, and trends—all in one place.
                        </p>
                    </section>

                    {/* 2. Key Decisions (Accordion) */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">02</span>
                            Key Questions Answered
                        </h3>
                        <div className="grid gap-2">
                            {questions.map((item, i) => (
                                <div key={i} className="rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors overflow-hidden">
                                    <button
                                        onClick={() => toggleQuestion(i)}
                                        className="w-full flex gap-3 items-center text-sm p-3 bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-800/50 transition-colors text-left"
                                    >
                                        {openQuestionIndex === i ? (
                                            <CaretDown weight="bold" className="text-blue-500 shrink-0" size={14} />
                                        ) : (
                                            <CaretRight weight="bold" className="text-gray-400 shrink-0" size={14} />
                                        )}
                                        <span className={`font-medium ${openQuestionIndex === i ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.q}
                                        </span>
                                    </button>

                                    <div
                                        className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${openQuestionIndex === i ? 'max-h-40 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
                                    >
                                        <p className="text-xs text-gray-500 dark:text-gray-400 pl-7 pb-2 leading-relaxed">
                                            {item.a}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Detailed Component Breakdown */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">03</span>
                            Detailed Breakdown
                        </h3>

                        <div className="space-y-6">
                            {/* KPIs */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Key Performance Indicators</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Total Sales" desc="Gross revenue before any deductions. The top-line number." />
                                    <DetailItem title="Net Revenue" desc="Real money earned after discounts and returns. The bottom-line." />
                                    <DetailItem title="Orders Count" desc="Total number of completed transactions." />
                                    <DetailItem title="Avg Order Value" desc="Average amount a customer spends per transaction. Higher is better." />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            {/* Charts */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Charts & Tables</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Sales Over Time" desc="Bar chart showing daily sales volume to identify peak days." />
                                    <DetailItem title="Sales by Channel" desc="Breakdown of where customers shop (Online vs Store)." />
                                    <DetailItem title="Category Pie" desc="Distribution of sales across different product categories." />
                                    <DetailItem title="Status Pie" desc="Operational health check: Completed vs Returned/Cancelled orders." />
                                    <DetailItem title="Top Products" desc="Table highlighting best sellers and their profit margins." />
                                    <DetailItem title="Revenue Contribution" desc="Treemap showing which products drive the most revenue." />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Data Sources & Logic */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">04</span>
                            Data Sources & Logic
                        </h3>

                        <div className="space-y-6">

                            {/* Logic Summary First */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-semibold text-xs uppercase tracking-wide">
                                    <Calculator size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span>Core Calculation Logic</span>
                                </div>
                                <ul className="space-y-2.5 text-xs text-blue-900/80 dark:text-blue-200/80 ml-1">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>KPIs are based on <span className="font-semibold">completed orders only</span> to ensure accuracy.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>Net Revenue</strong> = Total Sales - (Discounts + Returns).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>Data is automatically filtered by your selected date range.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Detailed Schemas */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">
                                    <Table size={14} className="text-gray-500" />
                                    <span>Source Tables & Fields</span>
                                </div>

                                <div className="space-y-4">
                                    <TableSchema
                                        name="1. Orders Table"
                                        desc="Used to calculate sales volume and order-related KPIs."
                                        columns={['Order ID', 'Order Date', 'Order Status', 'Total Order Amount', 'Discount Amount', 'Net Order Amount', 'Customer ID']}
                                    />
                                    <TableSchema
                                        name="2. Order Items Table"
                                        desc="Used to analyze product-level performance."
                                        columns={['Order ID', 'Product ID', 'Product Name', 'Quantity Sold', 'Item Revenue', 'Item Cost']}
                                    />
                                    <TableSchema
                                        name="3. Products Table"
                                        desc="Used for product identification and grouping."
                                        columns={['Product ID', 'Product Name', 'Product Category', 'Selling Price', 'Cost Price']}
                                    />
                                    <TableSchema
                                        name="4. Customers Table"
                                        desc="Used for basic customer contribution insights."
                                        columns={['Customer ID', 'Customer Name', 'Customer Type', 'Total Orders Count']}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 text-[10px] text-gray-400 dark:text-gray-500 italic text-center">
                                This dashboard aggregates data for high-level decision making.
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer - Fixed/Static */}
                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#1f2229] z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        Close Guide
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

const DetailItem = ({ title, desc }: { title: string, desc: string }) => (
    <div className="group text-left">
        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {desc}
        </div>
    </div>
);

const TableSchema = ({ name, desc, columns }: { name: string, desc: string, columns: string[] }) => (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-100/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-0.5">
            <span className="font-bold text-xs text-gray-800 dark:text-gray-200">{name}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{desc}</span>
        </div>
        <div className="p-3">
            <div className="flex flex-wrap gap-1.5">
                {columns.map((col, i) => (
                    <span key={i} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 shadow-sm">
                        {col}
                    </span>
                ))}
            </div>
        </div>
    </div>
);
