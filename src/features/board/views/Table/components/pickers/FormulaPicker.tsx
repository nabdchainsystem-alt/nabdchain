import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Function, Lightning, Info, Copy } from 'phosphor-react';

// =============================================================================
// FORMULA PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface FormulaConfig {
    formula: string;
    resultType: 'number' | 'text' | 'date' | 'boolean';
}

interface FormulaPickerProps {
    value: FormulaConfig | null;
    onSelect: (value: FormulaConfig | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    availableColumns?: { id: string; name: string; type: string }[];
}

// Available formula functions
const FORMULA_FUNCTIONS = [
    { name: 'SUM', syntax: 'SUM(column)', description: 'Sum of all values in column', category: 'Math' },
    { name: 'AVG', syntax: 'AVG(column)', description: 'Average of values', category: 'Math' },
    { name: 'MIN', syntax: 'MIN(column)', description: 'Minimum value', category: 'Math' },
    { name: 'MAX', syntax: 'MAX(column)', description: 'Maximum value', category: 'Math' },
    { name: 'COUNT', syntax: 'COUNT(column)', description: 'Count non-empty values', category: 'Math' },
    { name: 'ROUND', syntax: 'ROUND(value, decimals)', description: 'Round to decimal places', category: 'Math' },
    { name: 'IF', syntax: 'IF(condition, true_val, false_val)', description: 'Conditional logic', category: 'Logic' },
    { name: 'AND', syntax: 'AND(cond1, cond2)', description: 'All conditions true', category: 'Logic' },
    { name: 'OR', syntax: 'OR(cond1, cond2)', description: 'Any condition true', category: 'Logic' },
    { name: 'CONCAT', syntax: 'CONCAT(val1, val2)', description: 'Join text values', category: 'Text' },
    { name: 'LEFT', syntax: 'LEFT(text, count)', description: 'First N characters', category: 'Text' },
    { name: 'RIGHT', syntax: 'RIGHT(text, count)', description: 'Last N characters', category: 'Text' },
    { name: 'LEN', syntax: 'LEN(text)', description: 'Length of text', category: 'Text' },
    { name: 'TODAY', syntax: 'TODAY()', description: 'Current date', category: 'Date' },
    { name: 'DAYS', syntax: 'DAYS(date1, date2)', description: 'Days between dates', category: 'Date' },
    { name: 'DATEADD', syntax: 'DATEADD(date, days)', description: 'Add days to date', category: 'Date' },
];

const FORMULA_EXAMPLES = [
    { label: 'Sum of Numbers', formula: 'SUM({Numbers})' },
    { label: 'Progress %', formula: 'ROUND({Completed} / {Total} * 100, 0)' },
    { label: 'Days Until Due', formula: 'DAYS({Due Date}, TODAY())' },
    { label: 'Status Check', formula: 'IF({Status} = "Done", "Complete", "Pending")' },
];

export const FormulaPicker: React.FC<FormulaPickerProps> = ({
    value,
    onSelect,
    onClose,
    triggerRect,
    availableColumns = [],
}) => {
    const [formula, setFormula] = useState(value?.formula || '');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const MENU_WIDTH = 400;
    const MENU_HEIGHT = 500;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            right = PADDING;
        } else {
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
            maxHeight: MENU_HEIGHT,
        };

        if (openUp) {
            return { ...baseStyle, bottom: windowHeight - triggerRect.top + 4, ...(left !== undefined ? { left } : { right }) };
        }
        return { ...baseStyle, top: triggerRect.bottom + 4, ...(left !== undefined ? { left } : { right }) };
    }, [triggerRect]);

    const categories = [...new Set(FORMULA_FUNCTIONS.map(f => f.category))];

    const filteredFunctions = selectedCategory
        ? FORMULA_FUNCTIONS.filter(f => f.category === selectedCategory)
        : FORMULA_FUNCTIONS;

    const handleInsertFunction = (func: typeof FORMULA_FUNCTIONS[0]) => {
        setFormula(prev => prev + func.syntax);
    };

    const handleInsertColumn = (column: { id: string; name: string }) => {
        setFormula(prev => prev + `{${column.name}}`);
    };

    const handleSave = () => {
        if (formula.trim()) {
            // TODO: Validate formula and determine result type
            console.log('[Formula] Save formula - NOT IMPLEMENTED', formula);
            onSelect({ formula, resultType: 'number' });
        }
        onClose();
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                            <Function size={14} />
                            Formula Editor
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"
                            >
                                <Info size={14} className="text-stone-500" />
                            </button>
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                                BETA
                            </span>
                        </div>
                    </div>
                </div>

                {/* Formula Input */}
                <div className="p-3 border-b border-stone-100 dark:border-stone-800">
                    <textarea
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        placeholder="Enter formula... e.g., SUM({Numbers}) or IF({Status} = 'Done', 1, 0)"
                        className="w-full h-20 px-3 py-2 text-sm font-mono border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-stone-400">
                            Use {'{Column Name}'} to reference columns
                        </span>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                        >
                            Apply Formula
                        </button>
                    </div>
                </div>

                {/* Quick Examples */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="text-[10px] font-medium text-stone-500 uppercase mb-2">Quick Examples</div>
                    <div className="flex flex-wrap gap-1">
                        {FORMULA_EXAMPLES.map((example) => (
                            <button
                                key={example.label}
                                onClick={() => setFormula(example.formula)}
                                className="px-2 py-1 text-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Available Columns */}
                {availableColumns.length > 0 && (
                    <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                        <div className="text-[10px] font-medium text-stone-500 uppercase mb-2">Available Columns</div>
                        <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                            {availableColumns.map((col) => (
                                <button
                                    key={col.id}
                                    onClick={() => handleInsertColumn(col)}
                                    className="px-2 py-1 text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                                >
                                    {'{' + col.name + '}'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Function Categories */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-2 py-1 text-[10px] rounded transition-colors ${!selectedCategory ? 'bg-stone-200 dark:bg-stone-700' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2 py-1 text-[10px] rounded transition-colors ${selectedCategory === cat ? 'bg-stone-200 dark:bg-stone-700' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Functions List */}
                <div className="flex-1 overflow-y-auto max-h-[200px]">
                    <div className="p-2 space-y-1">
                        {filteredFunctions.map((func) => (
                            <button
                                key={func.name}
                                onClick={() => handleInsertFunction(func)}
                                className="w-full flex items-start gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-lg transition-colors text-left"
                            >
                                <Lightning size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-stone-700 dark:text-stone-300">
                                        {func.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-stone-500 truncate">
                                        {func.syntax}
                                    </div>
                                    <div className="text-[10px] text-stone-400 truncate">
                                        {func.description}
                                    </div>
                                </div>
                                <Copy size={12} className="text-stone-400 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/30">
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        Clear formula
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

export default FormulaPicker;
