export interface CellStyle {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    color?: string;
    bg?: string;
    borderBottom?: boolean;
    borderTop?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    fontSize?: number;
    fontFamily?: string;
    wrap?: boolean;
}

export interface CellData {
    value: string | number;
    formula?: string; // Store original formula (e.g., "=SUM(A1:A5)")
    displayValue?: string;
    style?: CellStyle;
}

export type GridData = Record<string, CellData>;

export interface Selection {
    row: number;
    col: string;
}

export interface CellRange {
    startCol: string;
    startRow: number;
    endCol: string;
    endRow: number;
}

export interface Sheet {
    id: string;
    name: string;
    data: GridData;
    columnWidths?: Record<string, number>;
    rowHeights?: Record<number, number>;
}

export interface SpreadsheetState {
    title: string;
    sheets: Sheet[];
    activeSheetId: string;
    selectedCell: { col: string; row: number };
    selectedRange?: CellRange;
    editingCell: { col: string; row: number } | null;
    clipboard?: {
        data: GridData;
        range: CellRange;
        isCut: boolean;
    };
}

export interface HistoryEntry {
    sheets: Sheet[];
    activeSheetId: string;
}

export type FormulaFunction = (args: (number | string)[]) => number | string;
