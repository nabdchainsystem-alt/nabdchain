import React, { useEffect, useMemo, useState } from 'react';
import {
    AlignCenter,
    AlignLeft,
    BarChart3,
    Bold,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Compass,
    DollarSign,
    Filter,
    Grid3X3,
    Highlighter,
    Italic,
    Link2,
    Menu,
    MessageSquare,
    Paintbrush,
    Percent,
    Plus,
    Printer,
    Redo2,
    Search,
    Settings,
    Share2,
    Sigma,
    Sparkles,
    Strikethrough,
    Type,
    Undo2,
    X
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

type Status = 'Cleared' | 'Pending' | 'Review';
type ColumnId = typeof COLUMNS[number];

interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    status: Status;
    notes: string;
}

interface CellCoord {
    row: number;
    col: ColumnId;
}

interface CellStyle {
    bold?: boolean;
    italic?: boolean;
    strike?: boolean;
    color?: string;
    background?: string;
}

const INITIAL_DATA: Transaction[] = [
    { id: '1', date: 'Jan 01, 2024', description: 'Opening Balance', category: 'Equity', amount: 15000.00, status: 'Cleared', notes: 'FY Start' },
    { id: '2', date: 'Jan 03, 2024', description: 'Client Payment - Alpha', category: 'Income', amount: 3250.00, status: 'Cleared', notes: 'Project Alpha Inv #1002' },
    { id: '3', date: 'Jan 05, 2024', description: 'Office Supplies', category: 'Expenses', amount: -245.80, status: 'Pending', notes: 'Staples Order' },
    { id: '4', date: 'Jan 10, 2024', description: 'Software Subscription', category: 'Expenses', amount: -49.00, status: 'Cleared', notes: 'Monthly seat' },
    { id: '5', date: 'Jan 12, 2024', description: 'Utility Bill - Electric', category: 'Utilities', amount: -120.50, status: 'Review', notes: 'Higher than avg' },
    { id: '6', date: 'Jan 15, 2024', description: 'Client Payment - Beta', category: 'Income', amount: 5000.00, status: 'Cleared', notes: 'Deposit' },
    { id: '7', date: 'Jan 20, 2024', description: 'Marketing Ads', category: 'Marketing', amount: -1500.00, status: 'Cleared', notes: 'Q1 Campaign' },
];

const ToolbarButton: React.FC<{
    icon: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    className?: string;
}> = ({ icon, active, onClick, className }) => (
    <button
        onClick={onClick}
        className={`p-1.5 rounded transition-all flex items-center justify-center ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'} ${className || ''}`}
    >
        {icon}
    </button>
);

const GridCell: React.FC<{
    value: string | number;
    selected: boolean;
    onClick: () => void;
    style?: CellStyle;
    className?: string;
}> = ({ value, selected, onClick, style, className }) => {
    const cellClasses = [
        style?.bold ? 'font-bold' : '',
        style?.italic ? 'italic' : '',
        style?.strike ? 'line-through' : '',
        className || ''
    ].join(' ');

    const inlineStyle = {
        backgroundColor: style?.background,
        color: style?.color
    };

    return (
        <td
            onClick={onClick}
            className={`border px-3 text-sm transition-all relative cursor-cell ${selected ? 'ring-2 ring-blue-600 ring-inset z-10 bg-blue-50/10' : ''}`}
        >
            <div className={`truncate max-w-full py-2 ${cellClasses}`} style={inlineStyle}>
                {value}
            </div>
            {selected && (
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-sm cursor-nwse-resize border border-white shadow-sm z-20"></div>
            )}
        </td>
    );
};

const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
    return amount < 0 ? `-$${formatted}` : `$${formatted}`;
};

