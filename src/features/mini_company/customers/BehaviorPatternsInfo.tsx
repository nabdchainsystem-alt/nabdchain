import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, Activity, Clock, ShoppingCart } from 'phosphor-react';

interface BehaviorPatternsInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BehaviorPatternsInfo: React.FC<BehaviorPatternsInfoProps> = ({ isOpen, onClose }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const questions = [
        { q: 'What does "Seasonal Index" indicate?', a: 'It measures the deviation of purchase volume in the current season relative to the annual average (e.g., 1.2 = 20% higher).' },
        { q: 'How is "Behavior Volatility" measured?', a: 'Based on the variance in order frequency. High volatility means unpredictable buying patterns.' },
        { q: 'What triggers a "Pattern Alert"?', a: 'Significant deviations from established norms, such as a regular buyer suddenly stopping or a spike in returns.' },
        { q: 'What is the "Purchase Mix"?', a: 'The distribution of product categories within the average customer basket.' }
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
                    relative w-full max-w-md bg-white dark:bg-[#1a1d24] shadow-2xl h-full flex flex-col border-l border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : 'translate-x-full'}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1a1d24] z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Info size={24} className="text-orange-600 dark:text-orange-400" />
                            Behavior & Patterns
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Purchasing Habits</p>
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
                            <span className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">01</span>
                            Overview
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            This dashboard uncovers deep insights into how customers interact with the brand, highlighting purchase cycles, product preferences, and behavioral anomalies.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">02</span>
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
                                            <CaretDown weight="bold" className="text-orange-500 shrink-0" size={14} />
                                        ) : (
                                            <CaretRight weight="bold" className="text-gray-400 shrink-0" size={14} />
                                        )}
                                        <span className={`font-medium ${openQuestionIndex === i ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>
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
                            <span className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">03</span>
                            Detailed Breakdown
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Key Performance Indicators</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Purchase Frequency" desc="Avg days between orders." />
                                    <DetailItem title="Basket Size" desc="Items per order." />
                                    <DetailItem title="Repeat Rate" desc="% of customers who buy again." />
                                    <DetailItem title="Seasonal Index" desc="Current demand vs baseline." />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-left">Charts & Tables</h4>
                                <div className="space-y-3">
                                    <DetailItem title="Orders by Time" desc="Hourly/Daily activity heat." />
                                    <DetailItem title="Purchase Mix" desc="Category preference composition." />
                                    <DetailItem title="Behavior Timeline" desc="Visual history of customer actions." />
                                    <DetailItem title="Pattern Alerts" desc="Automatically detected anomalies." />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">04</span>
                            Models
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">
                                    <Activity size={14} className="text-gray-500" />
                                    <span>Predictive Behavior</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                                        <div className="font-bold text-xs text-gray-800 dark:text-gray-200 mb-1">Next Purchase Prediction</div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Calculated using historical inter-purchase time distributions for each customer segment.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#1f2229] z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
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
        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {desc}
        </div>
    </div>
);
