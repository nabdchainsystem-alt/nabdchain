import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, ChartLineUp, Database, Table, Lightbulb, Target, CaretRight, CaretDown, Calculator, Funnel } from 'phosphor-react';

interface SalesFunnelInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SalesFunnelInfo: React.FC<SalesFunnelInfoProps> = ({ isOpen, onClose }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

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

    const toggleQuestion = (index: number) => {
        setOpenQuestionIndex(openQuestionIndex === index ? null : index);
    };

    if (!mounted || !shouldRender) return null;

    // Use Portal - render to fullscreen element if in fullscreen mode, otherwise body
    const portalTarget = document.fullscreenElement || document.body;

    const questions = [
        { q: 'Where are we losing the most leads?', a: 'Check the Funnel Chart drop-off percentages between stages. High leakage after "Quotes Sent" usually indicates pricing or follow-up issues.' },
        { q: 'Which sales reps have higher drop-off?', a: 'The "Drop-off by Sales Rep" bar chart identifies team members who may need additional training on closing or qualifying leads.' },
        { q: 'Which products have highest leakage?', a: 'The Leakage Heatmap highlights specific products that frequently enter the funnel but fail to reach the "Won" status.' }
    ];

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden pointer-events-none font-sans">
            <div
                className={`absolute inset-0 pointer-events-auto transition-opacity duration-500 bg-black/5 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Funnel size={24} className="text-blue-600 dark:text-blue-400" />
                            Funnel & Leakage
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Understanding Funnel & Leakage</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-gray-300 pb-24">
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs text-left">01</span>
                            Overview
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            Tracks the sales funnel stages and identifies leakage points. This dashboard helps you visualize the journey from Lead to Order, allowing for data-driven optimizations to improve overall conversion.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs text-left">02</span>
                            Key Questions
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
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs text-left">03</span>
                            Detailed Breakdown
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Key Metrics</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Leads Entered" desc="Total number of potential customers entering the top of the funnel." />
                                    <DetailItem title="Conversion Rate" desc="The percentage of leads that successfully transition into confirmed orders." />
                                    <DetailItem title="Drop-Off %" desc="The percentage of leads lost at each transition stage of the funnel." />
                                    <DetailItem title="Potential Revenue Lost" desc="Financial value of deals that were marked as 'Lost' or dropped out." />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Visual Insights</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Sales Funnel Chart" desc="ECharts visualization mapping the volume flow and drop-off per stage." />
                                    <DetailItem title="Drop-off Analysis" desc="Bar charts identifying leakage by Sales Rep or Category." />
                                    <DetailItem title="Won vs Lost" desc="Revenue share comparison between successful and failed deals." />
                                    <DetailItem title="Leakage Heatmap" desc="Matrix view showing where value loss is most concentrated." />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs text-left">04</span>
                            Data Sources & Logic
                        </h3>

                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-semibold text-xs uppercase tracking-wide">
                                    <Calculator size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span>Funnel Logic</span>
                                </div>
                                <ul className="space-y-2.5 text-xs text-blue-900/80 dark:text-blue-200/80 ml-1">
                                    <li className="flex gap-2 text-left">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>Active Tracking:</strong> Includes all leads with 'Won', 'Lost', or 'Pending' status.</span>
                                    </li>
                                    <li className="flex gap-2 text-left">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>Data Sanitation:</strong> Excludes test, draft or invalid entries to maintain accuracy.</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">
                                    <Table size={14} className="text-gray-500" />
                                    <span>Source Tables</span>
                                </div>

                                <div className="space-y-4">
                                    <TableSchema
                                        name="1. CRM Leads"
                                        desc="Entry point for all potential customer interactions."
                                        columns={['Lead ID', 'Source', 'Entry Date', 'Initial Status']}
                                    />
                                    <TableSchema
                                        name="2. Sales Orders"
                                        desc="Fulfillment and completion data for the final stage."
                                        columns={['Order ID', 'Total Amount', 'Status', 'Closing Date']}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-monday-dark-bg z-10 text-left">
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
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
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
