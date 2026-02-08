import React, { useState, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { Function, Lightning, CaretRight, CaretDown } from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';
import { boardLogger } from '@/utils/logger';

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
  { label: 'Basic Math', formula: '(10 + 20) * 2' },
  { label: 'Concatenate Text', formula: '{Name} + " (" + {Status} + ")"' },
  { label: 'Discount (10%)', formula: '{Price} * 0.9' },
  { label: 'With Tax (15%)', formula: '{Total} * 1.15' },
];

export const FormulaPicker: React.FC<FormulaPickerProps> = memo(
  ({ value, onSelect, onClose, triggerRect, availableColumns = [] }) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [formula, setFormula] = useState(value?.formula || '');
    const [_showHelp, _setShowHelp] = useState(false);
    const [isExamplesOpen, setIsExamplesOpen] = useState(false);
    const [isColumnsOpen, setIsColumnsOpen] = useState(false);
    const [isFunctionsOpen, setIsFunctionsOpen] = useState(false);

    // const MENU_WIDTH = 360;
    const MENU_WIDTH = 500;
    // const MENU_HEIGHT = 600; // No longer needed fixed height as content is minimal, but we keep max-height logic
    const MENU_HEIGHT = 500;
    const PADDING = 12;

    const positionStyle = useMemo(() => {
      if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      // Horizontal positioning
      let left: number | undefined;
      let right: number | undefined;
      const spaceRight = windowWidth - triggerRect.left;

      if (spaceRight >= MENU_WIDTH + PADDING) {
        left = Math.max(PADDING, triggerRect.left);
      } else {
        right = Math.max(PADDING, windowWidth - triggerRect.right);
      }

      // Vertical positioning - prefer below, go above if needed
      const openUp = spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > spaceBelow;

      const baseStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
        width: Math.min(MENU_WIDTH, windowWidth - PADDING * 2),
        overflow: 'visible',
        // scrollbarWidth: 'none', // Not needed if visible
      };

      if (openUp) {
        const maxH = Math.min(MENU_HEIGHT, spaceAbove - PADDING);
        return {
          ...baseStyle,
          bottom: Math.max(PADDING, windowHeight - triggerRect.top + 4),
          maxHeight: maxH,
          ...(isRtl
            ? right !== undefined
              ? { right: PADDING }
              : { left: PADDING }
            : left !== undefined
              ? { left }
              : { right }),
        };
      }

      const maxH = Math.min(MENU_HEIGHT, spaceBelow - PADDING);
      return {
        ...baseStyle,
        top: triggerRect.bottom + 4,
        maxHeight: maxH,
        ...(isRtl
          ? right !== undefined
            ? { right: PADDING }
            : { left: PADDING }
          : left !== undefined
            ? { left }
            : { right }),
      };
    }, [triggerRect, isRtl]);

    const handleInsertFunction = (func: (typeof FORMULA_FUNCTIONS)[0]) => {
      setFormula((prev) => prev + func.syntax);
    };

    const handleInsertColumn = (column: { id: string; name: string }) => {
      setFormula((prev) => prev + `{${column.name}}`);
    };

    const handleSave = () => {
      if (formula.trim()) {
        // Future: validate formula syntax and infer result type
        boardLogger.debug('[Formula] Save formula', { formula });
        onSelect({ formula, resultType: 'number' });
      }
      onClose();
    };

    const content = (
      <>
        <div className="fixed inset-0 z-[9998]" onClick={onClose} />
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-100"
          style={positionStyle}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 rounded-t-xl">
            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span
                className={`text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <Function size={14} />
                {t('formula_editor')}
              </span>
            </div>
          </div>

          {/* Formula Input */}
          <div className="p-3 border-b border-stone-100 dark:border-stone-800">
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder={t('enter_formula_placeholder')}
              className={`w-full h-20 px-3 py-2 text-sm font-mono border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRtl ? 'text-right' : 'text-left'}`}
            />

            <div className="mt-2 flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                {/* Column Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsColumnsOpen(!isColumnsOpen)}
                    className={`px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors flex items-center gap-2 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 whitespace-nowrap ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <span>
                      {'{ }'} {t('insert_column')}
                    </span>
                    <CaretDown
                      size={10}
                      className={`transform transition-transform ${isColumnsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isColumnsOpen && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setIsColumnsOpen(false)} />
                      <div
                        className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-full mt-1 w-48 max-h-[200px] overflow-y-auto bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl z-[101] flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100`}
                      >
                        <div
                          className={`px-2 py-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider ${isRtl ? 'text-right' : ''}`}
                        >
                          {t('available_columns')}
                        </div>
                        {availableColumns.length > 0 ? (
                          availableColumns.map((col) => (
                            <button
                              key={col.id}
                              onClick={() => {
                                handleInsertColumn(col);
                                setIsColumnsOpen(false);
                              }}
                              className={`px-2 py-1.5 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 text-stone-700 dark:text-stone-300 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                            >
                              <span className="w-4 h-4 flex items-center justify-center bg-stone-100 dark:bg-stone-700 rounded text-[10px] font-mono text-stone-500">
                                {'{'}
                              </span>
                              <span className="truncate">{col.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-xs text-stone-400 italic text-center">
                            {t('no_columns_available')}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Functions Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsFunctionsOpen(!isFunctionsOpen)}
                    className={`px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors flex items-center gap-2 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 whitespace-nowrap ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <Function size={12} className="text-stone-500" />
                    <span>{t('insert_function') || 'Insert Function'}</span>
                    <CaretDown
                      size={10}
                      className={`transform transition-transform ${isFunctionsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isFunctionsOpen && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setIsFunctionsOpen(false)} />
                      <div
                        className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-full mt-1 w-64 max-h-[250px] overflow-y-auto bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl z-[101] flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100`}
                      >
                        <div
                          className={`px-2 py-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50 dark:bg-stone-800/50 sticky top-0 backdrop-blur-sm z-10 ${isRtl ? 'text-right' : ''}`}
                        >
                          {t('functions')}
                        </div>
                        {FORMULA_FUNCTIONS.map((func) => (
                          <button
                            key={func.name}
                            onClick={() => {
                              handleInsertFunction(func);
                              setIsFunctionsOpen(false);
                            }}
                            className={`w-full flex items-start gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-700/50 rounded-lg transition-colors text-left group ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              <Lightning size={12} className="text-amber-500 opacity-70 group-hover:opacity-100" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                                  {func.name}
                                </span>
                                <span className="text-[9px] px-1 bg-stone-100 dark:bg-stone-700 text-stone-500 rounded">
                                  {func.category}
                                </span>
                              </div>
                              <div
                                className={`text-[10px] font-mono text-stone-500 truncate mt-0.5 ${isRtl ? 'text-right' : ''}`}
                                dir="ltr"
                              >
                                {func.syntax}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm whitespace-nowrap"
              >
                {t('apply_formula')}
              </button>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="border-b border-stone-100 dark:border-stone-800">
            <button
              onClick={() => setIsExamplesOpen(!isExamplesOpen)}
              className={`w-full px-3 py-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <div className="text-[10px] font-medium text-stone-500 uppercase">{t('quick_examples')}</div>
              {isExamplesOpen ? (
                <CaretDown size={12} className="text-stone-400" />
              ) : (
                <CaretRight size={12} className={`text-stone-400 ${isRtl ? 'rotate-180' : ''}`} />
              )}
            </button>

            {isExamplesOpen && (
              <div
                className={`px-3 pb-2 flex flex-wrap gap-1 animate-in slide-in-from-top-1 duration-200 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
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
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/30 rounded-b-xl">
            <button
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              {t('clear_formula')}
            </button>
          </div>
        </div>
      </>
    );

    return createPortal(content, document.body);
  },
);

export default FormulaPicker;
