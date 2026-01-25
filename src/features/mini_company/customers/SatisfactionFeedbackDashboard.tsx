import React, { useState, useMemo, useEffect } from 'react';
import { useLoadingAnimation } from '../../../hooks/useFirstMount';
import { MemoizedChart } from '../../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { KPICard, KPIConfig } from '../../board/components/dashboard/KPICard';
import { ChartSkeleton, TableSkeleton, PieChartSkeleton } from '../../board/components/dashboard/KPICardVariants';
import { ArrowsOut, ArrowsIn, Info, TrendUp, Warning, Smiley, Star, ChatCenteredText, ThumbsUp, ThumbsDown, Megaphone } from 'phosphor-react';
import { SatisfactionFeedbackInfo } from './SatisfactionFeedbackInfo';
import { useAppContext } from '../../../contexts/AppContext';
import { useLanguage } from '../../../contexts/LanguageContext';


export const SatisfactionFeedbackDashboard: React.FC = () => {
    const { currency } = useAppContext();
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [showInfo, setShowInfo] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const isLoading = useLoadingAnimation();

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    // --- KPI Data ---
    const TOP_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = useMemo(() => [
        { id: '1', label: t('csat_score'), subtitle: t('customer_satisfaction'), value: '8.4', change: '+0.2', trend: 'up', icon: <Star size={18} />, sparklineData: [8.0, 8.1, 8.2, 8.3, 8.3, 8.4], color: 'blue' },
        { id: '2', label: t('nps_score'), subtitle: t('net_promoter'), value: '+42', change: '+5', trend: 'up', icon: <Smiley size={18} />, sparklineData: [35, 36, 38, 40, 41, 42], color: 'blue' },
        { id: '3', label: t('feedback_count'), subtitle: t('total_reviews'), value: '350', change: '+10%', trend: 'up', icon: <ChatCenteredText size={18} />, sparklineData: [300, 310, 320, 330, 340, 350], color: 'blue' },
        { id: '4', label: t('positive_percentage'), subtitle: t('star_rating'), value: '78%', change: '+2%', trend: 'up', icon: <ThumbsUp size={18} />, sparklineData: [75, 76, 76, 77, 77, 78], color: 'blue' },
    ], [t]);

    const SIDE_KPIS: (KPIConfig & { rawValue?: number, isCurrency?: boolean, color?: string })[] = useMemo(() => [
        { id: '5', label: t('negative_percentage'), subtitle: t('low_ratings'), value: '8%', change: '-1%', trend: 'down', icon: <ThumbsDown size={18} />, sparklineData: [10, 9, 9, 8, 8, 8], color: 'blue' },
        { id: '6', label: t('response_rate'), subtitle: t('survey_participation'), value: '22%', change: '+3%', trend: 'up', icon: <Megaphone size={18} />, sparklineData: [18, 19, 20, 21, 21, 22], color: 'blue' },
        { id: '7', label: t('sentiment_index'), subtitle: t('ai_analysis'), value: '72', change: '+4', trend: 'up', icon: <TrendUp size={18} />, sparklineData: [65, 66, 68, 70, 71, 72], color: 'blue' },
        { id: '8', label: t('avg_response_time'), subtitle: t('feedback_resolution'), value: '4.2h', change: '-0.5h', trend: 'up', icon: <ChatCenteredText size={18} />, sparklineData: [5.5, 5.2, 4.9, 4.6, 4.4, 4.2], color: 'blue' },
    ], [t]);

    // --- Mock Data: Charts ---
    const FEEDBACK_BY_CATEGORY = useMemo(() => [
        { name: t('product'), Count: 120 },
        { name: t('support'), Count: 85 },
        { name: t('price'), Count: 45 },
        { name: t('delivery'), Count: 60 },
        { name: t('website'), Count: 40 }
    ], [t]);

    const SENTIMENT_SPLIT = useMemo(() => [
        { value: 65, name: t('positive') },
        { value: 25, name: t('neutral') },
        { value: 10, name: t('negative') }
    ], [t]);

    // Feedback Log Table - Raw data with keys for styling
    const FEEDBACK_LOG_RAW = [
        { customer: 'Alpha Corp', typeKey: 'product_review', score: '5/5', date: '2024-01-20', statusKey: 'closed' },
        { customer: 'Beta Ltd', typeKey: 'support_ticket', score: '2/5', date: '2024-01-19', statusKey: 'in_progress' },
        { customer: 'Gamma Inc', typeKey: 'feature_request', score: 'N/A', date: '2024-01-18', statusKey: 'open' },
        { customer: 'Delta Co', typeKey: 'nps_survey', score: '9/10', date: '2024-01-18', statusKey: 'closed' },
        { customer: 'Epsilon', typeKey: 'delivery_complaint', score: '1/5', date: '2024-01-17', statusKey: 'escalated' },
    ];

    const FEEDBACK_LOG = useMemo(() => FEEDBACK_LOG_RAW.map(item => ({
        ...item,
        type: t(item.typeKey),
        status: t(item.statusKey)
    })), [t]);

    // Radar Data
    const RADAR_INDICATORS = useMemo(() => [
        { name: t('joy'), max: 100 },
        { name: t('trust'), max: 100 },
        { name: t('fear'), max: 100 },
        { name: t('surprise'), max: 100 },
        { name: t('sadness'), max: 100 },
        { name: t('disgust'), max: 100 }
    ], [t]);

    const RADAR_DATA = useMemo(() => [
        {
            value: [80, 75, 10, 40, 15, 5],
            name: t('current_sentiment')
        }
    ], [t]);

    // Additional chart data
    const NPS_BY_SEGMENT = useMemo(() => [
        { name: t('enterprise'), NPS: 55 },
        { name: t('mid_market'), NPS: 42 },
        { name: t('smb'), NPS: 38 },
        { name: t('startup'), NPS: 30 },
    ], [t]);

    const RATING_DISTRIBUTION = useMemo(() => [
        { value: 45, name: t('five_stars') },
        { value: 33, name: t('four_stars') },
        { value: 14, name: t('three_stars') },
        { value: 8, name: t('one_two_stars') }
    ], [t]);

    const toggleFullScreen = () => {
        window.dispatchEvent(new Event('dashboard-toggle-fullscreen'));
    };

    // --- ECharts Options ---

    // Pie Chart
    const pieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: SENTIMENT_SPLIT,
            color: ['#22c55e', '#fbbf24', '#ef4444']
        }]
    }), [SENTIMENT_SPLIT]);

    // Rating Distribution Pie
    const ratingPieOption: EChartsOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '65%',
            center: ['50%', '45%'],
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: RATING_DISTRIBUTION,
            color: ['#10b981', '#22c55e', '#f59e0b', '#ef4444']
        }]
    }), [RATING_DISTRIBUTION]);

    // Feedback Categories Bar Chart
    const feedbackCategoriesOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: FEEDBACK_BY_CATEGORY.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [{
            type: 'bar',
            data: FEEDBACK_BY_CATEGORY.map(d => d.Count),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [FEEDBACK_BY_CATEGORY, isRTL]);

    // NPS by Segment Bar Chart
    const npsBySegmentOption = useMemo<EChartsOption>(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: NPS_BY_SEGMENT.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            position: isRTL ? 'right' : 'left',
            axisLine: { show: true },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 },
        },
        series: [{
            type: 'bar',
            data: NPS_BY_SEGMENT.map(d => d.NPS),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
            barWidth: 28,
        }],
    }), [NPS_BY_SEGMENT, isRTL]);

    // Radar Chart
    const radarOption: EChartsOption = useMemo(() => ({
        title: { text: t('emotional_polarity'), left: 'center', top: 0, textStyle: { fontSize: 12, color: '#9ca3af' } },
        tooltip: {},
        radar: {
            indicator: RADAR_INDICATORS,
            radius: '65%',
            splitNumber: 4,
            axisName: { color: '#9ca3af', fontSize: 10 }
        },
        series: [
            {
                name: t('sentiment'),
                type: 'radar',
                data: RADAR_DATA,
                areaStyle: { opacity: 0.2, color: '#eab308' },
                lineStyle: { width: 2, color: '#eab308' },
                itemStyle: { color: '#eab308' }
            }
        ]
    }), [t, RADAR_INDICATORS, RADAR_DATA]);

    return (
        <div className="p-6 bg-white dark:bg-monday-dark-surface min-h-full font-sans text-gray-800 dark:text-gray-200 relative">
            <SatisfactionFeedbackInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                    <Smiley size={28} className="text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold">{t('satisfaction_feedback')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('satisfaction_feedback_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={isFullScreen ? t('exit_full_screen') : t('full_screen')}
                    >
                        {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-blue-500" />
                        {t('about_dashboard')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* --- Row 1: Top 4 KPIs --- */}
                {TOP_KPIS.map((kpi) => (
                    <div key={kpi.id} className="col-span-1">
                        <KPICard
                            {...kpi}
                            color="blue"
                        />
                    </div>
                ))}

                {/* --- Row 2: Two Bar Charts Side by Side --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2"><ChartSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Feedback by Category (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('feedback_categories')}</h3>
                                <p className="text-xs text-gray-400">{t('topic_analysis')}</p>
                            </div>
                            <MemoizedChart option={feedbackCategoriesOption} style={{ height: '220px', width: '100%' }} />
                        </div>

                        {/* NPS by Segment (Bar) */}
                        <div className="col-span-2 min-h-[300px] bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('nps_by_segment')}</h3>
                                <p className="text-xs text-gray-400">{t('net_promoter')}</p>
                            </div>
                            <MemoizedChart option={npsBySegmentOption} style={{ height: '220px', width: '100%' }} />
                        </div>
                    </>
                )}

                {/* --- Row 3: Two Pie Charts (col-span-2) + 4 KPIs in 2x2 grid (col-span-2) --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2"><PieChartSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Pie Charts in nested 2-col grid */}
                        <div className="col-span-2 grid grid-cols-2 gap-6">
                            {/* ECharts: Sentiment Split (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('sentiment_breakdown')}</h3>
                                    <p className="text-xs text-gray-400">{t('overall_mood')}</p>
                                </div>
                                <MemoizedChart option={pieOption} style={{ height: '180px' }} />
                            </div>

                            {/* ECharts: Rating Distribution (Pie) */}
                            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('rating_distribution')}</h3>
                                    <p className="text-xs text-gray-400">{t('star_breakdown')}</p>
                                </div>
                                <MemoizedChart option={ratingPieOption} style={{ height: '180px' }} />
                            </div>
                        </div>

                        {/* 4 KPIs in 2x2 grid */}
                        <div className="col-span-2 min-h-[250px] grid grid-cols-2 gap-4">
                            {SIDE_KPIS.map((kpi, index) => (
                                <div key={kpi.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                    <KPICard
                                        {...kpi}
                                        color="blue"
                                        className="h-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* --- Row 4: Table + Companion Chart --- */}
                {isLoading ? (
                    <>
                        <div className="col-span-2"><TableSkeleton /></div>
                        <div className="col-span-2"><ChartSkeleton /></div>
                    </>
                ) : (
                    <>
                        {/* Table (2 cols) */}
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('recent_feedback')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            <th className="px-5 py-3 text-start">{t('customer')}</th>
                                            <th className="px-5 py-3 text-start">{t('type')}</th>
                                            <th className="px-5 py-3 text-start">{t('score')}</th>
                                            <th className="px-5 py-3 text-start">{t('date')}</th>
                                            <th className="px-5 py-3 text-end">{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {FEEDBACK_LOG.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 text-start">{row.customer}</td>
                                                <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs text-start">{row.type}</td>
                                                <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200 text-start">{row.score}</td>
                                                <td className="px-5 py-3 text-gray-500 dark:text-gray-500 text-xs font-datetime text-start">{row.date}</td>
                                                <td className="px-5 py-3 text-end">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${row.statusKey === 'closed' ? 'bg-green-100 text-green-700' :
                                                        row.statusKey === 'escalated' ? 'bg-red-100 text-red-700' :
                                                            row.statusKey === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Companion Chart: Radar (2 cols) */}
                        <div className="col-span-2 bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <MemoizedChart option={radarOption} style={{ height: '300px', width: '100%' }} />
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
