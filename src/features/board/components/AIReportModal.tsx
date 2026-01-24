import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Sparkle as Sparkles, WarningCircle as AlertCircle, ArrowsClockwise as RefreshCw,
    ChartBar as BarChart3, ChartPie as PieChart, ChartLine as LineChart, GridFour as LayoutGrid,
    GearSix as Settings2, ArrowLeft, CheckSquare, Square,
    PlusCircle
} from 'phosphor-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Column, Row } from '../views/Table/RoomTable';
import { ChartBuilderConfig, ChartType } from './chart-builder/types';
import { ChartDataTransformer } from './chart-builder/services/ChartDataTransformer';
import { AIChartCard } from './AIChartCard';
import { aiLogger } from '../../../utils/logger';

interface AIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: Column[];
    rows: Row[];
    onAddChart?: (config: ChartBuilderConfig) => void;
}

type Mode = 'mode-selection' | 'config' | 'results';

export const AIReportModal: React.FC<AIReportModalProps> = ({ isOpen, onClose, columns, rows, onAddChart }) => {
    const [mode, setMode] = useState<Mode>('mode-selection');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestedConfigs, setSuggestedConfigs] = useState<ChartBuilderConfig[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Configuration State
    const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set());
    const [sampleSize, setSampleSize] = useState<number>(10);
    const [isAutoMode, setIsAutoMode] = useState(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode('mode-selection');
            setSuggestedConfigs([]);
            setError(null);
            setIsAutoMode(false);

            // Default to all columns initially for config mode
            const allIds = columns.map(c => c.id).filter(id => id !== 'select' && id !== 'actions');
            setSelectedColumnIds(new Set(allIds));
        }
    }, [isOpen, columns]);

    const toggleColumn = (id: string) => {
        const newSet = new Set(selectedColumnIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedColumnIds(newSet);
    };

    const handleAutoGenerate = () => {
        setIsAutoMode(true);
        // Select all columns
        const allIds = columns.map(c => c.id).filter(id => id !== 'select' && id !== 'actions');
        setSelectedColumnIds(new Set(allIds));
        // Set sample size to 20 for better auto results
        setSampleSize(20);

        // Trigger generation immediately
        generateAIAnalysis(new Set(allIds), 20);
    };

    const handleCustomMode = () => {
        setIsAutoMode(false);
        setMode('config');
    };

    const generateAIAnalysis = async (overrideCols?: Set<string>, overrideSize?: number) => {
        if (!apiKey) {
            setError("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
            setMode('results');
            return;
        }

        const colsToUse = overrideCols || selectedColumnIds;
        const sizeToUse = overrideSize || sampleSize;

        if (colsToUse.size === 0) {
            setError("Please select at least one column to analyze.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setMode('results');

        try {
            const genAI = new GoogleGenerativeAI(apiKey);

            // Filter columns based on selection
            const activeColumns = columns.filter(c => colsToUse.has(c.id));

            // Prepare a compact representation of the data for the AI
            const schema = activeColumns.map(c => ({ id: c.id, label: c.label, type: c.type }));

            // Slice rows based on sample size (-1 means all rows)
            const rowsToUse = sizeToUse === -1 ? rows : rows.slice(0, sizeToUse);

            const dataSample = rowsToUse.map(r => {
                const sample: any = {};
                activeColumns.forEach(c => {
                    sample[c.id] = r[c.id];
                });
                return sample;
            });

            const prompt = `
                Analyze the following table schema and data samples and suggest 3 unique and insightful chart configurations.
                
                Schema: ${JSON.stringify(schema)}
                Data Samples: ${JSON.stringify(dataSample)}
                
                Constraints for the suggested charts:
                1. Chart Type must be one of: 'bar', 'pie', 'line', 'area', 'doughnut', 'radar', 'funnel'.
                2. 'line' and 'area' charts usually use a 'date' column for xAxis, but categorical (text) columns are also allowed if they represent a sequence (e.g. Month names).
                3. Aggregation can be: 'count', 'sum', 'avg', 'min', 'max'.
                4. For quantitative aggregations ('sum', 'avg', etc.), prefer 'number' columns. However, if a column is labeled 'text' but contains numeric data (e.g. currency, large numbers), YOU MUST USE IT.
                5. 'count' does not require yAxisColumnId.
                
                Return the response ONLY as a JSON array of objects matching this TypeScript interface:
                interface ChartBuilderConfig {
                    title: string;
                    chartType: ChartType;
                    xAxisColumnId: string;
                    yAxisColumnId: string;
                    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
                }
                
                Do not include any explanation or markdown formatting like \`\`\`json.
            `;

            // Direct call to gemini-2.5-flash as requested
            aiLogger.info("Attempting generation with gemini-2.5-flash...");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up common AI formatting artifacts
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestions = JSON.parse(cleanText);

            // Validate suggestions against schema
            // Validate suggestions against schema
            const validSuggestions = suggestions.filter((s: ChartBuilderConfig) => {
                const xCol = activeColumns.find(c => c.id === s.xAxisColumnId);
                const yCol = activeColumns.find(c => c.id === s.yAxisColumnId);

                if (!xCol) return false;

                // Relaxed Validation:
                // 1. Allow 'text' columns for Line/Area charts (categorical or string-dates)
                // 2. Allow 'text' columns for numeric aggregations (parsed numbers)

                // if (['line', 'area'].includes(s.chartType) && xCol.type !== 'date') return false; // REMOVED STRICT CHECK

                // Ensure we have a Y column for aggregations
                if (s.aggregation !== 'count' && !yCol) return false;

                // We'll trust the AI to pick numeric-like text columns for now
                // if (s.aggregation !== 'count' && yCol.type !== 'number') return false; // REMOVED STRICT CHECK

                return true;
            });

            setSuggestedConfigs(validSuggestions);
        } catch (err) {
            aiLogger.error('AI Analysis failed', err);
            let errorMessage = err instanceof Error ? err.message : "Unknown error";

            // Diagnostic: If model not found or overloaded, try to list available models to help debug
            try {
                if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    // Note: accessing the model list requires a different call structure, 
                    // but usually 404 means the model string is wrong.
                    // We can't easily list models client-side with full auth sometimes, but let's encourage checking the docs.
                    errorMessage += " (Double check the model name in code. 'gemini-2.5-flash' might not exist or your API key doesn't have access.)";
                }
            } catch (e) {
                // ignore diagnostic error
            }

            setError(`Failed: ${errorMessage}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Sparkles size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">AI Intelligent Insights</h2>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                {mode === 'mode-selection' ? 'Choose how you want to generate insights' :
                                    mode === 'config' ? 'Configure your analysis parameters' :
                                        'Gemini analyzed your data and suggested these visualizations.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {mode !== 'mode-selection' && !isAnalyzing && (
                            <button
                                onClick={() => {
                                    if (mode === 'results' && isAutoMode) {
                                        setMode('mode-selection');
                                    } else if (mode === 'results') {
                                        setMode('config');
                                    } else {
                                        setMode('mode-selection');
                                    }
                                }}
                                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 transition-colors flex items-center gap-2 text-sm font-medium pr-3"
                                title="Back"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar relative">
                    {mode === 'mode-selection' ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-8 h-full min-h-[400px]">
                            <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-200 text-center">
                                How would you like to analyze your data?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                                {/* Auto Mode Card */}
                                <button
                                    onClick={handleAutoGenerate}
                                    className="group relative p-8 rounded-3xl border-2 border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-stone-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10 text-left flex flex-col gap-4"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Auto-Generate Report</h4>
                                        <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                                            Let AI automatically scan all columns, detect patterns, and generate the most relevant charts for you instantly.
                                        </p>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        Start Analysis <ArrowLeft className="rotate-180" size={16} />
                                    </div>
                                </button>

                                {/* Custom Mode Card */}
                                <button
                                    onClick={handleCustomMode}
                                    className="group relative p-8 rounded-3xl border-2 border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-800/50 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10 text-left flex flex-col gap-4"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        <Settings2 size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Custom Configuration</h4>
                                        <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                                            Manually select specific columns, define sample sizes, and fine-tune exactly what you want to analyze.
                                        </p>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        Configure Now <ArrowLeft className="rotate-180" size={16} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : mode === 'config' ? (
                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                                    <LayoutGrid size={20} className="text-blue-500" />
                                    Select Columns to Analyze
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {columns.filter(c => c.id !== 'select' && c.id !== 'actions').map(col => {
                                        const isSelected = selectedColumnIds.has(col.id);
                                        return (
                                            <button
                                                key={col.id}
                                                onClick={() => toggleColumn(col.id)}
                                                className={`
                                                    group flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                                                    ${isSelected
                                                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                                        : 'bg-white border-stone-200 dark:bg-stone-800/50 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-700'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-5 h-5 rounded-md flex items-center justify-center transition-colors
                                                    ${isSelected ? 'bg-blue-600 text-white' : 'bg-stone-100 dark:bg-stone-700 text-transparent group-hover:bg-stone-200'}
                                                `}>
                                                    <CheckSquare size={14} />
                                                </div>
                                                <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-stone-600 dark:text-stone-400'}`}>
                                                    {col.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                                    <Settings2 size={20} className="text-blue-500" />
                                    Sample Size (Rows)
                                </h3>
                                <div className="flex items-center gap-3">
                                    {/* Added -1 for "All" option */}
                                    {[5, 10, 50, -1].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSampleSize(size)}
                                            className={`
                                                px-6 py-3 rounded-xl text-sm font-semibold transition-all border
                                                ${sampleSize === size
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                                                }
                                            `}
                                        >
                                            {size === -1 ? 'All Rows' : `${size} Rows`}
                                        </button>
                                    ))}
                                    <p className="text-sm text-stone-400 ml-2">
                                        Fewer rows = Faster analysis. More rows = Better accuracy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Results View
                        <div className="p-8 h-full">
                            {isAnalyzing ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 py-12">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <div className="text-center">
                                        <p className="font-bold text-stone-700 dark:text-stone-300">
                                            {isAutoMode ? 'Auto-Analyzing your data...' : `Analyzing ${selectedColumnIds.size} columns & ${sampleSize} rows...`}
                                        </p>
                                        <p className="text-sm text-stone-500 dark:text-stone-400">Discovering patterns and correlations in your data.</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div className="max-w-md">
                                        <p className="font-bold text-stone-800 dark:text-stone-200">Something went wrong</p>
                                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{error}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                if (isAutoMode) setMode('mode-selection');
                                                else setMode('config');
                                            }}
                                            className="px-5 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-sm font-semibold hover:bg-stone-200 transition-all"
                                        >
                                            Change Settings
                                        </button>
                                        <button
                                            onClick={() => generateAIAnalysis()}
                                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : suggestedConfigs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 py-12 text-center text-stone-500">
                                    <LayoutGrid size={48} className="opacity-20" />
                                    <p>No suitable charts could be suggested for this data set.</p>
                                    <button
                                        onClick={() => {
                                            if (isAutoMode) setMode('mode-selection');
                                            else setMode('config');
                                        }}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Try different settings
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                    {suggestedConfigs.map((config, idx) => (
                                        <AIChartCard key={idx} config={config} columns={columns} rows={rows} onAdd={() => onAddChart?.(config)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Action Bar (Only in config mode) */}
                {mode === 'config' && (
                    <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-sm flex justify-between items-center">
                        <p className="text-sm text-stone-500">
                            Selected: <span className="font-bold text-stone-800 dark:text-stone-200">{selectedColumnIds.size} columns</span>
                        </p>
                        <button
                            onClick={() => generateAIAnalysis()}
                            disabled={selectedColumnIds.size === 0}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Sparkles size={18} />
                            Generate Insights
                        </button>
                    </div>
                )}

            </div>
        </div>,
        document.body
    );
};

