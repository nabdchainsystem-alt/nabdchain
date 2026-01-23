import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, Database, Table, Calculator } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

interface SalesDashboardInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SalesDashboardInfo: React.FC<SalesDashboardInfoProps> = ({ isOpen, onClose }) => {
    const { t } = useAppContext();

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
        { q: t('q_sales_growing'), a: t('a_sales_growing') },
        { q: t('q_pricing_working'), a: t('a_pricing_working') },
        { q: t('q_returns_high'), a: t('a_returns_high') },
        { q: t('q_volume_vs_value'), a: t('a_volume_vs_value') }
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

    // Use Portal - render to fullscreen element if in fullscreen mode, otherwise body
    const portalTarget = document.fullscreenElement || document.body;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end rtl:justify-start overflow-hidden pointer-events-none font-sans">
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
                    relative w-full max-w-md bg-white dark:bg-monday-dark-surface shadow-2xl h-full flex flex-col border-s border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                {/* Header - Fixed/Static */}
                <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-monday-dark-surface z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Info size={24} className="text-blue-600 dark:text-blue-400" />
                            {t('sales_insights')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('understanding_sales_insights')}</p>
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
                            {t('overview')}
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            {t('dashboard_overview_desc')}
                        </p>
                    </section>

                    {/* 2. Key Decisions (Accordion) */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">02</span>
                            {t('key_questions_answered')}
                        </h3>
                        <div className="grid gap-2">
                            {questions.map((item, i) => (
                                <div key={i} className="rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors overflow-hidden">
                                    <button
                                        onClick={() => toggleQuestion(i)}
                                        className="w-full flex gap-3 items-center text-sm p-3 bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-800/50 transition-colors text-start"
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
                            {t('detailed_breakdown')}
                        </h3>

                        <div className="space-y-6">
                            {/* Top KPIs */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-start">{t('top_kpis')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('total_sales')} desc={t('total_sales_desc')} />
                                    <DetailItem title={t('net_revenue')} desc={t('net_revenue_desc')} />
                                    <DetailItem title={t('orders_count')} desc={t('orders_count_desc')} />
                                    <DetailItem title={t('avg_order_value')} desc={t('avg_order_value_desc')} />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            {/* Side KPIs */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-start">{t('side_kpis')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('return_rate')} desc={t('return_rate_desc')} />
                                    <DetailItem title={t('customer_count')} desc={t('customer_count_desc')} />
                                    <DetailItem title={t('top_category')} desc={t('top_category_desc')} />
                                    <DetailItem title={t('discount_impact')} desc={t('discount_impact_desc')} />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            {/* Charts */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 text-start">{t('charts_tables')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('sales_over_time')} desc={t('sales_over_time_desc')} />
                                    <DetailItem title={t('sales_by_channel')} desc={t('sales_by_channel_desc')} />
                                    <DetailItem title={t('category_pie')} desc={t('category_pie_desc')} />
                                    <DetailItem title={t('status_pie')} desc={t('status_pie_desc')} />
                                    <DetailItem title={t('top_products')} desc={t('top_products_desc')} />
                                    <DetailItem title={t('revenue_contribution')} desc={t('revenue_contribution_desc')} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Data Sources & Logic */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">04</span>
                            {t('data_sources_logic')}
                        </h3>

                        <div className="space-y-6">

                            {/* Logic Summary First */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-semibold text-xs uppercase tracking-wide">
                                    <Calculator size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span>{t('core_calculation_logic')}</span>
                                </div>
                                <ul className="space-y-2.5 text-xs text-blue-900/80 dark:text-blue-200/80 ms-1">
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>{t('kpis_based_completed')}</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>{t('net_revenue_formula')}</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                        <span>{t('data_filtered_date')}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Detailed Schemas */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">
                                    <Table size={14} className="text-gray-500" />
                                    <span>{t('source_tables_fields')}</span>
                                </div>

                                <div className="space-y-4">
                                    <TableSchema
                                        name={`1. ${t('orders_table')}`}
                                        desc={t('orders_table_desc')}
                                        columns={[t('order_id'), t('order_date'), t('order_status'), t('total_order_amount'), t('discount_amount'), t('net_order_amount'), t('customer_id')]}
                                    />
                                    <TableSchema
                                        name={`2. ${t('order_items_table')}`}
                                        desc={t('order_items_table_desc')}
                                        columns={[t('order_id'), t('product_id'), t('product_name'), t('quantity_sold'), t('item_revenue'), t('item_cost')]}
                                    />
                                    <TableSchema
                                        name={`3. ${t('products_table')}`}
                                        desc={t('products_table_desc')}
                                        columns={[t('product_id'), t('product_name'), t('product_category'), t('selling_price'), t('cost_price')]}
                                    />
                                    <TableSchema
                                        name={`4. ${t('customers_table')}`}
                                        desc={t('customers_table_desc')}
                                        columns={[t('customer_id'), t('customer_name'), t('customer_type'), t('total_orders_count')]}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 text-[10px] text-gray-400 dark:text-gray-500 italic text-center">
                                {t('dashboard_aggregates_data')}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer - Fixed/Static */}
                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-monday-dark-bg z-10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
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
