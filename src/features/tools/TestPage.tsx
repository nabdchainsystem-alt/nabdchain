import React from 'react';
import { Plus, X, Flask, CurrencyDollar, Users, ShoppingCart, TrendUp, Package, Truck, ChartLine, Percent, ArrowsLeftRight, Sparkle, ListBullets, CircleNotch, ChartBar, Waves, SquaresFour, ChartLineUp } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { KPICard, KPIConfig } from '../board/components/dashboard/KPICard';
import {
    SparklineKPICard, SparklineKPIConfig,
    ProgressKPICard, ProgressKPIConfig,
    ComparisonKPICard, ComparisonKPIConfig,
    GradientKPICard, GradientKPIConfig,
    CompactKPICard, CompactKPIConfig,
    RadialKPICard, RadialKPIConfig,
    MiniBarKPICard, MiniBarKPIConfig,
    MiniAreaKPICard, MiniAreaKPIConfig,
    MultiMetricKPICard, MultiMetricKPIConfig,
    FullChartKPICard, FullChartKPIConfig
} from '../board/components/dashboard/KPICardVariants';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

import { AntigravityDesigns } from './AntigravityDesigns';
import { SalesInsightsDashboard } from '../mini_company/operations/SalesInsightsDashboard';
import { SalesInsightsDashboardECharts } from '../mini_company/operations/SalesInsightsDashboardECharts';
import { SalesPerformanceDashboard } from '../mini_company/operations/SalesPerformanceDashboard';
import { SalesAnalysisDashboard } from '../mini_company/operations/SalesAnalysisDashboard';
import { SalesForecastDashboard } from '../mini_company/operations/SalesForecastDashboard';
import { SalesFunnelDashboard } from '../mini_company/operations/SalesFunnelDashboard';
import { SalesSegmentationDashboard } from '../mini_company/operations/SalesSegmentationDashboard';
import { SalesPromotionsDashboard } from '../mini_company/operations/SalesPromotionsDashboard';

// Sample data for charts
const barData = [
    { name: 'Jan', sales: 4000, orders: 2400 },
    { name: 'Feb', sales: 3000, orders: 1398 },
    { name: 'Mar', sales: 2000, orders: 9800 },
    { name: 'Apr', sales: 2780, orders: 3908 },
    { name: 'May', sales: 1890, orders: 4800 },
    { name: 'Jun', sales: 2390, orders: 3800 },
];

const pieData = [
    { name: 'Electronics', value: 400 },
    { name: 'Clothing', value: 300 },
    { name: 'Food', value: 300 },
    { name: 'Other', value: 200 },
];

const areaData = [
    { name: 'Week 1', revenue: 4000, profit: 2400 },
    { name: 'Week 2', revenue: 3000, profit: 1398 },
    { name: 'Week 3', revenue: 2000, profit: 9800 },
    { name: 'Week 4', revenue: 2780, profit: 3908 },
];

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

// KPI demo data
const kpiData: (KPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Total Revenue', value: '0', rawValue: 124500, isCurrency: true, change: '+12.5%', trend: 'up', icon: <CurrencyDollar size={18} />, color: 'indigo', sparklineData: [40, 35, 55, 60, 58, 75, 80] },
    { id: '2', label: 'Active Users', value: '8,432', change: '+8.2%', trend: 'up', icon: <Users size={18} />, color: 'emerald', sparklineData: [20, 25, 30, 45, 40, 55, 60] },
    { id: '3', label: 'Orders', value: '1,243', change: '-3.1%', trend: 'down', icon: <ShoppingCart size={18} />, color: 'amber', sparklineData: [50, 45, 40, 35, 38, 30, 25] },
    { id: '4', label: 'Growth Rate', value: '23.5%', change: '0%', trend: 'neutral', icon: <TrendUp size={18} />, color: 'violet', sparklineData: [20, 20, 22, 23, 23, 24, 23.5] },
    { id: '5', label: 'Inventory', value: '12,847', change: '+5.4%', trend: 'up', icon: <Package size={18} />, color: 'blue', sparklineData: [100, 110, 105, 115, 120, 118, 125] },
    { id: '6', label: 'Shipments', value: '892', change: '+15.8%', trend: 'up', icon: <Truck size={18} />, color: 'teal', sparklineData: [10, 15, 12, 18, 20, 25, 30] },
];

