import React, { useRef, useEffect, useCallback, useState } from 'react';
import { COLS, NUM_ROWS } from '../constants';
import { GridData, CellStyle } from '../types';

interface CellRange {
    startCol: string;
    startRow: number;
    endCol: string;
    endRow: number;
}

interface GridProps {
    data: GridData;
    selectedCell: { col: string; row: number };
    selectedRange?: CellRange | null;
    editingCell: { col: string; row: number } | null;
    columnWidths?: Record<string, number>;
    rowHeights?: Record<number, number>;
    onSelectCell: (col: string, row: number) => void;
    onSelectRange?: (range: CellRange | null) => void;
    onStartEditing: (col: string, row: number) => void;
    onStopEditing: () => void;
    onCellChange: (col: string, row: number, value: string | number, formula?: string) => void;
    onCopy: () => void;
    onCut: () => void;
    onPaste: () => void;
    onInsertRow?: (row: number, above: boolean) => void;
    onDeleteRow?: (row: number) => void;
    onInsertColumn?: (col: string, left: boolean) => void;
    onDeleteColumn?: (col: string) => void;
    onClearCell?: () => void;
    onClearFormatting?: () => void;
    onClearRange?: (range: CellRange) => void;
    onColumnResize?: (col: string, width: number) => void;
    onRowResize?: (row: number, height: number) => void;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    col: string;
    row: number;
}

