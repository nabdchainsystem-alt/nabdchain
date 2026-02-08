import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MemoizedChart } from '../../../../components/common/MemoizedChart';
import {
  X,
  ChartBar as BarChart3,
  ChartLine as LineChart,
  ChartPie as PieChart,
  GearSix as Settings2,
  WarningCircle as AlertCircle,
  Funnel as Filter,
  Gauge,
  GridFour as LayoutGrid,
  Plus,
  Trash as Trash2,
  Sparkle,
  CircleNotch,
  Lightning,
  Brain,
} from 'phosphor-react';
import { Column, Row } from '../../views/Table/RoomTable';
import { ChartBuilderConfig, ChartType } from './types';
import { ChartDataTransformer } from './services/ChartDataTransformer';
import { useAI } from '../../../../contexts/AIContext';

interface ChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ChartBuilderConfig) => void;
  columns: Column[];
  rows: Row[];
  initialConfig?: ChartBuilderConfig;
}

export const ChartBuilderModal: React.FC<ChartBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  columns,
  rows,
  initialConfig,
}) => {
  if (!isOpen) return null;

  // --- State ---
  const [title, setTitle] = useState(initialConfig?.title || 'New Analysis');
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.chartType || 'bar');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>(
    initialConfig?.includedRowIds || rows.map((r) => r.id),
  );
  const [filterSearch, setFilterSearch] = useState('');
  const [filters, setFilters] = useState<{ columnId: string; operator: string; value: unknown }[]>(
    initialConfig?.filter || [],
  );

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedOption, setAiGeneratedOption] = useState<Record<string, unknown> | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const { generateChart, isProcessing, credits, deepModeEnabled, toggleDeepMode } = useAI();

  // Auto-select smart defaults if not provided - REMOVED per user request
  // const defaultX = columns.find(c => c.type === 'status' || c.type === 'select')?.id || columns[0]?.id || '';
  const [xAxisColId, setXAxisColId] = useState(initialConfig?.xAxisColumnId || '');

  const [yAxisColId, _setYAxisColId] = useState(initialConfig?.yAxisColumnId || '');
  const [aggregation, _setAggregation] = useState(initialConfig?.aggregation || 'count');

  // --- Derived State (Real-time Preview) ---
  const config: ChartBuilderConfig = {
    title,
    chartType,
    xAxisColumnId: xAxisColId,
    yAxisColumnId: yAxisColId,
    aggregation,
    includedRowIds: selectedRowIds.length === rows.length ? undefined : selectedRowIds,
    filter: filters,
  };

  const validation = useMemo(() => {
    if (!xAxisColId) return { isValid: false, message: 'Please select a Group By column to start.' };
    if (selectedRowIds.length === 0) return { isValid: false, message: 'Please select at least one row.' };
    return ChartDataTransformer.validateConfig(config, columns);
  }, [config, columns, xAxisColId, selectedRowIds]);

  const chartOption = useMemo(() => {
    // If we have an AI-generated option, use that instead
    if (aiGeneratedOption) return aiGeneratedOption;
    if (!validation.isValid) return null;
    const data = ChartDataTransformer.transformData(rows, config);
    return ChartDataTransformer.generateOption(data, config);
  }, [rows, config, validation, aiGeneratedOption]);

  // --- AI Generation Handler ---
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || isProcessing) return;

    setAiError(null);
    setAiGeneratedOption(null);

    // Prepare row data for AI
    const rowData = rows.map((row) => {
      const rowObj: Record<string, unknown> = {};
      columns.forEach((col) => {
        if (col.id !== 'select') {
          rowObj[col.label] = row[col.id];
        }
      });
      return rowObj;
    });

    const result = await generateChart(aiPrompt, rowData);

    if (result.success && result.chartConfig) {
      setAiGeneratedOption(result.chartConfig);
      // Extract chart type from response if available
      const detectedType = result.chartType;
      if (
        detectedType &&
        ['bar', 'line', 'pie', 'area', 'doughnut', 'scatter', 'radar', 'funnel', 'gauge', 'treemap'].includes(
          detectedType,
        )
      ) {
        setChartType(detectedType as ChartType);
      }
      // Set a title based on prompt if not set
      if (!title || title === 'New Analysis') {
        setTitle(aiPrompt.slice(0, 40) + (aiPrompt.length > 40 ? '...' : ''));
      }
    } else {
      setAiError(result.error || 'Failed to generate chart');
    }
  };

  // Clear AI-generated chart when manual config changes
  useEffect(() => {
    if (aiGeneratedOption && (xAxisColId || filters.length > 0)) {
      // User is manually configuring, clear AI chart
      setAiGeneratedOption(null);
    }
  }, [xAxisColId, filters]);

  // --- Helpers ---
  // --- Constants & Helpers ---
  const CHART_CONFIGS: Record<ChartType, { label: string; color: string; icon: React.ReactNode }> = {
    bar: { label: 'Bar Chart', color: 'bg-blue-100 text-blue-600', icon: <BarChart3 size={20} /> },
    line: { label: 'Line Chart', color: 'bg-indigo-100 text-indigo-600', icon: <LineChart size={20} /> },
    area: { label: 'Area Chart', color: 'bg-cyan-100 text-cyan-600', icon: <LineChart size={20} /> }, // Reusing Line icon but distinct color
    pie: { label: 'Pie Chart', color: 'bg-purple-100 text-purple-600', icon: <PieChart size={20} /> },
    doughnut: { label: 'Doughnut', color: 'bg-fuchsia-100 text-fuchsia-600', icon: <PieChart size={20} /> },
    // scatter: { label: 'Scatter', color: 'bg-pink-100 text-pink-600', icon: <ScatterChart size={20} /> },
    scatter: { label: 'Scatter', color: 'bg-pink-100 text-pink-600', icon: <LineChart size={20} /> }, // Fallback icon
    radar: { label: 'Radar', color: 'bg-orange-100 text-orange-600', icon: <PieChart size={20} /> },
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
        className="bg-white dark:bg-monday-dark-elevated w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Monday-style: Clean, White, Simple Actions) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-monday-dark-elevated z-20">
          <div>
            <h2 className="text-xl font-bold text-[#323338] dark:text-gray-100 tracking-tight">Add Widget</h2>
            <p className="text-[13px] text-[#676879] dark:text-gray-400">Transform your board data into insights</p>
          </div>
          <div className="flex items-center gap-3">
            {/* AI Credits Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300">
              <Sparkle size={14} className="text-amber-500" weight="fill" />
              <span>{credits} credits</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors text-[#676879]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body - Split View */}
        <div className="flex flex-1 overflow-hidden bg-[#f7f9fa] dark:bg-monday-dark-bg">
          {/* Left Pane: Configuration (The Settings Panel) */}
          <div className="w-[380px] flex-shrink-0 border-r border-stone-200 dark:border-stone-700 bg-white dark:bg-monday-dark-elevated flex flex-col overflow-hidden">
            {/* AI Generation Section */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkle size={16} className="text-purple-500" weight="fill" />
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  AI Chart Generator
                </label>
                <button
                  onClick={toggleDeepMode}
                  className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    deepModeEnabled
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                  }`}
                  title={deepModeEnabled ? 'Deep Mode (5 credits)' : 'Fast Mode (1 credit)'}
                >
                  {deepModeEnabled ? <Brain size={12} /> : <Lightning size={12} />}
                  {deepModeEnabled ? 'Deep' : 'Fast'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the chart you want..."
                  className="flex-1 h-9 px-3 bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 rounded-md text-[13px] text-[#323338] dark:text-gray-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-stone-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && aiPrompt.trim() && !isProcessing) {
                      handleAIGenerate();
                    }
                  }}
                />
                <button
                  onClick={handleAIGenerate}
                  disabled={isProcessing || !aiPrompt.trim() || credits < 1}
                  className={`px-4 h-9 rounded-md text-[13px] font-medium flex items-center gap-2 transition-all ${
                    isProcessing || !aiPrompt.trim() || credits < 1
                      ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                  }`}
                >
                  {isProcessing ? <CircleNotch size={14} className="animate-spin" /> : <Sparkle size={14} />}
                  Generate
                </button>
              </div>
              {aiError && <p className="mt-2 text-[11px] text-red-500">{aiError}</p>}
              {aiGeneratedOption && (
                <p className="mt-2 text-[11px] text-green-600 dark:text-green-400">
                  ✓ AI chart generated! View in preview.
                </p>
              )}
            </div>

            {/* Top: Title & Chart Type */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 space-y-4 shrink-0">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Analysis Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-[13px] text-[#323338] dark:text-gray-100 focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] outline-none transition-all placeholder:text-stone-400"
                  placeholder="Enter chart title..."
                />
              </div>

              {/* Chart Type (Horizontal) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Visualization
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                  {ALL_CHART_TYPES.map((type) => {
                    const conf = CHART_CONFIGS[type];
                    const isSelected = chartType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`
                                                    snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1.5 w-20 p-2 rounded-lg border transition-all duration-200
                                                    ${
                                                      isSelected
                                                        ? 'border-[#0073ea] bg-[#e5f4ff] dark:bg-[#0073ea]/20 ring-1 ring-[#0073ea]'
                                                        : 'border-transparent bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700'
                                                    }
                                                `}
                      >
                        <div className={`p-1 rounded-md ${isSelected ? 'bg-transparent text-[#0073ea]' : conf.color}`}>
                          {conf.icon}
                        </div>
                        <span
                          className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? 'text-[#0073ea]' : 'text-[#676879] dark:text-gray-400'}`}
                        >
                          {conf.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle: Axis Config */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Data Source
              </label>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#323338] dark:text-gray-300">Group By (X-Axis)</label>
                  <div className="relative">
                    <select
                      value={xAxisColId}
                      onChange={(e) => setXAxisColId(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-md text-[13px] text-[#323338] dark:text-gray-100 focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] outline-none transition-all appearance-none"
                    >
                      <option value="" disabled>
                        Choose a column...
                      </option>
                      {columns
                        .filter((c) => c.id !== 'select')
                        .map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.label}
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                      <Settings2 size={13} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Filters (Flex Fill) */}
            <div className="flex-1 flex flex-col p-5 min-h-0">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Filters & Data</label>
                <div className="text-[10px] font-medium px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-stone-500">
                  {selectedRowIds.length} / {rows.length} Rows
                </div>
              </div>

              {/* Active Filters List (Scrollable if many) */}
              <div className="shrink-0 space-y-2 mb-4 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                {filters.map((filter, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <select
                      value={filter.columnId}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[idx].columnId = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="flex-1 h-7 px-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[11px] outline-none focus:border-[#0073ea]"
                    >
                      <option value="" disabled>
                        Col
                      </option>
                      {columns
                        .filter((c) => c.id !== 'select')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[idx].operator = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="w-20 h-7 px-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[11px] outline-none focus:border-[#0073ea]"
                    >
                      <option value="contains">Has</option>
                      <option value="is">Is</option>
                      <option value="isNot">Not</option>
                      <option value="gt">{'>'}</option>
                      <option value="lt">{'<'}</option>
                    </select>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[idx].value = e.target.value;
                        setFilters(newFilters);
                      }}
                      placeholder="Val..."
                      className="w-20 h-7 px-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[11px] outline-none focus:border-[#0073ea]"
                    />
                    <button
                      onClick={() => setFilters(filters.filter((_, i) => i !== idx))}
                      className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setFilters([
                      ...filters,
                      {
                        columnId: columns.filter((c) => c.id !== 'select')[0]?.id || '',
                        operator: 'contains',
                        value: '',
                      },
                    ])
                  }
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[#0073ea] hover:text-[#0060b9] transition-colors"
                >
                  <Plus size={12} />
                  Add Rule
                </button>
              </div>

              {/* Manual Selection List (Fills Remaining) */}
              <div className="flex-1 flex flex-col min-h-0 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50/50 dark:bg-stone-800/30 overflow-hidden">
                {/* Search Header */}
                <div className="flex items-center gap-2 p-2 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/50">
                  <input
                    type="text"
                    placeholder="Search specific rows..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none text-[11px] outline-none placeholder:text-stone-400"
                  />
                  <button
                    onClick={() =>
                      setSelectedRowIds(selectedRowIds.length === rows.length ? [] : rows.map((r) => r.id))
                    }
                    className="text-[10px] font-medium text-[#0073ea] hover:underline"
                  >
                    {selectedRowIds.length === rows.length ? 'None' : 'All'}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                  {rows
                    .filter((row) => (row.name || '').toLowerCase().includes(filterSearch.toLowerCase()))
                    .map((row) => (
                      <label
                        key={row.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-white dark:hover:bg-stone-700 rounded cursor-pointer transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(row.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRowIds([...selectedRowIds, row.id]);
                            else setSelectedRowIds(selectedRowIds.filter((id) => id !== row.id));
                          }}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#0073ea] focus:ring-[#0073ea]"
                        />
                        <span className="text-[11px] text-[#323338] dark:text-gray-300 truncate w-full select-none">
                          {row.name || 'Untitled Row'}
                        </span>
                      </label>
                    ))}
                  {rows.filter((row) => (row.name || '').toLowerCase().includes(filterSearch.toLowerCase())).length ===
                    0 && <div className="p-4 text-center text-[10px] text-stone-400 italic">No matches</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane: Preview Canvas */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-[#f7f9fa] dark:bg-monday-dark-bg">
            {/* Interactive Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-full max-w-3xl aspect-[16/9] bg-white dark:bg-monday-dark-elevated rounded-lg shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col transition-all duration-300">
                {/* Chart Header inside Card */}
                <div className="h-12 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between px-6">
                  <span className="font-semibold text-stone-700 dark:text-gray-200 text-sm truncate">
                    {title || 'Untitled Chart'}
                  </span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-stone-200 dark:bg-stone-700" />
                    <div className="w-2 h-2 rounded-full bg-stone-200 dark:bg-stone-700" />
                  </div>
                </div>

                {/* Main Chart Render */}
                <div className="flex-1 p-6 relative">
                  {aiGeneratedOption || (validation.isValid && chartOption) ? (
                    <MemoizedChart
                      option={{
                        ...(aiGeneratedOption || chartOption),
                        title: { show: false },
                        grid: { top: 10, bottom: 20, left: 20, right: 20, containLabel: true },
                      }}
                      style={{ height: '100%', width: '100%', minHeight: 100, minWidth: 100 }}
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
        <div className="px-8 py-4 bg-white dark:bg-monday-dark-elevated border-t border-stone-200 dark:border-stone-700 flex justify-end gap-3 z-20">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[14px] font-normal text-[#323338] hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => validation.isValid && onSave(config)}
            disabled={!validation.isValid}
            className={`px-6 py-2 text-[14px] font-medium text-white rounded transition-all shadow-sm ${
              validation.isValid ? 'bg-[#0073ea] hover:bg-[#0060b9]' : 'bg-stone-300 cursor-not-allowed'
            }`}
          >
            Add Widget
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
