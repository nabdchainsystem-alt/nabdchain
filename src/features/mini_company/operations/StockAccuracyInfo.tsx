import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, Target, Table, Calculator, Warning } from 'phosphor-react';

interface StockAccuracyInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StockAccuracyInfo: React.FC<StockAccuracyInfoProps> = ({ isOpen, onClose }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const questions = [
        { q: 'What is shrinkage?', a: 'Inventory loss due to theft, damage, errors, or unknown causes. It is the difference between recorded and actual stock.' },
        { q: 'How is "Stock Accuracy" measured?', a: 'It calculates the percentage of SKUs where system quantity matches physical count exactly during audits.' },
        { q: 'Which items are "High Risk"?', a: 'Items that frequently show discrepancies or have high value and are prone to theft or loss.' },
        { q: 'What triggers a "Variance Alert"?', a: 'Any discrepancy exceeding a predefined threshold (e.g., &gt; 5% value difference) generates an immediate alert.' }
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

    const portalTarget = document.fullscreenElement || document.body;

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
                    relative w-full max-w-md bg-white dark:bg-monday-dark-surface shadow-2xl h-full flex flex-col border-l border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : 'translate-x-full'}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-monday-dark-surface z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Info size={24} className="text-red-600 dark:text-red-400" />
                            Stock Accuracy
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shrinkage & Variance Detection</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close info window"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-gray-300 pb-24">
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">01</span>
                            Overview
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            This dashboard tracks mismatches between system balances and physical verification, highlighting losses (shrinkage) and operational errors.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">02</span>
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
                                            <CaretDown weight="bold" className="text-red-500 shrink-0" size={14} />
                                        ) : (
                                            <CaretRight weight="bold" className="text-gray-400 shrink-0" size={14} />
                                        )}
                                        <span className={`font-medium ${openQuestionIndex === i ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.q}
                                        </span>
                                    </button>
                                    <div className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${openQuestionIndex === i ? 'max-h-40 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 pl-7 pb-2 leading-relaxed">{item.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">03</span>
                            Detailed Breakdown
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Key Performance Indicators</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Stock Accuracy %" desc="Ratio of correct SKU counts to total audited SKUs." />
                                    <DetailItem title="Shrinkage Value" desc="Total monetary loss from missing inventory." />
                                    <DetailItem title="Adjustment Count" desc="Number of manual stock corrections made." />
                                    <DetailItem title="Loss Rate %" desc="Shrinkage as a percentage of total inventory value." />
                                    <DetailItem title="High-Risk SKUs" desc="Items with repeated or high-value discrepancies." />
                                    <DetailItem title="Audit Frequency" desc="Average days between physical counts." />
                                    <DetailItem title="Variance Alerts" desc="Active notifications for large discrepancies." />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Charts & Tables</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Variance per Category" desc="Bar chart (Recharts) showing loss concentrations." />
                                    <DetailItem title="Shrinkage Causes" desc="Pie chart (ECharts) categorizing loss reasons (Theft, Damaged, Admin)." />
                                    <DetailItem title="Variance Log" desc="Table calling out specific SKU discrepancies." />
                                    <DetailItem title="Variance Radar Mesh" desc="Visualizes accuracy gaps across multiple dimensions." />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">04</span>
                            Data Sources & Logic
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">
                                    <Table size={14} className="text-gray-500" />
                                    <span>Source Tables & Fields</span>
                                </div>

                                <div className="space-y-4">
                                    <TableSchema
                                        name="InventoryAudits"
                                        desc="Physical count records."
                                        columns={['AuditDate', 'SKU', 'SystemQty', 'CountedQty', 'Variance']}
                                    />
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                                <div className="flex items-center gap-2 mb-3 text-red-800 dark:text-red-300 font-semibold text-xs uppercase tracking-wide">
                                    <Calculator size={14} className="text-red-600 dark:text-red-400" />
                                    <span>Core Calculation Logic</span>
                                </div>
                                <ul className="space-y-2.5 text-xs text-red-900/80 dark:text-red-200/80 ml-1">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                        <span><strong>Variance</strong> = Counted Qty - System Qty.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                        <span><strong>Accuracy</strong> = (Accurate Counts / Total Counts) * 100.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-monday-dark-bg z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        Close Guide
                    </button>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

const DetailItem = ({ title, desc }: { title: string, desc: string }) => (
    <div className="group text-left">
        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
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
