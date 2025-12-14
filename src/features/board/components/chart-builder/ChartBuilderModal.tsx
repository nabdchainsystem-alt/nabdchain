import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactECharts from 'echarts-for-react';
import {
    X, Check, BarChart3, LineChart, PieChart,
    ScatterChart, Settings2, Database, AlertCircle,
    LayoutDashboard, Radar, Filter, Gauge, LayoutGrid
} from 'lucide-react';
import { Column, Row } from '../../views/Table/RoomTable';
import { ChartBuilderConfig, ChartCategory, ChartType, CHART_CATEGORIES } from './types';
import { ChartDataTransformer } from './services/ChartDataTransformer';

interface ChartBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: ChartBuilderConfig) => void;
    columns: Column[];
    rows: Row[];
    initialConfig?: ChartBuilderConfig;
}

export const ChartBuilderModal: React.FC<ChartBuilderModalProps> = ({ isOpen, onClose, onSave, columns, rows, initialConfig }) => {
    if (!isOpen) return null;

    // --- State ---
    const [title, setTitle] = useState(initialConfig?.title || 'New Analysis');
    const [chartType, setChartType] = useState<ChartType>(initialConfig?.chartType || 'bar');
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>(initialConfig?.includedRowIds || rows.map(r => r.id));
    const [filterSearch, setFilterSearch] = useState('');

    // Auto-select smart defaults if not provided - REMOVED per user request
    // const defaultX = columns.find(c => c.type === 'status' || c.type === 'select')?.id || columns[0]?.id || '';
    const [xAxisColId, setXAxisColId] = useState(initialConfig?.xAxisColumnId || '');

    const [yAxisColId, setYAxisColId] = useState(initialConfig?.yAxisColumnId || '');
    const [aggregation, setAggregation] = useState(initialConfig?.aggregation || 'count');

    // --- Derived State (Real-time Preview) ---
    const config: ChartBuilderConfig = {
        title,
        chartType,
        xAxisColumnId: xAxisColId,
        yAxisColumnId: yAxisColId,
        aggregation,
        includedRowIds: selectedRowIds.length === rows.length ? undefined : selectedRowIds
    };

    const validation = useMemo(() => {
        if (!xAxisColId) return { isValid: false, message: 'Please select a Group By column to start.' };
        if (selectedRowIds.length === 0) return { isValid: false, message: 'Please select at least one row.' };
        return ChartDataTransformer.validateConfig(config, columns);
    }, [config, columns, xAxisColId, selectedRowIds]);

    const chartOption = useMemo(() => {
        if (!validation.isValid) return null;
        const data = ChartDataTransformer.transformData(rows, config);
        return ChartDataTransformer.generateOption(data, config);
    }, [rows, config, validation]);

    // --- Helpers ---
    // --- Constants & Helpers ---
    const CHART_CONFIGS: Record<ChartType, { label: string; color: string; icon: React.ReactNode }> = {
        bar: { label: 'Bar Chart', color: 'bg-blue-100 text-blue-600', icon: <BarChart3 size={20} /> },
        line: { label: 'Line Chart', color: 'bg-indigo-100 text-indigo-600', icon: <LineChart size={20} /> },
        area: { label: 'Area Chart', color: 'bg-cyan-100 text-cyan-600', icon: <LineChart size={20} /> }, // Reusing Line icon but distinct color
        pie: { label: 'Pie Chart', color: 'bg-purple-100 text-purple-600', icon: <PieChart size={20} /> },
        doughnut: { label: 'Doughnut', color: 'bg-fuchsia-100 text-fuchsia-600', icon: <PieChart size={20} /> },
        scatter: { label: 'Scatter', color: 'bg-pink-100 text-pink-600', icon: <ScatterChart size={20} /> },
        radar: { label: 'Radar', color: 'bg-orange-100 text-orange-600', icon: <Radar size={20} /> },
        funnel: { label: 'Funnel', color: 'bg-yellow-100 text-yellow-600', icon: <Filter size={20} /> },
        gauge: { label: 'Gauge', color: 'bg-emerald-100 text-emerald-600', icon: <Gauge size={20} /> },
        treemap: { label: 'Treemap', color: 'bg-lime-100 text-lime-600', icon: <LayoutGrid size={20} /> },
    };

    const ALL_CHART_TYPES = Object.keys(CHART_CONFIGS) as ChartType[];

    return createPortal(
        <div
            className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-6 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#1f2129] w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 font-sans"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header (Monday-style: Clean, White, Simple Actions) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1f2129] z-20">
                    <div>
                        <h2 className="text-xl font-bold text-[#323338] dark:text-gray-100 tracking-tight">Add Widget</h2>
                        <p className="text-[13px] text-[#676879] dark:text-gray-400">Transform your board data into insights</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors text-[#676879]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Split View */}
                <div className="flex flex-1 overflow-hidden bg-[#f7f9fa] dark:bg-[#111111]">

                    {/* Left Pane: Configuration (The Settings Panel) */}
                    <div className="w-[380px] flex-shrink-0 border-r border-stone-200 dark:border-stone-700 overflow-y-auto bg-white dark:bg-[#1f2129] flex flex-col">

                        {/* Section 1: Chart Title */}
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 space-y-3">
                            <label className="block text-[13px] font-semibold text-[#323338] dark:text-gray-200">Chart Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-10 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-[14px] text-[#323338] dark:text-gray-100 focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] outline-none transition-all placeholder:text-stone-400"
                                placeholder="Enter chart title..."
                            />
                        </div>

                        {/* Section 2: Data Settings */}
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 space-y-5">
                            <h3 className="text-[13px] font-semibold text-[#323338] dark:text-gray-200">Data Settings</h3>

                            {/* X-Axis */}
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-normal text-[#676879] dark:text-gray-400">X Axis (Group By)</label>
                                <div className="relative">
                                    <select
                                        value={xAxisColId}
                                        onChange={(e) => setXAxisColId(e.target.value)}
                                        className="w-full h-10 pl-3 pr-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-md text-[14px] text-[#323338] dark:text-gray-100 focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] outline-none transition-all appearance-none"
                                    >
                                        <option value="" disabled>Choose a column...</option>
                                        {columns.map(col => (
                                            <option key={col.id} value={col.id}>{col.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                                        <Settings2 size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Y-Axis & Aggregation */}
                            <div className="space-y-1.5">
                            </div>
                        </div>

                        {/* Section 2.5: Filter Data */}
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[13px] font-semibold text-[#323338] dark:text-gray-200">Filter Data</h3>
                                <div className="text-[11px] text-[#676879] dark:text-gray-400">
                                    {selectedRowIds.length} / {rows.length}
                                </div>
                            </div>

                            {/* Search & Actions */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search rows..."
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    className="flex-1 h-8 px-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[12px] outline-none focus:border-[#0073ea]"
                                />
                                <button
                                    onClick={() => {
                                        if (selectedRowIds.length === rows.length) {
                                            setSelectedRowIds([]);
                                        } else {
                                            setSelectedRowIds(rows.map(r => r.id));
                                        }
                                    }}
                                    className="px-2 h-8 text-[11px] font-medium text-[#0073ea] hover:bg-stone-50 dark:hover:bg-stone-800 rounded border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-all"
                                >
                                    {selectedRowIds.length === rows.length ? 'None' : 'All'}
                                </button>
                            </div>

                            {/* Row List */}
                            <div className="h-32 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50/50 dark:bg-stone-800/30 p-1 space-y-0.5">
                                {rows
                                    .filter(row => (row.name || '').toLowerCase().includes(filterSearch.toLowerCase()))
                                    .map(row => (
                                        <label
                                            key={row.id}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-white dark:hover:bg-stone-700 rounded cursor-pointer transition-colors group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedRowIds.includes(row.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedRowIds([...selectedRowIds, row.id]);
                                                    } else {
                                                        setSelectedRowIds(selectedRowIds.filter(id => id !== row.id));
                                                    }
                                                }}
                                                className="w-3.5 h-3.5 rounded border-stone-300 text-[#0073ea] focus:ring-[#0073ea]"
                                            />
                                            <span className="text-[12px] text-[#323338] dark:text-gray-300 truncate select-none group-hover:text-black dark:group-hover:text-white">
                                                {row.name || 'Untitled Row'}
                                            </span>
                                        </label>
                                    ))}
                                {rows.filter(row => (row.name || '').toLowerCase().includes(filterSearch.toLowerCase())).length === 0 && (
                                    <div className="p-4 text-center text-[11px] text-stone-400 italic">
                                        No matches found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Chart Type */}
                        <div className="p-6 flex-1">
                            <label className="block text-[13px] font-semibold text-[#323338] dark:text-gray-200 mb-3">Chart Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {ALL_CHART_TYPES.map(type => {
                                    const conf = CHART_CONFIGS[type];
                                    const isSelected = chartType === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setChartType(type)}
                                            className={`
                                                relative flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200
                                                ${isSelected
                                                    ? 'border-[#0073ea] bg-[#e5f4ff] dark:bg-[#0073ea]/20 ring-1 ring-[#0073ea]'
                                                    : 'border-transparent bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700'
                                                }
                                            `}
                                        >
                                            <div className={`p-1.5 rounded-md ${isSelected ? 'bg-transparent text-[#0073ea]' : conf.color}`}>
                                                {conf.icon}
                                            </div>
                                            <span className={`text-[11px] font-medium ${isSelected ? 'text-[#0073ea]' : 'text-[#676879] dark:text-gray-400'}`}>
                                                {conf.label}
                                            </span>
                                            {isSelected && (
                                                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0073ea]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                    </div>

                    {/* Right Pane: Preview Canvas */}
                    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#f7f9fa] dark:bg-[#111111]">
                        {/* Interactive Canvas Area */}
                        <div className="flex-1 flex items-center justify-center p-12">
                            <div className="w-full max-w-3xl aspect-[16/9] bg-white dark:bg-[#1f2129] rounded-lg shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col transition-all duration-300">
                                {/* Chart Header inside Card */}
                                <div className="h-12 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between px-6">
                                    <span className="font-semibold text-stone-700 dark:text-gray-200 text-sm truncate">{title || 'Untitled Chart'}</span>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-stone-200 dark:bg-stone-700" />
                                        <div className="w-2 h-2 rounded-full bg-stone-200 dark:bg-stone-700" />
                                    </div>
                                </div>

                                {/* Main Chart Render */}
                                <div className="flex-1 p-6 relative">
                                    {validation.isValid && chartOption ? (
                                        <ReactECharts
                                            option={{ ...chartOption, title: { show: false }, grid: { top: 10, bottom: 20, left: 20, right: 20, containLabel: true } }}
                                            style={{ height: '100%', width: '100%' }}
                                            theme="macarons"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                                            <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800/50 rounded-full flex items-center justify-center mb-4">
                                                <BarChart3 size={40} className="text-stone-300" />
                                            </div>
                                            <p className="text-sm font-medium">Connect columns to generate preview</p>
                                        </div>
                                    )}

                                    {/* Validation Toast */}
                                    {!validation.isValid && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 py-2 px-4 bg-stone-800 text-white text-xs rounded-full shadow-lg flex items-center gap-2">
                                            <AlertCircle size={14} className="text-amber-400" />
                                            {validation.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="px-8 py-4 bg-white dark:bg-[#1f2129] border-t border-stone-200 dark:border-stone-700 flex justify-end gap-3 z-20">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-[14px] font-normal text-[#323338] hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => validation.isValid && onSave(config)}
                        disabled={!validation.isValid}
                        className={`px-6 py-2 text-[14px] font-medium text-white rounded transition-all shadow-sm ${validation.isValid
                            ? 'bg-[#0073ea] hover:bg-[#0060b9]'
                            : 'bg-stone-300 cursor-not-allowed'
                            }`}
                    >
                        Add Widget
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};
