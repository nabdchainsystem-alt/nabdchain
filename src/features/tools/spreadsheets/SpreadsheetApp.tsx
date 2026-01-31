import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { FormulaBar } from './components/FormulaBar';
import { Grid } from './components/Grid';
import { Footer } from './components/Footer';
import { createInitialState, createEmptySheet, STORAGE_KEY, COLS } from './constants';
import { GridData, CellStyle, SpreadsheetState, Sheet, HistoryEntry, CellData, CellRange } from './types';
import { evaluateFormula } from './formulaEngine';
import { storageLogger } from '../../../utils/logger';

// Load state from localStorage
const loadState = (): SpreadsheetState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure we have valid state
            if (parsed.sheets && parsed.sheets.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        storageLogger.error('Failed to load spreadsheet state', e);
    }
    return createInitialState();
};

// Save state to localStorage
const saveState = (state: SpreadsheetState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        storageLogger.error('Failed to save spreadsheet state', e);
    }
};

// Export as a component that can be used within NABD
export const SpreadsheetApp: React.FC = () => {
    const [state, setState] = useState<SpreadsheetState>(loadState);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isSaved, setIsSaved] = useState(true);
    const [selectedRange, setSelectedRange] = useState<CellRange | null>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    // Get active sheet
    const activeSheet = useMemo(() => {
        return state.sheets.find(s => s.id === state.activeSheetId) || state.sheets[0];
    }, [state.sheets, state.activeSheetId]);

    // Initialize column/row widths from active sheet on mount
    useEffect(() => {
        if (activeSheet) {
            setColumnWidths(activeSheet.columnWidths || {});
            setRowHeights(activeSheet.rowHeights || {});
        }
    }, []);

    // Get current cell data
    const currentCellId = `${state.selectedCell.col}${state.selectedCell.row}`;
    const currentCell = activeSheet?.data[currentCellId];
    const currentCellValue = currentCell?.formula || currentCell?.value || '';

    // Save to history for undo/redo
    const saveToHistory = useCallback(() => {
        const entry: HistoryEntry = {
            sheets: JSON.parse(JSON.stringify(state.sheets)),
            activeSheetId: state.activeSheetId,
        };
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(entry);
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [state.sheets, state.activeSheetId, historyIndex]);

    // Auto-save effect
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveState(state);
            setIsSaved(true);
        }, 500);
        return () => clearTimeout(timeout);
    }, [state]);

    // Mark as unsaved when state changes
    useEffect(() => {
        setIsSaved(false);
    }, [state.sheets, state.title]);

    // Recalculate all formulas in the sheet
    const recalculateFormulas = useCallback((sheetData: GridData): GridData => {
        const newData = { ...sheetData };
        for (const cellId in newData) {
            const cell = newData[cellId];
            if (cell.formula) {
                const result = evaluateFormula(cell.formula, newData);
                newData[cellId] = {
                    ...cell,
                    value: result,
                    displayValue: String(result),
                };
            }
        }
        return newData;
    }, []);

    // Update cell value
    const updateCell = useCallback((col: string, row: number, value: string | number, formula?: string) => {
        saveToHistory();

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const cellId = `${col}${row}`;

            if (value === '' && !formula) {
                // Delete cell if empty
                const { [cellId]: _, ...rest } = sheet.data;
                sheet.data = recalculateFormulas(rest);
            } else {
                const existingCell = sheet.data[cellId] || {};
                const cellData: CellData = {
                    ...existingCell,
                    value: value,
                };

                if (formula) {
                    cellData.formula = formula;
                    // First, add the cell with the raw formula to the data
                    // so other cells can see this cell exists (for circular ref detection)
                    const tempData = { ...sheet.data, [cellId]: { ...cellData } };

                    // Now evaluate the formula with the updated data context
                    const result = evaluateFormula(formula, tempData);
                    cellData.value = result;
                    cellData.displayValue = String(result);
                } else {
                    delete cellData.formula;
                    delete cellData.displayValue;
                }

                sheet.data = { ...sheet.data, [cellId]: cellData };
                // Recalculate all formulas to update dependent cells
                sheet.data = recalculateFormulas(sheet.data);
            }

            newSheets[sheetIndex] = sheet;
            return { ...prev, sheets: newSheets };
        });
    }, [saveToHistory, recalculateFormulas]);

    // Update cell style
    const updateCellStyle = useCallback((col: string, row: number, style: Partial<CellStyle>) => {
        saveToHistory();

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const cellId = `${col}${row}`;

            const cellData = sheet.data[cellId] || { value: '' };
            const currentStyle = cellData.style || {};

            sheet.data = {
                ...sheet.data,
                [cellId]: {
                    ...cellData,
                    style: { ...currentStyle, ...style },
                },
            };

            newSheets[sheetIndex] = sheet;
            return { ...prev, sheets: newSheets };
        });
    }, [saveToHistory]);

    // Toggle style (for buttons like bold, italic)
    const toggleStyle = useCallback((styleKey: keyof CellStyle) => {
        const { col, row } = state.selectedCell;
        const cellId = `${col}${row}`;
        const currentStyle = activeSheet?.data[cellId]?.style || {};
        const currentValue = currentStyle[styleKey];

        updateCellStyle(col, row, { [styleKey]: !currentValue });
    }, [state.selectedCell, activeSheet?.data, updateCellStyle]);

    // Set alignment
    const setAlignment = useCallback((align: 'left' | 'center' | 'right') => {
        const { col, row } = state.selectedCell;
        updateCellStyle(col, row, { align });
    }, [state.selectedCell, updateCellStyle]);

    // Set text color
    const setTextColor = useCallback((color: string) => {
        const { col, row } = state.selectedCell;
        updateCellStyle(col, row, { color });
    }, [state.selectedCell, updateCellStyle]);

    // Set background color
    const setBgColor = useCallback((bg: string) => {
        const { col, row } = state.selectedCell;
        updateCellStyle(col, row, { bg });
    }, [state.selectedCell, updateCellStyle]);

    // Set font size
    const setFontSize = useCallback((fontSize: number) => {
        const { col, row } = state.selectedCell;
        updateCellStyle(col, row, { fontSize });
    }, [state.selectedCell, updateCellStyle]);

    // Set font family
    const setFontFamily = useCallback((fontFamily: string) => {
        const { col, row } = state.selectedCell;
        updateCellStyle(col, row, { fontFamily });
    }, [state.selectedCell, updateCellStyle]);

    // Format as currency
    const formatAsCurrency = useCallback(() => {
        const { col, row } = state.selectedCell;
        const cellId = `${col}${row}`;
        const cell = activeSheet?.data[cellId];
        if (cell && typeof cell.value === 'number') {
            const formatted = cell.value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
            });
            setState(prev => {
                const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
                if (sheetIndex === -1) return prev;

                const newSheets = [...prev.sheets];
                const sheet = { ...newSheets[sheetIndex] };
                sheet.data = {
                    ...sheet.data,
                    [cellId]: { ...cell, displayValue: formatted },
                };
                newSheets[sheetIndex] = sheet;
                return { ...prev, sheets: newSheets };
            });
        }
    }, [state.selectedCell, activeSheet?.data]);

    // Format as percent
    const formatAsPercent = useCallback(() => {
        const { col, row } = state.selectedCell;
        const cellId = `${col}${row}`;
        const cell = activeSheet?.data[cellId];
        if (cell && typeof cell.value === 'number') {
            const formatted = (cell.value * 100).toFixed(0) + '%';
            setState(prev => {
                const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
                if (sheetIndex === -1) return prev;

                const newSheets = [...prev.sheets];
                const sheet = { ...newSheets[sheetIndex] };
                sheet.data = {
                    ...sheet.data,
                    [cellId]: { ...cell, displayValue: formatted },
                };
                newSheets[sheetIndex] = sheet;
                return { ...prev, sheets: newSheets };
            });
        }
    }, [state.selectedCell, activeSheet?.data]);

    // Increase/decrease decimals
    const changeDecimals = useCallback((increase: boolean) => {
        const { col, row } = state.selectedCell;
        const cellId = `${col}${row}`;
        const cell = activeSheet?.data[cellId];
        if (cell && typeof cell.value === 'number') {
            const currentDisplay = cell.displayValue || String(cell.value);
            const decimals = (currentDisplay.split('.')[1] || '').length;
            const newDecimals = increase ? decimals + 1 : Math.max(0, decimals - 1);
            const formatted = cell.value.toFixed(newDecimals);
            setState(prev => {
                const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
                if (sheetIndex === -1) return prev;

                const newSheets = [...prev.sheets];
                const sheet = { ...newSheets[sheetIndex] };
                sheet.data = {
                    ...sheet.data,
                    [cellId]: { ...cell, displayValue: formatted },
                };
                newSheets[sheetIndex] = sheet;
                return { ...prev, sheets: newSheets };
            });
        }
    }, [state.selectedCell, activeSheet?.data]);

    // Select cell
    const selectCell = useCallback((col: string, row: number) => {
        setState(prev => ({
            ...prev,
            selectedCell: { col, row },
            editingCell: null,
        }));
    }, []);

    // Handle range selection
    const handleSelectRange = useCallback((range: CellRange | null) => {
        setSelectedRange(range);
    }, []);

    // Handle column resize - persist to current sheet
    const handleColumnResize = useCallback((col: string, width: number) => {
        setColumnWidths(prev => ({ ...prev, [col]: width }));
        // Also persist to sheet
        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;
            const newSheets = [...prev.sheets];
            newSheets[sheetIndex] = {
                ...newSheets[sheetIndex],
                columnWidths: { ...newSheets[sheetIndex].columnWidths, [col]: width },
            };
            return { ...prev, sheets: newSheets };
        });
    }, []);

    // Handle row resize - persist to current sheet
    const handleRowResize = useCallback((row: number, height: number) => {
        setRowHeights(prev => ({ ...prev, [row]: height }));
        // Also persist to sheet
        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;
            const newSheets = [...prev.sheets];
            newSheets[sheetIndex] = {
                ...newSheets[sheetIndex],
                rowHeights: { ...newSheets[sheetIndex].rowHeights, [row]: height },
            };
            return { ...prev, sheets: newSheets };
        });
    }, []);

    // Start editing cell
    const startEditing = useCallback((col: string, row: number) => {
        setState(prev => ({
            ...prev,
            selectedCell: { col, row },
            editingCell: { col, row },
        }));
    }, []);

    // Stop editing
    const stopEditing = useCallback(() => {
        setState(prev => ({
            ...prev,
            editingCell: null,
        }));
    }, []);

    // Handle formula bar change
    const handleFormulaChange = useCallback((value: string) => {
        const { col, row } = state.selectedCell;
        if (value.startsWith('=')) {
            updateCell(col, row, value, value);
        } else {
            const num = parseFloat(value);
            updateCell(col, row, isNaN(num) ? value : num);
        }
    }, [state.selectedCell, updateCell]);

    // Update title
    const updateTitle = useCallback((title: string) => {
        setState(prev => ({ ...prev, title }));
    }, []);

    // Add sheet
    const addSheet = useCallback(() => {
        const newSheet = createEmptySheet(`Sheet${state.sheets.length + 1}`);
        setState(prev => ({
            ...prev,
            sheets: [...prev.sheets, newSheet],
            activeSheetId: newSheet.id,
        }));
        // Reset column/row widths for new sheet
        setColumnWidths({});
        setRowHeights({});
        setSelectedRange(null);
    }, [state.sheets.length]);

    // Switch sheet
    const switchSheet = useCallback((sheetId: string) => {
        const targetSheet = state.sheets.find(s => s.id === sheetId);
        setState(prev => ({
            ...prev,
            activeSheetId: sheetId,
            selectedCell: { col: 'A', row: 1 },
            editingCell: null,
        }));
        // Restore column/row widths from target sheet
        setColumnWidths(targetSheet?.columnWidths || {});
        setRowHeights(targetSheet?.rowHeights || {});
        setSelectedRange(null);
    }, [state.sheets]);

    // Rename sheet
    const renameSheet = useCallback((sheetId: string, name: string) => {
        setState(prev => ({
            ...prev,
            sheets: prev.sheets.map(s =>
                s.id === sheetId ? { ...s, name } : s
            ),
        }));
    }, []);

    // Duplicate sheet
    const duplicateSheet = useCallback((sheetId: string) => {
        const sourceSheet = state.sheets.find(s => s.id === sheetId);
        if (!sourceSheet) return;

        const newSheet: Sheet = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${sourceSheet.name} (Copy)`,
            data: JSON.parse(JSON.stringify(sourceSheet.data)),
            columnWidths: sourceSheet.columnWidths ? { ...sourceSheet.columnWidths } : {},
            rowHeights: sourceSheet.rowHeights ? { ...sourceSheet.rowHeights } : {},
        };

        setState(prev => ({
            ...prev,
            sheets: [...prev.sheets, newSheet],
            activeSheetId: newSheet.id,
        }));
        setColumnWidths(newSheet.columnWidths || {});
        setRowHeights(newSheet.rowHeights || {});
    }, [state.sheets]);

    // Delete sheet
    const deleteSheet = useCallback((sheetId: string) => {
        if (state.sheets.length <= 1) return;

        setState(prev => {
            const newSheets = prev.sheets.filter(s => s.id !== sheetId);
            const newActiveId = prev.activeSheetId === sheetId
                ? newSheets[0].id
                : prev.activeSheetId;
            return {
                ...prev,
                sheets: newSheets,
                activeSheetId: newActiveId,
            };
        });
    }, [state.sheets.length]);

    // Undo
    const undo = useCallback(() => {
        if (historyIndex < 0) return;

        const entry = history[historyIndex];
        if (entry) {
            setState(prev => ({
                ...prev,
                sheets: JSON.parse(JSON.stringify(entry.sheets)),
                activeSheetId: entry.activeSheetId,
            }));
            setHistoryIndex(prev => prev - 1);
        }
    }, [history, historyIndex]);

    // Redo
    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const entry = history[historyIndex + 1];
        if (entry) {
            setState(prev => ({
                ...prev,
                sheets: JSON.parse(JSON.stringify(entry.sheets)),
                activeSheetId: entry.activeSheetId,
            }));
            setHistoryIndex(prev => prev + 1);
        }
    }, [history, historyIndex]);

    // Copy cell
    const copyCell = useCallback(() => {
        const { col, row } = state.selectedCell;
        const cellId = `${col}${row}`;
        const cell = activeSheet?.data[cellId];

        setState(prev => ({
            ...prev,
            clipboard: {
                data: { [cellId]: cell ? { ...cell } : { value: '' } },
                range: { startCol: col, startRow: row, endCol: col, endRow: row },
                isCut: false,
            },
        }));

        // Also copy to system clipboard
        if (cell) {
            navigator.clipboard?.writeText(String(cell.formula || cell.value || ''));
        }
    }, [state.selectedCell, activeSheet?.data]);

    // Cut cell
    const cutCell = useCallback(() => {
        const { col, row } = state.selectedCell;
        const cellId = `${col}${row}`;
        const cell = activeSheet?.data[cellId];

        setState(prev => ({
            ...prev,
            clipboard: {
                data: { [cellId]: cell ? { ...cell } : { value: '' } },
                range: { startCol: col, startRow: row, endCol: col, endRow: row },
                isCut: true,
            },
        }));

        if (cell) {
            navigator.clipboard?.writeText(String(cell.formula || cell.value || ''));
        }
    }, [state.selectedCell, activeSheet?.data]);

    // Paste cell
    const pasteCell = useCallback(async () => {
        const { col, row } = state.selectedCell;

        // Try to get from internal clipboard first
        if (state.clipboard) {
            const sourceId = Object.keys(state.clipboard.data)[0];
            const sourceCell = state.clipboard.data[sourceId];

            if (sourceCell) {
                if (sourceCell.formula) {
                    updateCell(col, row, sourceCell.formula, sourceCell.formula);
                } else {
                    updateCell(col, row, sourceCell.value);
                }

                if (sourceCell.style) {
                    updateCellStyle(col, row, sourceCell.style);
                }

                // If it was cut, clear the source cell
                if (state.clipboard.isCut) {
                    const { startCol, startRow } = state.clipboard.range;
                    updateCell(startCol, startRow, '');
                    setState(prev => ({ ...prev, clipboard: undefined }));
                }
            }
        } else {
            // Try system clipboard
            try {
                const text = await navigator.clipboard?.readText();
                if (text) {
                    const num = parseFloat(text);
                    updateCell(col, row, isNaN(num) ? text : num);
                }
            } catch {
                // Clipboard access denied
            }
        }
    }, [state.selectedCell, state.clipboard, updateCell, updateCellStyle]);

    // Clear formatting
    const clearFormatting = useCallback(() => {
        const { col, row } = state.selectedCell;
        const cellId = `${col}${row}`;

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const cell = sheet.data[cellId];

            if (cell) {
                sheet.data = {
                    ...sheet.data,
                    [cellId]: { value: cell.value, formula: cell.formula },
                };
            }

            newSheets[sheetIndex] = sheet;
            return { ...prev, sheets: newSheets };
        });
    }, [state.selectedCell]);

    // Clear cell content
    const clearCell = useCallback(() => {
        const { col, row } = state.selectedCell;
        updateCell(col, row, '');
    }, [state.selectedCell, updateCell]);

    // Clear range of cells
    const clearRange = useCallback((range: CellRange) => {
        saveToHistory();
        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const newData = { ...sheet.data };

            const startColIndex = COLS.indexOf(range.startCol);
            const endColIndex = COLS.indexOf(range.endCol);
            const minCol = Math.min(startColIndex, endColIndex);
            const maxCol = Math.max(startColIndex, endColIndex);
            const minRow = Math.min(range.startRow, range.endRow);
            const maxRow = Math.max(range.startRow, range.endRow);

            for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
                for (let row = minRow; row <= maxRow; row++) {
                    const cellId = `${COLS[colIdx]}${row}`;
                    delete newData[cellId];
                }
            }

            sheet.data = newData;
            newSheets[sheetIndex] = sheet;
            return { ...prev, sheets: newSheets };
        });
    }, [saveToHistory]);

    // Toggle text wrap
    const toggleWrap = useCallback(() => {
        toggleStyle('wrap');
    }, [toggleStyle]);

    // Set border
    const setBorder = useCallback((side: 'all' | 'none' | 'bottom' | 'top' | 'left' | 'right') => {
        const { col, row } = state.selectedCell;

        if (side === 'none') {
            updateCellStyle(col, row, {
                borderTop: false,
                borderBottom: false,
                borderLeft: false,
                borderRight: false,
            });
        } else if (side === 'all') {
            updateCellStyle(col, row, {
                borderTop: true,
                borderBottom: true,
                borderLeft: true,
                borderRight: true,
            });
        } else {
            const key = `border${side.charAt(0).toUpperCase() + side.slice(1)}` as 'borderTop' | 'borderBottom' | 'borderLeft' | 'borderRight';
            const cellId = `${col}${row}`;
            const currentValue = activeSheet?.data[cellId]?.style?.[key];
            updateCellStyle(col, row, { [key]: !currentValue });
        }
    }, [state.selectedCell, activeSheet?.data, updateCellStyle]);

    // Insert row
    const insertRow = useCallback((atRow: number, above: boolean) => {
        saveToHistory();
        const insertAt = above ? atRow : atRow + 1;

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const newData: GridData = {};

            // Shift all rows at or below insertAt down by 1
            for (const cellId in sheet.data) {
                const match = cellId.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                    const cellCol = match[1];
                    const cellRow = parseInt(match[2]);

                    if (cellRow >= insertAt) {
                        // Move this cell down one row
                        newData[`${cellCol}${cellRow + 1}`] = sheet.data[cellId];
                    } else {
                        // Keep this cell where it is
                        newData[cellId] = sheet.data[cellId];
                    }
                }
            }

            sheet.data = newData;
            newSheets[sheetIndex] = sheet;
            return { ...prev, sheets: newSheets };
        });
    }, [saveToHistory]);

    // Delete row
    const deleteRow = useCallback((row: number) => {
        saveToHistory();

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const newData: GridData = {};

            for (const cellId in sheet.data) {
                const match = cellId.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                    const cellCol = match[1];
                    const cellRow = parseInt(match[2]);

                    if (cellRow === row) {
                        // Skip this cell (delete it)
                        continue;
                    } else if (cellRow > row) {
                        // Move this cell up one row
                        newData[`${cellCol}${cellRow - 1}`] = sheet.data[cellId];
                    } else {
                        // Keep this cell where it is
                        newData[cellId] = sheet.data[cellId];
                    }
                }
            }

            sheet.data = newData;
            newSheets[sheetIndex] = sheet;

            // Adjust selection if needed
            const newSelectedRow = prev.selectedCell.row > row
                ? prev.selectedCell.row - 1
                : prev.selectedCell.row === row && row > 1
                    ? row - 1
                    : prev.selectedCell.row;

            return {
                ...prev,
                sheets: newSheets,
                selectedCell: { ...prev.selectedCell, row: newSelectedRow }
            };
        });
    }, [saveToHistory]);

    // Insert column
    const insertColumn = useCallback((atCol: string, left: boolean) => {
        saveToHistory();
        const colIndex = COLS.indexOf(atCol);
        const insertAtIndex = left ? colIndex : colIndex + 1;

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const newData: GridData = {};

            for (const cellId in sheet.data) {
                const match = cellId.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                    const cellCol = match[1];
                    const cellRow = parseInt(match[2]);
                    const cellColIndex = COLS.indexOf(cellCol);

                    if (cellColIndex >= insertAtIndex && cellColIndex < COLS.length - 1) {
                        // Move this cell right one column
                        newData[`${COLS[cellColIndex + 1]}${cellRow}`] = sheet.data[cellId];
                    } else if (cellColIndex < insertAtIndex) {
                        // Keep this cell where it is
                        newData[cellId] = sheet.data[cellId];
                    }
                    // Cells at the last column are lost if shifting
                }
            }

            sheet.data = newData;
            newSheets[sheetIndex] = sheet;
            return { ...prev, sheets: newSheets };
        });
    }, [saveToHistory]);

    // Delete column
    const deleteColumn = useCallback((col: string) => {
        saveToHistory();
        const colIndex = COLS.indexOf(col);

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const newData: GridData = {};

            for (const cellId in sheet.data) {
                const match = cellId.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                    const cellCol = match[1];
                    const cellRow = parseInt(match[2]);
                    const cellColIndex = COLS.indexOf(cellCol);

                    if (cellColIndex === colIndex) {
                        // Skip this cell (delete it)
                        continue;
                    } else if (cellColIndex > colIndex) {
                        // Move this cell left one column
                        newData[`${COLS[cellColIndex - 1]}${cellRow}`] = sheet.data[cellId];
                    } else {
                        // Keep this cell where it is
                        newData[cellId] = sheet.data[cellId];
                    }
                }
            }

            sheet.data = newData;
            newSheets[sheetIndex] = sheet;

            // Adjust selection if needed
            const selectedColIndex = COLS.indexOf(prev.selectedCell.col);
            const newSelectedCol = selectedColIndex > colIndex
                ? COLS[selectedColIndex - 1]
                : selectedColIndex === colIndex && colIndex > 0
                    ? COLS[colIndex - 1]
                    : prev.selectedCell.col;

            return {
                ...prev,
                sheets: newSheets,
                selectedCell: { ...prev.selectedCell, col: newSelectedCol }
            };
        });
    }, [saveToHistory]);

    // Reorder column (move fromCol to position of toCol)
    const reorderColumn = useCallback((fromCol: string, toCol: string) => {
        if (fromCol === toCol) return;
        saveToHistory();

        const fromIndex = COLS.indexOf(fromCol);
        const toIndex = COLS.indexOf(toCol);

        setState(prev => {
            const sheetIndex = prev.sheets.findIndex(s => s.id === prev.activeSheetId);
            if (sheetIndex === -1) return prev;

            const newSheets = [...prev.sheets];
            const sheet = { ...newSheets[sheetIndex] };
            const newData: GridData = {};

            // We need to reorder all the columns:
            // If moving right (fromIndex < toIndex): columns between from+1 and to shift left, from goes to to
            // If moving left (fromIndex > toIndex): columns between to and from-1 shift right, from goes to to

            for (const cellId in sheet.data) {
                const match = cellId.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                    const cellCol = match[1];
                    const cellRow = parseInt(match[2]);
                    const cellColIndex = COLS.indexOf(cellCol);

                    let newColIndex = cellColIndex;

                    if (cellColIndex === fromIndex) {
                        // This is the column being moved - it goes to toIndex
                        newColIndex = toIndex;
                    } else if (fromIndex < toIndex) {
                        // Moving right: shift columns between from+1 and to to the left
                        if (cellColIndex > fromIndex && cellColIndex <= toIndex) {
                            newColIndex = cellColIndex - 1;
                        }
                    } else {
                        // Moving left: shift columns between to and from-1 to the right
                        if (cellColIndex >= toIndex && cellColIndex < fromIndex) {
                            newColIndex = cellColIndex + 1;
                        }
                    }

                    newData[`${COLS[newColIndex]}${cellRow}`] = sheet.data[cellId];
                }
            }

            // Also reorder column widths
            const newColumnWidths: Record<string, number> = {};
            for (const col in sheet.columnWidths) {
                const colIndex = COLS.indexOf(col);
                let newColIndex = colIndex;

                if (colIndex === fromIndex) {
                    newColIndex = toIndex;
                } else if (fromIndex < toIndex) {
                    if (colIndex > fromIndex && colIndex <= toIndex) {
                        newColIndex = colIndex - 1;
                    }
                } else {
                    if (colIndex >= toIndex && colIndex < fromIndex) {
                        newColIndex = colIndex + 1;
                    }
                }

                if (sheet.columnWidths?.[col]) {
                    newColumnWidths[COLS[newColIndex]] = sheet.columnWidths[col];
                }
            }

            sheet.data = newData;
            sheet.columnWidths = newColumnWidths;
            newSheets[sheetIndex] = sheet;

            // Update column widths state
            setColumnWidths(newColumnWidths);

            // Adjust selection if the selected column was moved
            const selectedColIndex = COLS.indexOf(prev.selectedCell.col);
            let newSelectedColIndex = selectedColIndex;

            if (selectedColIndex === fromIndex) {
                newSelectedColIndex = toIndex;
            } else if (fromIndex < toIndex) {
                if (selectedColIndex > fromIndex && selectedColIndex <= toIndex) {
                    newSelectedColIndex = selectedColIndex - 1;
                }
            } else {
                if (selectedColIndex >= toIndex && selectedColIndex < fromIndex) {
                    newSelectedColIndex = selectedColIndex + 1;
                }
            }

            return {
                ...prev,
                sheets: newSheets,
                selectedCell: { ...prev.selectedCell, col: COLS[newSelectedColIndex] }
            };
        });
    }, [saveToHistory]);

    // New spreadsheet
    const newSpreadsheet = useCallback(() => {
        const initialState = createInitialState();
        setState(initialState);
        setHistory([]);
        setHistoryIndex(-1);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Download as CSV
    const downloadCSV = useCallback(() => {
        if (!activeSheet) return;

        const rows: string[][] = [];
        let maxCol = 0;
        let maxRow = 0;

        // Find the data bounds
        for (const cellId in activeSheet.data) {
            const match = cellId.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const colIndex = COLS.indexOf(match[1]);
                const rowIndex = parseInt(match[2]);
                maxCol = Math.max(maxCol, colIndex);
                maxRow = Math.max(maxRow, rowIndex);
            }
        }

        // Build CSV
        for (let r = 1; r <= maxRow; r++) {
            const row: string[] = [];
            for (let c = 0; c <= maxCol; c++) {
                const cellId = `${COLS[c]}${r}`;
                const cell = activeSheet.data[cellId];
                const value = cell?.displayValue || cell?.value || '';
                // Escape quotes and wrap in quotes if contains comma
                const escaped = String(value).replace(/"/g, '""');
                row.push(escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped);
            }
            rows.push(row);
        }

        const csv = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.title || 'spreadsheet'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [activeSheet, state.title]);

    // Download as JSON
    const downloadJSON = useCallback(() => {
        const json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.title || 'spreadsheet'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [state]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if we're in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

            if (ctrlOrCmd) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            redo();
                        } else {
                            undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        redo();
                        break;
                    case 'b':
                        e.preventDefault();
                        toggleStyle('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        toggleStyle('italic');
                        break;
                    case 'c':
                        e.preventDefault();
                        copyCell();
                        break;
                    case 'x':
                        e.preventDefault();
                        cutCell();
                        break;
                    case 'v':
                        e.preventDefault();
                        pasteCell();
                        break;
                    case 's':
                        e.preventDefault();
                        saveState(state);
                        setIsSaved(true);
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, toggleStyle, copyCell, cutCell, pasteCell, state]);

    // Calculate statistics for selected cells (for status bar)
    const selectionStats = useMemo(() => {
        if (!activeSheet) return { sum: null, count: 0, average: null };

        const values: number[] = [];

        // If we have a range selection, calculate for all cells in range
        if (selectedRange) {
            const startColIndex = COLS.indexOf(selectedRange.startCol);
            const endColIndex = COLS.indexOf(selectedRange.endCol);
            const minCol = Math.min(startColIndex, endColIndex);
            const maxCol = Math.max(startColIndex, endColIndex);
            const minRow = Math.min(selectedRange.startRow, selectedRange.endRow);
            const maxRow = Math.max(selectedRange.startRow, selectedRange.endRow);

            for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
                for (let row = minRow; row <= maxRow; row++) {
                    const cellId = `${COLS[colIdx]}${row}`;
                    const cell = activeSheet.data[cellId];
                    if (cell) {
                        const numVal = typeof cell.value === 'number' ? cell.value : parseFloat(String(cell.value));
                        if (!isNaN(numVal)) {
                            values.push(numVal);
                        }
                    }
                }
            }
        } else {
            // Single cell selection
            const cellId = `${state.selectedCell.col}${state.selectedCell.row}`;
            const cell = activeSheet.data[cellId];
            if (cell) {
                const numVal = typeof cell.value === 'number' ? cell.value : parseFloat(String(cell.value));
                if (!isNaN(numVal)) {
                    values.push(numVal);
                }
            }
        }

        if (values.length === 0) {
            return { sum: null, count: 0, average: null };
        }

        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;

        return {
            sum,
            count: values.length,
            average: values.length > 1 ? average : null, // Only show average for multiple values
        };
    }, [activeSheet, state.selectedCell, selectedRange]);

    const { sum: selectionSum, count: cellCount, average } = selectionStats;

    // Get current cell style
    const currentCellStyle = useMemo(() => {
        return currentCell?.style || {};
    }, [currentCell]);

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-white text-gray-900 overflow-hidden font-[Inter]">
            <Header
                title={state.title}
                onTitleChange={updateTitle}
                isSaved={isSaved}
                onNew={newSpreadsheet}
                onDownloadCSV={downloadCSV}
                onDownloadJSON={downloadJSON}
            />
            <Toolbar
                currentStyle={currentCellStyle}
                onToggleBold={() => toggleStyle('bold')}
                onToggleItalic={() => toggleStyle('italic')}
                onToggleStrikethrough={() => toggleStyle('strikethrough')}
                onSetAlignment={setAlignment}
                onSetTextColor={setTextColor}
                onSetBgColor={setBgColor}
                onSetFontSize={setFontSize}
                onSetFontFamily={setFontFamily}
                onFormatCurrency={formatAsCurrency}
                onFormatPercent={formatAsPercent}
                onIncreaseDecimals={() => changeDecimals(true)}
                onDecreaseDecimals={() => changeDecimals(false)}
                onClearFormatting={clearFormatting}
                onUndo={undo}
                onRedo={redo}
                canUndo={historyIndex >= 0}
                canRedo={historyIndex < history.length - 1}
                onToggleWrap={toggleWrap}
                onSetBorder={setBorder}
            />
            <FormulaBar
                selectedCell={currentCellId}
                value={currentCellValue}
                onChange={handleFormulaChange}
                isEditing={state.editingCell !== null}
            />
            <Grid
                data={activeSheet?.data || {}}
                selectedCell={state.selectedCell}
                selectedRange={selectedRange}
                editingCell={state.editingCell}
                columnWidths={columnWidths}
                rowHeights={rowHeights}
                onSelectCell={selectCell}
                onSelectRange={handleSelectRange}
                onStartEditing={startEditing}
                onStopEditing={stopEditing}
                onCellChange={updateCell}
                onCopy={copyCell}
                onCut={cutCell}
                onPaste={pasteCell}
                onInsertRow={insertRow}
                onDeleteRow={deleteRow}
                onInsertColumn={insertColumn}
                onDeleteColumn={deleteColumn}
                onClearCell={clearCell}
                onClearFormatting={clearFormatting}
                onClearRange={clearRange}
                onColumnResize={handleColumnResize}
                onRowResize={handleRowResize}
                onColumnReorder={reorderColumn}
            />
            <Footer
                sheets={state.sheets}
                activeSheetId={state.activeSheetId}
                onAddSheet={addSheet}
                onSwitchSheet={switchSheet}
                onRenameSheet={renameSheet}
                onDeleteSheet={deleteSheet}
                onDuplicateSheet={duplicateSheet}
                selectionSum={selectionSum}
                cellCount={cellCount}
                average={average}
            />
        </div>
    );
};