export const Grid: React.FC<GridProps> = ({
    data,
    selectedCell,
    selectedRange,
    editingCell,
    columnWidths,
    rowHeights,
    onSelectCell,
    onSelectRange,
    onStartEditing,
    onStopEditing,
    onCellChange,
    onCopy,
    onCut,
    onPaste,
    onInsertRow,
    onDeleteRow,
    onInsertColumn,
    onDeleteColumn,
    onClearCell,
    onClearFormatting,
    onClearRange,
    onColumnResize,
    onRowResize,
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const [editValue, setEditValue] = useState('');
    const startedByTypingRef = useRef(false); // Track if editing started by typing
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        col: 'A',
        row: 1,
    });

    // Formula reference selection state
    const [formulaRefCell, setFormulaRefCell] = useState<{ col: string; row: number } | null>(null);
    const [isSelectingRef, setIsSelectingRef] = useState(false);
    const cursorPositionRef = useRef<number>(0);

    // Box selection state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ col: string; row: number } | null>(null);
    const [dragEnd, setDragEnd] = useState<{ col: string; row: number } | null>(null);

    // Column/Row resizing state
    const [resizingCol, setResizingCol] = useState<string | null>(null);
    const [resizingRow, setResizingRow] = useState<number | null>(null);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeStartY, setResizeStartY] = useState(0);
    const [resizeStartWidth, setResizeStartWidth] = useState(0);
    const [resizeStartHeight, setResizeStartHeight] = useState(0);

    // Preview dimensions for smooth resizing (local state for immediate feedback)
    const [previewColWidth, setPreviewColWidth] = useState<number | null>(null);
    const [previewRowHeight, setPreviewRowHeight] = useState<number | null>(null);

    // Animation frame ref for smooth updates
    const animationFrameRef = useRef<number | null>(null);

    // Default dimensions
    const DEFAULT_COL_WIDTH = 100;
    const DEFAULT_ROW_HEIGHT = 21;
    const MIN_COL_WIDTH = 30;
    const MIN_ROW_HEIGHT = 16;

    const getCellId = (col: string, row: number) => `${col}${row}`;

    // Helper to get column width (use preview during resize for smooth feedback)
    const getColWidth = useCallback((col: string) => {
        if (resizingCol === col && previewColWidth !== null) {
            return previewColWidth;
        }
        return columnWidths?.[col] ?? DEFAULT_COL_WIDTH;
    }, [columnWidths, resizingCol, previewColWidth]);

    // Helper to get row height (use preview during resize for smooth feedback)
    const getRowHeight = useCallback((row: number) => {
        if (resizingRow === row && previewRowHeight !== null) {
            return previewRowHeight;
        }
        return rowHeights?.[row] ?? DEFAULT_ROW_HEIGHT;
    }, [rowHeights, resizingRow, previewRowHeight]);

    // Check if a cell is within a range
    const isCellInRange = useCallback((col: string, row: number, range: CellRange | null | undefined) => {
        if (!range) return false;
        const colIndex = COLS.indexOf(col);
        const startColIndex = COLS.indexOf(range.startCol);
        const endColIndex = COLS.indexOf(range.endCol);
        const minCol = Math.min(startColIndex, endColIndex);
        const maxCol = Math.max(startColIndex, endColIndex);
        const minRow = Math.min(range.startRow, range.endRow);
        const maxRow = Math.max(range.startRow, range.endRow);
        return colIndex >= minCol && colIndex <= maxCol && row >= minRow && row <= maxRow;
    }, []);

    // Get the current drag selection range
    const getDragRange = useCallback((): CellRange | null => {
        if (!dragStart || !dragEnd) return null;
        return {
            startCol: dragStart.col,
            startRow: dragStart.row,
            endCol: dragEnd.col,
            endRow: dragEnd.row,
        };
    }, [dragStart, dragEnd]);

    // Get the effective selection range (either from props or from current drag)
    const effectiveRange = isDragging ? getDragRange() : selectedRange;

    // Check if a cell is at the edge of the selection range
    const getCellEdgeClasses = useCallback((col: string, row: number, range: CellRange | null | undefined): string => {
        if (!range) return '';
        const colIndex = COLS.indexOf(col);
        const startColIndex = COLS.indexOf(range.startCol);
        const endColIndex = COLS.indexOf(range.endCol);
        const minCol = Math.min(startColIndex, endColIndex);
        const maxCol = Math.max(startColIndex, endColIndex);
        const minRow = Math.min(range.startRow, range.endRow);
        const maxRow = Math.max(range.startRow, range.endRow);

        // Check if cell is in the range
        if (colIndex < minCol || colIndex > maxCol || row < minRow || row > maxRow) {
            return '';
        }

        const classes: string[] = [];
        // Top edge
        if (row === minRow) classes.push('border-t-2 border-t-[#1a73e8]');
        // Bottom edge
        if (row === maxRow) classes.push('border-b-2 border-b-[#1a73e8]');
        // Left edge
        if (colIndex === minCol) classes.push('border-l-2 border-l-[#1a73e8]');
        // Right edge
        if (colIndex === maxCol) classes.push('border-r-2 border-r-[#1a73e8]');

        return classes.join(' ');
    }, []);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Handle mouse move for box selection and resizing with smooth animation
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Cancel any pending animation frame
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(() => {
                // Column resizing - use preview for immediate visual feedback
                if (resizingCol) {
                    const deltaX = e.clientX - resizeStartX;
                    const newWidth = Math.max(MIN_COL_WIDTH, resizeStartWidth + deltaX);
                    setPreviewColWidth(newWidth);
                }

                // Row resizing - use preview for immediate visual feedback
                if (resizingRow) {
                    const deltaY = e.clientY - resizeStartY;
                    const newHeight = Math.max(MIN_ROW_HEIGHT, resizeStartHeight + deltaY);
                    setPreviewRowHeight(newHeight);
                }
            });
        };

        const handleMouseUp = () => {
            // Cancel any pending animation frame
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            // Finish box selection
            if (isDragging && dragStart && dragEnd) {
                const range: CellRange = {
                    startCol: dragStart.col,
                    startRow: dragStart.row,
                    endCol: dragEnd.col,
                    endRow: dragEnd.row,
                };
                // Only set range if it's more than one cell
                const startColIndex = COLS.indexOf(range.startCol);
                const endColIndex = COLS.indexOf(range.endCol);
                if (startColIndex !== endColIndex || range.startRow !== range.endRow) {
                    onSelectRange?.(range);
                } else {
                    onSelectRange?.(null);
                }
            }

            // Commit resize to parent state
            if (resizingCol && previewColWidth !== null && onColumnResize) {
                onColumnResize(resizingCol, previewColWidth);
            }
            if (resizingRow && previewRowHeight !== null && onRowResize) {
                onRowResize(resizingRow, previewRowHeight);
            }

            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            setResizingCol(null);
            setResizingRow(null);
            setPreviewColWidth(null);
            setPreviewRowHeight(null);
        };

        if (isDragging || resizingCol || resizingRow) {
            document.addEventListener('mousemove', handleMouseMove, { passive: true });
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [isDragging, dragStart, dragEnd, resizingCol, resizingRow, resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight, previewColWidth, previewRowHeight, onSelectRange, onColumnResize, onRowResize]);

    // Handle starting column resize
    const handleColumnResizeStart = (col: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingCol(col);
        setResizeStartX(e.clientX);
        setResizeStartWidth(getColWidth(col));
    };

    // Handle starting row resize
    const handleRowResizeStart = (row: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingRow(row);
        setResizeStartY(e.clientY);
        setResizeStartHeight(getRowHeight(row));
    };

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingCell && editInputRef.current) {
            // Capture whether editing was started by typing
            const wasStartedByTyping = startedByTypingRef.current;

            // Only set editValue from cell data if NOT started by typing
            if (!wasStartedByTyping) {
                const cellId = getCellId(editingCell.col, editingCell.row);
                const cell = data[cellId];
                setEditValue(cell?.formula || String(cell?.value || ''));
            }
            // Reset the flag
            startedByTypingRef.current = false;

            // Use requestAnimationFrame for smoother focus
            requestAnimationFrame(() => {
                if (editInputRef.current) {
                    editInputRef.current.focus();
                    // Only select all if we loaded cell value (not if user typed)
                    if (!wasStartedByTyping) {
                        editInputRef.current.select();
                    } else {
                        // Move cursor to end if user typed
                        editInputRef.current.setSelectionRange(
                            editInputRef.current.value.length,
                            editInputRef.current.value.length
                        );
                    }
                }
            });
        }
    }, [editingCell, data]);

    // Focus grid when not editing - only on initial mount or when editingCell becomes null
    useEffect(() => {
        // Only focus if there's no active element or if focus is on body
        if (!editingCell && gridRef.current) {
            const activeEl = document.activeElement;
            if (!activeEl || activeEl === document.body || activeEl === gridRef.current) {
                gridRef.current.focus();
            }
        }
    }, [editingCell]);

    // Commit the current edit
    const commitEdit = useCallback(() => {
        if (!editingCell) return;

        const { col, row } = editingCell;
        if (editValue.startsWith('=')) {
            onCellChange(col, row, editValue, editValue);
        } else {
            const num = parseFloat(editValue);
            onCellChange(col, row, isNaN(num) ? editValue : num);
        }
        onStopEditing();
    }, [editingCell, editValue, onCellChange, onStopEditing]);

    // Handle right-click context menu
    const handleContextMenu = useCallback((e: React.MouseEvent, col: string, row: number) => {
        e.preventDefault();
        onSelectCell(col, row);
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            col,
            row,
        });
    }, [onSelectCell]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const { col, row } = selectedCell;
        const colIndex = COLS.indexOf(col);

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

        // Handle copy/cut/paste shortcuts
        if (ctrlOrCmd && !editingCell) {
            switch (e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    onCopy();
                    return;
                case 'x':
                    e.preventDefault();
                    onCut();
                    return;
                case 'v':
                    e.preventDefault();
                    onPaste();
                    return;
                case 'a':
                    // Select all - for future implementation
                    e.preventDefault();
                    return;
            }
        }

        // If editing, handle edit-specific keys
        if (editingCell) {
            const isFormulaMode = editValue.startsWith('=');

            // Handle arrow keys for formula cell reference selection
            if (isFormulaMode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();

                // Get current reference cell or start from the editing cell
                const refCol = formulaRefCell?.col || editingCell.col;
                const refRow = formulaRefCell?.row || editingCell.row;
                const refColIndex = COLS.indexOf(refCol);

                let newRefCol = refCol;
                let newRefRow = refRow;

                switch (e.key) {
                    case 'ArrowUp':
                        newRefRow = Math.max(1, refRow - 1);
                        break;
                    case 'ArrowDown':
                        newRefRow = Math.min(NUM_ROWS, refRow + 1);
                        break;
                    case 'ArrowLeft':
                        if (refColIndex > 0) newRefCol = COLS[refColIndex - 1];
                        break;
                    case 'ArrowRight':
                        if (refColIndex < COLS.length - 1) newRefCol = COLS[refColIndex + 1];
                        break;
                }

                const cellRef = `${newRefCol}${newRefRow}`;
                setFormulaRefCell({ col: newRefCol, row: newRefRow });

                // Insert or update cell reference in the formula
                if (!isSelectingRef) {
                    // First arrow press - insert new reference at cursor
                    setIsSelectingRef(true);
                    const input = editInputRef.current;
                    if (input) {
                        const cursorPos = input.selectionStart || editValue.length;
                        const newValue = editValue.slice(0, cursorPos) + cellRef + editValue.slice(cursorPos);
                        setEditValue(newValue);
                        cursorPositionRef.current = cursorPos;
                        // Set cursor position after the cell reference
                        requestAnimationFrame(() => {
                            input.setSelectionRange(cursorPos + cellRef.length, cursorPos + cellRef.length);
                        });
                    }
                } else {
                    // Subsequent arrow presses - update the reference
                    const input = editInputRef.current;
                    if (input) {
                        // Find and replace the last cell reference we inserted
                        const beforeRef = editValue.slice(0, cursorPositionRef.current);
                        const afterRefStart = editValue.slice(cursorPositionRef.current);
                        // Match cell reference at the start of afterRefStart
                        const refMatch = afterRefStart.match(/^[A-Z]+\d+/i);
                        if (refMatch) {
                            const newValue = beforeRef + cellRef + afterRefStart.slice(refMatch[0].length);
                            setEditValue(newValue);
                            requestAnimationFrame(() => {
                                input.setSelectionRange(cursorPositionRef.current + cellRef.length, cursorPositionRef.current + cellRef.length);
                            });
                        }
                    }
                }
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                setFormulaRefCell(null);
                setIsSelectingRef(false);
                commitEdit();
                if (e.shiftKey) {
                    if (row > 1) onSelectCell(col, row - 1);
                } else {
                    if (row < NUM_ROWS) onSelectCell(col, row + 1);
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                setFormulaRefCell(null);
                setIsSelectingRef(false);
                commitEdit();
                if (e.shiftKey && colIndex > 0) {
                    onSelectCell(COLS[colIndex - 1], row);
                } else if (!e.shiftKey && colIndex < COLS.length - 1) {
                    onSelectCell(COLS[colIndex + 1], row);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setFormulaRefCell(null);
                setIsSelectingRef(false);
                onStopEditing();
            } else {
                // Any other key resets the reference selection mode
                setIsSelectingRef(false);
                setFormulaRefCell(null);
            }
            return;
        }

        // Navigation when not editing
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (ctrlOrCmd) {
                    // Jump to first row with data or row 1
                    onSelectCell(col, 1);
                } else if (row > 1) {
                    onSelectCell(col, row - 1);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (ctrlOrCmd) {
                    // Jump to last row with data
                    let lastRow = row;
                    for (let r = row + 1; r <= NUM_ROWS; r++) {
                        if (data[`${col}${r}`]) lastRow = r;
                    }
                    onSelectCell(col, lastRow === row ? NUM_ROWS : lastRow);
                } else if (row < NUM_ROWS) {
                    onSelectCell(col, row + 1);
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (ctrlOrCmd) {
                    onSelectCell('A', row);
                } else if (colIndex > 0) {
                    onSelectCell(COLS[colIndex - 1], row);
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (ctrlOrCmd) {
                    let lastCol = colIndex;
                    for (let c = colIndex + 1; c < COLS.length; c++) {
                        if (data[`${COLS[c]}${row}`]) lastCol = c;
                    }
                    onSelectCell(COLS[lastCol === colIndex ? COLS.length - 1 : lastCol], row);
                } else if (colIndex < COLS.length - 1) {
                    onSelectCell(COLS[colIndex + 1], row);
                }
                break;
            case 'Tab':
                e.preventDefault();
                if (e.shiftKey && colIndex > 0) {
                    onSelectCell(COLS[colIndex - 1], row);
                } else if (!e.shiftKey && colIndex < COLS.length - 1) {
                    onSelectCell(COLS[colIndex + 1], row);
                }
                break;
            case 'Enter':
                e.preventDefault();
                onStartEditing(col, row);
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                // Clear cell content (like Excel) - if range selected, clear all cells in range
                if (selectedRange && onClearRange) {
                    onClearRange(selectedRange);
                    onSelectRange?.(null);
                } else {
                    onCellChange(col, row, '');
                }
                break;
            case 'F2':
                e.preventDefault();
                onStartEditing(col, row);
                break;
            case 'Home':
                e.preventDefault();
                if (ctrlOrCmd) {
                    onSelectCell('A', 1);
                } else {
                    onSelectCell('A', row);
                }
                break;
            case 'End':
                e.preventDefault();
                if (ctrlOrCmd) {
                    onSelectCell(COLS[COLS.length - 1], NUM_ROWS);
                } else {
                    onSelectCell(COLS[COLS.length - 1], row);
                }
                break;
            case 'PageUp':
                e.preventDefault();
                onSelectCell(col, Math.max(1, row - 20));
                break;
            case 'PageDown':
                e.preventDefault();
                onSelectCell(col, Math.min(NUM_ROWS, row + 20));
                break;
            default:
                // Start typing to edit (if single printable character)
                if (e.key.length === 1 && !ctrlOrCmd && !e.altKey) {
                    e.preventDefault();
                    setEditValue(e.key);
                    startedByTypingRef.current = true; // Flag that editing started by typing
                    onStartEditing(col, row);
                }
        }
    }, [selectedCell, editingCell, data, commitEdit, onSelectCell, onStartEditing, onStopEditing, onCellChange, onCopy, onCut, onPaste]);

    // Get style classes from cell style
    const getStyleClasses = (style: CellStyle | undefined, isInSelectedRowOrCol: boolean) => {
        const classes: string[] = [];

        if (style?.align === 'right') classes.push('text-right');
        else if (style?.align === 'center') classes.push('text-center');
        else classes.push('text-left');

        if (style?.bold) classes.push('font-semibold');
        if (style?.italic) classes.push('italic');
        if (style?.strikethrough) classes.push('line-through');

        // Background
        if (style?.bg) {
            if (!style.bg.startsWith('#')) {
                classes.push(style.bg.startsWith('bg-') ? style.bg : `bg-[${style.bg}]`);
            }
        } else if (isInSelectedRowOrCol) {
            classes.push('bg-[#e8f0fe]/50');
        } else {
            classes.push('bg-white');
        }

        // Text color
        if (style?.color) {
            if (!style.color.startsWith('#')) {
                classes.push(style.color.startsWith('text-') ? style.color : `text-[${style.color}]`);
            }
        } else {
            classes.push('text-[#202124]');
        }

        // Borders
        if (style?.borderBottom) classes.push('!border-b-2 !border-b-[#202124]');
        if (style?.borderTop) classes.push('!border-t-2 !border-t-[#202124]');
        if (style?.borderLeft) classes.push('!border-l-2 !border-l-[#202124]');
        if (style?.borderRight) classes.push('!border-r-2 !border-r-[#202124]');

        // Text wrap
        if (style?.wrap) {
            classes.push('whitespace-normal');
        } else {
            classes.push('whitespace-nowrap');
        }

        return classes.join(' ');
    };

    // Get inline styles (for hex colors)
    const getInlineStyles = (style: CellStyle | undefined): React.CSSProperties => {
        const styles: React.CSSProperties = {};

        if (style?.bg?.startsWith('#')) {
            styles.backgroundColor = style.bg;
        }
        if (style?.color?.startsWith('#')) {
            styles.color = style.color;
        }
        if (style?.fontSize) {
            styles.fontSize = `${style.fontSize}px`;
        }
        if (style?.fontFamily) {
            styles.fontFamily = style.fontFamily;
        }

        return styles;
    };

    // Scroll selected cell into view
    useEffect(() => {
        const cellElement = document.getElementById(`cell-${selectedCell.col}${selectedCell.row}`);
        if (cellElement) {
            cellElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }, [selectedCell]);

    return (
        <main
            ref={gridRef}
            className={`flex-1 overflow-auto bg-white relative focus:outline-none ${resizingCol ? 'cursor-col-resize select-none' : ''} ${resizingRow ? 'cursor-row-resize select-none' : ''} ${isDragging ? 'select-none cursor-cell' : ''}`}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            style={{ willChange: isDragging || resizingCol || resizingRow ? 'transform' : 'auto' }}
        >
            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="fixed bg-white rounded shadow-xl border border-gray-300 py-1 z-[100] min-w-[200px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => { onCut(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px] text-gray-600">content_cut</span>
                        <span className="flex-1">Cut</span>
                        <span className="text-xs text-gray-500">Ctrl+X</span>
                    </button>
                    <button
                        onClick={() => { onCopy(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px] text-gray-600">content_copy</span>
                        <span className="flex-1">Copy</span>
                        <span className="text-xs text-gray-500">Ctrl+C</span>
                    </button>
                    <button
                        onClick={() => { onPaste(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px] text-gray-600">content_paste</span>
                        <span className="flex-1">Paste</span>
                        <span className="text-xs text-gray-500">Ctrl+V</span>
                    </button>

                    <div className="h-[1px] bg-gray-200 my-1 mx-2"></div>

                    {onInsertRow && (
                        <>
                            <button
                                onClick={() => { onInsertRow(contextMenu.row, true); setContextMenu(prev => ({ ...prev, visible: false })); }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-gray-600">add_row_above</span>
                                <span>Insert row above</span>
                            </button>
                            <button
                                onClick={() => { onInsertRow(contextMenu.row, false); setContextMenu(prev => ({ ...prev, visible: false })); }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-gray-600">add_row_below</span>
                                <span>Insert row below</span>
                            </button>
                        </>
                    )}

                    {onInsertColumn && (
                        <>
                            <button
                                onClick={() => { onInsertColumn(contextMenu.col, true); setContextMenu(prev => ({ ...prev, visible: false })); }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-gray-600">add_column_left</span>
                                <span>Insert column left</span>
                            </button>
                            <button
                                onClick={() => { onInsertColumn(contextMenu.col, false); setContextMenu(prev => ({ ...prev, visible: false })); }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-gray-600">add_column_right</span>
                                <span>Insert column right</span>
                            </button>
                        </>
                    )}

                    <div className="h-[1px] bg-gray-200 my-1 mx-2"></div>

                    {onDeleteRow && (
                        <button
                            onClick={() => { onDeleteRow(contextMenu.row); setContextMenu(prev => ({ ...prev, visible: false })); }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_row</span>
                            <span>Delete row {contextMenu.row}</span>
                        </button>
                    )}

                    {onDeleteColumn && (
                        <button
                            onClick={() => { onDeleteColumn(contextMenu.col); setContextMenu(prev => ({ ...prev, visible: false })); }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_column</span>
                            <span>Delete column {contextMenu.col}</span>
                        </button>
                    )}

                    <div className="h-[1px] bg-gray-200 my-1 mx-2"></div>

                    {onClearCell && (
                        <button
                            onClick={() => { onClearCell(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-600">backspace</span>
                            <span className="flex-1">Clear contents</span>
                            <span className="text-xs text-gray-500">Del</span>
                        </button>
                    )}

                    {onClearFormatting && (
                        <button
                            onClick={() => { onClearFormatting(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[#e8f0fe] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-600">format_clear</span>
                            <span>Clear formatting</span>
                        </button>
                    )}
                </div>
            )}

            <table className="border-collapse bg-white text-[13px] table-fixed" style={{ tableLayout: 'fixed' }}>
                <thead className="sticky top-0 z-20">
                    <tr>
                        {/* Corner Header - Select All */}
                        <th
                            className="bg-[#f8f9fa] border-r border-b border-[#e1e3e6] w-[46px] min-w-[46px] h-[25px] cursor-pointer hover:bg-[#e8eaed] transition-colors"
                            title="Select all"
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 border-l-2 border-t-2 border-[#5f6368] rotate-[-45deg] translate-y-[1px]"></div>
                            </div>
                        </th>

                        {/* Column Headers */}
                        {COLS.map((col) => {
                            const isSelectedCol = selectedCell.col === col;
                            const colWidth = getColWidth(col);
                            return (
                                <th
                                    key={col}
                                    className={`border-r border-b font-medium text-center select-none transition-colors cursor-pointer h-[25px] text-[12px] relative group
                                        ${isSelectedCol
                                            ? 'bg-[#d3e3fd] text-[#1a73e8] border-[#d3e3fd] font-semibold'
                                            : 'bg-[#f8f9fa] text-[#5f6368] border-[#e1e3e6] hover:bg-[#e8eaed]'}
                                    `}
                                    style={{ width: colWidth, minWidth: colWidth }}
                                    onClick={() => onSelectCell(col, 1)}
                                >
                                    {col}
                                    {/* Column resize handle */}
                                    <div
                                        className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-[#1a73e8] z-10"
                                        onMouseDown={(e) => handleColumnResizeStart(col, e)}
                                    />
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: NUM_ROWS }, (_, i) => i + 1).map((row) => {
                        const isSelectedRow = selectedCell.row === row;
                        const rowHeight = getRowHeight(row);
                        return (
                            <tr key={row} style={{ height: rowHeight }}>
                                {/* Row Header */}
                                <td
                                    className={`sticky left-0 z-10 border-r border-b text-center font-medium text-[12px] select-none transition-colors cursor-pointer relative group
                                        ${isSelectedRow
                                            ? 'bg-[#d3e3fd] text-[#1a73e8] border-[#d3e3fd] font-semibold'
                                            : 'bg-[#f8f9fa] text-[#5f6368] border-[#e1e3e6] hover:bg-[#e8eaed]'}
                                    `}
                                    style={{ height: rowHeight }}
                                    onClick={() => onSelectCell('A', row)}
                                >
                                    {row}
                                    {/* Row resize handle */}
                                    <div
                                        className="absolute bottom-0 left-0 w-full h-[4px] cursor-row-resize opacity-0 group-hover:opacity-100 hover:bg-[#1a73e8] z-10"
                                        onMouseDown={(e) => handleRowResizeStart(row, e)}
                                    />
                                </td>

                                {/* Cells */}
                                {COLS.map((col) => {
                                    const cellId = getCellId(col, row);
                                    const cellData = data[cellId];
                                    const isSelected = selectedCell.col === col && selectedCell.row === row;
                                    const isEditing = editingCell?.col === col && editingCell?.row === row;
                                    const isInSelectedRowOrCol = selectedCell.col === col || selectedCell.row === row;
                                    const isFormulaRef = formulaRefCell?.col === col && formulaRefCell?.row === row;
                                    const isInRange = isCellInRange(col, row, effectiveRange);
                                    const rangeEdgeClasses = getCellEdgeClasses(col, row, effectiveRange);
                                    const colWidth = getColWidth(col);

                                    const styleClasses = getStyleClasses(cellData?.style, isInSelectedRowOrCol && !isInRange);
                                    const inlineStyles = getInlineStyles(cellData?.style);

                                    // Handle mouse down - start box selection
                                    const handleCellMouseDown = (e: React.MouseEvent) => {
                                        // Don't start drag selection if editing
                                        if (editingCell) return;

                                        // Left click only
                                        if (e.button !== 0) return;

                                        setIsDragging(true);
                                        setDragStart({ col, row });
                                        setDragEnd({ col, row });
                                        onSelectCell(col, row);
                                        onSelectRange?.(null); // Clear existing range
                                    };

                                    // Handle mouse enter during drag
                                    const handleCellMouseEnter = () => {
                                        if (isDragging) {
                                            setDragEnd({ col, row });
                                        }
                                    };

                                    // Handle click - either select cell or insert reference in formula
                                    const handleCellClick = (e: React.MouseEvent) => {
                                        e.preventDefault();

                                        // If we're editing a formula, clicking another cell inserts a reference
                                        if (editingCell && editValue.startsWith('=') && !(editingCell.col === col && editingCell.row === row)) {
                                            const cellRef = `${col}${row}`;
                                            const input = editInputRef.current;
                                            if (input) {
                                                const cursorPos = input.selectionStart || editValue.length;
                                                const newValue = editValue.slice(0, cursorPos) + cellRef + editValue.slice(cursorPos);
                                                setEditValue(newValue);
                                                setFormulaRefCell({ col, row });
                                                setIsSelectingRef(true);
                                                cursorPositionRef.current = cursorPos;
                                                requestAnimationFrame(() => {
                                                    input.focus();
                                                    input.setSelectionRange(cursorPos + cellRef.length, cursorPos + cellRef.length);
                                                });
                                            }
                                            return;
                                        }

                                        // Click is handled by mousedown for selection
                                        gridRef.current?.focus();
                                    };

                                    return (
                                        <td
                                            key={cellId}
                                            id={`cell-${cellId}`}
                                            onMouseDown={handleCellMouseDown}
                                            onMouseEnter={handleCellMouseEnter}
                                            onClick={handleCellClick}
                                            onDoubleClick={(e) => {
                                                e.preventDefault();
                                                onStartEditing(col, row);
                                            }}
                                            onContextMenu={(e) => handleContextMenu(e, col, row)}
                                            className={`
                                                border-r border-b border-[#e1e3e6] px-1.5 outline-none cursor-cell relative overflow-hidden
                                                ${styleClasses}
                                                ${isSelected ? 'ring-2 ring-[#1a73e8] ring-inset z-10' : ''}
                                                ${isInRange && !isSelected ? 'bg-[#e8f0fe]' : ''}
                                                ${rangeEdgeClasses}
                                                ${isFormulaRef && !isSelected ? 'ring-2 ring-[#34a853] ring-inset z-10 bg-[#e6f4ea]' : ''}
                                            `}
                                            style={{ ...inlineStyles, width: colWidth, minWidth: colWidth, height: rowHeight }}
                                        >
                                            {isEditing ? (
                                                <input
                                                    ref={editInputRef}
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => {
                                                        setEditValue(e.target.value);
                                                        // Reset formula ref selection when manually typing
                                                        setIsSelectingRef(false);
                                                        setFormulaRefCell(null);
                                                    }}
                                                    onBlur={commitEdit}
                                                    onKeyDown={(e) => {
                                                        // Handle arrow keys for formula mode
                                                        if (editValue.startsWith('=') && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                                            handleKeyDown(e as unknown as React.KeyboardEvent);
                                                            return;
                                                        }
                                                        if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
                                                            handleKeyDown(e as unknown as React.KeyboardEvent);
                                                        }
                                                    }}
                                                    className="absolute inset-[-2px] w-[calc(100%+4px)] h-[calc(100%+4px)] px-1.5 text-[13px] border-2 border-[#1a73e8] outline-none bg-white z-20 shadow-lg"
                                                    style={{ fontSize: cellData?.style?.fontSize ? `${cellData.style.fontSize}px` : undefined }}
                                                />
                                            ) : (
                                                <span className={`block ${cellData?.style?.wrap ? '' : 'truncate'}`} style={{ lineHeight: `${rowHeight}px` }}>
                                                    {cellData?.displayValue ?? cellData?.value ?? ''}
                                                </span>
                                            )}

                                            {/* Fill Handle */}
                                            {isSelected && !isEditing && (
                                                <div
                                                    className="absolute -bottom-[3px] -right-[3px] w-[7px] h-[7px] bg-[#1a73e8] cursor-crosshair z-20 border-2 border-white"
                                                    title="Drag to fill"
                                                ></div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </main>
    );
};