// KPI Cards Demo Component (Original)
const KPICardsDemo: React.FC = () => {
    const { currency } = useAppContext();
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-stone- Stone-200 mb-4">Original KPI Cards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {kpiData.map(kpi => (
                        <KPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">Original KPI Cards (Smaller Width Test)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {kpiData.map(kpi => (
                        <KPICard
                            key={`small-${kpi.id}`}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Enhanced KPI Demo Data
const sparklineKPIs: (SparklineKPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Revenue', value: '0', rawValue: 124500, isCurrency: true, change: '+12.5%', trend: 'up', sparklineData: [30, 40, 35, 50, 49, 60, 70, 65, 80], icon: <CurrencyDollar size={18} />, color: 'indigo' },
    { id: '2', label: 'Users', value: '8,432', change: '+8.2%', trend: 'up', sparklineData: [20, 25, 30, 28, 35, 40, 38, 45, 50], icon: <Users size={18} />, color: 'emerald' },
    { id: '3', label: 'Orders', value: '1,243', change: '-3.1%', trend: 'down', sparklineData: [50, 45, 48, 42, 40, 38, 35, 30, 28], icon: <ShoppingCart size={18} />, color: 'rose' },
];

const progressKPIs: (ProgressKPIConfig & { isCurrency?: boolean })[] = [
    { id: '1', label: 'Quarterly Sales', currentValue: 124500, targetValue: 160000, isCurrency: true, change: '+12.5%', trend: 'up', color: 'indigo' },
    { id: '2', label: 'New Users Target', currentValue: 8432, targetValue: 10000, change: '+8.2%', trend: 'up', color: 'emerald' },
    { id: '3', label: 'Support Tickets', currentValue: 45, targetValue: 100, change: '-15%', trend: 'down', color: 'amber' },
];

const comparisonKPIs: (ComparisonKPIConfig & { rawCurrentValue?: number, rawPreviousValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Revenue', currentValue: '0', rawCurrentValue: 124500, currentLabel: 'This Month', previousValue: '0', rawPreviousValue: 110700, previousLabel: 'Last Month', isCurrency: true, change: '+12.5%', trend: 'up', icon: <CurrencyDollar size={18} />, color: 'indigo' },
    { id: '2', label: 'Orders', currentValue: '1,243', currentLabel: 'This Week', previousValue: '1,182', previousLabel: 'Last Week', change: '+5.2%', trend: 'up', icon: <ShoppingCart size={18} />, color: 'emerald' },
];

const gradientKPIs: (GradientKPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Total Revenue', value: '0', rawValue: 124500, isCurrency: true, change: '+12.5%', trend: 'up', icon: <CurrencyDollar size={18} />, gradient: 'indigo' },
    { id: '2', label: 'Active Users', value: '8,432', change: '+8.2%', trend: 'up', icon: <Users size={18} />, gradient: 'emerald' },
    { id: '3', label: 'Growth Rate', value: '23.5%', change: '-2.1%', trend: 'down', icon: <TrendUp size={18} />, gradient: 'sunset' },
    { id: '4', label: 'Shipments', value: '892', change: '+15.8%', trend: 'up', icon: <Truck size={18} />, gradient: 'ocean' },
];

const compactKPIs: (CompactKPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Revenue', value: '124.5K', rawValue: 124500, isCurrency: true, change: '+12.5%', trend: 'up', color: 'indigo' },
    { id: '2', label: 'Users', value: '8,432', change: '+8.2%', trend: 'up', color: 'emerald' },
    { id: '3', label: 'Orders', value: '1,243', change: '-3.1%', trend: 'down', color: 'rose' },
    { id: '4', label: 'Growth', value: '23.5%', change: '0%', trend: 'neutral', color: 'amber' },
];

const radialKPIs: (RadialKPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    { id: '1', label: 'Sales Target', value: '0', rawValue: 124500, percentage: 78, isCurrency: true, subtitle: 'of $160,000 goal', color: 'indigo' },
    { id: '2', label: 'User Growth', value: '8,432', percentage: 84, subtitle: 'of 10,000 target', color: 'emerald' },
    { id: '3', label: 'Task Complete', value: '45/60', percentage: 75, subtitle: 'tasks done', color: 'violet' },
];

// Chart KPI Demo Data
const miniBarKPIs: (MiniBarKPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    {
        id: '1', label: 'Weekly Sales', value: '0', rawValue: 28450, isCurrency: true, change: '+18.2%', trend: 'up',
        chartData: [
            { name: 'Mon', value: 3200 }, { name: 'Tue', value: 4100 }, { name: 'Wed', value: 3800 },
            { name: 'Thu', value: 4500 }, { name: 'Fri', value: 5200 }, { name: 'Sat', value: 4800 }, { name: 'Sun', value: 2850 }
        ],
        icon: <CurrencyDollar size={18} />, color: 'indigo'
    },
    {
        id: '2', label: 'Daily Orders', value: '1,892', change: '+12.5%', trend: 'up',
        chartData: [
            { name: 'Mon', value: 220 }, { name: 'Tue', value: 280 }, { name: 'Wed', value: 310 },
            { name: 'Thu', value: 290 }, { name: 'Fri', value: 350 }, { name: 'Sat', value: 280 }, { name: 'Sun', value: 162 }
        ],
        icon: <ShoppingCart size={18} />, color: 'emerald'
    },
    {
        id: '3', label: 'Support Tickets', value: '156', change: '-8.4%', trend: 'down',
        chartData: [
            { name: 'Mon', value: 28 }, { name: 'Tue', value: 22 }, { name: 'Wed', value: 25 },
            { name: 'Thu', value: 20 }, { name: 'Fri', value: 24 }, { name: 'Sat', value: 19 }, { name: 'Sun', value: 18 }
        ],
        icon: <Users size={18} />, color: 'rose'
    },
];

const miniAreaKPIs: (MiniAreaKPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    {
        id: '1', label: 'Revenue Trend', value: '0', rawValue: 89250, isCurrency: true, change: '+22.4%', trend: 'up',
        chartData: [
            { name: '1', value: 4000 }, { name: '2', value: 4200 }, { name: '3', value: 3800 },
            { name: '4', value: 4600 }, { name: '5', value: 5100 }, { name: '6', value: 4900 },
            { name: '7', value: 5400 }, { name: '8', value: 5800 }, { name: '9', value: 6200 }
        ],
        icon: <TrendUp size={18} />, color: 'indigo'
    },
    {
        id: '2', label: 'Active Sessions', value: '12,847', change: '+15.8%', trend: 'up',
        chartData: [
            { name: '1', value: 8000 }, { name: '2', value: 8500 }, { name: '3', value: 9200 },
            { name: '4', value: 8800 }, { name: '5', value: 9500 }, { name: '6', value: 10200 },
            { name: '7', value: 11000 }, { name: '8', value: 11800 }, { name: '9', value: 12847 }
        ],
        icon: <Users size={18} />, color: 'emerald'
    },
    {
        id: '3', label: 'Error Rate', value: '0.42%', change: '-32.1%', trend: 'down',
        chartData: [
            { name: '1', value: 62 }, { name: '2', value: 58 }, { name: '3', value: 55 },
            { name: '4', value: 52 }, { name: '5', value: 48 }, { name: '6', value: 45 },
            { name: '7', value: 44 }, { name: '8', value: 43 }, { name: '9', value: 42 }
        ],
        icon: <ChartLineUp size={18} />, color: 'amber'
    },
];

const multiMetricKPIs: MultiMetricKPIConfig[] = [
    {
        id: '1', label: 'Sales Pipeline',
        metrics: [
            { name: 'Leads', value: 1240, maxValue: 2000, color: 'indigo' },
            { name: 'Qualified', value: 680, maxValue: 1000, color: 'violet' },
            { name: 'Proposals', value: 320, maxValue: 500, color: 'emerald' },
            { name: 'Closed', value: 145, maxValue: 200, color: 'teal' },
        ],
        icon: <TrendUp size={18} />
    },
    {
        id: '2', label: 'Resource Usage',
        metrics: [
            { name: 'CPU', value: 72, maxValue: 100, color: 'emerald' },
            { name: 'Memory', value: 58, maxValue: 100, color: 'blue' },
            { name: 'Storage', value: 85, maxValue: 100, color: 'amber' },
            { name: 'Network', value: 34, maxValue: 100, color: 'indigo' },
        ],
        icon: <Package size={18} />
    },
];

const fullChartKPIs: (FullChartKPIConfig & { rawValue?: number, isCurrency?: boolean })[] = [
    {
        id: '1', label: 'Monthly Revenue', value: '0', rawValue: 284500, isCurrency: true, change: '+24.5%', trend: 'up',
        chartData: [
            { name: 'Jan', current: 42000, previous: 35000 },
            { name: 'Feb', current: 38000, previous: 32000 },
            { name: 'Mar', current: 45000, previous: 38000 },
            { name: 'Apr', current: 52000, previous: 42000 },
            { name: 'May', current: 48000, previous: 40000 },
            { name: 'Jun', current: 59500, previous: 45000 },
        ],
        icon: <CurrencyDollar size={20} />, color: 'indigo'
    },
    {
        id: '2', label: 'User Signups', value: '18,420', change: '+32.1%', trend: 'up',
        chartData: [
            { name: 'Jan', current: 2200, previous: 1800 },
            { name: 'Feb', current: 2800, previous: 2100 },
            { name: 'Mar', current: 3100, previous: 2400 },
            { name: 'Apr', current: 2900, previous: 2200 },
            { name: 'May', current: 3400, previous: 2600 },
            { name: 'Jun', current: 4020, previous: 2800 },
        ],
        icon: <Users size={20} />, color: 'emerald'
    },
];

// Enhanced KPI Cards Demo Component
const EnhancedKPICardsDemo: React.FC = () => {
    const { currency } = useAppContext();
    return (
        <div className="space-y-8">
            {/* Sparkline Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <ChartLine size={20} /> Sparkline KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Mini trend chart showing historical data</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sparklineKPIs.map(kpi => (
                        <SparklineKPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>

            {/* Progress Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <Percent size={20} /> Progress/Target KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Shows progress toward a goal with visual bar</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {progressKPIs.map(kpi => (
                        <ProgressKPICard
                            key={kpi.id}
                            {...kpi}
                            prefix={kpi.isCurrency ? currency.symbol : ''}
                        />
                    ))}
                </div>
            </div>

            {/* Comparison Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <ArrowsLeftRight size={20} /> Comparison KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Side-by-side current vs previous period</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {comparisonKPIs.map(kpi => (
                        <ComparisonKPICard
                            key={kpi.id}
                            {...kpi}
                            currentValue={kpi.isCurrency && kpi.rawCurrentValue ? formatCurrency(kpi.rawCurrentValue, currency.code, currency.symbol) : kpi.currentValue}
                            previousValue={kpi.isCurrency && kpi.rawPreviousValue ? formatCurrency(kpi.rawPreviousValue, currency.code, currency.symbol) : kpi.previousValue}
                        />
                    ))}
                </div>
            </div>

            {/* Gradient Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <Sparkle size={20} /> Gradient/Glass KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Modern aesthetic with gradient backgrounds</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {gradientKPIs.map(kpi => (
                        <GradientKPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>

            {/* Compact Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <ListBullets size={20} /> Compact KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Dense layout for dashboards with many metrics</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                    {compactKPIs.map(kpi => (
                        <CompactKPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>

            {/* Radial Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <CircleNotch size={20} /> Radial/Ring KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Visual gauge-style progress indicator</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {radialKPIs.map(kpi => (
                        <RadialKPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>
            {/* Mini Bar Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <ChartBar size={20} /> Mini Bar KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Compact bar charts for distribution data</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {miniBarKPIs.map(kpi => (
                        <MiniBarKPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>

            {/* Mini Area Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <Waves size={20} /> Mini Area KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Smoothed area charts for trend visualization</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {miniAreaKPIs.map(kpi => (
                        <MiniAreaKPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>

            {/* Multi Metric Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <SquaresFour size={20} /> Multi-Metric Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Grouped metrics with progress bars</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {multiMetricKPIs.map(kpi => (
                        <MultiMetricKPICard key={kpi.id} {...kpi} />
                    ))}
                </div>
            </div>

            {/* Full Chart Cards */}
            <div>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-2">
                    <ChartLine size={24} /> Full Chart KPI Cards
                </h2>
                <p className="text-sm text-stone-500 mb-4">Detailed periodic comparison</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {fullChartKPIs.map(kpi => (
                        <FullChartKPICard
                            key={kpi.id}
                            {...kpi}
                            value={kpi.isCurrency && kpi.rawValue ? formatCurrency(kpi.rawValue, currency.code, currency.symbol) : kpi.value}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Recharts Demo Component
const RechartsDemo: React.FC = () => (
    <div className="space-y-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">Recharts Library</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Bar Chart - Sales vs Orders</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Line Chart */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Line Chart - Trend Analysis</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Pie Chart - Categories</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Area Chart */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Area Chart - Revenue & Profit</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={areaData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="profit" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

// ECharts Demo Component
const EChartsDemo: React.FC = () => {
    // Bar Chart Option
    const barOption: EChartsOption = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Sales', 'Orders'] },
        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        yAxis: { type: 'value' },
        series: [
            { name: 'Sales', type: 'bar', data: [4000, 3000, 2000, 2780, 1890, 2390], itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] } },
            { name: 'Orders', type: 'bar', data: [2400, 1398, 9800, 3908, 4800, 3800], itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] } }
        ]
    };

    // Line Chart Option
    const lineOption: EChartsOption = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Sales', 'Orders'] },
        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], boundaryGap: false },
        yAxis: { type: 'value' },
        series: [
            { name: 'Sales', type: 'line', data: [4000, 3000, 2000, 2780, 1890, 2390], smooth: true, lineStyle: { color: '#6366f1', width: 2 }, itemStyle: { color: '#6366f1' } },
            { name: 'Orders', type: 'line', data: [2400, 1398, 9800, 3908, 4800, 3800], smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' } }
        ]
    };

    // Pie Chart Option
    const pieOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', right: 10, top: 'center' },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: [
                { value: 400, name: 'Electronics', itemStyle: { color: '#6366f1' } },
                { value: 300, name: 'Clothing', itemStyle: { color: '#22c55e' } },
                { value: 300, name: 'Food', itemStyle: { color: '#f59e0b' } },
                { value: 200, name: 'Other', itemStyle: { color: '#ef4444' } }
            ]
        }]
    };

    // Area Chart Option
    const areaOption: EChartsOption = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Revenue', 'Profit'] },
        xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], boundaryGap: false },
        yAxis: { type: 'value' },
        series: [
            { name: 'Revenue', type: 'line', data: [4000, 3000, 2000, 2780], smooth: true, areaStyle: { color: 'rgba(99, 102, 241, 0.3)' }, lineStyle: { color: '#6366f1' }, itemStyle: { color: '#6366f1' } },
            { name: 'Profit', type: 'line', data: [2400, 1398, 9800, 3908], smooth: true, areaStyle: { color: 'rgba(34, 197, 94, 0.3)' }, lineStyle: { color: '#22c55e' }, itemStyle: { color: '#22c55e' } }
        ]
    };

    // Gauge Chart Option (unique to ECharts)
    const gaugeOption: EChartsOption = {
        series: [{
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 100,
            splitNumber: 5,
            itemStyle: { color: '#6366f1' },
            progress: { show: true, width: 18 },
            pointer: { show: false },
            axisLine: { lineStyle: { width: 18, color: [[1, '#e5e7eb']] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            title: { offsetCenter: [0, '20%'], fontSize: 14, color: '#71717a' },
            detail: { fontSize: 28, offsetCenter: [0, '-10%'], valueAnimation: true, color: '#18181b', formatter: '{value}%' },
            data: [{ value: 78, name: 'Performance' }]
        }]
    };

    // Radar Chart Option (unique to ECharts)
    const radarOption: EChartsOption = {
        legend: { data: ['Current', 'Target'] },
        radar: {
            indicator: [
                { name: 'Sales', max: 100 },
                { name: 'Marketing', max: 100 },
                { name: 'Development', max: 100 },
                { name: 'Support', max: 100 },
                { name: 'Operations', max: 100 }
            ]
        },
        series: [{
            type: 'radar',
            data: [
                { value: [85, 70, 90, 65, 80], name: 'Current', areaStyle: { color: 'rgba(99, 102, 241, 0.3)' }, lineStyle: { color: '#6366f1' }, itemStyle: { color: '#6366f1' } },
                { value: [95, 85, 95, 80, 90], name: 'Target', areaStyle: { color: 'rgba(34, 197, 94, 0.2)' }, lineStyle: { color: '#22c55e', type: 'dashed' }, itemStyle: { color: '#22c55e' } }
            ]
        }]
    };

    // Heatmap Option (unique to ECharts)
    const heatmapData: [number, number, number][] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 9; j++) {
            heatmapData.push([i, j, Math.floor(Math.random() * 100)]);
        }
    }

    const heatmapOption: EChartsOption = {
        tooltip: { position: 'top' },
        grid: { height: '60%', top: '10%' },
        xAxis: { type: 'category', data: days, splitArea: { show: true } },
        yAxis: { type: 'category', data: hours, splitArea: { show: true } },
        visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '5%', inRange: { color: ['#eef2ff', '#6366f1'] } },
        series: [{ type: 'heatmap', data: heatmapData, label: { show: true, fontSize: 10 }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }]
    };

    // Funnel Chart Option (unique to ECharts)
    const funnelOption: EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        series: [{
            type: 'funnel',
            left: '10%',
            width: '80%',
            label: { position: 'inside', formatter: '{b}', color: '#fff' },
            itemStyle: { borderColor: '#fff', borderWidth: 1 },
            data: [
                { value: 100, name: 'Visits', itemStyle: { color: '#6366f1' } },
                { value: 80, name: 'Inquiries', itemStyle: { color: '#8b5cf6' } },
                { value: 60, name: 'Leads', itemStyle: { color: '#a78bfa' } },
                { value: 40, name: 'Negotiations', itemStyle: { color: '#22c55e' } },
                { value: 20, name: 'Deals', itemStyle: { color: '#16a34a' } }
            ]
        }]
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">ECharts Library</h2>

            {/* Basic Charts (same as Recharts for comparison) */}
            <div>
                <h3 className="text-md font-medium text-stone-700 dark:text-stone-300 mb-3">Basic Charts (Compare with Recharts)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Bar Chart</h4>
                        <ReactECharts option={barOption} style={{ height: 250 }} />
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Line Chart</h4>
                        <ReactECharts option={lineOption} style={{ height: 250 }} />
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Pie/Donut Chart</h4>
                        <ReactECharts option={pieOption} style={{ height: 250 }} />
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Area Chart</h4>
                        <ReactECharts option={areaOption} style={{ height: 250 }} />
                    </div>
                </div>
            </div>

            {/* Advanced Charts (ECharts exclusive) */}
            <div>
                <h3 className="text-md font-medium text-stone-700 dark:text-stone-300 mb-3">Advanced Charts (ECharts Exclusive)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Gauge Chart</h4>
                        <ReactECharts option={gaugeOption} style={{ height: 200 }} />
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Radar Chart</h4>
                        <ReactECharts option={radarOption} style={{ height: 250 }} />
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Heatmap Chart</h4>
                        <ReactECharts option={heatmapOption} style={{ height: 300 }} />
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4">Funnel Chart</h4>
                        <ReactECharts option={funnelOption} style={{ height: 250 }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface Tab {
    id: string;
    title: string;
    content: React.ReactNode;
}

export const TestPage: React.FC = () => {
    // Initial state with demo tabs
    const initialDemoTabs: Tab[] = [
        {
            id: 'tab-antigravity',
            title: 'Antigravity designs',
            content: <AntigravityDesigns />
        },
        {
            id: 'tab-minicompany-sales',
            title: 'Mini Company / Sales',
            content: <SalesInsightsDashboard />
        },
        {
            id: 'tab-minicompany-sales-2',
            title: 'Mini Company / Sales 2',
            content: <SalesPerformanceDashboard />
        },
        {
            id: 'tab-minicompany-sales-3',
            title: 'Mini Company / Sales 3',
            content: <SalesAnalysisDashboard />
        },
        {
            id: 'tab-minicompany-sales-4',
            title: 'Mini Company / Sales 4',
            content: <SalesForecastDashboard />
        },
        {
            id: 'tab-minicompany-sales-5',
            title: 'Mini Company / Sales 5',
            content: <SalesFunnelDashboard />
        },
        {
            id: 'tab-minicompany-sales-6',
            title: 'Mini Company / Sales 6',
            content: <SalesSegmentationDashboard />
        },
        {
            id: 'tab-minicompany-sales-7',
            title: 'Mini Company / Sales 7',
            content: <SalesPromotionsDashboard />
        },
        {
            id: 'tab-minicompany-sales-echarts',
            title: 'Mini Company / Sales (ECharts)',
            content: <SalesInsightsDashboardECharts />
        },
        {
            id: 'tab-enhanced-kpi',
            title: 'Enhanced KPIs',
            content: <EnhancedKPICardsDemo />
        },
        {
            id: 'tab-kpi',
            title: 'Original KPIs',
            content: <KPICardsDemo />
        },
        {
            id: 'tab-recharts',
            title: 'Recharts',
            content: <RechartsDemo />
        },
        {
            id: 'tab-echarts',
            title: 'ECharts',
            content: <EChartsDemo />
        },
        {
            id: 'tab-blank',
            title: 'Blank',
            content: (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                        <Flask size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Blank Test Canvas</p>
                    </div>
                </div>
            )
        }
    ];

    // Helper to serialize tabs for storage (stripping React components)
    const serializeTabs = (tabsToSave: Tab[]) => {
        return tabsToSave.map(t => ({ id: t.id, title: t.title }));
    };

    // Helper to reconstruct tabs with their content
    const reconstructTabs = (savedTabs: { id: string, title: string }[]) => {
        return savedTabs.map(st => {
            const demoTab = initialDemoTabs.find(dt => dt.id === st.id);
            if (demoTab) return demoTab;
            // For user added tabs that are blank
            return {
                id: st.id,
                title: st.title,
                content: (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                            <Flask size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Blank Test Canvas</p>
                        </div>
                    </div>
                )
            };
        });
    };

    const [tabs, setTabs] = React.useState<Tab[]>(() => {
        const saved = localStorage.getItem('test-page-tabs');
        if (saved) {
            try {
                const savedTabs = JSON.parse(saved);
                const reconstructed = reconstructTabs(savedTabs);
                // Return only the tabs the user has (respects deletions)
                return reconstructed;
            } catch (e) {
                return initialDemoTabs;
            }
        }
        return initialDemoTabs;
    });

    const [activeTabId, setActiveTabId] = React.useState<string>(() => {
        return localStorage.getItem('test-page-active-tab') || 'tab-antigravity';
    });

    // Persist tabs whenever they change
    React.useEffect(() => {
        localStorage.setItem('test-page-tabs', JSON.stringify(serializeTabs(tabs)));
    }, [tabs]);

    // Persist active tab
    React.useEffect(() => {
        localStorage.setItem('test-page-active-tab', activeTabId);
    }, [activeTabId]);

    const handleAddTab = () => {
        const newId = `tab-${Date.now()}`;
        const newTab: Tab = {
            id: newId,
            title: `Test ${tabs.length + 1}`,
            content: (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                        <Flask size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Blank Test Canvas</p>
                    </div>
                </div>
            )
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const handleCloseTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) return; // Don't close last tab
        setTabs(newTabs);
        if (activeTabId === id) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const activeTab = tabs.find(t => t.id === activeTabId);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
            {/* Header Section (Mimicking BoardView) */}
            <div className="flex-shrink-0 bg-white dark:bg-[#1a1d24] grid grid-rows-[1fr]">
                <div className="overflow-hidden">
                    <div className="pl-[24px] pr-[20px] pt-4 pb-0">
                        {/* Title Row */}
                        <div className="flex items-center justify-between mb-1 gap-4">
                            <div className="relative">
                                <h1 className="text-[32px] font-bold text-[#323338] dark:text-[#d0d1d6] leading-tight tracking-tight outline-none border border-transparent -ml-1.5 px-1.5 rounded-[4px]">
                                    Test Tools
                                </h1>
                            </div>
                        </div>
                        {/* Description Row (Empty/Reserved space like BoardView) */}
                        <div className="mb-4 text-[#676879] dark:text-[#9597a1] text-[14px] min-h-[20px]">
                            Testing playground for new tools and components
                        </div>

                        {/* Tabs Row */}
                        <div className="flex items-center gap-0 w-full border-b border-gray-200 dark:border-gray-800">
                            <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide no-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                {tabs.map(tab => (
                                    <div
                                        key={tab.id}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={`
                                            group flex items-center justify-start text-left gap-2 py-1.5 border-b-2 text-[13.6px] font-medium transition-colors whitespace-nowrap select-none px-3 cursor-pointer
                                            ${activeTabId === tab.id
                                                ? 'border-indigo-500 text-[#323338] dark:text-gray-100'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }
                                        `}
                                    >
                                        <span>{tab.title}</span>
                                        {tabs.length > 1 && (
                                            <button
                                                onClick={(e) => handleCloseTab(tab.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-gray-400"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddTab}
                                className="flex-shrink-0 ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                                title="Add Tab"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {/* Global styling: White background and no padding for all tabs */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1d24] p-0">
                {activeTab?.content}
            </div>
        </div>
    );
};
