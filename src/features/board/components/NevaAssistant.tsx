import React, { useState } from 'react';
import { Sparkles, Send, Loader2, LayoutDashboard, ChevronRight, Wand2, PlusSquare, ArrowLeft, Database, MessageSquare } from 'lucide-react';
import { getGeminiModel } from '../../../services/gemini';
import { DashboardConfig } from './dashboard/DashboardHeader';

interface Column {
    id: string;
    label: string;
    type: string;
}

interface NevaAssistantProps {
    onClose: () => void;
    onGenerate: (config: DashboardConfig) => void;
    columns: Column[];
    rows: any[];
}

type MenuState = 'MAIN' | 'NEW_BOARD' | 'AUTO_GEN_MENU' | 'AUTO_GEN_CUSTOM' | 'AUTO_GEN_SELECT';

export const NevaAssistant: React.FC<NevaAssistantProps> = ({ onClose, onGenerate, columns, rows }) => {
    const [menuState, setMenuState] = useState<MenuState>('MAIN');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [selectedCols, setSelectedCols] = useState<string[]>([]);

    // --- Helpers ---
    const getContextData = (colsToUse: Column[] = columns) => {
        // Sample first 5 rows for context, filtering to only used columns
        const sampleDocs = rows.slice(0, 5).map(row => {
            const filteredRow: any = {};
            colsToUse.forEach(col => {
                filteredRow[col.label] = row[col.id];
            });
            return filteredRow;
        });

        return `
        Table Structure (Columns): ${colsToUse.map(c => `${c.label} (${c.type})`).join(', ')}
        Sample Data (First 5 rows):
        ${JSON.stringify(sampleDocs, null, 2)}
        `;
    };

    const handleGenerate = async (customPrompt?: string, useSelectedColsOnly = false) => {
        setLoading(true);
        setError(null);

        try {
            const model = getGeminiModel("gemini-2.5-flash");

            const colsToUse = useSelectedColsOnly
                ? columns.filter(c => selectedCols.includes(c.id))
                : columns;

            const context = getContextData(colsToUse);

            let finalPrompt = '';

            if (customPrompt) {
                finalPrompt = `User Request: "${customPrompt}". \nBased on the table context below, generate a dashboard JSON.`;
            } else {
                finalPrompt = `Analyze the table context below and suggest the most valuable KPIs and Charts for a business user. Generate a dashboard JSON.`;
            }

            const systemPrompt = `
                You are NEVA (Neural Enhanced Visual Assistant).
                ${finalPrompt}

                CONTEXT:
                ${context}
                
                Generate a JSON configuration for a business dashboard.
                Return ONLY valid JSON. No markdown formatting.
                Structure:
                {
                    "kpis": [
                        { "id": "1", "label": "Metric Name", "value": "$123", "change": "+10%", "trend": "up", "icon": "dollar" }
                    ],
                    "charts": [
                        { 
                            "id": "c1", 
                            "title": "Chart Title", 
                            "type": "bar", // or line, pie
                            "data": { 
                                "tooltip": {}, 
                                "xAxis": { "data": ["A", "B"] }, 
                                "yAxis": {}, 
                                "series": [{ "name": "Metric", "type": "bar", "data": [10, 20] }] 
                            } 
                        }
                    ]
                }
                Make data realistic but based on the Context if possible (e.g. valid statuses).
                Generate 3-4 KPIs and 1-2 Charts.
            `;

            const result = await model.generateContent(systemPrompt);
            const text = result.response.text();

            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const config = JSON.parse(jsonText);

            onGenerate(config);
            onClose();
        } catch (err: any) {
            console.error("NEVA Error:", err);
            setError("My neural pathways got crossed. Try again or check your data.");
        } finally {
            setLoading(false);
        }
    };

    // --- Views ---

    const renderMain = () => (
        <div className="flex flex-col gap-2 p-2">
            <button
                onClick={() => setMenuState('NEW_BOARD')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left group"
            >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40">
                    <PlusSquare size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New Board</h3>
                    <p className="text-xs text-stone-500">Start fresh with a new list or table</p>
                </div>
                <ChevronRight size={16} className="text-stone-300" />
            </button>

            {columns.length > 0 && (
                <button
                    onClick={() => setMenuState('AUTO_GEN_MENU')}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left group"
                >
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40">
                        <Wand2 size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Auto Generator</h3>
                        <p className="text-xs text-stone-500">Analyze this table & build a dashboard</p>
                    </div>
                    <ChevronRight size={16} className="text-stone-300" />
                </button>
            )}
        </div>
    );

    const renderAutoGenMenu = () => (
        <div className="flex flex-col gap-2 p-2">
            <button
                onClick={() => handleGenerate()} // Suggest Mode
                disabled={loading}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
            >
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Smart Suggest</h3>
                    <p className="text-xs text-stone-500">I'll figure out what's important</p>
                </div>
            </button>

            <button
                onClick={() => setMenuState('AUTO_GEN_SELECT')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
            >
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                    <Database size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Select Data</h3>
                    <p className="text-xs text-stone-500">Choose specific columns to analyze</p>
                </div>
            </button>

            <button
                onClick={() => setMenuState('AUTO_GEN_CUSTOM')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
            >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <MessageSquare size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Custom Request</h3>
                    <p className="text-xs text-stone-500">Tell me exactly what you want</p>
                </div>
            </button>
        </div>
    );

    const renderColumnSelect = () => {
        const validColumns = columns.filter(c => c.id !== 'select' && c.type !== 'select');
        const isAllSelected = validColumns.length > 0 && selectedCols.length === validColumns.length;

        const toggleAll = () => {
            if (isAllSelected) {
                setSelectedCols([]);
            } else {
                setSelectedCols(validColumns.map(c => c.id));
            }
        };

        return (
            <div className="flex flex-col gap-2 p-2">
                <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-semibold text-stone-500 uppercase">Select Columns</p>
                    <button
                        onClick={toggleAll}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        {isAllSelected ? "Deselect All" : "Select All"}
                    </button>
                </div>

                <div className="max-h-48 overflow-y-auto flex flex-col gap-1 p-1 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-100 dark:border-stone-800">
                    {/* Select All Checkbox Item */}
                    <label className="flex items-center gap-2 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded cursor-pointer border-b border-stone-100 dark:border-stone-800/50 mb-1">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleAll}
                            className="rounded text-indigo-600 focus:ring-indigo-500 border-stone-300"
                        />
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Select All</span>
                    </label>

                    {validColumns.map(col => (
                        <label key={col.id} className="flex items-center gap-2 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedCols.includes(col.id)}
                                onChange={(e) => {
                                    if (e.target.checked) setSelectedCols([...selectedCols, col.id]);
                                    else setSelectedCols(selectedCols.filter(c => c !== col.id));
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 border-stone-300"
                            />
                            <span className="text-sm text-stone-600 dark:text-stone-400">{col.label}</span>
                        </label>
                    ))}
                </div>
                <button
                    onClick={() => handleGenerate(undefined, true)}
                    disabled={loading || selectedCols.length === 0}
                    className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
                >
                    Generate from Selected
                </button>
            </div>
        );
    };

    const renderCustomPrompt = () => (
        <div className="p-4 flex flex-col gap-3">
            <div className="relative">
                <textarea
                    className="w-full h-24 p-3 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:border-indigo-500 resize-none"
                    placeholder="e.g. Show me a pie chart of tasks by Status..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    autoFocus
                />
            </div>
            <button
                onClick={() => handleGenerate(prompt)}
                disabled={loading || !prompt.trim()}
                className="flex justify-center items-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
                {loading ? 'Thinking...' : 'Generate Dashboard'}
            </button>
        </div>
    );

    const renderHeader = () => {
        const canGoBack = menuState !== 'MAIN';
        const title = menuState === 'MAIN' ? 'NEVA Assistant' :
            menuState === 'AUTO_GEN_MENU' ? 'Auto Generator' :
                menuState === 'NEW_BOARD' ? 'New Board' : 'Dashboard';

        return (
            <div className="px-4 py-3 bg-indigo-600 flex items-center gap-3">
                {canGoBack && (
                    <button onClick={() => setMenuState(menuState === 'AUTO_GEN_CUSTOM' || menuState === 'AUTO_GEN_SELECT' ? 'AUTO_GEN_MENU' : 'MAIN')} className="text-white/80 hover:text-white">
                        <ArrowLeft size={16} />
                    </button>
                )}
                {!canGoBack && <Sparkles className="text-white fill-white/20" size={18} />}
                <span className="font-semibold text-white tracking-wide text-sm">{title}</span>
            </div>
        );
    };

    return (
        <div className="w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {renderHeader()}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-stone-500">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <span className="text-xs">NEVA is analyzing your data...</span>
                </div>
            ) : error ? (
                <div className="p-4">
                    <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 mb-2">
                        {error}
                    </div>
                    <button onClick={() => setError(null)} className="text-xs text-stone-500 underline">Try again</button>
                </div>
            ) : (
                <>
                    {menuState === 'MAIN' && renderMain()}
                    {menuState === 'AUTO_GEN_MENU' && renderAutoGenMenu()}
                    {menuState === 'AUTO_GEN_SELECT' && renderColumnSelect()}
                    {menuState === 'AUTO_GEN_CUSTOM' && renderCustomPrompt()}
                    {menuState === 'NEW_BOARD' && (
                        <div className="p-4 text-center text-stone-500 text-xs">
                            New Board wizard coming soon.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
