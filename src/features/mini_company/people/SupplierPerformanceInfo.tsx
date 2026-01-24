import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, ChartLine, Star, Target } from 'phosphor-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SupplierPerformanceInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupplierPerformanceInfo: React.FC<SupplierPerformanceInfoProps> = ({ isOpen, onClose }) => {
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const questions = [
        { q: t('perf_q1'), a: t('perf_a1') },
        { q: t('perf_q2'), a: t('perf_a2') },
        { q: t('perf_q3'), a: t('perf_a3') },
        { q: t('perf_q4'), a: t('perf_a4') }
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
        <div className={`fixed inset-0 z-[9999] flex overflow-hidden pointer-events-none font-sans justify-end`} dir={dir}>
            <div
                className={`absolute inset-0 pointer-events-auto transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
                style={{ background: 'transparent' }}
            />

            <div
                className={`
                    pointer-events-auto
                    relative w-full max-w-md bg-white dark:bg-monday-dark-surface shadow-2xl h-full flex flex-col
                    ${isRTL ? 'border-r' : 'border-l'} border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                <div className={`flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-monday-dark-surface z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                        <h2 className={`text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Info size={24} className="text-blue-600 dark:text-blue-400" />
                            {t('supplier_performance')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('metrics_scorecard')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close info window"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={`flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-gray-300 pb-24 ${isRTL ? 'text-right' : ''}`}>
                    <section>
                        <h3 className={`text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">01</span>
                            {t('overview')}
                        </h3>
                        <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            {t('supplier_performance_info_desc')}
                        </p>
                    </section>

                    <section>
                        <h3 className={`text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">02</span>
                            {t('key_questions_answered')}
                        </h3>
                        <div className="grid gap-2">
                            {questions.map((item, i) => (
                                <div key={i} className="rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors overflow-hidden">
                                    <button
                                        onClick={() => toggleQuestion(i)}
                                        className={`w-full flex gap-3 items-center text-sm p-3 bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-800/50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                                    >
                                        {openQuestionIndex === i ? (
                                            <CaretDown weight="bold" className="text-blue-500 shrink-0" size={14} />
                                        ) : (
                                            <CaretRight weight="bold" className={`text-gray-400 shrink-0 ${isRTL ? 'rotate-180' : ''}`} size={14} />
                                        )}
                                        <span className={`font-medium ${openQuestionIndex === i ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.q}
                                        </span>
                                    </button>
                                    <div className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${openQuestionIndex === i ? 'max-h-40 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
                                        <p className={`text-xs text-gray-500 dark:text-gray-400 pb-2 leading-relaxed ${isRTL ? 'pr-7' : 'pl-7'}`}>{item.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className={`text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">03</span>
                            {t('detailed_breakdown')}
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className={`text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('performance_metrics')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('quality_score')} desc={t('quality_score_info')} isRTL={isRTL} />
                                    <DetailItem title={t('delivery_rate')} desc={t('delivery_rate_info')} isRTL={isRTL} />
                                    <DetailItem title={t('cost_performance')} desc={t('cost_performance_info')} isRTL={isRTL} />
                                    <DetailItem title={t('response_time')} desc={t('response_time_info')} isRTL={isRTL} />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700" />

                            <div>
                                <h4 className={`text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('charts_tables')}</h4>
                                <div className="space-y-3">
                                    <DetailItem title={t('performance_trend')} desc={t('performance_trend_info')} isRTL={isRTL} />
                                    <DetailItem title={t('performance_radar')} desc={t('performance_radar_info')} isRTL={isRTL} />
                                    <DetailItem title={t('supplier_scorecard')} desc={t('supplier_scorecard_info')} isRTL={isRTL} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className={`text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">04</span>
                            {t('scoring_methodology')}
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className={`flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Star size={14} className="text-gray-500" />
                                    <span>{t('rating_scale')}</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                                        <div className="font-bold text-xs text-gray-800 dark:text-gray-200 mb-1">{t('score_ranges')}</div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('score_ranges_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-monday-dark-bg z-10">
                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        {t('close_guide')}
                    </button>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

const DetailItem = ({ title, desc, isRTL }: { title: string, desc: string, isRTL: boolean }) => (
    <div className={`group ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {desc}
        </div>
    </div>
);
