import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, CurrencyDollar, Table, Calculator } from 'phosphor-react';

interface CostControlInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CostControlInfo: React.FC<CostControlInfoProps> = ({ isOpen, onClose }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const questions = [
        { q: 'Where are we overspending?', a: 'Check "Budget Variance %" and the "Cost vs Budget" chart. Positive variance indicates spending above budget.' },
        { q: 'How effective are our negotiations?', a: 'Review "Negotiation Savings". This tracks the difference between initial quotes and final invoiced amounts.' },
        { q: 'Which items have volatile prices?', a: 'The "Price Volatility Index" highlights items with fluctuating costs, suggesting a need for fixed-rate contracts.' },
        { q: 'Where can we optimize?', a: '"Optimization Opportunities" counts potential savings from bulk buying or switching suppliers.' },
        { q: 'How is our budget allocation distributed?', a: 'The "Cost Allocation" pie chart shows which categories consume the calculated budget.' }
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
                            <Info size={24} className="text-blue-600 dark:text-blue-400" />
                            Cost Control
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimization & Variance Analysis</p>
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
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">01</span>
                            Overview
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            This dashboard focuses on financial efficiency, identifying areas where actual spending deviates from the budget and highlighting opportunities for cost reduction.
                        </p>
                    </section>

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
                                    <div className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${openQuestionIndex === i ? 'max-h-40 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 pl-7 pb-2 leading-relaxed">{item.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">03</span>
                            Detailed Breakdown
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Key Performance Indicators</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Total Cost" desc="Total actual spend calculated from approved purchase orders." />
                                    <DetailItem title="Budget Variance %" desc="Percentage difference between Actual Cost and Budget." />
                                    <DetailItem title="Cost per Category" desc="Average spend across active purchasing categories." />
                                    <DetailItem title="Negotiation Savings" desc="Total secured savings (Quote Price - Final Price)." />
                                    <DetailItem title="Price Volatility Index" desc="Measure of price fluctuation for key items over time (0-100)." />
                                    <DetailItem title="High-Risk Items" desc="Count of items significantly over budget or with supply instability." />
                                    <DetailItem title="Optimization Opportunities" desc="Count of flagged potential savings (e.g., volume discounts)." />
                                    <DetailItem title="Cost Efficiency %" desc="Ratio of achieved savings to total spending potential, indicating optimization effectiveness." />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Charts & Tables</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Cost vs Budget" desc="Bar chart (Recharts) comparing actual spending vs planned budget by category." />
                                    <DetailItem title="Monthly Cost Trend" desc="Bar chart (Recharts) showing cost fluctuation patterns over months." />
                                    <DetailItem title="Cost Allocation" desc="Donut chart (ECharts) showing spend distribution by category." />
                                    <DetailItem title="Savings Breakdown" desc="Donut chart (ECharts) showing cost optimization sources (Negotiation, Volume Discount, Contract Terms, Process Efficiency)." />
                                    <DetailItem title="Item Cost Variance Table" desc="Detailed list of items with cost, budget, and variance percentage." />
                                    <DetailItem title="Cost Deviation Radar" desc="Radar chart (ECharts) visualizing budget adherence by category with actual vs planned overlay." />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">04</span>
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
                                        name="1. Budgets"
                                        desc="Target spending limits."
                                        columns={['Category', 'Fiscal Period', 'Amount']}
                                    />
                                    <TableSchema
                                        name="2. PurchaseOrderItems"
                                        desc="Actual line item costs."
                                        columns={['Item ID', 'Unit Price', 'Quantity', 'Final Amount']}
                                    />
                                    <TableSchema
                                        name="3. OptimizationRules"
                                        desc="Logic for flagging opportunities."
                                        columns={['Rule ID', 'Threshold', 'Savings Type']}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-semibold text-xs uppercase tracking-wide">
                                    <Calculator size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span>Core Calculation Logic</span>
                                </div>
                                <ul className="space-y-2.5 text-xs text-blue-900/80 dark:text-blue-200/80 ml-1">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>Variance %</strong> = ((Actual - Budget) / Budget) * 100.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>Volatility</strong> = StdDev(Unit Price) / Mean(Unit Price).</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-monday-dark-bg z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
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
