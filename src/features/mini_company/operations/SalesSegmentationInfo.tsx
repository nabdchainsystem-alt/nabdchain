import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, Users, ChartPie, Table as TableIcon, Lightbulb, ShieldCheck, CaretRight, CaretDown, Calculator, Medal } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

interface SalesSegmentationInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SalesSegmentationInfo: React.FC<SalesSegmentationInfoProps> = ({ isOpen, onClose }) => {
    const { t, dir } = useAppContext();
    const isRTL = dir === 'rtl';
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
        { q: t('segmentation_q1'), a: t('segmentation_a1') },
        { q: t('segmentation_q2'), a: t('segmentation_a2') },
        { q: t('segmentation_q3'), a: t('segmentation_a3') }
    ];

    return ReactDOM.createPortal(
        <div dir={dir} className="fixed inset-0 z-[9999] flex justify-end overflow-hidden pointer-events-none font-sans">
            <div
                className={`absolute inset-0 pointer-events-auto transition-opacity duration-500 bg-black/5 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={`
                    pointer-events-auto
                    relative w-full max-w-md bg-white dark:bg-monday-dark-surface shadow-2xl h-full flex flex-col border-s border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-monday-dark-surface z-10 text-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Medal size={24} className="text-blue-600 dark:text-blue-400" />
                            {t('segmentation_and_loyalty')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('understanding_customer_value')}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-gray-300 pb-24 text-start">
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">01</span>
                            {t('overview')}
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            {t('segmentation_overview_text')}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">02</span>
                            {t('key_questions')}
                        </h3>
                        <div className="grid gap-2 text-start">
                            {questions.map((item, i) => (
                                <div key={i} className="rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors overflow-hidden">
                                    <button
                                        onClick={() => toggleQuestion(i)}
                                        className="w-full flex gap-3 items-center text-sm p-3 bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-800/50 transition-colors text-start"
                                    >
                                        {openQuestionIndex === i ? (
                                            <CaretDown weight="bold" className="text-blue-500 shrink-0" size={14} />
                                        ) : (
                                            <CaretRight weight="bold" className="text-gray-400 shrink-0 rtl:rotate-180" size={14} />
                                        )}
                                        <span className={`font-medium ${openQuestionIndex === i ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.q}
                                        </span>
                                    </button>
                                    <div className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${openQuestionIndex === i ? 'max-h-40 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 ps-7 pb-2 leading-relaxed">{item.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">03</span>
                            {t('detailed_breakdown')}
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-start">{t('top_kpis')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('total_customers')} desc={t('total_customers_desc')} />
                                    <DetailItem title={t('active_customers')} desc={t('active_customers_desc')} />
                                    <DetailItem title={t('repeat_customer_percent')} desc={t('repeat_customer_desc')} />
                                    <DetailItem title={t('avg_clv')} desc={t('avg_clv_desc')} />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-start">{t('side_kpis')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('avg_orders')} desc={t('avg_orders_desc')} />
                                    <DetailItem title={t('churn_rate_percent')} desc={t('churn_rate_desc')} />
                                    <DetailItem title={t('engagement_score')} desc={t('engagement_score_desc')} />
                                    <DetailItem title={t('new_customers')} desc={t('new_customers_desc')} />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-start">{t('charts_tables')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('customer_segmentation')} desc={t('customer_segmentation_desc')} />
                                    <DetailItem title={t('repeat_vs_onetime')} desc={t('repeat_vs_onetime_desc')} />
                                    <DetailItem title={t('revenue_by_segment')} desc={t('revenue_by_segment_desc')} />
                                    <DetailItem title={t('loyalty_curve')} desc={t('loyalty_curve_desc')} />
                                    <DetailItem title={t('top_customers_list')} desc={t('top_customers_list_desc')} />
                                    <DetailItem title={t('customer_value_distribution')} desc={t('customer_value_distribution_desc')} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">04</span>
                            {t('data_sources_logic')}
                        </h3>

                        <div className="space-y-6">
                            {/* Logic Summary */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-semibold text-xs uppercase tracking-wide">
                                    <Calculator size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span>{t('segmentation_logic')}</span>
                                </div>
                                <ul className="space-y-2.5 text-xs text-blue-900/80 dark:text-blue-200/80 ms-1">
                                    <li className="flex gap-2 text-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>{t('inclusion')}:</strong> {t('inclusion_desc')}</span>
                                    </li>
                                    <li className="flex gap-2 text-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>{t('clv_calculation')}:</strong> {t('clv_calculation_desc')}</span>
                                    </li>
                                    <li className="flex gap-2 text-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span><strong>{t('segment_classification')}:</strong> {t('segment_classification_desc')}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Detailed Schemas */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">
                                    <TableIcon size={14} className="text-gray-500" />
                                    <span>{t('source_tables')}</span>
                                </div>

                                <div className="space-y-4">
                                    <TableSchema
                                        name={t('customer_master_table')}
                                        desc={t('customer_master_desc')}
                                        columns={[t('customer_id'), t('segment'), t('registration_date'), t('status')]}
                                    />
                                    <TableSchema
                                        name={t('transaction_history_table')}
                                        desc={t('transaction_history_desc')}
                                        columns={[t('transaction_id'), t('customer_id'), t('order_value'), t('order_date')]}
                                    />
                                    <TableSchema
                                        name={t('engagement_events_table')}
                                        desc={t('engagement_events_desc')}
                                        columns={[t('event_id'), t('customer_id'), t('event_type'), t('timestamp')]}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-monday-dark-bg z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        {t('close_guide')}
                    </button>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

const DetailItem = ({ title, desc }: { title: string, desc: string }) => (
    <div className="group text-start">
        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {desc}
        </div>
    </div>
);

const TableSchema = ({ name, desc, columns }: { name: string, desc: string, columns: string[] }) => (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden text-start">
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