const SmartSheetView: React.FC<{ boardId: string }> = ({ boardId }) => {
    const storagePrefix = `smart-sheet-${boardId}`;

    const [data, setData] = useState<Transaction[]>(() => {
        try {
            const stored = localStorage.getItem(`${storagePrefix}-data`);
            if (stored) return JSON.parse(stored);
        } catch {
            // ignore bad data
        }
        return INITIAL_DATA;
    });

    const [selectedCell, setSelectedCell] = useState<CellCoord>(() => {
        try {
            const stored = localStorage.getItem(`${storagePrefix}-selection`);
            if (stored) return JSON.parse(stored);
        } catch {
            // ignore bad data
        }
        return { row: 3, col: 'C' };
    });

    const [cellStyles, setCellStyles] = useState<Record<string, CellStyle>>(() => {
        try {
            const stored = localStorage.getItem(`${storagePrefix}-styles`);
            if (stored) return JSON.parse(stored);
        } catch {
            // ignore bad data
        }
        return { 'C-1': { bold: true } };
    });

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Sheet 1');
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(`${storagePrefix}-data`);
            setData(stored ? JSON.parse(stored) : INITIAL_DATA);
        } catch {
            setData(INITIAL_DATA);
        }
        try {
            const storedSelection = localStorage.getItem(`${storagePrefix}-selection`);
            setSelectedCell(storedSelection ? JSON.parse(storedSelection) : { row: 3, col: 'C' });
        } catch {
            setSelectedCell({ row: 3, col: 'C' });
        }
        try {
            const storedStyles = localStorage.getItem(`${storagePrefix}-styles`);
            setCellStyles(storedStyles ? JSON.parse(storedStyles) : { 'C-1': { bold: true } });
        } catch {
            setCellStyles({ 'C-1': { bold: true } });
        }
    }, [storagePrefix]);

    useEffect(() => {
        try {
            localStorage.setItem(`${storagePrefix}-data`, JSON.stringify(data));
        } catch {
            // ignore
        }
    }, [data, storagePrefix]);

    useEffect(() => {
        try {
            localStorage.setItem(`${storagePrefix}-selection`, JSON.stringify(selectedCell));
        } catch {
            // ignore
        }
    }, [selectedCell, storagePrefix]);

    useEffect(() => {
        try {
            localStorage.setItem(`${storagePrefix}-styles`, JSON.stringify(cellStyles));
        } catch {
            // ignore
        }
    }, [cellStyles, storagePrefix]);

    const totalAmount = useMemo(
        () => data.reduce((sum, item) => sum + item.amount, 0),
        [data]
    );

    const toggleStyle = (styleKey: keyof CellStyle) => {
        const key = `${selectedCell.col}-${selectedCell.row}`;
        setCellStyles(prev => {
            const current = prev[key] || {};
            return {
                ...prev,
                [key]: { ...current, [styleKey]: !current[styleKey] }
            };
        });
    };

    const currentKey = `${selectedCell.col}-${selectedCell.row}`;
    const currentStyle = cellStyles[currentKey] || {};

    const handleAiAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const apiKey =
                import.meta.env.VITE_GEMINI_API_KEY ||
                (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY || process.env.API_KEY : '');

            if (!apiKey) {
                setAiInsight('Add GEMINI_API_KEY or VITE_GEMINI_API_KEY to enable Smart Insights.');
                return;
            }

            const ai = new GoogleGenerativeAI(apiKey);
            const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `Analyze this financial data and provide 3 concise insights with any risks to watch: ${JSON.stringify(data)}`;
            const response = await model.generateContent(prompt);
            const text = response.response.text();
            setAiInsight(text || 'No insights available.');
        } catch (error) {
            console.error('Smart Sheet AI failed', error);
            setAiInsight('Unable to connect to AI. Please check your API key or try again later.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getStatusColor = (status: Status) => {
        switch (status) {
            case 'Cleared': return 'bg-blue-100 text-blue-700';
            case 'Pending': return 'bg-slate-100 text-slate-600';
            case 'Review': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formulaValue = useMemo(() => {
        if (selectedCell.row === 1) return '';
        if (selectedCell.col === 'C' && selectedCell.row === 3) return '=SUM(D2:D8)';

        const rowData = data[selectedCell.row - 2];
        if (!rowData) return '';

        switch (selectedCell.col) {
            case 'A': return rowData.date;
            case 'B': return rowData.description;
            case 'C': return rowData.category;
            case 'D': return rowData.amount?.toString() || '';
            case 'E': return rowData.status;
            case 'F': return rowData.notes;
            default: return '';
        }
    }, [data, selectedCell]);

    return (
        <div className="h-full w-full overflow-auto">
            <div
                className="flex flex-col h-full w-full text-slate-800 bg-white overflow-hidden rounded-xl border border-slate-100 shadow-sm"
                style={{
                    transform: 'scale(0.9)',
                    transformOrigin: 'top left',
                    width: '111.1111%',
                    minWidth: '111.1111%'
                }}
            >
            <header className="flex items-center justify-between px-4 h-14 bg-white border-b flex-shrink-0">
                <div className="flex items-center gap-3 w-1/4 min-w-max">
                    <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
                        <Grid3X3 size={24} />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-3">
                            <h1 className="text-[18px] font-bold text-[#202124]">Q1 Financial Report</h1>
                            <span className="text-[12px] text-[#5f6368] font-normal mt-0.5">Last edit was 2 minutes ago</span>
                        </div>
                    </div>
                </div>

                <nav className="hidden lg:flex flex-1 justify-center gap-8 text-[14px] font-medium text-[#5f6368]">
                    {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools'].map(menu => (
                        <button key={menu} className="hover:text-blue-600 px-1 py-1 transition-colors relative group">
                            {menu}
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
                        </button>
                    ))}
                </nav>

                <div className="flex items-center justify-end gap-3 w-1/4 min-w-max">
                    <div className="flex -space-x-2 mr-2">
                        <img src="https://picsum.photos/id/1012/32/32" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="User" />
                        <img src="https://picsum.photos/id/1027/32/32" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="User" />
                    </div>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-md shadow-blue-200">
                        <Share2 size={16} />
                        Share
                    </button>
                    <img src="https://picsum.photos/id/64/32/32" className="w-9 h-9 rounded-full border-2 border-blue-600 cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all" alt="Profile" />
                </div>
            </header>

            <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-[#f8f9fa] overflow-x-auto no-scrollbar flex-shrink-0">
                <div className="flex gap-0.5 pr-2 border-r border-slate-300">
                    <ToolbarButton icon={<Undo2 size={18} />} onClick={() => console.log('Undo')} />
                    <ToolbarButton icon={<Redo2 size={18} />} onClick={() => console.log('Redo')} />
                    <ToolbarButton icon={<Printer size={18} />} />
                    <ToolbarButton icon={<Paintbrush size={18} />} />
                </div>

                <div className="flex items-center gap-1 px-2 border-r border-slate-300">
                    <button className="flex items-center gap-1 px-2 py-1 text-sm font-medium hover:bg-slate-200 rounded text-slate-700 transition-colors">
                        100% <ChevronDown size={14} />
                    </button>
                </div>

                <div className="flex gap-0.5 px-2 border-r border-slate-300">
                    <ToolbarButton icon={<DollarSign size={18} />} />
                    <ToolbarButton icon={<Percent size={18} />} />
                    <ToolbarButton icon={<ChevronLeft size={16} />} />
                    <ToolbarButton icon={<ChevronRight size={16} />} />
                    <ToolbarButton icon={<span className="text-xs font-bold">.00</span>} />
                </div>

                <div className="flex items-center gap-2 px-2 border-r border-slate-300">
                    <button className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 hover:border-blue-400 transition-colors">
                        Inter <ChevronDown size={14} />
                    </button>
                    <button className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 hover:border-blue-400 transition-colors">11</button>
                </div>

                <div className="flex gap-0.5 px-2 border-r border-slate-300">
                    <ToolbarButton
                        icon={<Bold size={18} />}
                        active={currentStyle.bold}
                        onClick={() => toggleStyle('bold')}
                    />
                    <ToolbarButton
                        icon={<Italic size={18} />}
                        active={currentStyle.italic}
                        onClick={() => toggleStyle('italic')}
                    />
                    <ToolbarButton
                        icon={<Strikethrough size={18} />}
                        active={currentStyle.strike}
                        onClick={() => toggleStyle('strike')}
                    />
                    <ToolbarButton
                        icon={<Type size={18} className="text-blue-600" />}
                        onClick={() => console.log('Text Color Picker')}
                    />
                    <ToolbarButton icon={<Highlighter size={18} />} onClick={() => console.log('Highlight Picker')} />
                </div>

                <div className="flex gap-0.5 px-2">
                    <ToolbarButton icon={<AlignLeft size={18} />} />
                    <ToolbarButton icon={<AlignCenter size={18} />} />
                    <ToolbarButton icon={<Link2 size={18} />} />
                    <ToolbarButton icon={<MessageSquare size={18} />} />
                    <ToolbarButton
                        icon={<Filter size={18} />}
                        active={isFilterOpen}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    />
                    <ToolbarButton icon={<Sigma size={18} />} />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={handleAiAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold transition-all shadow-sm border border-blue-700 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={16} className={isAnalyzing ? 'animate-spin' : ''} />
                        {isAnalyzing ? 'Analyzing...' : 'Smart Insights'}
                    </button>
                </div>
            </div>

            <div className="flex items-center border-b bg-white flex-shrink-0">
                <div className="w-12 h-9 flex items-center justify-center text-sm font-medium text-slate-500 border-r bg-[#f8f9fa]">
                    {selectedCell.col}{selectedCell.row}
                </div>
                <div className="px-3 py-2 text-slate-400">
                    <Sigma size={16} />
                </div>
                <input
                    className="flex-1 px-3 py-2 text-sm outline-none font-mono text-slate-700 bg-transparent"
                    value={formulaValue}
                    readOnly
                />
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full border-collapse table-fixed select-none">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-[#f8f9fa]">
                                <th className="w-12 h-8 border text-xs text-slate-400 font-medium bg-[#f8f9fa]"></th>
                                {COLUMNS.map(col => (
                                    <th key={col} className={`w-40 border text-xs text-slate-500 font-medium h-8 relative group transition-colors ${col === selectedCell.col ? 'bg-blue-50 text-blue-700 border-b-2 border-b-blue-600' : 'bg-[#f8f9fa] hover:bg-slate-200'}`}>
                                        {col}
                                        {col === 'C' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
                                                className={`absolute right-1 top-1.5 transition-colors p-0.5 rounded ${isFilterOpen ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'}`}
                                            >
                                                <Filter size={12} fill={isFilterOpen ? "currentColor" : "none"} />
                                            </button>
                                        )}
                                        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-slate-50">
                                <td className={`h-10 border text-center text-xs text-slate-400 font-medium ${selectedCell.row === 1 ? 'bg-blue-100 text-blue-700' : 'bg-[#f8f9fa]'}`}>1</td>
                                <td className="border px-3 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">Date</td>
                                <td className="border px-3 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">Transaction</td>
                                <td className="border px-3 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">Category</td>
                                <td className="border px-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right bg-slate-50">Amount</td>
                                <td className="border px-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center bg-slate-50">Status</td>
                                <td className="border px-3 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">Notes</td>
                                <td className="border px-3 bg-slate-50"></td>
                                <td className="border px-3 bg-slate-50"></td>
                            </tr>
                            {Array.from({ length: 50 }).map((_, i) => {
                                const rowIndex = i + 2;
                                const tx = data[i];
                                return (
                                    <tr key={rowIndex} className="hover:bg-slate-50/50">
                                        <td className={`h-10 border text-center text-xs font-medium ${rowIndex === selectedCell.row ? 'bg-blue-100 text-blue-700' : 'bg-[#f8f9fa] text-slate-400'}`}>
                                            {rowIndex}
                                        </td>
                                        <GridCell
                                            value={tx?.date || ''}
                                            selected={selectedCell.row === rowIndex && selectedCell.col === 'A'}
                                            style={cellStyles[`A-${rowIndex}`]}
                                            onClick={() => setSelectedCell({ row: rowIndex, col: 'A' })}
                                        />
                                        <GridCell
                                            value={tx?.description || ''}
                                            selected={selectedCell.row === rowIndex && selectedCell.col === 'B'}
                                            style={cellStyles[`B-${rowIndex}`]}
                                            onClick={() => setSelectedCell({ row: rowIndex, col: 'B' })}
                                        />
                                        <GridCell
                                            value={tx?.category || ''}
                                            selected={selectedCell.row === rowIndex && selectedCell.col === 'C'}
                                            style={cellStyles[`C-${rowIndex}`]}
                                            onClick={() => setSelectedCell({ row: rowIndex, col: 'C' })}
                                            className={tx ? 'font-medium' : ''}
                                        />
                                        <GridCell
                                            value={tx ? formatAmount(tx.amount) : ''}
                                            selected={selectedCell.row === rowIndex && selectedCell.col === 'D'}
                                            style={cellStyles[`D-${rowIndex}`]}
                                            onClick={() => setSelectedCell({ row: rowIndex, col: 'D' })}
                                            className={`text-right font-mono ${tx?.amount && tx.amount < 0 ? 'text-red-500' : 'text-slate-700'}`}
                                        />
                                        <td className={`border px-3 text-center transition-all ${selectedCell.row === rowIndex && selectedCell.col === 'E' ? 'ring-2 ring-blue-600 ring-inset z-10' : ''}`} onClick={() => setSelectedCell({ row: rowIndex, col: 'E' })}>
                                            {tx && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${getStatusColor(tx.status)}`}>
                                                    {tx.status}
                                                </span>
                                            )}
                                        </td>
                                        <GridCell
                                            value={tx?.notes || ''}
                                            selected={selectedCell.row === rowIndex && selectedCell.col === 'F'}
                                            style={cellStyles[`F-${rowIndex}`]}
                                            onClick={() => setSelectedCell({ row: rowIndex, col: 'F' })}
                                            className={tx?.notes === 'FY Start' ? 'italic text-slate-400' : ''}
                                        />
                                        <GridCell value="" selected={selectedCell.row === rowIndex && selectedCell.col === 'G'} style={cellStyles[`G-${rowIndex}`]} onClick={() => setSelectedCell({ row: rowIndex, col: 'G' })} />
                                        <GridCell value="" selected={selectedCell.row === rowIndex && selectedCell.col === 'H'} style={cellStyles[`H-${rowIndex}`]} onClick={() => setSelectedCell({ row: rowIndex, col: 'H' })} />
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {aiInsight && (
                        <div className="fixed bottom-20 right-8 w-80 bg-white rounded-xl shadow-2xl border border-blue-100 animate-in slide-in-from-bottom-4 duration-300 z-50 overflow-hidden">
                            <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} />
                                    <span className="text-sm font-semibold">AI Assistant</span>
                                </div>
                                <button onClick={() => setAiInsight(null)} className="hover:bg-blue-700 p-1 rounded transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-4 text-sm leading-relaxed text-slate-700 max-h-60 overflow-y-auto custom-scrollbar whitespace-pre-line">
                                {aiInsight}
                            </div>
                        </div>
                    )}

                    {isFilterOpen && (
                        <div className="absolute top-[38px] left-[320px] z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                            <div className="p-4 border-b border-slate-100 bg-[#f8f9fa] rounded-t-xl">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sorting &amp; Filtering</span>
                            </div>
                            <div className="p-3 border-b border-slate-100">
                                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors text-slate-700 group">
                                    <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"><AlignLeft size={16} className="rotate-90" /></div>
                                    <div className="text-left"><p className="font-semibold">Sort A → Z</p><p className="text-[10px] text-slate-400">Alphabetical order</p></div>
                                </button>
                                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors text-slate-700 mt-1 group">
                                    <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"><AlignLeft size={16} className="-rotate-90" /></div>
                                    <div className="text-left"><p className="font-semibold">Sort Z → A</p><p className="text-[10px] text-slate-400">Reverse order</p></div>
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter by category</span>
                                    <button className="text-[11px] text-blue-600 font-bold hover:underline">Select All</button>
                                </div>
                                <div className="relative mb-3">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20" placeholder="Search categories..." />
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                    {['Equity', 'Expenses', 'Income', 'Marketing', 'Utilities', 'Taxes'].map(cat => (
                                        <label key={cat} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer group">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 transition-all" />
                                            <span className="text-sm text-slate-600 group-hover:text-slate-900">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-b-xl flex justify-between gap-3">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                                >
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-80 border-l bg-white flex flex-col hidden xl:flex shadow-[-4px_0_20px_rgba(0,0,0,0.02)]">
                    <div className="p-5 border-b flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-600" />
                            Intelligence
                        </h3>
                        <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                            <Settings size={18} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Performance</div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-700 rounded-2xl shadow-xl shadow-blue-100 transform transition-transform hover:scale-[1.02]">
                                    <div className="text-xs text-blue-100 font-medium mb-1">Total Net Profit</div>
                                    <div className="text-3xl font-bold text-white tracking-tight">${totalAmount.toLocaleString()}</div>
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-blue-200 font-bold">
                                        <Sparkles size={12} />
                                        AUTO-CALCULATED FROM GRID
                                    </div>
                                </div>
                                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Status: Need Review</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold text-amber-600">{data.filter(d => d.status === 'Review').length} Transactions</div>
                                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                                            <MessageSquare size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Transaction Volume</div>
                            <div className="h-44 w-full bg-[#f8f9fa] rounded-2xl flex items-end justify-around p-4 gap-1.5 border border-slate-100">
                                {[40, 65, 30, 85, 45, 95, 20].map((h, i) => (
                                    <div key={i} className="flex-1 bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 cursor-pointer relative group" style={{ height: `${h}%` }}>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50 shadow-lg">
                                            ${(h * 100).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 bg-slate-900 rounded-2xl text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-blue-400" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Growth Forecast</span>
                            </div>
                            <p className="text-[13px] leading-relaxed text-slate-300">
                                Based on current Q1 momentum, we anticipate a <span className="text-blue-400 font-bold text-lg">14.2%</span> increase in liquid assets by end of May.
                            </p>
                            <button className="mt-5 w-full py-3 bg-slate-800 hover:bg-blue-600 rounded-xl text-xs font-bold uppercase transition-all border border-slate-700 hover:border-blue-500 flex items-center justify-center gap-2">
                                Analyze More <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="flex items-center justify-between px-4 h-12 border-t bg-[#f8f9fa] flex-shrink-0 z-40">
                <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                        <Plus size={20} />
                    </button>
                    <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-2"></div>
                    {['Sheet 1', 'Sheet 2', 'Data_Raw'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 text-sm font-semibold transition-all rounded-t-lg relative ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            {tab}
                            {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-xs font-bold bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                        <span className="text-slate-400 uppercase tracking-tighter">Report Total:</span>
                        <span className="text-blue-600 text-sm font-mono tracking-tight">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg shadow-blue-100 hover:scale-110 hover:rotate-12 transition-all">
                        <Compass size={22} />
                    </button>
                </div>
            </footer>
            </div>
        </div>
    );
};

export default SmartSheetView;
