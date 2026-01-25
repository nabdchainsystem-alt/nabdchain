import React from 'react';
import { Plus, X, Flask } from 'phosphor-react';
import { MemoizedChart as ReactECharts } from '../../components/common/MemoizedChart';
import type { EChartsOption } from 'echarts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAppContext } from '../../contexts/AppContext';

const SAMPLE_DATA = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
];

const PIE_DATA = [
    { name: 'Online', value: 65 },
    { name: 'Store', value: 15 },
    { name: 'Marketplace', value: 12 },
    { name: 'WhatsApp', value: 8 },
];

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

interface Tab {
    id: string;
    title: string;
    content: React.ReactNode;
}

const Test1Content: React.FC = () => {
    const { dir } = useAppContext();
    const isRTL = dir === 'rtl';

    const echartsBarOption: EChartsOption = {
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: SAMPLE_DATA.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            inverse: isRTL,
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
            position: isRTL ? 'right' : 'left',
        },
        grid: { left: isRTL ? 20 : 50, right: isRTL ? 50 : 20, top: 20, bottom: 30 },
        series: [{
            type: 'bar',
            data: SAMPLE_DATA.map(d => d.sales),
            itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
            barWidth: '60%',
        }],
    };

    const echartsPieOption: EChartsOption = {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: isRTL ? 'auto' : 10, left: isRTL ? 10 : 'auto', top: 'center' },
        series: [{
            type: 'pie',
            selectedMode: 'multiple',
            radius: '70%',
            center: [isRTL ? '60%' : '40%', '50%'],
            data: PIE_DATA.map((d, i) => ({ ...d, itemStyle: { color: PIE_COLORS[i] } })),
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        }],
    };

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ECharts Bar Chart */}
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">ECharts Bar Chart</h3>
                <p className="text-xs text-gray-400 mb-4">Sales data visualization</p>
                <div className="h-[300px]">
                    <ReactECharts option={echartsBarOption} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Recharts Bar Chart</h3>
                <p className="text-xs text-gray-400 mb-4">Sales data visualization</p>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={SAMPLE_DATA}
                            margin={{ top: 10, right: isRTL ? 0 : 20, left: isRTL ? 20 : 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                reversed={isRTL}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                width={45}
                                orientation={isRTL ? 'right' : 'left'}
                            />
                            <Tooltip />
                            <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ECharts Pie Chart */}
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">ECharts Pie Chart</h3>
                <p className="text-xs text-gray-400 mb-4">Sales by channel</p>
                <div className="h-[300px]">
                    <ReactECharts option={echartsPieOption} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            {/* Recharts Pie Chart */}
            <div className="bg-white dark:bg-monday-dark-elevated p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Recharts Pie Chart</h3>
                <p className="text-xs text-gray-400 mb-4">Sales by channel</p>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={PIE_DATA}
                                cx={isRTL ? '60%' : '40%'}
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                paddingAngle={2}
                            >
                                {PIE_DATA.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                layout="vertical"
                                align={isRTL ? 'left' : 'right'}
                                verticalAlign="middle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export const TestPage: React.FC = () => {
    // Clear localStorage on first load to start fresh
    React.useEffect(() => {
        localStorage.removeItem('test-page-tabs');
        localStorage.removeItem('test-page-active-tab');
    }, []);

    const createBlankTab = (id: string, title: string): Tab => ({
        id,
        title,
        content: (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                    <Flask size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Blank Test Canvas</p>
                </div>
            </div>
        )
    });

    const [tabs, setTabs] = React.useState<Tab[]>([
        { id: 'tab-1', title: 'Test 1', content: <Test1Content /> }
    ]);

    const [activeTabId, setActiveTabId] = React.useState<string>('tab-1');

    const handleAddTab = () => {
        const newId = `tab-${Date.now()}`;
        const newTab = createBlankTab(newId, `Test ${tabs.length + 1}`);
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
            {/* Header Section */}
            <div className="flex-shrink-0 bg-white dark:bg-monday-dark-surface grid grid-rows-[1fr]">
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
                        {/* Description Row */}
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
            <div className="flex-1 overflow-y-auto bg-white dark:bg-monday-dark-surface p-0">
                {activeTab?.content}
            </div>
        </div>
    );
};
